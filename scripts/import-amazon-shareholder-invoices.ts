/**
 * Post the 2025 Amazon shareholder-loan expenses (FP-0047 through FP-0054).
 *
 * Debit the labeled equipment or supplies account and GST input tax credit.
 * Credit 2310 Shareholder Loan - Jerrold for the amount paid.
 *
 * Usage:
 *   npx tsx scripts/import-amazon-shareholder-invoices.ts --dry-run
 *   DATABASE_URL=postgresql://... npx tsx scripts/import-amazon-shareholder-invoices.ts
 */
import {
  AMAZON_SHAREHOLDER_INVOICES,
  AMAZON_SHAREHOLDER_SOURCE,
  amazonInvoiceBalances,
  amazonJournalLines,
} from "@/lib/amazon-shareholder-invoices"
import { shouldSkipExistingJournals } from "@/lib/post-2025-shop-books"

function format(cents: number) {
  return (cents / 100).toFixed(2)
}

export async function main() {
  let paid = 0
  for (const invoice of AMAZON_SHAREHOLDER_INVOICES) {
    if (!amazonInvoiceBalances(invoice)) throw new Error(`${invoice.invoiceNumber} does not balance`)
    paid += invoice.totalCents
    console.log(
      `${invoice.invoiceNumber}  ${invoice.invoiceDate}  $${format(invoice.totalCents)}  ${invoice.description}`
    )
    for (const line of amazonJournalLines(invoice)) {
      const amount = line.debitCents > 0 ? `Dr ${format(line.debitCents)}` : `Cr ${format(line.creditCents)}`
      console.log(`  ${line.accountCode} ${line.accountName}  ${amount}`)
    }
  }
  console.log(`Shareholder loan ${format(paid)}`)

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
  for (const code of ["1160", "1600", "2310", "5100"]) {
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

  for (const invoice of AMAZON_SHAREHOLDER_INVOICES) {
    const existing = await prisma.journalEntry.findUnique({
      where: { organizationId_entryNumber: { organizationId: identified.id, entryNumber: invoice.invoiceNumber } },
    })
    if (existing && existing.source !== AMAZON_SHAREHOLDER_SOURCE) {
      throw new Error(`${invoice.invoiceNumber} already exists from ${existing.source}`)
    }
    if (existing && shouldSkipExistingJournals()) {
      console.log(`Skipping ${invoice.invoiceNumber} (already posted)`)
      continue
    }
    if (existing) await prisma.journalEntry.delete({ where: { id: existing.id } })

    const postedAt = new Date(`${invoice.invoiceDate}T12:00:00.000Z`)
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
        entryNumber: invoice.invoiceNumber,
        source: AMAZON_SHAREHOLDER_SOURCE,
        description: `${invoice.description} (${invoice.invoiceNumber})`,
        postedAt,
        status: "posted",
        currencyCode: "CAD",
        createdById: owner.userId,
        lines: {
          create: amazonJournalLines(invoice).map((line) => ({
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
      where: { organizationId: identified.id, name: { startsWith: invoice.invoiceNumber } },
    })
    if (prior) await prisma.transaction.delete({ where: { id: prior.id } })

    await prisma.transaction.create({
      data: {
        userId: owner.userId,
        organizationId: identified.id,
        name: `${invoice.invoiceNumber} ${invoice.description}`.slice(0, 180),
        description: `Reimbursement to Jerrold Jacobe (${invoice.invoiceNumber})`,
        merchant: "Amazon.ca",
        total: invoice.totalCents,
        currencyCode: "CAD",
        convertedTotal: invoice.totalCents,
        convertedCurrencyCode: "CAD",
        type: "expense",
        issuedAt: postedAt,
        paymentMethodId: personalCard?.id,
        journalEntryId: entry.id,
        postsToLedger: true,
        destinationType: "paid_expense",
        note: [
          invoice.seller,
          `Amazon invoice ${invoice.amazonInvoiceNumber}`,
          `Order ${invoice.orderNumber}`,
          `GST ${format(invoice.gstCents)} ITC`,
          `Delivered to ${invoice.delivery}`,
          "Paid personally. Shareholder loan 2310.",
        ].join(" | "),
        extra: {
          invoiceNumber: invoice.invoiceNumber,
          amazonInvoiceNumber: invoice.amazonInvoiceNumber,
          orderNumber: invoice.orderNumber,
          seller: invoice.seller,
          gstRegistrant: invoice.gstRegistrant,
          gstCents: invoice.gstCents,
          netCostCents: invoice.listPriceCents - invoice.discountCents,
          accountCode: invoice.kind === "equipment" ? "1600" : "5100",
          sourceFile: `data/formulated-prints/amazon-invoices/${invoice.amazonInvoiceNumber}.pdf`,
        },
      },
    })
  }

  console.log(`Posted ${AMAZON_SHAREHOLDER_INVOICES.length} Amazon shareholder-loan expenses for ${identified.name}`)
}

const isDirectRun = process.argv[1]?.includes("import-amazon-shareholder-invoices")
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
