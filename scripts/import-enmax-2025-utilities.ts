/**
 * Post the 2025 ENMAX shop utility bills.
 *
 * Debit 6010 Utilities and 1160 GST ITC. Credit 2300 Credit Card Payable.
 * The February returned payment is the January bill again and is not expensed twice.
 *
 * Usage:
 *   npx tsx scripts/import-enmax-2025-utilities.ts --dry-run
 *   DATABASE_URL=postgresql://... npx tsx scripts/import-enmax-2025-utilities.ts
 */
import {
  ENMAX_2025_BILLS,
  ENMAX_2025_SOURCE,
  enmaxAmountDueCents,
  enmaxBillBalances,
  enmaxGstCents,
  enmaxJournalLines,
  enmaxNewChargeCents,
  enmaxUtilityCents,
} from "@/lib/enmax-2025-utilities"
import { shouldSkipExistingJournals } from "@/lib/post-2025-shop-books"

function format(cents: number) {
  return (cents / 100).toFixed(2)
}

export async function main() {
  let utilities = 0
  let gst = 0
  for (const bill of ENMAX_2025_BILLS) {
    if (!enmaxBillBalances(bill)) throw new Error(`${bill.entryNumber} does not balance`)
    utilities += enmaxUtilityCents(bill)
    gst += enmaxGstCents(bill)
    console.log(
      `${bill.entryNumber}  ${bill.billDate}  electricity ${format(bill.electricityCents)}  gas ${format(bill.naturalGasCents)}  GST ${format(enmaxGstCents(bill))}  new ${format(enmaxNewChargeCents(bill))}${bill.returnedPaymentCents ? `  returned payment excluded ${format(bill.returnedPaymentCents)}` : ""}${bill.lateFeeCents ? `  late fee ${format(bill.lateFeeCents)}` : ""}`
    )
  }
  console.log(`Utilities ${format(utilities)}  GST ITC ${format(gst)}  card ${format(utilities + gst)}`)

  if (process.argv.includes("--dry-run")) return

  const { prisma } = await import("@/lib/db")
  const { applyFormulatedPrintsIdentity, seedOrganizationDefaults } = await import("@/models/organizations")
  const organizationId = process.env.ORGANIZATION_ID
  const organization = organizationId
    ? await prisma.organization.findUnique({ where: { id: organizationId } })
    : await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } })
  if (!organization) throw new Error("No organization found. Create one in the app, or set ORGANIZATION_ID.")

  const identified = await applyFormulatedPrintsIdentity(organization.id)
  await seedOrganizationDefaults(identified.id)
  const accounts = await prisma.ledgerAccount.findMany({ where: { organizationId: identified.id } })
  const accountIds = new Map(accounts.map((account) => [account.code, account.id]))
  for (const code of ["1160", "2300", "6010"]) {
    if (!accountIds.has(code)) throw new Error(`Chart of accounts is missing ${code}`)
  }
  const gstItc = await prisma.taxCode.findUnique({
    where: { organizationId_code: { organizationId: identified.id, code: "GST_5_ITC" } },
  })
  const card = await prisma.paymentMethod.findUnique({
    where: { organizationId_name: { organizationId: identified.id, name: "Company Credit Card" } },
  })
  const owner = await prisma.organizationMember.findFirst({
    where: { organizationId: identified.id, role: { in: ["superuser", "owner"] }, isActive: true },
  })

  for (const bill of ENMAX_2025_BILLS) {
    const existing = await prisma.journalEntry.findUnique({
      where: { organizationId_entryNumber: { organizationId: identified.id, entryNumber: bill.entryNumber } },
    })
    if (existing && existing.source !== ENMAX_2025_SOURCE) {
      throw new Error(`${bill.entryNumber} already exists from ${existing.source}`)
    }
    if (existing && shouldSkipExistingJournals()) {
      console.log(`Skipping ${bill.entryNumber} (already posted)`)
      continue
    }
    if (existing) await prisma.journalEntry.delete({ where: { id: existing.id } })

    const postedAt = new Date(`${bill.billDate}T12:00:00.000Z`)
    const closedPeriod = await prisma.accountingPeriod.findFirst({
      where: {
        organizationId: identified.id,
        isClosed: true,
        startsAt: { lte: postedAt },
        endsAt: { gte: postedAt },
      },
    })
    if (closedPeriod) throw new Error(`Accounting period ${closedPeriod.name} is closed`)

    const entry = await prisma.journalEntry.create({
      data: {
        organizationId: identified.id,
        entryNumber: bill.entryNumber,
        source: ENMAX_2025_SOURCE,
        description: `ENMAX utilities ${bill.billDate}`,
        postedAt,
        status: "posted",
        currencyCode: "CAD",
        createdById: owner?.userId,
        lines: {
          create: enmaxJournalLines(bill).map((line) => ({
            organizationId: identified.id,
            accountId: accountIds.get(line.accountCode)!,
            debit: line.debitCents,
            credit: line.creditCents,
            memo: line.memo,
            taxCodeId: line.taxCode ? gstItc?.id : undefined,
          })),
        },
      },
    })

    if (!owner) continue
    const prior = await prisma.transaction.findFirst({
      where: { organizationId: identified.id, name: { startsWith: bill.entryNumber } },
    })
    if (prior) await prisma.transaction.delete({ where: { id: prior.id } })
    await prisma.transaction.create({
      data: {
        userId: owner.userId,
        organizationId: identified.id,
        name: `${bill.entryNumber} ENMAX utilities`,
        description: "Shop electricity and natural gas",
        merchant: "ENMAX",
        total: enmaxAmountDueCents(bill),
        currencyCode: "CAD",
        convertedTotal: enmaxNewChargeCents(bill),
        convertedCurrencyCode: "CAD",
        type: "expense",
        issuedAt: postedAt,
        paymentMethodId: card?.id,
        journalEntryId: entry.id,
        postsToLedger: true,
        destinationType: "paid_expense",
        note: [
          `Account ${"503330614"}`,
          `Electricity ${format(bill.electricityCents)}`,
          `Natural gas ${format(bill.naturalGasCents)}`,
          `GST ${format(enmaxGstCents(bill))}`,
          bill.lateFeeCents ? `Late fee ${format(bill.lateFeeCents)}` : "",
          bill.returnedPaymentCents ? `Returned payment ${format(bill.returnedPaymentCents)} is the prior bill, not a new expense` : "",
          `Withdrawal ${bill.withdrawalDate}`,
        ]
          .filter(Boolean)
          .join(" | "),
        extra: {
          ...bill,
          gstCents: enmaxGstCents(bill),
          newChargeCents: enmaxNewChargeCents(bill),
          sourceFile: `data/formulated-prints/enmax-2025/${bill.billDate}.pdf`,
        },
      },
    })
  }

  console.log(`Posted ${ENMAX_2025_BILLS.length} ENMAX bills for ${identified.name}`)
}

const isDirectRun = process.argv[1]?.includes("import-enmax-2025-utilities")
if (isDirectRun) {
  main()
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(async () => {
      if (!process.argv.includes("--dry-run")) {
        const { prisma } = await import("@/lib/db")
        await prisma.$disconnect().catch(() => undefined)
      }
    })
}
