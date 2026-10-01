/**
 * Post 2025 maximum CCA as book depreciation and set the T2 worksheet
 * add-back and CCA deduction to the same amount.
 *
 * Dr 6090 Depreciation / Cr 1690 Accumulated Depreciation on 2025-12-31.
 *
 * Usage:
 *   npx tsx scripts/import-2025-depreciation.ts --dry-run
 *   DATABASE_URL=postgresql://... npx tsx scripts/import-2025-depreciation.ts
 */
import {
  CCA_2025,
  CCA_2025_ENTRY,
  CCA_2025_POSTED_AT,
  CCA_2025_SOURCE,
  CCA_2025_YEAR,
  cca2025Balances,
  cca2025Description,
  cca2025JournalLines,
  cca2025T2Adjustments,
  formatCad,
} from "@/lib/cca-2025"
import { shouldSkipExistingJournals } from "@/lib/post-2025-shop-books"

function format(cents: number) {
  return (cents / 100).toFixed(2)
}

export async function main() {
  const totals = cca2025Balances()
  if (!totals.balanced) throw new Error("2025 depreciation entry does not balance")

  console.log(`2025 maximum CCA ${formatCad(CCA_2025.totalCcaCents)}`)
  console.log(
    `Class 8 opening UCC ${formatCad(CCA_2025.class8.openingUccCents)} additions ${formatCad(CCA_2025.class8.additionsCents)} CCA ${formatCad(CCA_2025.class8.ccaCents)} closing ${formatCad(CCA_2025.class8.closingUccCents)}`
  )
  console.log(
    `Class 12 additions ${formatCad(CCA_2025.class12.additionsCents)} CCA ${formatCad(CCA_2025.class12.ccaCents)} closing ${formatCad(CCA_2025.class12.closingUccCents)}`
  )
  console.log(
    `Class 50 additions ${formatCad(CCA_2025.class50.additionsCents)} CCA ${formatCad(CCA_2025.class50.ccaCents)} closing ${formatCad(CCA_2025.class50.closingUccCents)}`
  )
  console.log(`Class 8 RIIP alternative ${formatCad(CCA_2025.allClass8RiipCents)} (not used)`)
  for (const item of [...CCA_2025.class8.items, ...CCA_2025.class12.items, ...CCA_2025.class50.items]) {
    console.log(`  ${item.invoiceNumber}  ${formatCad(item.costCents)}  ${item.description}`)
  }
  for (const line of cca2025JournalLines()) {
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
  for (const code of ["1690", "6090"]) {
    if (!accountIds.has(code)) throw new Error(`Chart of accounts is missing ${code}`)
  }

  const owner = await prisma.organizationMember.findFirst({
    where: { organizationId: identified.id, role: { in: ["superuser", "owner"] }, isActive: true },
  })
  if (!owner) throw new Error("No active owner found to attach the depreciation entry")

  const existing = await prisma.journalEntry.findUnique({
    where: { organizationId_entryNumber: { organizationId: identified.id, entryNumber: CCA_2025_ENTRY } },
  })
  if (existing && existing.source !== CCA_2025_SOURCE) {
    throw new Error(`${CCA_2025_ENTRY} already exists from ${existing.source}`)
  }

  const skipJournal = Boolean(existing && shouldSkipExistingJournals())
  if (skipJournal) {
    console.log(`Skipping ${CCA_2025_ENTRY} (already posted)`)
  } else {
    if (existing) await prisma.journalEntry.delete({ where: { id: existing.id } })

    const closedPeriod = await prisma.accountingPeriod.findFirst({
      where: {
        organizationId: identified.id,
        isClosed: true,
        startsAt: { lte: CCA_2025_POSTED_AT },
        endsAt: { gte: CCA_2025_POSTED_AT },
      },
    })
    if (closedPeriod) throw new Error(`Accounting period ${closedPeriod.name} is closed`)

    const entry = await prisma.journalEntry.create({
      data: {
        organizationId: identified.id,
        entryNumber: CCA_2025_ENTRY,
        source: CCA_2025_SOURCE,
        description: cca2025Description(),
        postedAt: CCA_2025_POSTED_AT,
        status: "posted",
        currencyCode: "CAD",
        createdById: owner.userId,
        lines: {
          create: cca2025JournalLines().map((line) => ({
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
      where: { organizationId: identified.id, name: { startsWith: CCA_2025_ENTRY } },
    })
    if (prior) await prisma.transaction.delete({ where: { id: prior.id } })

    await prisma.transaction.create({
      data: {
        userId: owner.userId,
        organizationId: identified.id,
        name: `${CCA_2025_ENTRY} maximum CCA`,
        description: cca2025Description(),
        merchant: "CCA",
        total: CCA_2025.bookDepreciationCents,
        currencyCode: "CAD",
        convertedTotal: CCA_2025.bookDepreciationCents,
        convertedCurrencyCode: "CAD",
        type: "expense",
        issuedAt: CCA_2025_POSTED_AT,
        journalEntryId: entry.id,
        postsToLedger: true,
        note: [
          `Class 8 CCA ${formatCad(CCA_2025.class8.ccaCents)}`,
          `Class 12 CCA ${formatCad(CCA_2025.class12.ccaCents)}`,
          `Class 50 CCA ${formatCad(CCA_2025.class50.ccaCents)}`,
          `Closing class 8 UCC ${formatCad(CCA_2025.class8.closingUccCents)}`,
          `Closing class 50 UCC ${formatCad(CCA_2025.class50.closingUccCents)}`,
          "Book depreciation equals CCA.",
        ].join(" | "),
        extra: {
          source: CCA_2025_SOURCE,
          entryNumber: CCA_2025_ENTRY,
          totalCcaCents: CCA_2025.totalCcaCents,
          class8CcaCents: CCA_2025.class8.ccaCents,
          class12CcaCents: CCA_2025.class12.ccaCents,
          class50CcaCents: CCA_2025.class50.ccaCents,
          class8ClosingUccCents: CCA_2025.class8.closingUccCents,
          class50ClosingUccCents: CCA_2025.class50.closingUccCents,
          allClass8RiipCents: CCA_2025.allClass8RiipCents,
        },
      },
    })
  }

  for (const row of cca2025T2Adjustments()) {
    await prisma.t2ScheduleAdjustment.upsert({
      where: {
        organizationId_taxYear_code: { organizationId: identified.id, taxYear: CCA_2025_YEAR, code: row.code },
      },
      update: {
        amountCents: row.amountCents,
        note: row.note,
        label: row.label,
        section: row.section,
        sortOrder: row.sortOrder,
      },
      create: {
        organizationId: identified.id,
        taxYear: CCA_2025_YEAR,
        code: row.code,
        label: row.label,
        section: row.section,
        amountCents: row.amountCents,
        note: row.note,
        sortOrder: row.sortOrder,
      },
    })
  }

  console.log(
    skipJournal
      ? `T2 2025 CCA adjustments upserted for ${identified.name}. Depreciation ${formatCad(CCA_2025.bookDepreciationCents)} already on the ledger.`
      : `Posted ${CCA_2025_ENTRY} for ${identified.name}. Depreciation ${formatCad(CCA_2025.bookDepreciationCents)}.`
  )
}

const isDirectRun = process.argv[1]?.includes("import-2025-depreciation")
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
