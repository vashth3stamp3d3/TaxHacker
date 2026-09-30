/**
 * Replace unofficial 2024 FP36 P&L with the filed 2024 T2 GIFI,
 * keep 2024 equipment on the balance sheet, close net income to RE,
 * and set 2025 opening equal to 2024 ending.
 *
 *   npx tsx scripts/import-2024-t2.ts --dry-run
 *   npx tsx scripts/import-2024-t2.ts
 */
import { prisma } from "@/lib/db"
import { loadFp36Entries } from "@/lib/formulated-prints-ledger"
import {
  T2_2024_GIFI,
  T2_2024_SOURCE,
  T2_2024_YEAR,
  YEAR_CLOSE_SOURCE,
  equipmentCentsFromHistorical,
  official2024BalanceSheet,
  official2024Journals,
} from "@/lib/tax/t2-2024-filed"
import { applyFormulatedPrintsIdentity, seedOrganizationDefaults } from "@/models/organizations"

async function replaceOfficial2024() {
  const organizationId = process.env.ORGANIZATION_ID
  const organization = organizationId
    ? await prisma.organization.findUnique({ where: { id: organizationId } })
    : await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } })
  if (!organization) throw new Error("No organization found. Create one in the app, or set ORGANIZATION_ID.")

  const identified = await applyFormulatedPrintsIdentity(organization.id)
  await seedOrganizationDefaults(identified.id)
  const accounts = await prisma.ledgerAccount.findMany({ where: { organizationId: identified.id } })
  const accountIds = new Map(accounts.map((account) => [account.code, account.id]))
  const required = ["1000", "1600", "1690", "2310", "3100", "4000", "5000", "5040", "6000", "6010", "6020", "6050", "6090"]
  for (const code of required) {
    if (!accountIds.has(code)) throw new Error(`Chart of accounts is missing ${code}`)
  }

  const owner = await prisma.organizationMember.findFirst({
    where: { organizationId: identified.id, role: { in: ["superuser", "owner"] } },
  })
  const equipmentCents = equipmentCentsFromHistorical(await loadFp36Entries(), T2_2024_YEAR)
  const journals = official2024Journals(equipmentCents)
  const { opening, ending } = official2024BalanceSheet(equipmentCents)

  const stale = await prisma.journalEntry.findMany({
    where: {
      organizationId: identified.id,
      OR: [
        { source: T2_2024_SOURCE },
        { source: YEAR_CLOSE_SOURCE, entryNumber: { startsWith: "T2-2024" } },
        {
          source: "formulated-prints-fp36",
          postedAt: {
            gte: new Date(Date.UTC(2023, 0, 1)),
            lte: new Date(Date.UTC(2024, 11, 31, 23, 59, 59, 999)),
          },
        },
      ],
    },
    select: { id: true, entryNumber: true, source: true },
  })

  if (!process.argv.includes("--dry-run")) {
    if (stale.length) {
      await prisma.journalEntry.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } })
    }
    await prisma.ledgerBalanceSnapshot.deleteMany({
      where: { organizationId: identified.id, year: { in: [2024, 2025] } },
    })

    for (const journal of journals) {
      await prisma.journalEntry.deleteMany({
        where: { organizationId: identified.id, entryNumber: journal.entryNumber },
      })
      await prisma.journalEntry.create({
        data: {
          organizationId: identified.id,
          entryNumber: journal.entryNumber,
          source: journal.source,
          description: journal.description,
          postedAt: journal.postedAt,
          status: "posted",
          currencyCode: "CAD",
          createdById: owner?.userId,
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
    }

    const snapshots = [
      {
        year: 2024,
        kind: "beginning",
        label: "2024 opening — first official T2 year",
        sourceFile: "2024 - Formulated Prints - Tax return.pdf",
        asOf: new Date(Date.UTC(2024, 0, 1)),
        lines: opening,
      },
      {
        year: 2024,
        kind: "ending",
        label: "2024 ending — filed T2 GIFI plus equipment subledger",
        sourceFile: "2024 - Formulated Prints - Tax return.pdf",
        asOf: new Date(Date.UTC(2024, 11, 31, 23, 59, 59, 999)),
        lines: ending,
      },
      {
        year: 2025,
        kind: "beginning",
        label: "2025 opening — equals 2024 ending",
        sourceFile: "2024 - Formulated Prints - Tax return.pdf",
        asOf: new Date(Date.UTC(2025, 0, 1)),
        lines: ending,
      },
    ]

    for (const snapshot of snapshots) {
      await prisma.ledgerBalanceSnapshot.upsert({
        where: {
          organizationId_year_kind: { organizationId: identified.id, year: snapshot.year, kind: snapshot.kind },
        },
        update: {
          label: snapshot.label,
          sourceFile: snapshot.sourceFile,
          asOf: snapshot.asOf,
          lines: snapshot.lines,
        },
        create: {
          organizationId: identified.id,
          year: snapshot.year,
          kind: snapshot.kind,
          label: snapshot.label,
          sourceFile: snapshot.sourceFile,
          asOf: snapshot.asOf,
          lines: snapshot.lines,
        },
      })
    }

    await prisma.t2ScheduleAdjustment.upsert({
      where: {
        organizationId_taxYear_code: { organizationId: identified.id, taxYear: 2024, code: "accounting_depreciation" },
      },
      update: {
        amountCents: T2_2024_GIFI.amortization,
        note: "GIFI 8670 book amortization from the filed 2024 T2. Enter Schedule 8 CCA as the matching deduction.",
      },
      create: {
        organizationId: identified.id,
        taxYear: 2024,
        code: "accounting_depreciation",
        label: "Accounting depreciation and amortization",
        section: "schedule1_addition",
        amountCents: T2_2024_GIFI.amortization,
        note: "GIFI 8670 book amortization from the filed 2024 T2. Enter Schedule 8 CCA as the matching deduction.",
        sortOrder: 10,
      },
    })
  }

  return { identified, stale, journals, equipmentCents, ending }
}

async function main() {
  const format = (cents: number) => (cents / 100).toFixed(2)
  const { identified, stale, journals, equipmentCents, ending } = await replaceOfficial2024()
  console.log(`Removed ${stale.length} unofficial 2023/2024 FP36 or prior T2-2024 journals`)
  console.log(`Equipment from 2024 FP36 subledger ${format(equipmentCents)}`)
  console.log(`Posted ${journals.length} official 2024 T2 journals for ${identified.name}`)
  console.log(`Filed sales ${format(T2_2024_GIFI.sales)} net income ${format(T2_2024_GIFI.netIncome)}`)
  for (const line of ending) {
    console.log(`  ${line.accountCode} debit ${format(line.debitCents)} credit ${format(line.creditCents)}`)
  }
}

const isDirectRun = process.argv[1]?.includes("import-2024-t2")
if (isDirectRun) {
  main()
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(async () => {
      await prisma.$disconnect().catch(() => undefined)
    })
}
