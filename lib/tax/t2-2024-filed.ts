/** Filed 2024 Formulated Prints T2 (UFile copy, year-end 2024-12-31, BN 796765758RC0001). */

export const T2_2024_SOURCE = "t2-2024-filed"
export const YEAR_CLOSE_SOURCE = "year_close"
export const T2_2024_YEAR = 2024
export const T2_2024_SOURCE_FILE = "2024 - Formulated Prints - My copy - Tax return.pdf"

export const T2_2024_IDENTITY = {
  legalName: "Formulated Prints",
  businessNumber: "796765758RC0001",
  albertaCorporateAccount: "2125660072",
  taxYearEnd: "2024-12-31",
  signingOfficer: "Jerrold Jacobe",
  phone: "(587) 889-3235",
  email: "customerservice@formulatedprints.com",
} as const

export const T2_2024_GIFI = {
  sales: 7_588_900,
  purchases: 4_465_300,
  freightIn: 647_700,
  costOfSales: 5_113_000,
  grossProfit: 2_475_900,
  advertising: 239_100,
  amortization: 418_300,
  utilities: 77_900,
  rent: 527_600,
  computer: 108_500,
  operatingExpenses: 1_371_400,
  totalExpenses: 6_484_400,
  netIncome: 1_104_500,
} as const

export const T2_2024_SCHEDULE_100 = {
  cash: 0,
  inventory: 253_600,
  prepaid: 874_000,
  currentAssets: 1_127_600,
  equipment: 3_780_700,
  accumDep: 418_300,
  totalAssets: 4_490_000,
  taxesPayable: 401_000,
  bankLoan: 2_368_100,
  otherCurrent: 550_000,
  currentLiabilities: 3_319_100,
  shareholderLoan: 66_400,
  totalLiabilities: 3_385_500,
  retainedEarnings: 1_104_500,
  totalEquity: 1_104_500,
} as const

export const T2_2024_SCHEDULE_101 = {
  cash: 10_000,
  commonShares: 10_000,
  totalAssets: 10_000,
} as const

export const T2_2024_TAX = {
  netIncomeForTax: 1_104_500,
  taxableIncome: 1_104_500,
  bookAmortization: 418_300,
  cca: 418_300,
  class8Acquisitions: 3_780_700,
  class8UccEnd: 3_362_400,
  federalPartI: 99_300,
  albertaTax: 22_100,
  totalTax: 121_400,
} as const

export const T2_2024_GIFI_LINES = [
  { code: "8000", label: "Trade sales of goods and services", section: "income", amountCents: T2_2024_GIFI.sales },
  { code: "8089", label: "Total sales of goods and services", section: "income", amountCents: T2_2024_GIFI.sales },
  { code: "8299", label: "Total revenue", section: "income", amountCents: T2_2024_GIFI.sales },
  { code: "8300", label: "Opening inventory", section: "cogs", amountCents: 0 },
  { code: "8320", label: "Purchases / cost of materials", section: "cogs", amountCents: T2_2024_GIFI.purchases },
  { code: "8457", label: "Freight in and duty", section: "cogs", amountCents: T2_2024_GIFI.freightIn },
  { code: "8518", label: "Cost of sales", section: "cogs", amountCents: T2_2024_GIFI.costOfSales },
  { code: "8519", label: "Gross profit / loss", section: "summary", amountCents: T2_2024_GIFI.grossProfit },
  { code: "8521", label: "Advertising", section: "expense", amountCents: T2_2024_GIFI.advertising },
  { code: "8670", label: "Amortization of tangible assets", section: "expense", amountCents: T2_2024_GIFI.amortization },
  { code: "8812", label: "Office utilities", section: "expense", amountCents: T2_2024_GIFI.utilities },
  { code: "8910", label: "Rental", section: "expense", amountCents: T2_2024_GIFI.rent },
  { code: "9150", label: "Computer related expenses", section: "expense", amountCents: T2_2024_GIFI.computer },
  { code: "9367", label: "Total operating expenses", section: "expense", amountCents: T2_2024_GIFI.operatingExpenses },
  { code: "9368", label: "Total expenses", section: "expense", amountCents: T2_2024_GIFI.totalExpenses },
  { code: "9369", label: "Net non-farming income", section: "summary", amountCents: T2_2024_GIFI.netIncome },
  { code: "9970", label: "Net income/loss before taxes and extraordinary items", section: "summary", amountCents: T2_2024_GIFI.netIncome },
  { code: "9999", label: "Net income / loss after taxes and extraordinary items", section: "summary", amountCents: T2_2024_GIFI.netIncome },
] as const

