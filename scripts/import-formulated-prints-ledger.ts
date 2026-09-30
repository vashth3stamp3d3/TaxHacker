/**
 * Post Formulated Prints historical journal entries from the updated FP36 workbook.
 *
 * data/formulated-prints/complete-accounting-and-ledger-v5.xlsx is an earlier
 * revision of the same FP-0001–FP-0029 invoices. It is kept as an archived past
 * log and is not posted, because those amounts were superseded by FP36.
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
import { readFile } from "node:fs/promises"
import path from "node:path"
import JSZip from "jszip"
import { prisma } from "@/lib/db"
import { seedOrganizationDefaults } from "@/models/organizations"

const WORKBOOK = path.join(process.cwd(), "data/formulated-prints/fp36-updated-accounting-and-ledger.xlsx")
const SOURCE = "formulated-prints-fp36"
const ACCOUNT_MAP: Record<string, string> = {
  "1600": "1600",
  "2100": "2310",
  "5000": "5100",
}

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

type JournalRow = {
  date: Date
  spreadsheetAccount: string
  accountCode: string
  debitCents: number
  creditCents: number
  description: string
  invoiceNumber: string | null
}

export type HistoricalEntry = {
  entryNumber: string
  postedAt: Date
  description: string
  lines: Array<{ accountCode: string; debitCents: number; creditCents: number; memo: string }>
}

function parseCalendarDate(value: string): Date {
  const full = value.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/)
  const monthOnly = value.trim().match(/^([A-Za-z]+)\s+(\d{4})$/)
  const match = full || monthOnly
  if (!match) {
    throw new Error(`Unrecognised date: ${value}`)
  }
  const month = MONTHS[match[1].toLowerCase()]
  if (month === undefined) {
    throw new Error(`Unrecognised month: ${value}`)
  }
  const day = full ? Number(full[2]) : 1
  const year = Number(full ? full[3] : monthOnly![2])
  return new Date(Date.UTC(year, month, day))
}

function toCents(value: string): number {
  const amount = Number(value || "0")
  if (!Number.isFinite(amount)) {
    throw new Error(`Invalid amount: ${value}`)
  }
  return Math.round(amount * 100)
}

function columnOf(cellRef: string): string {
  return cellRef.replace(/[0-9]/g, "")
}

async function readSheetRows(zip: JSZip, sheetPath: string, sharedStrings: string[]): Promise<string[][]> {
  const file = zip.file(sheetPath)
  if (!file) throw new Error(`Missing sheet ${sheetPath}`)
  const xml = await file.async("text")
  const rows: string[][] = []
  const rowMatches = xml.match(/<row\b[^>]*>[\s\S]*?<\/row>/g) || []
  for (const rowXml of rowMatches) {
    const cells: Record<string, string> = {}
    const cellMatches = rowXml.match(/<c\b[^>]*>[\s\S]*?<\/c>|<c\b[^>]*\/>/g) || []
    for (const cellXml of cellMatches) {
      const ref = cellXml.match(/\br="([^"]+)"/)?.[1] || ""
      const type = cellXml.match(/\bt="([^"]+)"/)?.[1]
      const raw = cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? ""
      let value = raw
      if (type === "s") value = sharedStrings[Number(raw)] || ""
      cells[columnOf(ref)] = value
    }
    rows.push(["A", "B", "C", "D", "E", "F", "G"].map((column) => cells[column] || ""))
  }
  return rows.filter((row) => row.some((cell) => cell.trim() !== ""))
}

async function loadSharedStrings(zip: JSZip): Promise<string[]> {
  const file = zip.file("xl/sharedStrings.xml")
  if (!file) return []
  const xml = await file.async("text")
  const strings: string[] = []
  const items = xml.match(/<si\b[^>]*>[\s\S]*?<\/si>/g) || []
  for (const item of items) {
    const texts = [...item.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => match[1])
    strings.push(texts.join("").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"))
  }
  return strings
}

async function sheetPathByName(zip: JSZip, name: string): Promise<string> {
  const workbook = await zip.file("xl/workbook.xml")!.async("text")
  const rels = await zip.file("xl/_rels/workbook.xml.rels")!.async("text")
  const sheet = workbook.match(new RegExp(`<sheet[^>]*name="${name}"[^>]*>`))?.[0]
  if (!sheet) throw new Error(`Workbook is missing sheet ${name}`)
  const rid = sheet.match(/r:id="([^"]+)"/)?.[1]
  const target = rels.match(new RegExp(`Id="${rid}"[^>]*Target="([^"]+)"`))?.[1]
  if (!target) throw new Error(`Could not resolve sheet ${name}`)
  return target.startsWith("xl/") ? target : `xl/${target.replace(/^\//, "")}`
}

export async function loadFp36Entries(workbookPath = WORKBOOK): Promise<HistoricalEntry[]> {
  const zip = await JSZip.loadAsync(await readFile(workbookPath))
  const sharedStrings = await loadSharedStrings(zip)
  const journalPath = await sheetPathByName(zip, "Accounting Journal")
  const rows = await readSheetRows(zip, journalPath, sharedStrings)
  const [, ...body] = rows

  const parsed: JournalRow[] = body.map((row) => {
    const spreadsheetAccount = String(Math.round(Number(row[1])))
    const accountCode = ACCOUNT_MAP[spreadsheetAccount]
    if (!accountCode) {
      throw new Error(`Unexpected spreadsheet account ${spreadsheetAccount}`)
    }
    const description = row[5]
    return {
      date: parseCalendarDate(row[0]),
      spreadsheetAccount,
      accountCode,
      debitCents: toCents(row[3]),
      creditCents: toCents(row[4]),
      description,
      invoiceNumber: description.match(/\(FP-\d+\)/)?.[0]?.slice(1, -1) || null,
    }
  })

  const entries = new Map<string, HistoricalEntry>()
  let pendingDebit: JournalRow | null = null
  for (const row of parsed) {
    if (!row.invoiceNumber) {
      pendingDebit = row
      continue
    }
    const entry = entries.get(row.invoiceNumber) || {
      entryNumber: row.invoiceNumber,
      postedAt: row.date,
      description: row.description,
      lines: [],
    }
    if (pendingDebit) {
      entry.postedAt = pendingDebit.date
      entry.lines.push({
        accountCode: pendingDebit.accountCode,
        debitCents: pendingDebit.debitCents,
        creditCents: pendingDebit.creditCents,
        memo: pendingDebit.description,
      })
      pendingDebit = null
    }
    entry.lines.push({
      accountCode: row.accountCode,
      debitCents: row.debitCents,
      creditCents: row.creditCents,
      memo: row.description,
    })
    entries.set(row.invoiceNumber, entry)
  }
  if (pendingDebit) {
    throw new Error(`Unpaired journal debit: ${pendingDebit.description}`)
  }

  return [...entries.values()].sort((a, b) => a.entryNumber.localeCompare(b.entryNumber))
}

export function summarizeEntries(entries: HistoricalEntry[]) {
  const totals = new Map<string, { debit: number; credit: number }>()
  for (const entry of entries) {
    let debit = 0
    let credit = 0
    for (const line of entry.lines) {
      debit += line.debitCents
      credit += line.creditCents
      const current = totals.get(line.accountCode) || { debit: 0, credit: 0 }
      current.debit += line.debitCents
      current.credit += line.creditCents
      totals.set(line.accountCode, current)
    }
    if (debit !== credit) {
      throw new Error(`${entry.entryNumber} is unbalanced: debit ${debit} credit ${credit}`)
    }
  }
  return totals
}

async function postEntries(entries: HistoricalEntry[]) {
  const organizationId = process.env.ORGANIZATION_ID
  const organization = organizationId
    ? await prisma.organization.findUnique({ where: { id: organizationId } })
    : await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } })

  if (!organization) {
    throw new Error("No organization found. Create one in the app, or set ORGANIZATION_ID.")
  }

  await seedOrganizationDefaults(organization.id)
  const accounts = await prisma.ledgerAccount.findMany({ where: { organizationId: organization.id } })
  const accountIds = new Map(accounts.map((account) => [account.code, account.id]))
  for (const code of ["1600", "2310", "5100"]) {
    if (!accountIds.has(code)) {
      throw new Error(`Chart of accounts is missing ${code}`)
    }
  }

  const owner = await prisma.organizationMember.findFirst({
    where: { organizationId: organization.id, role: "owner" },
  })

  for (const entry of entries) {
    const existing = await prisma.journalEntry.findUnique({
      where: { organizationId_entryNumber: { organizationId: organization.id, entryNumber: entry.entryNumber } },
    })
    if (existing) {
      await prisma.journalEntry.delete({ where: { id: existing.id } })
    }

    await prisma.journalEntry.create({
      data: {
        organizationId: organization.id,
        entryNumber: entry.entryNumber,
        source: SOURCE,
        description: entry.description,
        postedAt: entry.postedAt,
        status: "posted",
        currencyCode: "CAD",
        createdById: owner?.userId,
        lines: {
          create: entry.lines.map((line) => ({
            organizationId: organization.id,
            accountId: accountIds.get(line.accountCode)!,
            debit: line.debitCents,
            credit: line.creditCents,
            memo: line.memo,
          })),
        },
      },
    })
  }

  return organization
}

async function main() {
  const entries = await loadFp36Entries()
  const totals = summarizeEntries(entries)
  const format = (cents: number) => (cents / 100).toFixed(2)
  const lineCount = entries.reduce((count, entry) => count + entry.lines.length, 0)
  console.log(`Parsed ${entries.length} FP36 journal entries (${lineCount} lines)`)
  for (const [code, total] of totals) {
    console.log(`${code} debit ${format(total.debit)} credit ${format(total.credit)}`)
  }

  const expected = {
    "1600": { debit: 3092934, credit: 0 },
    "5100": { debit: 4701209, credit: 0 },
    "2310": { debit: 0, credit: 7794143 },
  }
  for (const [code, total] of Object.entries(expected)) {
    const actual = totals.get(code)
    if (!actual || actual.debit !== total.debit || actual.credit !== total.credit) {
      throw new Error(`Account ${code} totals do not match the FP36 workbook`)
    }
  }
  if (entries.length !== 36 || lineCount !== 72) {
    throw new Error(`Expected 36 entries and 72 lines, got ${entries.length} entries and ${lineCount} lines`)
  }

  if (process.argv.includes("--dry-run")) {
    return
  }

  const organization = await postEntries(entries)
  console.log(`Posted ${entries.length} entries to organization ${organization.id}`)
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
