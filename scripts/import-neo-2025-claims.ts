/**
 * Post claimable 2025 Neo Financial Mastercard shop charges.
 *
 * Twelve monthly journals. Debit labeled expense/equipment/meals accounts and GST ITC.
 * Credit 2310 Shareholder Loan - Jerrold. Personal grocery, gas, insurance, phone,
 * already-booked Alibaba Klarna, ENMAX, and TradingView card lines are omitted.
 * Restaurant meals are booked in full on 6100; T2 adds back 50%.
 *
 * Usage:
 *   npx tsx scripts/import-neo-2025-claims.ts --dry-run
 *   DATABASE_URL=postgresql://... npx tsx scripts/import-neo-2025-claims.ts
 */
import {
  NEO_2025_SOURCE,
  neoClaimTotals,
  neoMealClaims,
  neoMealsNondeductibleCents,
  neoMonthBalances,
  neoMonthJournalLines,
  neoMonthlyJournals,
} from "@/lib/neo-2025-claims"
import { shouldSkipExistingJournals } from "@/lib/post-2025-shop-books"

function format(cents: number) {
  return (cents / 100).toFixed(2)
}

export async function main() {
  const months = neoMonthlyJournals()
  let paid = 0
  let gst = 0
  for (const month of months) {
    if (!neoMonthBalances(month)) throw new Error(`${month.entryNumber} does not balance`)
    const totals = neoClaimTotals(month.claims)
    paid += totals.totalCents
    gst += totals.gstCents
    console.log(
      `${month.entryNumber}  ${month.postedOn}  n=${totals.count}  net ${format(totals.netCents)}  GST ${format(totals.gstCents)}  loan ${format(totals.totalCents)}`
    )
  }
  const meals = neoMealClaims()
  const mealNet = meals.reduce((sum, claim) => sum + claim.netCents, 0)
  console.log(`Shareholder loan ${format(paid)}  GST ITC ${format(gst)}`)
  console.log(
    `Meals ${meals.length}  net ${format(mealNet)}  T2 50% add-back ${format(neoMealsNondeductibleCents())}`
  )

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
  for (const code of ["1160", "1600", "2310", "5000", "5040", "5100", "6020", "6050", "6100"]) {
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

  for (const month of months) {
    const existing = await prisma.journalEntry.findUnique({
      where: { organizationId_entryNumber: { organizationId: identified.id, entryNumber: month.entryNumber } },
    })
    if (existing && existing.source !== NEO_2025_SOURCE) {
      throw new Error(`${month.entryNumber} already exists from ${existing.source}`)
    }
    if (existing && shouldSkipExistingJournals()) {
      console.log(`Skipping ${month.entryNumber} (already posted)`)
      continue
    }
    if (existing) await prisma.journalEntry.delete({ where: { id: existing.id } })

    const postedAt = new Date(`${month.postedOn}T12:00:00.000Z`)
    const closedPeriod = await prisma.accountingPeriod.findFirst({
      where: {
        organizationId: identified.id,
        isClosed: true,
        startsAt: { lte: postedAt },
        endsAt: { gte: postedAt },
      },
    })
    if (closedPeriod) throw new Error(`Accounting period ${closedPeriod.name} is closed`)

    const totals = neoClaimTotals(month.claims)
    const entry = await prisma.journalEntry.create({
      data: {
        organizationId: identified.id,
        entryNumber: month.entryNumber,
        source: NEO_2025_SOURCE,
        description: `Neo Mastercard print-shop charges ${month.month}`,
        postedAt,
        status: "posted",
        currencyCode: "CAD",
        createdById: owner.userId,
        lines: {
          create: neoMonthJournalLines(month).map((line) => ({
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
      where: { organizationId: identified.id, name: { startsWith: month.entryNumber } },
    })
    if (prior) await prisma.transaction.delete({ where: { id: prior.id } })

    await prisma.transaction.create({
      data: {
        userId: owner.userId,
        organizationId: identified.id,
        name: `${month.entryNumber} Neo print-shop charges`,
        description: `Reimbursement to Jerrold Jacobe (${month.entryNumber})`,
        merchant: "Neo Financial",
        total: totals.totalCents,
        currencyCode: "CAD",
        convertedTotal: totals.totalCents,
        convertedCurrencyCode: "CAD",
        type: "expense",
        issuedAt: postedAt,
        paymentMethodId: personalCard?.id,
        journalEntryId: entry.id,
        postsToLedger: true,
        destinationType: "paid_expense",
        note: [
          `Mastercard •••• 6233`,
          `${totals.count} shop charges`,
          `GST ${format(totals.gstCents)} ITC`,
          "Paid personally. Shareholder loan 2310.",
        ].join(" | "),
        extra: {
          entryNumber: month.entryNumber,
          month: month.month,
          claimCount: totals.count,
          gstCents: totals.gstCents,
          netCents: totals.netCents,
        },
      },
    })
  }

  const mealNetCents = neoMealClaims().reduce((sum, claim) => sum + claim.netCents, 0)
  const mealAddBack = neoMealsNondeductibleCents()
  await prisma.t2ScheduleAdjustment.upsert({
    where: {
      organizationId_taxYear_code: { organizationId: identified.id, taxYear: 2025, code: "meals_nondeductible" },
    },
    update: {
      amountCents: mealAddBack,
      note: `50% of Neo 2025 meal expense ${format(mealNetCents)} is not deductible.`,
      label: "Non-deductible meals and entertainment",
      section: "schedule1_addition",
      sortOrder: 20,
    },
    create: {
      organizationId: identified.id,
      taxYear: 2025,
      code: "meals_nondeductible",
      label: "Non-deductible meals and entertainment",
      section: "schedule1_addition",
      amountCents: mealAddBack,
      note: `50% of Neo 2025 meal expense ${format(mealNetCents)} is not deductible.`,
      sortOrder: 20,
    },
  })

  console.log(`Posted ${months.length} Neo monthly journals for ${identified.name}. T2 meals add-back ${format(mealAddBack)}.`)
}

const isDirectRun = process.argv[1]?.includes("import-neo-2025-claims")
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
