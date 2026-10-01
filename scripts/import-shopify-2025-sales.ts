/**
 * Post the 2025 Shopify Analytics sales summary.
 *
 * Credits print sales and shipping income, debits discounts and sales reversals,
 * and credits GST collected. Operating revenue for net income is net sales plus
 * shipping. The cash side is Undeposited Funds until Shopify payouts are matched.
 *
 * Usage:
 *   npx tsx scripts/import-shopify-2025-sales.ts --dry-run
 *   DATABASE_URL=postgresql://... npx tsx scripts/import-shopify-2025-sales.ts
 */
import {
  SHOPIFY_2025_ENTRY,
  SHOPIFY_2025_POSTED_AT,
  SHOPIFY_2025_SALES,
  SHOPIFY_2025_SOURCE,
  shopify2025Balances,
  shopify2025JournalLines,
  shopify2025OperatingRevenueCents,
} from "@/lib/shopify-2025-sales"
import { shouldSkipExistingJournals } from "@/lib/post-2025-shop-books"

function format(cents: number) {
  return (cents / 100).toFixed(2)
}

export async function main() {
  const totals = shopify2025Balances()
  if (!totals.balanced) throw new Error("Shopify 2025 sales entry does not balance")

  console.log(`Shopify ${SHOPIFY_2025_SALES.periodStart} to ${SHOPIFY_2025_SALES.periodEnd} (${SHOPIFY_2025_SALES.currency})`)
  console.log(`Gross sales ${format(SHOPIFY_2025_SALES.grossSalesCents)}`)
  console.log(`Discounts ${format(SHOPIFY_2025_SALES.discountsCents)}`)
  console.log(`Sales reversals ${format(SHOPIFY_2025_SALES.salesReversalsCents)}`)
  console.log(`Net sales ${format(SHOPIFY_2025_SALES.netSalesCents)}`)
  console.log(`Shipping income ${format(SHOPIFY_2025_SALES.shippingChargesCents)}`)
  console.log(`GST collected ${format(SHOPIFY_2025_SALES.taxesCents)}`)
  console.log(`Total sales ${format(SHOPIFY_2025_SALES.totalSalesCents)}`)
  console.log(`Operating revenue for net income ${format(shopify2025OperatingRevenueCents())}`)
  for (const line of shopify2025JournalLines()) {
    const amount = line.debitCents > 0 ? `Dr ${format(line.debitCents)}` : `Cr ${format(line.creditCents)}`
    console.log(`  ${line.accountCode} ${line.accountName}  ${amount}  ${line.memo}`)
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
  for (const code of ["1020", "2100", "4000", "4300", "4900"]) {
    if (!accountIds.has(code)) throw new Error(`Chart of accounts is missing ${code}`)
  }
  const gstCollected = await prisma.taxCode.findUnique({
    where: { organizationId_code: { organizationId: identified.id, code: "GST_5_COLLECTED" } },
  })

  const owner = await prisma.organizationMember.findFirst({
    where: { organizationId: identified.id, role: { in: ["superuser", "owner"] }, isActive: true },
  })
  if (!owner) throw new Error("No active owner found to attach the sales transaction")

  const existing = await prisma.journalEntry.findUnique({
    where: { organizationId_entryNumber: { organizationId: identified.id, entryNumber: SHOPIFY_2025_ENTRY } },
  })
  if (existing && existing.source !== SHOPIFY_2025_SOURCE) {
    throw new Error(`${SHOPIFY_2025_ENTRY} already exists from ${existing.source}`)
  }
  if (existing && shouldSkipExistingJournals()) {
    console.log(`Skipping ${SHOPIFY_2025_ENTRY} (already posted)`)
    return
  }
  if (existing) await prisma.journalEntry.delete({ where: { id: existing.id } })

  const closedPeriod = await prisma.accountingPeriod.findFirst({
    where: {
      organizationId: identified.id,
      isClosed: true,
      startsAt: { lte: SHOPIFY_2025_POSTED_AT },
      endsAt: { gte: SHOPIFY_2025_POSTED_AT },
    },
  })
  if (closedPeriod) throw new Error(`Accounting period ${closedPeriod.name} is closed`)

  const entry = await prisma.journalEntry.create({
    data: {
      organizationId: identified.id,
      entryNumber: SHOPIFY_2025_ENTRY,
      source: SHOPIFY_2025_SOURCE,
      description: "Shopify 2025 sales — print sales, discounts, reversals, shipping, and GST",
      postedAt: SHOPIFY_2025_POSTED_AT,
      status: "posted",
      currencyCode: "CAD",
      createdById: owner.userId,
      lines: {
        create: shopify2025JournalLines().map((line) => ({
          organizationId: identified.id,
          accountId: accountIds.get(line.accountCode)!,
          debit: line.debitCents,
          credit: line.creditCents,
          memo: line.memo,
          taxCodeId: line.taxCode ? gstCollected?.id : undefined,
        })),
      },
    },
  })

  const prior = await prisma.transaction.findFirst({
    where: { organizationId: identified.id, name: { startsWith: SHOPIFY_2025_ENTRY } },
  })
  if (prior) await prisma.transaction.delete({ where: { id: prior.id } })

  await prisma.transaction.create({
    data: {
      userId: owner.userId,
      organizationId: identified.id,
      name: `${SHOPIFY_2025_ENTRY} Shopify sales`,
      description: "Net sales, shipping income, and GST collected for 2025",
      merchant: "Shopify",
      total: SHOPIFY_2025_SALES.totalSalesCents,
      currencyCode: "CAD",
      convertedTotal: shopify2025OperatingRevenueCents(),
      convertedCurrencyCode: "CAD",
      type: "income",
      issuedAt: SHOPIFY_2025_POSTED_AT,
      journalEntryId: entry.id,
      postsToLedger: true,
      destinationType: "customer_invoice",
      note: [
        `Gross sales ${format(SHOPIFY_2025_SALES.grossSalesCents)}`,
        `Discounts ${format(SHOPIFY_2025_SALES.discountsCents)}`,
        `Sales reversals ${format(SHOPIFY_2025_SALES.salesReversalsCents)}`,
        `Net sales ${format(SHOPIFY_2025_SALES.netSalesCents)}`,
        `Shipping ${format(SHOPIFY_2025_SALES.shippingChargesCents)}`,
        `GST ${format(SHOPIFY_2025_SALES.taxesCents)}`,
        `Operating revenue ${format(shopify2025OperatingRevenueCents())}`,
        `${SHOPIFY_2025_SALES.orders} orders, ${SHOPIFY_2025_SALES.ordersFulfilled} fulfilled`,
      ].join(" | "),
      extra: {
        source: SHOPIFY_2025_SOURCE,
        ...SHOPIFY_2025_SALES,
        operatingRevenueCents: shopify2025OperatingRevenueCents(),
      },
    },
  })

  console.log(
    `Posted ${SHOPIFY_2025_ENTRY} for ${identified.name}. Operating revenue ${format(shopify2025OperatingRevenueCents())}.`
  )
}

const isDirectRun = process.argv[1]?.includes("import-shopify-2025-sales")
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
