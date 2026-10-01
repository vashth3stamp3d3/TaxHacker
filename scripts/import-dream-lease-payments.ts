/**
 * Post Dream shop lease payments to rent, GST input tax credits, and operating cash.
 *
 * Usage:
 *   npx tsx scripts/import-dream-lease-payments.ts --dry-run
 *   DATABASE_URL=postgresql://... npx tsx scripts/import-dream-lease-payments.ts
 */
import {
  DREAM_LEASE_PAYMENTS,
  DREAM_LEASE_SOURCE,
  DREAM_OPEN_BALANCE_CENTS,
  dreamJournalLines,
  dreamNetAppliedCents,
  dreamPaymentBalances,
  splitGstIncluded,
} from "@/lib/dream-lease-payments"

function format(cents: number) {
  const sign = cents < 0 ? "-" : ""
  return `${sign}${(Math.abs(cents) / 100).toFixed(2)}`
}

async function main() {
  for (const payment of DREAM_LEASE_PAYMENTS) {
    if (!dreamPaymentBalances(payment)) throw new Error(`${payment.entryNumber} does not balance`)
    const split = splitGstIncluded(payment.appliedCents)
    console.log(
      `${payment.entryNumber}  ${payment.paidDate}  ${payment.status}  paid ${format(payment.appliedCents)}  rent ${format(split.rentCents)}  GST ${format(split.gstCents)}`
    )
  }
  console.log(`2025 net cash ${format(dreamNetAppliedCents(2025))}`)
  console.log(`2026 net cash ${format(dreamNetAppliedCents(2026))}`)
  console.log(`Open balance not booked ${format(DREAM_OPEN_BALANCE_CENTS)}`)

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
  for (const code of ["1000", "1160", "6000"]) {
    if (!accountIds.has(code)) throw new Error(`Chart of accounts is missing ${code}`)
  }
  const gstItc = await prisma.taxCode.findUnique({
    where: { organizationId_code: { organizationId: identified.id, code: "GST_5_ITC" } },
  })
  const owner = await prisma.organizationMember.findFirst({
    where: { organizationId: identified.id, role: { in: ["superuser", "owner"] }, isActive: true },
  })

  for (const payment of DREAM_LEASE_PAYMENTS) {
    const existing = await prisma.journalEntry.findUnique({
      where: { organizationId_entryNumber: { organizationId: identified.id, entryNumber: payment.entryNumber } },
    })
    if (existing && existing.source !== DREAM_LEASE_SOURCE) {
      throw new Error(`${payment.entryNumber} already exists from ${existing.source}`)
    }
    if (existing) await prisma.journalEntry.delete({ where: { id: existing.id } })

    const postedAt = new Date(`${payment.paidDate}T12:00:00.000Z`)
    const closedPeriod = await prisma.accountingPeriod.findFirst({
      where: {
        organizationId: identified.id,
        isClosed: true,
        startsAt: { lte: postedAt },
        endsAt: { gte: postedAt },
      },
    })
    if (closedPeriod) throw new Error(`Accounting period ${closedPeriod.name} is closed`)

    const split = splitGstIncluded(payment.appliedCents)
    const entry = await prisma.journalEntry.create({
      data: {
        organizationId: identified.id,
        entryNumber: payment.entryNumber,
        source: DREAM_LEASE_SOURCE,
        description:
          payment.status === "reversal"
            ? `Dream lease NSF reversal ${payment.invoiceNumber}`
            : `Dream lease ${payment.invoiceNumber}`,
        postedAt,
        status: "posted",
        currencyCode: "CAD",
        createdById: owner?.userId,
        lines: {
          create: dreamJournalLines(payment).map((line) => ({
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
      where: { organizationId: identified.id, name: { startsWith: payment.entryNumber } },
    })
    if (prior) await prisma.transaction.delete({ where: { id: prior.id } })
    await prisma.transaction.create({
      data: {
        userId: owner.userId,
        organizationId: identified.id,
        name: `${payment.entryNumber} Dream lease`,
        description: payment.status === "reversal" ? "NSF reversal of Dream lease payment" : "Shop lease payment to Dream",
        merchant: "Dream",
        total: payment.appliedCents,
        currencyCode: "CAD",
        convertedTotal: split.rentCents,
        convertedCurrencyCode: "CAD",
        type: "expense",
        issuedAt: postedAt,
        journalEntryId: entry.id,
        postsToLedger: true,
        destinationType: "paid_expense",
        note: [
          `Invoice ${payment.invoiceNumber}`,
          `Payment ${payment.paymentNumber}`,
          "CIBC (7607) via Versapay",
          `GST ITC ${format(split.gstCents)}`,
          payment.status,
        ].join(" | "),
        extra: {
          ...payment,
          rentCents: split.rentCents,
          gstCents: split.gstCents,
          sourceFile: "data/formulated-prints/dream-lease/payments-dream-2025.pdf",
        },
      },
    })
  }

  console.log(`Posted ${DREAM_LEASE_PAYMENTS.length} Dream lease rows for ${identified.name}`)
}

const isDirectRun = process.argv[1]?.includes("import-dream-lease-payments")
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
