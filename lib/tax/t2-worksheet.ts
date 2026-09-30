export const DEFAULT_T2_YEAR = 2025

export const T2_RATES = {
  federalSmallBusinessBps: 900,
  federalGeneralBps: 1500,
  albertaSmallBusinessBps: 200,
  albertaGeneralBps: 800,
  businessLimitCents: 50_000_000,
  donationLimitBps: 7500,
} as const

export const PLANNING_DISCLAIMER =
  "Planning estimate only. This is not a filed T2 return, not a CRA assessment, and not a substitute for CPA review."

export type AdjustmentSection = "schedule1_addition" | "schedule1_deduction" | "taxable_income_deduction"

export type Schedule1Definition = {
  code: string
  label: string
  section: AdjustmentSection
  help: string
  sortOrder: number
}

export const SCHEDULE_1_FIELDS: Schedule1Definition[] = [
  {
    code: "accounting_depreciation",
    label: "Accounting depreciation and amortization",
    section: "schedule1_addition",
    help: "Add back book depreciation. Claim capital cost allowance as a separate deduction.",
    sortOrder: 10,
  },
  {
    code: "meals_nondeductible",
    label: "Non-deductible meals and entertainment",
    section: "schedule1_addition",
    help: "Generally 50% of meals and entertainment is not deductible.",
    sortOrder: 20,
  },
  {
    code: "penalties",
    label: "Penalties and fines",
    section: "schedule1_addition",
    help: "Penalties and fines recorded in the books are not deductible.",
    sortOrder: 30,
  },
  {
    code: "income_tax_expense",
    label: "Income tax expense",
    section: "schedule1_addition",
    help: "Add back income tax recorded as an expense in the books.",
    sortOrder: 40,
  },
  {
    code: "charitable_donations_expensed",
    label: "Charitable donations expensed in the books",
    section: "schedule1_addition",
    help: "Add back donations deducted in accounting income. Enter the claim separately below.",
    sortOrder: 50,
  },
  {
    code: "taxable_capital_gains",
    label: "Taxable capital gains",
    section: "schedule1_addition",
    help: "Taxable portion of capital gains that is not already included in book net income.",
    sortOrder: 60,
  },
  {
    code: "recapture",
    label: "Recapture of CCA",
    section: "schedule1_addition",
    help: "Recapture included in income for tax purposes.",
    sortOrder: 70,
  },
  {
    code: "other_additions",
    label: "Other Schedule 1 additions",
    section: "schedule1_addition",
    help: "Other amounts that increase income for tax purposes.",
    sortOrder: 80,
  },
  {
    code: "cca",
    label: "Capital cost allowance",
    section: "schedule1_deduction",
    help: "CCA claimed for the year. This planning worksheet does not calculate Schedule 8 classes.",
    sortOrder: 110,
  },
  {
    code: "terminal_loss",
    label: "Terminal loss",
    section: "schedule1_deduction",
    help: "Terminal loss on disposition of a class.",
    sortOrder: 120,
  },
  {
    code: "accounting_gain_capital",
    label: "Accounting gain on capital property",
    section: "schedule1_deduction",
    help: "Deduct the book gain and include only the taxable capital gain above.",
    sortOrder: 130,
  },
  {
    code: "reserves",
    label: "Reserves allowed for tax",
    section: "schedule1_deduction",
    help: "Tax reserves that differ from the reserve already recorded in the books.",
    sortOrder: 140,
  },
  {
    code: "other_deductions",
    label: "Other Schedule 1 deductions",
    section: "schedule1_deduction",
    help: "Other amounts that decrease net income for tax purposes.",
    sortOrder: 150,
  },
  {
    code: "charitable_donation_claim",
    label: "Charitable donation claim",
    section: "taxable_income_deduction",
    help: "Deducted in computing taxable income, limited to 75% of net income for tax purposes.",
    sortOrder: 210,
  },
  {
    code: "non_capital_losses",
    label: "Non-capital loss carryforward applied",
    section: "taxable_income_deduction",
    help: "Non-capital losses applied against taxable income. Unused losses are not turned into a refund here.",
    sortOrder: 220,
  },
  {
    code: "dividends_112",
    label: "Dividends deductible under subsection 112(1)",
    section: "taxable_income_deduction",
    help: "Taxable dividends deducted in computing taxable income.",
    sortOrder: 230,
  },
]