export const T2_2024_SCHEDULE_100_LINES = [
  { code: "1000", label: "Cash and deposits", amountCents: T2_2024_SCHEDULE_100.cash },
  { code: "1121", label: "Inventory of goods for sale", amountCents: T2_2024_SCHEDULE_100.inventory },
  { code: "1484", label: "Prepaid expenses", amountCents: T2_2024_SCHEDULE_100.prepaid },
  { code: "1599", label: "Total current assets", amountCents: T2_2024_SCHEDULE_100.currentAssets },
  { code: "1740", label: "Machinery, equipment, furniture and fixtures", amountCents: T2_2024_SCHEDULE_100.equipment },
  { code: "1741", label: "Accum. amort. — machinery/equip/furn/fixtures", amountCents: -T2_2024_SCHEDULE_100.accumDep },
  { code: "2599", label: "Total assets", amountCents: T2_2024_SCHEDULE_100.totalAssets },
  { code: "2680", label: "Taxes payable", amountCents: T2_2024_SCHEDULE_100.taxesPayable },
  { code: "2701", label: "Loans from Canadian banks", amountCents: T2_2024_SCHEDULE_100.bankLoan },
  { code: "2960", label: "Other current liabilities", amountCents: T2_2024_SCHEDULE_100.otherCurrent },
  { code: "3139", label: "Total current liabilities", amountCents: T2_2024_SCHEDULE_100.currentLiabilities },
  { code: "3261", label: "Due to individual shareholder(s)", amountCents: T2_2024_SCHEDULE_100.shareholderLoan },
  { code: "3499", label: "Total liabilities", amountCents: T2_2024_SCHEDULE_100.totalLiabilities },
  { code: "3600", label: "Retained earnings / deficit", amountCents: T2_2024_SCHEDULE_100.retainedEarnings },
  { code: "3620", label: "Total shareholder equity", amountCents: T2_2024_SCHEDULE_100.totalEquity },
  { code: "3640", label: "Total liabilities and shareholder equity", amountCents: T2_2024_SCHEDULE_100.totalAssets },
] as const

export type FiledBalanceLine = {
  accountCode: string
  name: string
  debitCents: number
  creditCents: number
}

export type FiledJournal = {
  entryNumber: string
  source: string
  postedAt: Date
  description: string
  lines: Array<{ accountCode: string; debitCents: number; creditCents: number; memo: string }>
}

export function assertFiledGifiMath() {
  const {
    sales,
    purchases,
    freightIn,
    costOfSales,
    grossProfit,
    advertising,
    amortization,
    utilities,
    rent,
    computer,
    operatingExpenses,
    totalExpenses,
    netIncome,
  } = T2_2024_GIFI
  if (purchases + freightIn !== costOfSales) throw new Error("GIFI cost of sales does not equal purchases plus freight")
  if (sales - costOfSales !== grossProfit) throw new Error("GIFI gross profit does not equal sales minus cost of sales")
  if (advertising + amortization + utilities + rent + computer !== operatingExpenses) {
    throw new Error("GIFI operating expenses do not add through")
  }
  if (costOfSales + operatingExpenses !== totalExpenses) throw new Error("GIFI total expenses do not add through")
  if (grossProfit - operatingExpenses !== netIncome) throw new Error("GIFI net income does not add through")
  if (sales - totalExpenses !== netIncome) throw new Error("GIFI net income does not equal sales minus total expenses")
}

