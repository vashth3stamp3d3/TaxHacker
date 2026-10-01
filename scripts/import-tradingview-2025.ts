/**
 * Post the 2025 TradingView Premium invoice (FP-0055).
 *
 * Debit 6020 Software and 1160 GST ITC. Credit 2310 Shareholder Loan.
 *
 * Usage:
 *   npx tsx scripts/import-tradingview-2025.ts --dry-run
 *   DATABASE_URL=postgresql://... npx tsx scripts/import-tradingview-2025.ts
 */
import {
  TRADINGVIEW_2025,
  TRADINGVIEW_2025_SOURCE,
  tradingViewBalances,
  tradingViewJournalLines,
} from "@/lib/tradingview-2025"
import { shouldSkipExistingJournals } from "@/lib/post-2025-shop-books"

function format(cents: number) {
  return (cents / 100).toFixed(2)
}

export async function main() {
  if (!tradingViewBalances()) throw new Error(`${TRADINGVIEW_2025.invoiceNumber} does not balance`)
  console.log(
    `${TRADINGVIEW_2025.invoiceNumber}  ${TRADINGVIEW_2025.invoiceDate}  $${format(TRADINGVIEW_2025.totalCents)}  ${TRADINGVIEW_2025.description}`
  )
  for (const line of tradingViewJournalLines()) {
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
  for (const code of ["1160", "2310", "6020"]) {
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
    where: { organizationId_entryNumber: { organizationId: identified.id, entryNumber: TRADINGVIEW_2025.invoiceNumber } },
  })
  if (existing && existing.source !== TRADINGVIEW_2025_SOURCE) {
    throw new Error(`${TRADINGVIEW_2025.invoiceNumber} already exists from ${existing.source}`)
  }
  if (existing && shouldSkipExistingJournals()) {
    console.log(`Skipping ${TRADINGVIEW_2025.invoiceNumber} (already posted)`)
    return
  }
  if (existing) await prisma.journalEntry.delete({ where: { id: existing.id } })

  const postedAt = new Date(`${TRADINGVIEW_2025.invoiceDate}T12:00:00.000Z`)
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
      entryNumber: TRADINGVIEW_2025.invoiceNumber,
      source: TRADINGVIEW_2025_SOURCE,
      description: `${TRADINGVIEW_2025.description} (${TRADINGVIEW_2025.invoiceNumber})`,
      postedAt,
      status: "posted",
      currencyCode: "CAD",
      createdById: owner.userId,
      lines: {
        create: tradingViewJournalLines().map((line) => ({
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
    where: { organizationId: identified.id, name: { startsWith: TRADINGVIEW_2025.invoiceNumber } },
  })
  if (prior) await prisma.transaction.delete({ where: { id: prior.id } })

  await prisma.transaction.create({
    data: {
      userId: owner.userId,
      organizationId: identified.id,
      name: `${TRADINGVIEW_2025.invoiceNumber} ${TRADINGVIEW_2025.description}`.slice(0, 180),
      description: `Reimbursement to Jerrold Jacobe (${TRADINGVIEW_2025.invoiceNumber})`,
      merchant: "TradingView",
      total: TRADINGVIEW_2025.totalCents,
      currencyCode: "CAD",
      convertedTotal: TRADINGVIEW_2025.totalCents,
      convertedCurrencyCode: "CAD",
      type: "expense",
      issuedAt: postedAt,
      paymentMethodId: personalCard?.id,
      journalEntryId: entry.id,
      postsToLedger: true,
      destinationType: "paid_expense",
      note: [
        TRADINGVIEW_2025.seller,
        `Invoice ${TRADINGVIEW_2025.vendorInvoiceNumber}`,
        `PayPal ${TRADINGVIEW_2025.transactionId}`,
        `GST ${format(TRADINGVIEW_2025.gstCents)} ITC`,
        "Paid personally. Shareholder loan 2310.",
      ].join(" | "),
      extra: {
        invoiceNumber: TRADINGVIEW_2025.invoiceNumber,
        vendorInvoiceNumber: TRADINGVIEW_2025.vendorInvoiceNumber,
        transactionId: TRADINGVIEW_2025.transactionId,
        gstCents: TRADINGVIEW_2025.gstCents,
        netCents: TRADINGVIEW_2025.netCents,
        accountCode: "6020",
      },
    },
  })

  console.log(`Posted ${TRADINGVIEW_2025.invoiceNumber} for ${identified.name}`)
}

const isDirectRun = process.argv[1]?.includes("import-tradingview-2025")
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