export type JournalActivityLine = {
  postedAt: Date
  accountCode: string
  accountName: string
  accountType: string
  debitCents: number
  creditCents: number
}

export type SavedAdjustment = {
  code: string
  label?: string
  section?: AdjustmentSection
  amountCents: number
  help?: string
  sortOrder?: number
  isCustom?: boolean
  note?: string
}

export type WorksheetAdjustment = {
  code: string
  label: string
  section: AdjustmentSection
  amountCents: number
  help: string
  sortOrder: number
  isCustom: boolean
  note: string
}

export type BookAccountTotal = {
  code: string
  name: string
  type: string
  balanceCents: number
}

export type ChecklistStatus = "done" | "review" | "info"

export type ChecklistItem = {
  id: string
  label: string
  detail: string
  status: ChecklistStatus
}

export type ReconciliationItem = {
  label: string
  field: string
  statedCents: number
  worksheetCents: number
  differenceCents: number
  matches: boolean
}

export type T2Worksheet = {
  year: number
  province: string
  currency: "CAD"
  estimateKind: "planning_estimate"
  disclaimer: string
  period: {
    startsAt: string
    endsAt: string
    fiscalYearStartMonth: number
  }
  books: {
    revenueCents: number
    cogsCents: number
    expenseCents: number
    netIncomeCents: number
    accounts: BookAccountTotal[]
  }
  adjustments: WorksheetAdjustment[]
  schedule1: {
    additionsCents: number
    deductionsCents: number
    netIncomeForTaxCents: number
  }
  taxableIncome: {
    donationClaimedCents: number
    donationAllowedCents: number
    donationLimitCents: number
    otherDeductionsCents: number
    taxableIncomeCents: number
  }
  tax: {
    assumptions: string[]
    businessLimitCents: number
    smallBusinessIncomeCents: number
    generalIncomeCents: number
    federalSmallBusinessBps: number
    federalGeneralBps: number
    albertaSmallBusinessBps: number
    albertaGeneralBps: number
    federalTaxCents: number
    albertaTaxCents: number
    totalTaxCents: number
  }
  deadlines: {
    yearEnd: string
    filingDue: string
    balanceDueCcpc: string
    balanceDueGeneral: string
    notes: string[]
  }
  checklist: ChecklistItem[]
}

const RECONCILE_FIELDS: Array<{
  field: string
  label: string
  patterns: RegExp[]
  pick: (worksheet: T2Worksheet) => number
}> = [
  { field: "totalTaxCents", label: "Total estimated tax", patterns: [/total tax/, /combined tax/, /tax payable/], pick: (w) => w.tax.totalTaxCents },
  { field: "federalTaxCents", label: "Federal tax", patterns: [/federal/], pick: (w) => w.tax.federalTaxCents },
  { field: "albertaTaxCents", label: "Alberta tax", patterns: [/alberta/, /provincial tax/], pick: (w) => w.tax.albertaTaxCents },
  { field: "taxableIncomeCents", label: "Taxable income", patterns: [/taxable income/], pick: (w) => w.taxableIncome.taxableIncomeCents },
  {
    field: "netIncomeForTaxCents",
    label: "Net income for tax purposes",
    patterns: [/net income for tax/, /income for tax purposes/],
    pick: (w) => w.schedule1.netIncomeForTaxCents,
  },
  { field: "bookNetIncomeCents", label: "Book net income", patterns: [/net income/, /book income/, /accounting income/, /\bprofit\b/], pick: (w) => w.books.netIncomeCents },
  { field: "revenueCents", label: "Revenue", patterns: [/revenue/, /gross sales/, /\bsales\b/], pick: (w) => w.books.revenueCents },
  { field: "cogsCents", label: "Cost of goods sold", patterns: [/cogs/, /cost of goods/], pick: (w) => w.books.cogsCents },
  { field: "expenseCents", label: "Expenses", patterns: [/\bexpenses?\b/, /operating costs?/], pick: (w) => w.books.expenseCents },
  { field: "additionsCents", label: "Schedule 1 additions", patterns: [/schedule 1 additions?/, /\badditions?\b/], pick: (w) => w.schedule1.additionsCents },
  {
    field: "deductionsCents",
    label: "Schedule 1 deductions",
    patterns: [/capital cost allowance/, /\bcca\b/, /schedule 1 deductions?/, /\bdeductions?\b/],
    pick: (w) => w.schedule1.deductionsCents,
  },
]