export function assertFiledBalanceSheetMath() {
  const s = T2_2024_SCHEDULE_100
  if (s.inventory + s.prepaid !== s.currentAssets) throw new Error("Schedule 100 current assets do not add through")
  if (s.currentAssets + s.equipment - s.accumDep !== s.totalAssets) throw new Error("Schedule 100 total assets do not add through")
  if (s.taxesPayable + s.bankLoan + s.otherCurrent !== s.currentLiabilities) {
    throw new Error("Schedule 100 current liabilities do not add through")
  }
  if (s.currentLiabilities + s.shareholderLoan !== s.totalLiabilities) {
    throw new Error("Schedule 100 total liabilities do not add through")
  }
  if (s.totalLiabilities + s.retainedEarnings !== s.totalAssets) {
    throw new Error("Schedule 100 does not tie: assets vs liabilities and equity")
  }
  if (T2_2024_TAX.class8Acquisitions - T2_2024_TAX.cca !== T2_2024_TAX.class8UccEnd) {
    throw new Error("Schedule 8 UCC does not equal cost minus CCA")
  }
  if (T2_2024_TAX.federalPartI + T2_2024_TAX.albertaTax !== T2_2024_TAX.totalTax) {
    throw new Error("Filed federal plus Alberta tax does not equal total tax")
  }
}

export function official2024BalanceSheet(): { opening: FiledBalanceLine[]; ending: FiledBalanceLine[] } {
  assertFiledGifiMath()
  assertFiledBalanceSheetMath()
  return {
    opening: [
      { accountCode: "1000", name: "Operating Cash", debitCents: T2_2024_SCHEDULE_101.cash, creditCents: 0 },
      { accountCode: "3000", name: "Common Shares", debitCents: 0, creditCents: T2_2024_SCHEDULE_101.commonShares },
    ],
    ending: [
      { accountCode: "1200", name: "Paper Inventory", debitCents: T2_2024_SCHEDULE_100.inventory, creditCents: 0 },
      { accountCode: "1500", name: "Prepaid Expenses", debitCents: T2_2024_SCHEDULE_100.prepaid, creditCents: 0 },
      { accountCode: "1600", name: "Equipment", debitCents: T2_2024_SCHEDULE_100.equipment, creditCents: 0 },
      { accountCode: "1690", name: "Accumulated Depreciation", debitCents: 0, creditCents: T2_2024_SCHEDULE_100.accumDep },
      { accountCode: "2000", name: "Accounts Payable", debitCents: 0, creditCents: T2_2024_SCHEDULE_100.otherCurrent },
      { accountCode: "2210", name: "Income Taxes Payable", debitCents: 0, creditCents: T2_2024_SCHEDULE_100.taxesPayable },
      { accountCode: "2310", name: "Shareholder Loan - Jerrold", debitCents: 0, creditCents: T2_2024_SCHEDULE_100.shareholderLoan },
      { accountCode: "2400", name: "Loans Payable", debitCents: 0, creditCents: T2_2024_SCHEDULE_100.bankLoan },
      { accountCode: "3100", name: "Retained Earnings", debitCents: 0, creditCents: T2_2024_SCHEDULE_100.retainedEarnings },
    ],
  }
}

