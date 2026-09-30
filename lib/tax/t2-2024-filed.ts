/** Filed 2024 T2 GIFI Schedule 125 (whole dollars from the return summary). */
export const T2_2024_SOURCE = "t2-2024-filed"
export const YEAR_CLOSE_SOURCE = "year_close"
export const T2_2024_YEAR = 2024

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

export const T2_2024_ACCOUNT_MAP = {
  sales: "4000",
  purchases: "5000",
  freightIn: "5040",
  advertising: "6050",
  amortization: "6090",
  accumDep: "1690",
  utilities: "6010",
  rent: "6000",
  computer: "6020",
  cash: "1000",
  equipment: "1600",
  loan: "2310",
  retainedEarnings: "3100",
} as const

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

export function cashExpensesCents() {
  return T2_2024_GIFI.totalExpenses - T2_2024_GIFI.amortization
}

export function endingCashCents() {
  return T2_2024_GIFI.sales - cashExpensesCents()
}

export function assertFiledGifiMath() {
  const { sales, purchases, freightIn, costOfSales, grossProfit, advertising, amortization, utilities, rent, computer, operatingExpenses, totalExpenses, netIncome } =
    T2_2024_GIFI
  if (purchases + freightIn !== costOfSales) throw new Error("GIFI cost of sales does not equal purchases plus freight")
  if (sales - costOfSales !== grossProfit) throw new Error("GIFI gross profit does not equal sales minus cost of sales")
  if (advertising + amortization + utilities + rent + computer !== operatingExpenses) {
    throw new Error("GIFI operating expenses do not add through")
  }
  if (costOfSales + operatingExpenses !== totalExpenses) throw new Error("GIFI total expenses do not add through")
  if (grossProfit - operatingExpenses !== netIncome) throw new Error("GIFI net income does not add through")
  if (sales - totalExpenses !== netIncome) throw new Error("GIFI net income does not equal sales minus total expenses")
}

export function official2024BalanceSheet(equipmentCents: number): {
  opening: FiledBalanceLine[]
  ending: FiledBalanceLine[]
} {
  const cash = endingCashCents()
  const loan = equipmentCents
  const ending: FiledBalanceLine[] = [
    { accountCode: "1000", name: "Operating Cash", debitCents: cash, creditCents: 0 },
    { accountCode: "1600", name: "Equipment", debitCents: equipmentCents, creditCents: 0 },
    { accountCode: "1690", name: "Accumulated Depreciation", debitCents: 0, creditCents: T2_2024_GIFI.amortization },
    { accountCode: "2310", name: "Shareholder Loan - Jerrold", debitCents: 0, creditCents: loan },
    { accountCode: "3100", name: "Retained Earnings", debitCents: 0, creditCents: T2_2024_GIFI.netIncome },
  ]
  const assets = cash + equipmentCents - T2_2024_GIFI.amortization
  const liabEquity = loan + T2_2024_GIFI.netIncome
  if (assets !== liabEquity) {
    throw new Error(`2024 official books do not tie: assets ${assets} liabilities and equity ${liabEquity}`)
  }
  return { opening: [], ending }
}