const AMOUNT_PATTERN =
  /(?:\$|cad\s*)\s*-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|(?:\$|cad\s*)\s*-?\d+(?:\.\d{1,2})?|-?\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|-?\d+\.\d{2}(?!\d)|-?\d+(?:\.\d{1,2})?\s+dollars\b/i

export function parseTaxYear(value: unknown, fallback = DEFAULT_T2_YEAR) {
  const year = Number(String(value ?? "").trim())
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return fallback
  return year
}

export function taxYearFromAdvisorUrl(url: string | undefined) {
  if (!url) return null
  const [path, query = ""] = url.split("?")
  const normalized = path.replace(/\/$/, "") || "/"
  if (normalized !== "/taxes/t2") return null
  return parseTaxYear(new URLSearchParams(query).get("year"), DEFAULT_T2_YEAR)
}

export function fiscalPeriodForYear(year: number, fiscalYearStartMonth: number) {
  const startMonth = Math.min(12, Math.max(1, Math.trunc(fiscalYearStartMonth) || 1))
  const startsAt = new Date(Date.UTC(year, startMonth - 1, 1, 0, 0, 0, 0))
  const endsAt = new Date(Date.UTC(year + 1, startMonth - 1, 1, 0, 0, 0, 0) - 1)
  return { startsAt, endsAt, fiscalYearStartMonth: startMonth }
}

export function formatUtcDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function addCalendarMonths(date: Date, months: number) {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()
  const originalLastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const monthIndex = month + months
  const targetYear = year + Math.floor(monthIndex / 12)
  const normalizedMonth = ((monthIndex % 12) + 12) % 12
  const targetLastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate()
  const targetDay = day === originalLastDay ? targetLastDay : Math.min(day, targetLastDay)
  return new Date(Date.UTC(targetYear, normalizedMonth, targetDay))
}

export function formatCents(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100)
}

export function centsToDollarInput(cents: number) {
  return (cents / 100).toFixed(2)
}

export function parseDollarsToCents(value: unknown) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null
    return roundCents(value)
  }
  const raw = String(value ?? "").trim()
  if (!raw) return 0
  const cleaned = raw.replace(/[$,\s]/g, "").replace(/cad/i, "")
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null
  const negative = cleaned.startsWith("-")
  const unsigned = negative ? cleaned.slice(1) : cleaned
  const [whole, fraction = ""] = unsigned.split(".")
  const digits = (fraction + "000").slice(0, 3)
  let cents = Number(whole) * 100 + Number(digits.slice(0, 2))
  if (Number(digits[2]) >= 5) cents += 1
  if (!Number.isSafeInteger(cents)) return null
  return negative ? -cents : cents
}

export function customAdjustmentCode(label: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40) || "custom"
  return `custom_${slug}_${Date.now().toString(36)}`
}

export function mergeScheduleAdjustments(saved: SavedAdjustment[]): WorksheetAdjustment[] {
  const savedByCode = new Map(saved.map((row) => [row.code, row]))
  const defaults = SCHEDULE_1_FIELDS.map((field) => {
    const existing = savedByCode.get(field.code)
    return {
      code: field.code,
      label: field.label,
      section: field.section,
      amountCents: nonNegativeCents(existing?.amountCents ?? 0),
      help: field.help,
      sortOrder: field.sortOrder,
      isCustom: false,
      note: existing?.note || "",
    }
  })

  const custom = saved
    .filter((row) => row.isCustom || !SCHEDULE_1_FIELDS.some((field) => field.code === row.code))
    .filter((row) => !SCHEDULE_1_FIELDS.some((field) => field.code === row.code))
    .map((row, index) => ({
      code: row.code,
      label: row.label || row.code,
      section: normalizeSection(row.section),
      amountCents: nonNegativeCents(row.amountCents),
      help: row.help || "Custom adjustment entered on the T2 worksheet.",
      sortOrder: row.sortOrder ?? 300 + index,
      isCustom: true,
      note: row.note || "",
    }))

  return [...defaults, ...custom].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
}

