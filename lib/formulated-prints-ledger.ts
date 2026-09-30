import { readFile } from "node:fs/promises"
import path from "node:path"
import JSZip from "jszip"

export const V5_WORKBOOK = path.join(process.cwd(), "data/formulated-prints/complete-accounting-and-ledger-v5.xlsx")
export const FP36_WORKBOOK = path.join(process.cwd(), "data/formulated-prints/fp36-updated-accounting-and-ledger.xlsx")
export const FP36_SOURCE = "formulated-prints-fp36"

export const SPREADSHEET_ACCOUNT_MAP: Record<string, string> = {
  "1600": "1600",
  "2100": "2310",
  "5000": "5100",
}

export const EXPECTED_BEGINNING_BALANCES = {
  "1600": { debit: 1_994_265, credit: 0 },
  "5100": { debit: 2_606_543, credit: 0 },
  "2310": { debit: 0, credit: 4_600_808 },
} as const

export const EXPECTED_ENDING_BALANCES = {
  "1600": { debit: 3_092_934, credit: 0 },
  "5100": { debit: 4_701_209, credit: 0 },
  "2310": { debit: 0, credit: 7_794_143 },
} as const

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

export type LedgerBalanceLine = {
  spreadsheetAccount: string
  accountCode: string
  name: string
  debitCents: number
  creditCents: number
  balanceCents: number
}

export type LedgerWorkbookSnapshot = {
  kind: "beginning" | "ending"
  label: string
  sourceFile: string
  asOf: Date
  lines: LedgerBalanceLine[]
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

function mapAccount(spreadsheetAccount: string) {
  const accountCode = SPREADSHEET_ACCOUNT_MAP[spreadsheetAccount]
  if (!accountCode) {
    throw new Error(`Unexpected spreadsheet account ${spreadsheetAccount}`)
  }
  return accountCode
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

async function openWorkbook(workbookPath: string) {
  const zip = await JSZip.loadAsync(await readFile(workbookPath))
  const sharedStrings = await loadSharedStrings(zip)
  return { zip, sharedStrings }
}

export async function loadJournalEntries(workbookPath: string): Promise<HistoricalEntry[]> {
  const { zip, sharedStrings } = await openWorkbook(workbookPath)
  const journalPath = await sheetPathByName(zip, "Accounting Journal")
  const rows = await readSheetRows(zip, journalPath, sharedStrings)
  const [, ...body] = rows

  const parsed: JournalRow[] = body.map((row) => {
    const spreadsheetAccount = String(Math.round(Number(row[1])))
    const accountCode = mapAccount(spreadsheetAccount)
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

export async function loadFp36Entries(workbookPath = FP36_WORKBOOK): Promise<HistoricalEntry[]> {
  return loadJournalEntries(workbookPath)
}

export async function loadAccountBalances(workbookPath: string): Promise<LedgerBalanceLine[]> {
  const { zip, sharedStrings } = await openWorkbook(workbookPath)
  const sheetPath = await sheetPathByName(zip, "Account Balances")
  const rows = await readSheetRows(zip, sheetPath, sharedStrings)
  const [, ...body] = rows
  return body.map((row) => {
    const spreadsheetAccount = String(Math.round(Number(row[0])))
    const debitCents = toCents(row[2])
    const creditCents = toCents(row[3])
    return {
      spreadsheetAccount,
      accountCode: mapAccount(spreadsheetAccount),
      name: row[1],
      debitCents,
      creditCents,
      balanceCents: debitCents - creditCents,
    }
  })
}

export async function loadBeginningSnapshot(workbookPath = V5_WORKBOOK): Promise<LedgerWorkbookSnapshot> {
  return {
    kind: "beginning",
    label: "Beginning balances — Complete Accounting and Ledger (v5)",
    sourceFile: path.basename(workbookPath),
    asOf: new Date(Date.UTC(2025, 0, 1)),
    lines: await loadAccountBalances(workbookPath),
  }
}

export async function loadEndingSnapshot(workbookPath = FP36_WORKBOOK): Promise<LedgerWorkbookSnapshot> {
  return {
    kind: "ending",
    label: "Ending balances — Updated Accounting and Ledger FP36",
    sourceFile: path.basename(workbookPath),
    asOf: new Date(Date.UTC(2025, 11, 31, 23, 59, 59, 999)),
    lines: await loadAccountBalances(workbookPath),
  }
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

export function assertExpectedTotals(
  totals: Map<string, { debit: number; credit: number }>,
  expected: Record<string, { debit: number; credit: number }>
) {
  for (const [code, total] of Object.entries(expected)) {
    const actual = totals.get(code)
    if (!actual || actual.debit !== total.debit || actual.credit !== total.credit) {
      throw new Error(`Account ${code} totals do not match the expected workbook amounts`)
    }
  }
}

export function snapshotTotals(lines: LedgerBalanceLine[]) {
  return Object.fromEntries(lines.map((line) => [line.accountCode, { debit: line.debitCents, credit: line.creditCents }]))
}
