/**
 * Post the 2025 MacBook Pro (FP-0056) as shareholder-loan equipment.
 *
 * Debit 1600 Equipment and 1160 GST ITC. Credit 2310 Shareholder Loan.
 *
 * Usage:
 *   npx tsx scripts/import-macbook-2025.ts --dry-run
 *   DATABASE_URL=postgresql://... npx tsx scripts/import-macbook-2025.ts
 */
import { MACBOOK_2025, MACBOOK_2025_SOURCE, macbookBalances, macbookJournalLines } from "@/lib/macbook-2025"
import { shouldSkipExistingJournals } from "@/lib/post-2025-shop-books"

function format(cents: number) {
  return (cents / 100).toFixed(2)
}

export async function main() {
  if (!macbookBalances()) throw new Error(`${MACBOOK_2025.invoiceNumber} does not balance`)
  console.log(
    `${MACBOOK_2025.invoiceNumber}  ${MACBOOK_2025.invoiceDate}  $${format(MACBOOK_2025.totalCents)}  ${MACBOOK_2025.description}`
  )
  for (const line of macbookJournalLines()) {
    const amount = line.debitCents > 0 ? `Dr ${format(line.debitCents)}` : `Cr ${format(line.creditCents)}`
    console.log(`  ${line.accountCode} ${line.accountName}  ${amount}`)
  }

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
  for (const code of ["1160", "1600", "2310"]) {
    if (!accountIds.has(code)) throw new Error(`Chart of accounts is missing ${code}`)
  }
  const gstItc = await prisma.taxCode.findUnique({
    where: { organizationId_code: { organizationId: identified.id, code: "GST_5_ITC" } },
  })
  const owner = await prisma.organizationMember.findFirst({
    where: { organizationId: identified.id, role: { in: ["superuser", "owner"] }, isActive: true },
  })
  if (!owner) throw new Error("No active owner found to attach the expense transactions")
  const personalCard = await prisma.paymentMethod.findUnique({
    where: { organizationId_name: { organizationId: identified.id, name: "Personal Card - Owner" } },
  })

  const existing = await prisma.journalEntry.findUnique({
    where: { organizationId_entryNumber: { organizationId: identified.id, entryNumber: MACBOOK_2025.invoiceNumber } },
  })
  if (existing && existing.source !== MACBOOK_2025_SOURCE) {
    throw new Error(`${MACBOOK_2025.invoiceNumber} already exists from ${existing.source}`)
  }
  if (existing && shouldSkipExistingJournals()) {
    console.log(`Skipping ${MACBOOK_2025.invoiceNumber} (already posted)`)
    return
  }
  if (existing) await prisma.journalEntry.delete({ where: { id: existing.id } })

  const postedAt = new Date(`${MACBOOK_2025.invoiceDate}T12:00:00.000Z`)
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
      entryNumber: MACBOOK_2025.invoiceNumber,
      source: MACBOOK_2025_SOURCE,
      description: `${MACBOOK_2025.description} (${MACBOOK_2025.invoiceNumber})`,
      postedAt,
      status: "posted",
      currencyCode: "CAD",
      createdById: owner.userId,
      lines: {
        create: macbookJournalLines().map((line) => ({
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

  const prior = await prisma.transaction.findFirst({
    where: { organizationId: identified.id, name: { startsWith: MACBOOK_2025.invoiceNumber } },
  })
  if (prior) await prisma.transaction.delete({ where: { id: prior.id } })

  await prisma.transaction.create({
    data: {
      userId: owner.userId,
      organizationId: identified.id,
      name: `${MACBOOK_2025.invoiceNumber} ${MACBOOK_2025.description}`.slice(0, 180),
      description: `Reimbursement to Jerrold Jacobe (${MACBOOK_2025.invoiceNumber})`,
      merchant: "Apple",
      total: MACBOOK_2025.totalCents,
      currencyCode: "CAD",
      convertedTotal: MACBOOK_2025.totalCents,
      convertedCurrencyCode: "CAD",
      type: "expense",
      issuedAt: postedAt,
      paymentMethodId: personalCard?.id,
      journalEntryId: entry.id,
      postsToLedger: true,
      destinationType: "paid_expense",
      note: [
        MACBOOK_2025.store,
        `Receipt ${MACBOOK_2025.receiptNumber}`,
        `Serial ${MACBOOK_2025.serial}`,
        `GST ${format(MACBOOK_2025.gstCents)} ITC`,
        "Paid personally. Shareholder loan 2310. Class 50.",
      ].join(" | "),
      extra: {
        invoiceNumber: MACBOOK_2025.invoiceNumber,
        receiptNumber: MACBOOK_2025.receiptNumber,
        serial: MACBOOK_2025.serial,
        gstCents: MACBOOK_2025.gstCents,
        netCents: MACBOOK_2025.netCents,
        accountCode: "1600",
        ccaClass: "class50",
      },
    },
  })

  console.log(`Posted ${MACBOOK_2025.invoiceNumber} for ${identified.name}`)
}

const isDirectRun = process.argv[1]?.includes("import-macbook-2025")
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
