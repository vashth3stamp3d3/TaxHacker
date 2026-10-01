/**
 * Post Formulated Prints historical journal entries from the updated FP36 workbook
 * and log both Excel files as beginning / ending balance snapshots.
 *
 * 2024 books come from the filed T2, not this workbook. This importer keeps 2025+
 * FP36 journals only.
 *
 * Spreadsheet account codes are mapped onto the app chart:
 *   1600 Equipment -> 1600 Equipment
 *   2100 Shareholder Loan - Jerrold -> 2310 Shareholder Loan - Jerrold
 *   5000 Supplies Expense -> 5100 Supplies Expense
 *
 * Usage:
 *   npx tsx scripts/import-formulated-prints-ledger.ts --dry-run
 *   DATABASE_URL=postgresql://... npx tsx scripts/import-formulated-prints-ledger.ts
 */
import { prisma } from "@/lib/db"
import {
  EXPECTED_BEGINNING_BALANCES,
  EXPECTED_ENDING_BALANCES,
  FP36_SOURCE,
  assertExpectedTotals,
  loadBeginningSnapshot,
  loadEndingSnapshot,
  loadFp36Entries,
  snapshotTotals,
  summarizeEntries,
  type HistoricalEntry,
} from "@/lib/formulated-prints-ledger"
import { applyFormulatedPrintsIdentity, seedOrganizationDefaults } from "@/models/organizations"

async function postEntries(entries: HistoricalEntry[]) {
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
  for (const code of ["1600", "2310", "5100"]) {
    if (!accountIds.has(code)) {
      throw new Error(`Chart of accounts is missing ${code}`)
    }
  }

  const owner = await prisma.organizationMember.findFirst({
    where: { organizationId: identified.id, role: { in: ["superuser", "owner"] } },
  })

  const liveEntries = entries.filter((entry) => entry.postedAt.getUTCFullYear() >= 2025)
  for (const entry of liveEntries) {
    const existing = await prisma.journalEntry.findUnique({
      where: { organizationId_entryNumber: { organizationId: identified.id, entryNumber: entry.entryNumber } },
    })
    if (existing) {
      await prisma.journalEntry.delete({ where: { id: existing.id } })
    }

    await prisma.journalEntry.create({
      data: {
        organizationId: identified.id,
        entryNumber: entry.entryNumber,
        source: FP36_SOURCE,
        description: entry.description,
        postedAt: entry.postedAt,
        status: "posted",
        currencyCode: "CAD",
        createdById: owner?.userId,
        lines: {
          create: entry.lines.map((line) => ({
            organizationId: identified.id,
            accountId: accountIds.get(line.accountCode)!,
            debit: line.debitCents,
            credit: line.creditCents,
            memo: line.memo,
          })),
        },
      },
    })
  }

  return identified
}

async function main() {
  const [entries, beginning, ending] = await Promise.all([
    loadFp36Entries(),
    loadBeginningSnapshot(),
    loadEndingSnapshot(),
  ])
  const totals = summarizeEntries(entries)
  const format = (cents: number) => (cents / 100).toFixed(2)
  const lineCount = entries.reduce((count, entry) => count + entry.lines.length, 0)
  console.log(`Parsed ${entries.length} FP36 journal entries (${lineCount} lines)`)
  for (const [code, total] of totals) {
    console.log(`${code} debit ${format(total.debit)} credit ${format(total.credit)}`)
  }

  assertExpectedTotals(totals, EXPECTED_ENDING_BALANCES)
  assertExpectedTotals(new Map(Object.entries(snapshotTotals(beginning.lines))), EXPECTED_BEGINNING_BALANCES)
  assertExpectedTotals(new Map(Object.entries(snapshotTotals(ending.lines))), EXPECTED_ENDING_BALANCES)
  if (entries.length !== 36 || lineCount !== 72) {
    throw new Error(`Expected 36 entries and 72 lines, got ${entries.length} entries and ${lineCount} lines`)
  }

  console.log(`Beginning snapshot ${beginning.sourceFile} as of ${beginning.asOf.toISOString().slice(0, 10)}`)
  for (const line of beginning.lines) {
    console.log(`  ${line.accountCode} debit ${format(line.debitCents)} credit ${format(line.creditCents)}`)
  }
  console.log(`Ending snapshot ${ending.sourceFile} as of ${ending.asOf.toISOString().slice(0, 10)}`)
  for (const line of ending.lines) {
    console.log(`  ${line.accountCode} debit ${format(line.debitCents)} credit ${format(line.creditCents)}`)
  }

  if (process.argv.includes("--dry-run")) {
    return
  }

  const organization = await postEntries(entries)
  console.log(
    `Posted ${entries.filter((entry) => entry.postedAt.getUTCFullYear() >= 2025).length} FP36 2025+ entries for ${organization.name}. 2024 is the filed T2, not this workbook.`
  )
}

const isDirectRun = process.argv[1]?.includes("import-formulated-prints-ledger")
if (isDirectRun) {
  main()
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(async () => {
      if (!process.argv.includes("--dry-run")) {
        await prisma.$disconnect().catch(() => undefined)
      }
    })
}