export function computeT2Worksheet(input: {
  year: number
  province?: string
  fiscalYearStartMonth: number
  lines: JournalActivityLine[]
  adjustments?: SavedAdjustment[]
}): T2Worksheet {
  const period = fiscalPeriodForYear(input.year, input.fiscalYearStartMonth)
  const books = summarizeFiscalBooks(input.lines, period.startsAt, period.endsAt)
  const adjustments = mergeScheduleAdjustments(input.adjustments || [])
  const additions = adjustments.filter((row) => row.section === "schedule1_addition")
  const deductions = adjustments.filter((row) => row.section === "schedule1_deduction")
  const taxableDeductions = adjustments.filter((row) => row.section === "taxable_income_deduction")
  const additionsCents = sum(additions)
  const deductionsCents = sum(deductions)
  const netIncomeForTaxCents = books.netIncomeCents + additionsCents - deductionsCents
  const donationClaimedCents = sum(taxableDeductions.filter((row) => row.code === "charitable_donation_claim" || row.code.startsWith("donation_")))
  const otherDeductionsCents = sum(
    taxableDeductions.filter((row) => row.code !== "charitable_donation_claim" && !row.code.startsWith("donation_"))
  )
  const donationLimitCents = portionCents(Math.max(0, netIncomeForTaxCents), T2_RATES.donationLimitBps)
  const donationAllowedCents = Math.min(donationClaimedCents, donationLimitCents)
  const taxableIncomeCents = Math.max(0, netIncomeForTaxCents - donationAllowedCents - otherDeductionsCents)
  const smallBusinessIncomeCents = Math.min(taxableIncomeCents, T2_RATES.businessLimitCents)
  const generalIncomeCents = taxableIncomeCents - smallBusinessIncomeCents
  const federalTaxCents =
    portionCents(smallBusinessIncomeCents, T2_RATES.federalSmallBusinessBps) +
    portionCents(generalIncomeCents, T2_RATES.federalGeneralBps)
  const albertaTaxCents =
    portionCents(smallBusinessIncomeCents, T2_RATES.albertaSmallBusinessBps) +
    portionCents(generalIncomeCents, T2_RATES.albertaGeneralBps)
  const yearEnd = period.endsAt
  const province = (input.province || "AB").toUpperCase()

  const worksheet: T2Worksheet = {
    year: input.year,
    province,
    currency: "CAD",
    estimateKind: "planning_estimate",
    disclaimer: PLANNING_DISCLAIMER,
    period: {
      startsAt: formatUtcDate(period.startsAt),
      endsAt: formatUtcDate(period.endsAt),
      fiscalYearStartMonth: period.fiscalYearStartMonth,
    },
    books,
    adjustments,
    schedule1: {
      additionsCents,
      deductionsCents,
      netIncomeForTaxCents,
    },
    taxableIncome: {
      donationClaimedCents,
      donationAllowedCents,
      donationLimitCents,
      otherDeductionsCents,
      taxableIncomeCents,
    },
    tax: {
      assumptions: [
        "Assumes a Canadian-controlled private corporation.",
        "Assumes all taxable income is active business income earned in Alberta.",
        "Assumes the full $500,000 small-business limit is available and is not shared with associated corporations.",
        "Federal planning rates: 9% on income eligible for the small business deduction and 15% general rate after abatement and the general rate reduction.",
        "Alberta planning rates: 2% small business and 8% general.",
        "Does not compute GRIP, refundable dividend tax on hand, Part IV tax, additional refundable tax on investment income, foreign tax credits, or instalments.",
      ],
      businessLimitCents: T2_RATES.businessLimitCents,
      smallBusinessIncomeCents,
      generalIncomeCents,
      federalSmallBusinessBps: T2_RATES.federalSmallBusinessBps,
      federalGeneralBps: T2_RATES.federalGeneralBps,
      albertaSmallBusinessBps: T2_RATES.albertaSmallBusinessBps,
      albertaGeneralBps: T2_RATES.albertaGeneralBps,
      federalTaxCents,
      albertaTaxCents,
      totalTaxCents: federalTaxCents + albertaTaxCents,
    },
    deadlines: {
      yearEnd: formatUtcDate(yearEnd),
      filingDue: formatUtcDate(addCalendarMonths(yearEnd, 6)),
      balanceDueCcpc: formatUtcDate(addCalendarMonths(yearEnd, 3)),
      balanceDueGeneral: formatUtcDate(addCalendarMonths(yearEnd, 2)),
      notes: [
        "T2 filing deadline used here is the last day of the sixth month after the taxation year end.",
        "Balance-due date for a CCPC that is eligible for the three-month rule is the last day of the third month after year end. Other corporations generally pay by the last day of the second month.",
        "If a date falls on a weekend or a CRA-observed holiday, confirm the next business day before relying on it.",
      ],
    },
    checklist: [],
  }
  worksheet.checklist = buildChecklist(worksheet)
  return worksheet
}