export function official2024Journals(equipmentCents: number): FiledJournal[] {
  assertFiledGifiMath()
  const postedAt = new Date(Date.UTC(2024, 11, 31, 23, 0, 0, 0))
  const cashOut = cashExpensesCents()
  const gifi = T2_2024_GIFI
  const map = T2_2024_ACCOUNT_MAP

  const journals: FiledJournal[] = [
    {
      entryNumber: "T2-2024-01",
      source: T2_2024_SOURCE,
      postedAt,
      description: "2024 filed T2 GIFI 8000 trade sales",
      lines: [
        { accountCode: map.cash, debitCents: gifi.sales, creditCents: 0, memo: "GIFI 8000" },
        { accountCode: map.sales, debitCents: 0, creditCents: gifi.sales, memo: "GIFI 8000" },
      ],
    },
    {
      entryNumber: "T2-2024-02",
      source: T2_2024_SOURCE,
      postedAt,
      description: "2024 filed T2 GIFI cash cost of sales and operating expenses",
      lines: [
        { accountCode: map.purchases, debitCents: gifi.purchases, creditCents: 0, memo: "GIFI 8320" },
        { accountCode: map.freightIn, debitCents: gifi.freightIn, creditCents: 0, memo: "GIFI 8457" },
        { accountCode: map.advertising, debitCents: gifi.advertising, creditCents: 0, memo: "GIFI 8521" },
        { accountCode: map.utilities, debitCents: gifi.utilities, creditCents: 0, memo: "GIFI 8812" },
        { accountCode: map.rent, debitCents: gifi.rent, creditCents: 0, memo: "GIFI 8910" },
        { accountCode: map.computer, debitCents: gifi.computer, creditCents: 0, memo: "GIFI 9150" },
        { accountCode: map.cash, debitCents: 0, creditCents: cashOut, memo: "Paid expenses per filed T2" },
      ],
    },
    {
      entryNumber: "T2-2024-03",
      source: T2_2024_SOURCE,
      postedAt,
      description: "2024 filed T2 GIFI 8670 amortization of tangible assets",
      lines: [
        { accountCode: map.amortization, debitCents: gifi.amortization, creditCents: 0, memo: "GIFI 8670" },
        { accountCode: map.accumDep, debitCents: 0, creditCents: gifi.amortization, memo: "GIFI 8670" },
      ],
    },
    {
      entryNumber: "T2-2024-CLOSE",
      source: YEAR_CLOSE_SOURCE,
      postedAt,
      description: "Close 2024 filed net income to retained earnings",
      lines: [
        { accountCode: map.sales, debitCents: gifi.sales, creditCents: 0, memo: "Close GIFI 8000" },
        { accountCode: map.purchases, debitCents: 0, creditCents: gifi.purchases, memo: "Close GIFI 8320" },
        { accountCode: map.freightIn, debitCents: 0, creditCents: gifi.freightIn, memo: "Close GIFI 8457" },
        { accountCode: map.advertising, debitCents: 0, creditCents: gifi.advertising, memo: "Close GIFI 8521" },
        { accountCode: map.amortization, debitCents: 0, creditCents: gifi.amortization, memo: "Close GIFI 8670" },
        { accountCode: map.utilities, debitCents: 0, creditCents: gifi.utilities, memo: "Close GIFI 8812" },
        { accountCode: map.rent, debitCents: 0, creditCents: gifi.rent, memo: "Close GIFI 8910" },
        { accountCode: map.computer, debitCents: 0, creditCents: gifi.computer, memo: "Close GIFI 9150" },
        { accountCode: map.retainedEarnings, debitCents: 0, creditCents: gifi.netIncome, memo: "2024 filed net income" },
      ],
    },
  ]

  if (equipmentCents > 0) {
    journals.splice(3, 0, {
      entryNumber: "T2-2024-04",
      source: T2_2024_SOURCE,
      postedAt,
      description: "2024 equipment purchases funded by shareholder loan (FP36 subledger, kept on the balance sheet)",
      lines: [
        { accountCode: map.equipment, debitCents: equipmentCents, creditCents: 0, memo: "2024 equipment" },
        { accountCode: map.loan, debitCents: 0, creditCents: equipmentCents, memo: "Shareholder loan - Jerrold" },
      ],
    })
  }

  for (const journal of journals) {
    const debit = journal.lines.reduce((sum, line) => sum + line.debitCents, 0)
    const credit = journal.lines.reduce((sum, line) => sum + line.creditCents, 0)
    if (debit !== credit) {
      throw new Error(`${journal.entryNumber} is unbalanced: debit ${debit} credit ${credit}`)
    }
  }

  official2024BalanceSheet(equipmentCents)
  return journals
}

export function equipmentCentsFromHistorical(entries: Array<{ postedAt: Date; lines: Array<{ accountCode: string; debitCents: number }> }>, year: number) {
  return entries
    .filter((entry) => entry.postedAt.getUTCFullYear() === year)
    .reduce(
      (sum, entry) => sum + entry.lines.filter((line) => line.accountCode === "1600").reduce((lineSum, line) => lineSum + line.debitCents, 0),
      0
    )
}
