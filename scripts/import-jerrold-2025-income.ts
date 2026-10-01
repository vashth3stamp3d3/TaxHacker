/**
 * Clear 2025 Shopify payouts that landed in Jerrold's personal account onto
 * 2310, then post officer wages for the leftover draw so it is T4 income.
 *
 * Usage:
 *   npx tsx scripts/import-jerrold-2025-income.ts --dry-run
 *   DATABASE_URL=postgresql://... npx tsx scripts/import-jerrold-2025-income.ts
 */
import {
  JERROLD_2025_INCOME,
  JERROLD_2025_SOURCE,
  jerrold2025Balances,
  jerrold2025Journals,
} from "@/lib/jerrold-2025-income"
import { shouldSkipExistingJournals } from "@/lib/post-2025-shop-books"

function format(cents: number) {
  return (cents / 100).toFixed(2)
}

export async function main() {
  const totals = jerrold2025Balances()
  if (!totals.depositBalanced || !totals.wageBalanced || !totals.wagesAreResidual) {
    throw new Error("Jerrold 2025 deposit/wage journals do not balance")
  }

  console.log(`Shopify deposits to Jerrold ${format(JERROLD_2025_INCOME.depositsCents)}`)
  console.log(`Owner-paid shop bills ${format(JERROLD_2025_INCOME.ownerPaidCents)}`)
  console.log(`Officer wages T4-2025 ${format(JERROLD_2025_INCOME.wagesCents)}`)
  console.log(`2310 stays a credit ${format(JERROLD_2025_INCOME.closingLoanCreditCents)} (filed 2024)`)
  for (const journal of jerrold2025Journals()) {
    console.log(`${journal.entryNumber}  ${journal.description}`)
    for (const line of journal.lines) {
      const amount = line.debitCents > 0 ? `Dr ${format(line.debitCents)}` : `Cr ${format(line.creditCents)}`
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
  if (!organization) throw new Error("No organization found. Create one in the app, or set ORGANIZATION_ID.")

  const identified = await applyFormulatedPrintsIdentity(organization.id)
  await seedOrganizationDefaults(identified.id)
  const accounts = await prisma.ledgerAccount.findMany({ where: { organizationId: identified.id } })
  const accountIds = new Map(accounts.map((account) => [account.code, account.id]))
  for (const code of ["1020", "2310", "6200"]) {
    if (!accountIds.has(code)) throw new Error(`Chart of accounts is missing ${code}`)
  }
  const owner = await prisma.organizationMember.findFirst({
    where: { organizationId: identified.id, role: { in: ["superuser", "owner"] }, isActive: true },
  })
  if (!owner) throw new Error("No active owner found to attach the income journals")
  const personalCard = await prisma.paymentMethod.findUnique({
    where: { organizationId_name: { organizationId: identified.id, name: "Personal Card - Owner" } },
  })

  for (const journal of jerrold2025Journals()) {
    const existing = await prisma.journalEntry.findUnique({
      where: { organizationId_entryNumber: { organizationId: identified.id, entryNumber: journal.entryNumber } },
    })
    if (existing && existing.source !== JERROLD_2025_SOURCE) {
      throw new Error(`${journal.entryNumber} already exists from ${existing.source}`)
    }
    if (existing && shouldSkipExistingJournals()) {
      console.log(`Skipping ${journal.entryNumber} (already posted)`)
      continue
    }
    if (existing) await prisma.journalEntry.delete({ where: { id: existing.id } })

    const closedPeriod = await prisma.accountingPeriod.findFirst({
      where: {
        organizationId: identified.id,
        isClosed: true,
        startsAt: { lte: journal.postedAt },
        endsAt: { gte: journal.postedAt },
      },
    })
    if (closedPeriod) throw new Error(`Accounting period ${closedPeriod.name} is closed`)

    const totalCents = journal.lines.reduce((sum, line) => sum + line.debitCents, 0)
    const entry = await prisma.journalEntry.create({
      data: {
        organizationId: identified.id,
        entryNumber: journal.entryNumber,
        source: JERROLD_2025_SOURCE,
        description: journal.description,
        postedAt: journal.postedAt,
        status: "posted",
        currencyCode: "CAD",
        createdById: owner.userId,
        lines: {
          create: journal.lines.map((line) => ({
            organizationId: identified.id,
            accountId: accountIds.get(line.accountCode)!,
            debit: line.debitCents,
            credit: line.creditCents,
            memo: line.memo,
          })),
        },
      },
    })

    if (journal.entryNumber !== "T4-2025") continue

    const prior = await prisma.transaction.findFirst({
      where: { organizationId: identified.id, name: { startsWith: journal.entryNumber } },
    })
    if (prior) await prisma.transaction.delete({ where: { id: prior.id } })

    await prisma.transaction.create({
      data: {
        userId: owner.userId,
        organizationId: identified.id,
        name: `${journal.entryNumber} ${journal.description}`.slice(0, 180),
        description: journal.description,
        merchant: "Jerrold Jacobe",
        total: totalCents,
        currencyCode: "CAD",
        convertedTotal: totalCents,
        convertedCurrencyCode: "CAD",
        type: "expense",
        issuedAt: journal.postedAt,
        paymentMethodId: personalCard?.id,
        journalEntryId: entry.id,
        postsToLedger: true,
        destinationType: "paid_expense",
        note: [
          `Deposits ${format(JERROLD_2025_INCOME.depositsCents)}`,
          `Owner-paid bills ${format(JERROLD_2025_INCOME.ownerPaidCents)}`,
          `Wages ${format(JERROLD_2025_INCOME.wagesCents)}`,
          "Shareholder loan stays the 2024 credit.",
        ].join(" | "),
        extra: {
          entryNumber: journal.entryNumber,
          depositsCents: JERROLD_2025_INCOME.depositsCents,
          ownerPaidCents: JERROLD_2025_INCOME.ownerPaidCents,
          wagesCents: JERROLD_2025_INCOME.wagesCents,
        },
      },
    })
  }

  console.log(`Posted Jerrold 2025 deposit and T4 journals for ${identified.name}.`)
}

const isDirectRun = process.argv[1]?.includes("import-jerrold-2025-income")
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