export function summarizeFiscalBooks(lines: JournalActivityLine[], startsAt: Date, endsAt: Date) {
  const totals = new Map<string, BookAccountTotal>()
  for (const line of lines) {
    if (line.postedAt < startsAt || line.postedAt > endsAt) continue
    const type = line.accountType.toLowerCase()
    if (!["revenue", "cogs", "expense"].includes(type)) continue
    const key = line.accountCode
    const current = totals.get(key) || {
      code: line.accountCode,
      name: line.accountName,
      type,
      balanceCents: 0,
    }
    const movement = type === "revenue" ? line.creditCents - line.debitCents : line.debitCents - line.creditCents
    current.balanceCents += movement
    totals.set(key, current)
  }

  const accounts = [...totals.values()].sort((a, b) => a.code.localeCompare(b.code))
  const revenueCents = sumAccounts(accounts, "revenue")
  const cogsCents = sumAccounts(accounts, "cogs")
  const expenseCents = sumAccounts(accounts, "expense")
  return {
    revenueCents,
    cogsCents,
    expenseCents,
    netIncomeCents: revenueCents - cogsCents - expenseCents,
    accounts,
  }
}

export function formatWorksheetForAdvisor(worksheet: T2Worksheet) {
  const lines = [
    `Computed T2 planning worksheet for ${worksheet.year} (fresh database compute, source=database_fresh_compute).`,
    worksheet.disclaimer,
    `Province: ${worksheet.province}`,
    `Fiscal period: ${worksheet.period.startsAt} to ${worksheet.period.endsAt}`,
    `Books include only journal lines posted in this fiscal period. All-time trial balance is not used.`,
    `Revenue: ${formatCents(worksheet.books.revenueCents)} (${worksheet.books.revenueCents} cents)`,
    `Cost of goods sold: ${formatCents(worksheet.books.cogsCents)} (${worksheet.books.cogsCents} cents)`,
    `Expenses: ${formatCents(worksheet.books.expenseCents)} (${worksheet.books.expenseCents} cents)`,
    `Book net income: ${formatCents(worksheet.books.netIncomeCents)} (${worksheet.books.netIncomeCents} cents)`,
    `Schedule 1 additions: ${formatCents(worksheet.schedule1.additionsCents)} (${worksheet.schedule1.additionsCents} cents)`,
    `Schedule 1 deductions: ${formatCents(worksheet.schedule1.deductionsCents)} (${worksheet.schedule1.deductionsCents} cents)`,
    `Net income for tax purposes: ${formatCents(worksheet.schedule1.netIncomeForTaxCents)} (${worksheet.schedule1.netIncomeForTaxCents} cents)`,
    `Charitable donation claimed: ${formatCents(worksheet.taxableIncome.donationClaimedCents)}; allowed: ${formatCents(worksheet.taxableIncome.donationAllowedCents)}; limit: ${formatCents(worksheet.taxableIncome.donationLimitCents)}`,
    `Other taxable-income deductions: ${formatCents(worksheet.taxableIncome.otherDeductionsCents)}`,
    `Taxable income: ${formatCents(worksheet.taxableIncome.taxableIncomeCents)} (${worksheet.taxableIncome.taxableIncomeCents} cents)`,
    `Small-business income: ${formatCents(worksheet.tax.smallBusinessIncomeCents)}`,
    `General-rate income: ${formatCents(worksheet.tax.generalIncomeCents)}`,
    `Federal tax: ${formatCents(worksheet.tax.federalTaxCents)} (${worksheet.tax.federalTaxCents} cents)`,
    `Alberta tax: ${formatCents(worksheet.tax.albertaTaxCents)} (${worksheet.tax.albertaTaxCents} cents)`,
    `Total estimated tax: ${formatCents(worksheet.tax.totalTaxCents)} (${worksheet.tax.totalTaxCents} cents)`,
    `Filing due: ${worksheet.deadlines.filingDue}`,
    `CCPC balance-due date (3-month rule): ${worksheet.deadlines.balanceDueCcpc}`,
    `General balance-due date (2-month rule): ${worksheet.deadlines.balanceDueGeneral}`,
    "Adjustment detail:",
    ...worksheet.adjustments
      .filter((row) => row.amountCents > 0)
      .map((row) => `- ${row.section} ${row.label}: ${formatCents(row.amountCents)}`),
    "Assumptions:",
    ...worksheet.tax.assumptions.map((item) => `- ${item}`),
  ]
  return lines.join("\n")
}