export function official2024Journals(): FiledJournal[] {
  const { opening } = official2024BalanceSheet()
  const gifi = T2_2024_GIFI
  const bs = T2_2024_SCHEDULE_100
  const open = T2_2024_SCHEDULE_101
  const yearEnd = new Date(Date.UTC(2024, 11, 31, 23, 0, 0, 0))

  const journals: FiledJournal[] = [
    {
      entryNumber: "T2-2024-00",
      source: T2_2024_SOURCE,
      postedAt: new Date(Date.UTC(2024, 0, 1)),
      description: "2024 opening — filed T2 Schedule 101",
      lines: opening.map((line) => ({
        accountCode: line.accountCode,
        debitCents: line.debitCents,
        creditCents: line.creditCents,
        memo: "GIFI Schedule 101",
      })),
    },
    {
      entryNumber: "T2-2024-01",
      source: T2_2024_SOURCE,
      postedAt: yearEnd,
      description: "2024 filed T2 Schedule 125 and Schedule 100",
      lines: [
        { accountCode: "5000", debitCents: gifi.purchases, creditCents: 0, memo: "GIFI 8320" },
        { accountCode: "5040", debitCents: gifi.freightIn, creditCents: 0, memo: "GIFI 8457" },
        { accountCode: "6050", debitCents: gifi.advertising, creditCents: 0, memo: "GIFI 8521" },
        { accountCode: "6090", debitCents: gifi.amortization, creditCents: 0, memo: "GIFI 8670" },
        { accountCode: "6010", debitCents: gifi.utilities, creditCents: 0, memo: "GIFI 8812" },
        { accountCode: "6000", debitCents: gifi.rent, creditCents: 0, memo: "GIFI 8910" },
        { accountCode: "6020", debitCents: gifi.computer, creditCents: 0, memo: "GIFI 9150" },
        { accountCode: "1200", debitCents: bs.inventory, creditCents: 0, memo: "GIFI 1121" },
        { accountCode: "1500", debitCents: bs.prepaid, creditCents: 0, memo: "GIFI 1484" },
        { accountCode: "1600", debitCents: bs.equipment, creditCents: 0, memo: "GIFI 1740 / Schedule 8 class 8" },
        { accountCode: "3000", debitCents: open.commonShares, creditCents: 0, memo: "Clear Schedule 101 share capital to match Schedule 100" },
        { accountCode: "4000", debitCents: 0, creditCents: gifi.sales, memo: "GIFI 8000" },
        { accountCode: "1690", debitCents: 0, creditCents: bs.accumDep, memo: "GIFI 1741" },
        { accountCode: "2210", debitCents: 0, creditCents: bs.taxesPayable, memo: "GIFI 2680" },
        { accountCode: "2400", debitCents: 0, creditCents: bs.bankLoan, memo: "GIFI 2701" },
        { accountCode: "2000", debitCents: 0, creditCents: bs.otherCurrent, memo: "GIFI 2960" },
        { accountCode: "2310", debitCents: 0, creditCents: bs.shareholderLoan, memo: "GIFI 3261" },
        { accountCode: "1000", debitCents: 0, creditCents: open.cash, memo: "Spend opening cash; Schedule 100 cash is nil" },
      ],
    },
    {
      entryNumber: "T2-2024-CLOSE",
      source: YEAR_CLOSE_SOURCE,
      postedAt: yearEnd,
      description: "Close 2024 filed net income to retained earnings",
      lines: [
        { accountCode: "4000", debitCents: gifi.sales, creditCents: 0, memo: "Close GIFI 8000" },
        { accountCode: "5000", debitCents: 0, creditCents: gifi.purchases, memo: "Close GIFI 8320" },
        { accountCode: "5040", debitCents: 0, creditCents: gifi.freightIn, memo: "Close GIFI 8457" },
        { accountCode: "6050", debitCents: 0, creditCents: gifi.advertising, memo: "Close GIFI 8521" },
        { accountCode: "6090", debitCents: 0, creditCents: gifi.amortization, memo: "Close GIFI 8670" },
        { accountCode: "6010", debitCents: 0, creditCents: gifi.utilities, memo: "Close GIFI 8812" },
        { accountCode: "6000", debitCents: 0, creditCents: gifi.rent, memo: "Close GIFI 8910" },
        { accountCode: "6020", debitCents: 0, creditCents: gifi.computer, memo: "Close GIFI 9150" },
        { accountCode: "3100", debitCents: 0, creditCents: gifi.netIncome, memo: "GIFI 3680 / 3849" },
      ],
    },
  ]

  for (const journal of journals) {
    const debit = journal.lines.reduce((sum, line) => sum + line.debitCents, 0)
    const credit = journal.lines.reduce((sum, line) => sum + line.creditCents, 0)
    if (debit !== credit) {
      throw new Error(`${journal.entryNumber} is unbalanced: debit ${debit} credit ${credit}`)
    }
  }
  return journals
}
