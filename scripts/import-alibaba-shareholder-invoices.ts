/**
 * Post the 2025 Alibaba shareholder-loan expenses (FP-0037 through FP-0046).
 *
 * Each invoice debits the labeled expense accounts and credits 2310
 * Shareholder Loan - Jerrold. GST is zero because Alibaba did not charge
 * Canadian GST.
 *
 * Usage:
 *   npx tsx scripts/import-alibaba-shareholder-invoices.ts --dry-run
 *   DATABASE_URL=postgresql://... npx tsx scripts/import-alibaba-shareholder-invoices.ts
 */
import {
  ALIBABA_SHAREHOLDER_INVOICES,
  ALIBABA_SHAREHOLDER_SOURCE,
  formatCad,
  journalBalances,
  presentationLines,
  shareholderJournalLines,
} from "@/lib/alibaba-shareholder-invoices"
import { shouldSkipExistingJournals } from "@/lib/post-2025-shop-books"

export async function main() {
  for (const invoice of ALIBABA_SHAREHOLDER_INVOICES) {
    if (!journalBalances(invoice)) {
      throw new Error(`${invoice.invoiceNumber} does not balance`)
    }
    const lines = shareholderJournalLines(invoice)
    console.log(
      `${invoice.invoiceNumber}  ${invoice.paidDate}  ${formatCad(invoice.amountPaidCents)}  ${invoice.label}`
    )
    for (const line of lines) {
      const amount = line.debitCents > 0 ? `Dr ${formatCad(line.debitCents)}` : `Cr ${formatCad(line.creditCents)}`
      console.log(`  ${line.accountCode} ${line.accountName}  ${amount}  ${line.memo}`)
    }
  }

  if (process.argv.includes("--dry-run")) return

  const { prisma } = await import("@/lib/db")
  const { applyFormulatedPrintsIdentity, seedOrganizationDefaults } = await import("@/models/organizations")
  const organizationId = process.env.ORGANIZATION_ID
  const organization = organizationId
    ? await prisma.organization.findUnique({ where: { id: organizationId } })
    : await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } })
  if (!organization) {
    throw new Error("No organization found. Create one in the app, or set ORGANIZATION_ID.")
  }

  const identified = await applyFormulatedPrintsIdentity(organization.id)
  await seedOrganizationDefaults(identified.id)
  const accounts = await prisma.ledgerAccount.findMany({ where: { organizationId: identified.id } })
  const accountIds = new Map(accounts.map((account) => [account.code, account.id]))
  for (const code of ["2310", "5010", "5040", "5100", "6070"]) {
    if (!accountIds.has(code)) throw new Error(`Chart of accounts is missing ${code}`)
  }

  const owner = await prisma.organizationMember.findFirst({
    where: { organizationId: identified.id, role: { in: ["superuser", "owner"] }, isActive: true },
  })
  if (!owner) throw new Error("No active owner found to attach the expense transactions")

  const personalCard = await prisma.paymentMethod.findUnique({
    where: { organizationId_name: { organizationId: identified.id, name: "Personal Card - Owner" } },
  })

  for (const invoice of ALIBABA_SHAREHOLDER_INVOICES) {
    const existing = await prisma.journalEntry.findUnique({
      where: { organizationId_entryNumber: { organizationId: identified.id, entryNumber: invoice.invoiceNumber } },
    })
    if (existing && existing.source !== ALIBABA_SHAREHOLDER_SOURCE) {
      throw new Error(`${invoice.invoiceNumber} already exists from ${existing.source}`)
    }
    if (existing && shouldSkipExistingJournals()) {
      console.log(`Skipping ${invoice.invoiceNumber} (already posted)`)
      continue
    }
    if (existing) {
      await prisma.journalEntry.delete({ where: { id: existing.id } })
    }

    const postedAt = new Date(`${invoice.paidDate}T00:00:00.000Z`)
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
        source: ALIBABA_SHAREHOLDER_SOURCE,
        description: `${invoice.label} (${invoice.invoiceNumber})`,
        postedAt,
        status: "posted",
        currencyCode: "CAD",
        createdById: owner.userId,
        lines: {
          create: shareholderJournalLines(invoice).map((line) => ({
            organizationId: identified.id,
            accountId: accountIds.get(line.accountCode)!,
            debit: line.debitCents,
            credit: line.creditCents,
            memo: line.memo,
          })),
        },
      },
    })

    const prior = await prisma.transaction.findFirst({
      where: {
        organizationId: identified.id,
        name: { startsWith: invoice.invoiceNumber },
      },
    })
    if (prior) await prisma.transaction.delete({ where: { id: prior.id } })

    await prisma.transaction.create({
      data: {
        userId: owner.userId,
        organizationId: identified.id,
        name: `${invoice.invoiceNumber} ${invoice.label}`.slice(0, 180),
        description: `Reimbursement to Jerrold Jacobe (${invoice.invoiceNumber})`,
        merchant: "Alibaba.com",
        total: invoice.amountPaidCents,
        currencyCode: "CAD",
        convertedTotal: invoice.amountPaidCents,
        convertedCurrencyCode: "CAD",
        type: "expense",
        issuedAt: postedAt,
        note: [
          invoice.paymentDetail,
          `Alibaba order ${invoice.orderNumber}`,
          invoice.seller,
          `USD ${(invoice.usdPaidCents / 100).toFixed(2)} at 1 USD = ${invoice.fxRate} CAD`,
          "GST 0. Shareholder loan 2310. Not a company credit card.",
        ].join(" | "),
        items: presentationLines(invoice),
        paymentMethodId: personalCard?.id,
        journalEntryId: entry.id,
        postsToLedger: true,
        destinationType: "paid_expense",
        extra: {
          invoiceNumber: invoice.invoiceNumber,
          orderNumber: invoice.orderNumber,
          seller: invoice.seller,
          paymentDetail: invoice.paymentDetail,
          usdPaidCents: invoice.usdPaidCents,
          fxRate: invoice.fxRate,
          gstCents: 0,
          sourceReceipt: `data/formulated-prints/alibaba-receipts/${invoice.orderNumber}.pdf`,
          shareholderInvoice: `data/formulated-prints/invoices/FormulatedPrints_Invoice_${invoice.invoiceNumber}.pdf`,
        },
      },
    })
  }

  console.log(`Posted ${ALIBABA_SHAREHOLDER_INVOICES.length} shareholder-loan expenses for ${identified.name}`)
}

const isDirectRun = process.argv[1]?.includes("import-alibaba-shareholder-invoices")
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