export function reconcileChatAmounts(worksheet: T2Worksheet, message: string): ReconciliationItem[] {
  const clauses = message
    .split(/\n|(?<=[.!?])\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean)
  const items: ReconciliationItem[] = []
  const seen = new Set<string>()

  for (const clause of clauses) {
    const mentionedYear = clause.match(/\b(20\d{2})\b/)
    if (mentionedYear && Number(mentionedYear[1]) !== worksheet.year) continue
    for (const item of pairClauseAmounts(clause, worksheet)) {
      if (seen.has(item.field)) continue
      seen.add(item.field)
      items.push(item)
    }
  }

  return items
}

export function formatReconciliation(worksheet: T2Worksheet, items: ReconciliationItem[]) {
  if (items.length === 0) return ""
  const rows = items.map((item) => {
    const comparison = item.matches
      ? "matches the worksheet."
      : `the worksheet shows ${formatCents(item.worksheetCents)} (difference ${formatCents(item.differenceCents)}).`
    return `- ${item.label}: you entered ${formatCents(item.statedCents)}; ${comparison}`
  })
  return [
    `**Worksheet reconciliation for ${worksheet.year} (computed from the ledger and saved adjustments, not from this chat):**`,
    ...rows,
  ].join("\n")
}

export function worksheetToCsv(worksheet: T2Worksheet) {
  const rows: string[][] = [
    ["section", "code", "label", "amount_cad"],
    ["meta", "disclaimer", worksheet.disclaimer, ""],
    ["meta", "year", String(worksheet.year), ""],
    ["meta", "period_start", worksheet.period.startsAt, ""],
    ["meta", "period_end", worksheet.period.endsAt, ""],
    ["meta", "estimate_kind", worksheet.estimateKind, ""],
    ["books", "revenue", "Revenue", centsToDollarInput(worksheet.books.revenueCents)],
    ["books", "cogs", "Cost of goods sold", centsToDollarInput(worksheet.books.cogsCents)],
    ["books", "expenses", "Expenses", centsToDollarInput(worksheet.books.expenseCents)],
    ["books", "net_income", "Book net income", centsToDollarInput(worksheet.books.netIncomeCents)],
  ]

  for (const account of worksheet.books.accounts) {
    rows.push(["books_account", account.code, account.name, centsToDollarInput(account.balanceCents)])
  }
  for (const adjustment of worksheet.adjustments) {
    rows.push([adjustment.section, adjustment.code, adjustment.label, centsToDollarInput(adjustment.amountCents)])
  }
  rows.push(
    ["schedule1", "additions", "Schedule 1 additions", centsToDollarInput(worksheet.schedule1.additionsCents)],
    ["schedule1", "deductions", "Schedule 1 deductions", centsToDollarInput(worksheet.schedule1.deductionsCents)],
    ["schedule1", "net_income_for_tax", "Net income for tax purposes", centsToDollarInput(worksheet.schedule1.netIncomeForTaxCents)],
    ["taxable_income", "taxable_income", "Taxable income", centsToDollarInput(worksheet.taxableIncome.taxableIncomeCents)],
    ["tax", "federal", "Federal tax", centsToDollarInput(worksheet.tax.federalTaxCents)],
    ["tax", "alberta", "Alberta tax", centsToDollarInput(worksheet.tax.albertaTaxCents)],
    ["tax", "total", "Total estimated tax", centsToDollarInput(worksheet.tax.totalTaxCents)],
    ["deadline", "filing_due", "T2 filing due", worksheet.deadlines.filingDue],
    ["deadline", "balance_due_ccpc", "CCPC balance due", worksheet.deadlines.balanceDueCcpc],
    ["deadline", "balance_due_general", "General balance due", worksheet.deadlines.balanceDueGeneral]
  )

  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n"
}

function buildChecklist(worksheet: T2Worksheet): ChecklistItem[] {
  const depreciation = worksheet.books.accounts
    .filter((account) => account.type === "expense" && (account.code === "6090" || /depreciat|amort/i.test(account.name)))
    .reduce((total, account) => total + account.balanceCents, 0)
  const depreciationAddBack = amountFor(worksheet, "accounting_depreciation")
  const cca = amountFor(worksheet, "cca")
  const donationsAdded = amountFor(worksheet, "charitable_donations_expensed")
  const donationClaim = amountFor(worksheet, "charitable_donation_claim")

  return [
    {
      id: "estimate",
      label: "Treat this as a planning estimate",
      detail: worksheet.disclaimer,
      status: "info",
    },
    {
      id: "period",
      label: `Books are limited to ${worksheet.period.startsAt} through ${worksheet.period.endsAt}`,
      detail: "Net income starts from journal lines posted in this fiscal period only.",
      status: "done",
    },
    {
      id: "depreciation",
      label: "Add back accounting depreciation",
      detail:
        depreciation > 0 && depreciationAddBack === 0
          ? `Depreciation expense in the books is ${formatCents(depreciation)} and the Schedule 1 add-back is still zero.`
          : "Book depreciation should be added back before claiming CCA.",
      status: depreciation > 0 && depreciationAddBack === 0 ? "review" : "done",
    },
    {
      id: "cca",
      label: "Enter capital cost allowance",
      detail:
        depreciationAddBack > 0 && cca === 0
          ? "Depreciation was added back and CCA is still zero. Enter the Schedule 8 amount when you have it."
          : "CCA is a tax deduction and is not the same amount as book depreciation.",
      status: depreciationAddBack > 0 && cca === 0 ? "review" : "info",
    },
    {
      id: "donations",
      label: "Review charitable donations",
      detail:
        donationsAdded > 0 && donationClaim === 0
          ? "Donations were added back and no donation claim has been entered."
          : "Donation claims are limited to 75% of net income for tax purposes in this estimate.",
      status: donationsAdded > 0 && donationClaim === 0 ? "review" : "info",
    },
    {
      id: "ccpc",
      label: "Confirm CCPC status, Alberta active business income, and the business limit",
      detail: "The tax estimate assumes a CCPC with the full $500,000 Alberta small-business limit.",
      status: "review",
    },
    {
      id: "filing",
      label: `File the T2 by ${worksheet.deadlines.filingDue}`,
      detail: "Six months after the taxation year end. Confirm the exact date if it falls on a weekend or holiday.",
      status: "info",
    },
    {
      id: "balance",
      label: `Pay any balance by ${worksheet.deadlines.balanceDueCcpc} if the three-month CCPC rule applies`,
      detail: `Otherwise use ${worksheet.deadlines.balanceDueGeneral}. This worksheet does not calculate instalments.`,
      status: "info",
    },
    {
      id: "schedules",
      label: "Prepare T2, Schedule 1, Schedule 8, Schedule 50, and Alberta AT1 with a CPA",
      detail: "Export this worksheet as a planning package. It does not replace those forms.",
      status: "info",
    },
  ]
}

function amountFor(worksheet: T2Worksheet, code: string) {
  return worksheet.adjustments.find((row) => row.code === code)?.amountCents || 0
}

function pairClauseAmounts(clause: string, worksheet: T2Worksheet): ReconciliationItem[] {
  const lower = clause.toLowerCase()
  const amounts: Array<{ cents: number; index: number }> = []
  const amountPattern = new RegExp(AMOUNT_PATTERN, "gi")
  for (const match of clause.matchAll(amountPattern)) {
    const cents = parseDollarsToCents(match[0].replace(/dollars/i, "").trim())
    if (cents === null || match.index === undefined) continue
    amounts.push({ cents, index: match.index })
  }
  if (amounts.length === 0) return []

  const claimedSpans: Array<[number, number]> = []
  const hits: Array<{ field: (typeof RECONCILE_FIELDS)[number]; index: number }> = []
  for (const field of RECONCILE_FIELDS) {
    const found = earliestPattern(lower, field.patterns)
    if (!found) continue
    if (claimedSpans.some(([start, end]) => found.index >= start && found.index < end)) continue
    claimedSpans.push([found.index, found.index + found.length])
    hits.push({ field, index: found.index })
  }

  hits.sort((a, b) => a.index - b.index)
  const usedAmounts = new Set<number>()
  const items: ReconciliationItem[] = []
  for (const hit of hits) {
    let bestIndex = -1
    let bestDistance = Number.POSITIVE_INFINITY
    amounts.forEach((amount, index) => {
      if (usedAmounts.has(index)) return
      const distance = Math.abs(amount.index - hit.index)
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })
    if (bestIndex < 0) continue
    usedAmounts.add(bestIndex)
    const statedCents = amounts[bestIndex].cents
    const worksheetCents = hit.field.pick(worksheet)
    items.push({
      label: hit.field.label,
      field: hit.field.field,
      statedCents,
      worksheetCents,
      differenceCents: statedCents - worksheetCents,
      matches: statedCents === worksheetCents,
    })
  }
  return items
}

function earliestPattern(value: string, patterns: RegExp[]) {
  let best: { index: number; length: number } | null = null
  for (const pattern of patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`
    const globalPattern = new RegExp(pattern.source, flags)
    const match = globalPattern.exec(value)
    if (!match || match.index === undefined) continue
    if (!best || match.index < best.index || (match.index === best.index && match[0].length > best.length)) {
      best = { index: match.index, length: match[0].length }
    }
  }
  return best
}

function portionCents(baseCents: number, basisPoints: number) {
  if (baseCents <= 0 || basisPoints <= 0) return 0
  return Math.round((baseCents * basisPoints) / 10_000)
}

function sum(rows: Array<{ amountCents: number }>) {
  return rows.reduce((total, row) => total + row.amountCents, 0)
}

function sumAccounts(accounts: BookAccountTotal[], type: string) {
  return accounts.filter((account) => account.type === type).reduce((total, account) => total + account.balanceCents, 0)
}

function nonNegativeCents(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value))
}

function roundCents(value: number) {
  const negative = value < 0
  const cents = Math.round(Math.abs(value) * 100)
  return negative ? -cents : cents
}

function normalizeSection(section: AdjustmentSection | undefined): AdjustmentSection {
  if (section === "schedule1_addition" || section === "schedule1_deduction" || section === "taxable_income_deduction") {
    return section
  }
  return "schedule1_addition"
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}
