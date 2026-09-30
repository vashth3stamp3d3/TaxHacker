import { prisma } from "@/lib/db"
import { prismaAsOf, prismaDateInYear, workingYearRange } from "@/lib/working-year"
import { cache } from "react"
import { writeAuditLog } from "./audit"

export type JournalLineInput = {
  accountId: string
  debit: number
  credit: number
  memo?: string
  taxCodeId?: string
}

export type AccountingSuggestionLine = {
  accountCode: string
  accountName?: string
  debit: number
  credit: number
  memo?: string
  taxCode?: string
  confidence?: number
}

export type AccountingSuggestion = {
  accountingLines?: AccountingSuggestionLine[]
  taxTreatment?: {
    code?: string
    summary?: string
    recoverable?: boolean
    confidence?: number
  }
  paymentMethodSuggestion?: {
    name?: string
    confidence?: number
    reason?: string
  }
  accountingReviewNotes?: string[]
  automationSuggestions?: Record<string, unknown>[]
}

export type AccountBalance = {
  accountId: string
  code: string
  name: string
  type: string
  normalBalance: string
  debit: number
  credit: number
  balance: number
}

export type MonthlyFinancialBreakdown = {
  month: string
  label: string
  revenue: number
  costs: number
  netIncome: number
  transactionCount: number
  transactionTotal: number
}

export type FinancialBreakdown = {
  year: number
  ytd: {
    revenue: number
    costs: number
    netIncome: number
    transactionCount: number
    transactionTotal: number
  }
  monthly: MonthlyFinancialBreakdown[]
  recentTransactions: Array<{
    id: string
    name: string | null
    merchant: string | null
    total: number | null
    currencyCode: string | null
    issuedAt: Date | null
    type: string | null
  }>
}

export const getLedgerAccounts = cache(async (organizationId: string) => {
  return prisma.ledgerAccount.findMany({
    where: { organizationId },
    orderBy: { code: "asc" },
  })
})

export const getTaxCodes = cache(async (organizationId: string) => {
  return prisma.taxCode.findMany({
    where: { organizationId },
    orderBy: { code: "asc" },
  })
})

export const getPaymentMethods = cache(async (organizationId: string) => {
  return prisma.paymentMethod.findMany({
    where: { organizationId, isActive: true },
    orderBy: { name: "asc" },
  })
})

export const getJournalEntries = cache(async (organizationId: string, year?: number) => {
  return prisma.journalEntry.findMany({
    where: { organizationId, postedAt: prismaDateInYear(year) },
    include: { lines: true },
    orderBy: [{ postedAt: "desc" }, { entryNumber: "desc" }],
    take: 100,
  })
})

export async function createBalancedJournalEntry({
  organizationId,
  createdById,
  description,
  postedAt,
  source = "manual",
  sourceId,
  reversedEntryId,
  lines,
}: {
  organizationId: string
  createdById?: string
  description?: string
  postedAt: Date
  source?: string
  sourceId?: string
  reversedEntryId?: string
  lines: JournalLineInput[]
}) {
  const normalizedLines = lines
    .map((line) => ({
      ...line,
      debit: Math.max(0, Math.round(line.debit || 0)),
      credit: Math.max(0, Math.round(line.credit || 0)),
    }))
    .filter((line) => line.accountId && (line.debit > 0 || line.credit > 0))

  const debitTotal = normalizedLines.reduce((sum, line) => sum + line.debit, 0)
  const creditTotal = normalizedLines.reduce((sum, line) => sum + line.credit, 0)

  if (normalizedLines.length < 2) {
    throw new Error("Journal entries require at least two lines")
  }

  if (debitTotal !== creditTotal) {
    throw new Error("Journal entry debits and credits must balance")
  }

  const closedPeriod = await prisma.accountingPeriod.findFirst({
    where: {
      organizationId,
      isClosed: true,
      startsAt: { lte: postedAt },
      endsAt: { gte: postedAt },
    },
  })
  if (closedPeriod) {
    throw new Error(`Accounting period ${closedPeriod.name} is closed`)
  }

  const entryNumber = await getNextNumber(organizationId, "journal_entry")

  const entry = await prisma.journalEntry.create({
    data: {
      organizationId,
      entryNumber,
      source,
      sourceId,
      description,
      postedAt,
      createdById,
      reversedEntryId,
      lines: {
        create: normalizedLines.map((line) => ({
          organizationId,
          accountId: line.accountId,
          debit: line.debit,
          credit: line.credit,
          memo: line.memo,
          taxCodeId: line.taxCodeId,
        })),
      },
    },
    include: { lines: true },
  })

  await writeAuditLog({
    organizationId,
    userId: createdById,
    action: "journal.post",
    entityType: "journal_entry",
    entityId: entry.id,
    data: { source, sourceId, description, debitTotal },
  })

  return entry
}

export async function postReceiptAnalysisJournalEntry({
  organizationId,
  createdById,
  transactionId,
  paymentMethodId,
  description,
  postedAt,
  accountingSuggestion,
  fallbackAmount,
}: {
  organizationId: string
  createdById?: string
  transactionId?: string
  paymentMethodId?: string | null
  description: string
  postedAt: Date
  accountingSuggestion?: AccountingSuggestion | null
  fallbackAmount: number
}) {
  const accounts = await getLedgerAccounts(organizationId)
  const taxCodes = await getTaxCodes(organizationId)
  const paymentMethod = paymentMethodId
    ? await prisma.paymentMethod.findFirst({ where: { id: paymentMethodId, organizationId, isActive: true } })
    : null

  const accountByCode = new Map(accounts.map((account) => [account.code, account]))
  const taxCodeByCode = new Map(taxCodes.map((taxCode) => [taxCode.code, taxCode]))
  const suggestedLines = accountingSuggestion?.accountingLines || []
  const lines: JournalLineInput[] = suggestedLines
    .flatMap((line) => {
      const account = accountByCode.get(line.accountCode)
      if (!account) return []

      return [{
        accountId: account.id,
        debit: dollarsToCents(line.debit),
        credit: paymentMethod?.clearingAccountId ? 0 : dollarsToCents(line.credit),
        memo: line.memo || description,
        taxCodeId: line.taxCode ? taxCodeByCode.get(line.taxCode)?.id : undefined,
      }]
    })

  const debitTotal = lines.reduce((sum, line) => sum + line.debit, 0)
  const creditTotal = lines.reduce((sum, line) => sum + line.credit, 0)

  if (paymentMethod?.clearingAccountId && debitTotal > 0 && creditTotal === 0) {
    lines.push({
      accountId: paymentMethod.clearingAccountId,
      debit: 0,
      credit: debitTotal,
      memo: paymentMethod.name,
    })
  }

  if (lines.length < 2) {
    const [expense, clearing] = await Promise.all([
      getAccount(organizationId, "6040"),
      paymentMethod?.clearingAccountId
        ? prisma.ledgerAccount.findFirst({ where: { id: paymentMethod.clearingAccountId, organizationId } })
        : getAccount(organizationId, "1000"),
    ])
    const amount = Math.max(0, fallbackAmount)
    lines.splice(
      0,
      lines.length,
      { accountId: expense.id, debit: amount, credit: 0, memo: description },
      { accountId: clearing?.id || expense.id, debit: 0, credit: amount, memo: paymentMethod?.name || description }
    )
  }

  return createBalancedJournalEntry({
    organizationId,
    createdById,
    description,
    postedAt,
    source: "receipt_analysis",
    sourceId: transactionId,
    lines,
  })
}

export async function getNextNumber(organizationId: string, code: string) {
  const sequence = await prisma.numberSequence.upsert({
    where: { organizationId_code: { organizationId, code } },
    update: {},
    create: { organizationId, code, prefix: `${code.toUpperCase()}-`, nextNumber: 1 },
  })

  await prisma.numberSequence.update({
    where: { organizationId_code: { organizationId, code } },
    data: { nextNumber: { increment: 1 } },
  })

  return `${sequence.prefix}${String(sequence.nextNumber).padStart(sequence.padding, "0")}`
}

export const getTrialBalance = cache(async (organizationId: string, year?: number): Promise<AccountBalance[]> => {
  return accountBalances(organizationId, year ? prismaAsOf(workingYearRange(year)) : undefined)
})

export const getIncomeStatement = cache(async (organizationId: string, year?: number) => {
  const balances = await accountBalances(organizationId, prismaDateInYear(year))
  const revenue = sumByTypes(balances, ["revenue"])
  const cogs = sumByTypes(balances, ["cogs"])
  const expenses = sumByTypes(balances, ["expense"])

  return {
    revenue,
    cogs,
    grossProfit: revenue - cogs,
    expenses,
    netIncome: revenue - cogs - expenses,
    accounts: balances.filter((balance) => ["revenue", "cogs", "expense"].includes(balance.type)),
  }
})

export const getBalanceSheet = cache(async (organizationId: string, year?: number) => {
  const balances = await getTrialBalance(organizationId, year)
  const assets = sumByTypes(balances, ["asset"])
  const liabilities = sumByTypes(balances, ["liability"])
  const equity = sumByTypes(balances, ["equity"])

  return {
    assets,
    liabilities,
    equity,
    check: assets - liabilities - equity,
    accounts: balances.filter((balance) => ["asset", "liability", "equity"].includes(balance.type)),
  }
})

export const getCashFlowStatement = cache(async (organizationId: string, year?: number) => {
  const balances = await getTrialBalance(organizationId, year)
  const cashAccounts = balances.filter((balance) => balance.type === "asset" && balance.code.startsWith("10"))
  const netCash = cashAccounts.reduce((sum, account) => sum + account.balance, 0)
  const incomeStatement = await getIncomeStatement(organizationId, year)

  return {
    operating: incomeStatement.netIncome,
    investing: 0,
    financing: 0,
    netCashChange: netCash,
    endingCash: netCash,
    accounts: cashAccounts,
  }
})

export const getGstSummary = cache(async (organizationId: string, range?: { from?: Date; to?: Date }) => {
  const taxCodes = await getTaxCodes(organizationId)
  const gstCodeIds = taxCodes.filter((code) => code.taxType === "GST").map((code) => code.id)
  const taxLines = await prisma.journalLine.findMany({
    where: {
      organizationId,
      taxCodeId: { in: gstCodeIds },
      journalEntry: range?.from || range?.to
        ? { postedAt: { gte: range.from, lte: range.to } }
        : undefined,
    },
  })

  const collected = taxLines
    .filter((line) => line.credit > line.debit)
    .reduce((sum, line) => sum + line.credit - line.debit, 0)
  const inputCredits = taxLines
    .filter((line) => line.debit > line.credit)
    .reduce((sum, line) => sum + line.debit - line.credit, 0)

  return {
    collected,
    inputCredits,
    adjustments: 0,
    netTax: collected - inputCredits,
    taxCodes,
  }
})

export const getFinancialBreakdown = cache(async (organizationId: string, userId: string, yearNumber?: number): Promise<FinancialBreakdown> => {
  const selected = workingYearRange(yearNumber ?? new Date().getUTCFullYear())
  const year = selected.year
  const startsAt = selected.startsAt
  const endsAt = selected.endsAt
  const accounts = await getLedgerAccounts(organizationId)
  const accountById = new Map(accounts.map((account) => [account.id, account]))
  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: `${year}-${String(index + 1).padStart(2, "0")}`,
    label: new Date(Date.UTC(year, index, 1)).toLocaleString("en-CA", { month: "short", timeZone: "UTC" }),
    revenue: 0,
    costs: 0,
    netIncome: 0,
    transactionCount: 0,
    transactionTotal: 0,
  }))

  const [journalEntries, transactions, recentTransactions] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { organizationId, postedAt: { gte: startsAt, lte: endsAt } },
      include: { lines: true },
      orderBy: { postedAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        OR: [{ organizationId }, { userId, organizationId: null }],
        issuedAt: { gte: startsAt, lte: endsAt },
      },
      select: { issuedAt: true, total: true, convertedTotal: true, type: true },
    }),
    prisma.transaction.findMany({
      where: {
        OR: [{ organizationId }, { userId, organizationId: null }],
        issuedAt: { gte: startsAt, lte: endsAt },
      },
      orderBy: { issuedAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        merchant: true,
        total: true,
        currencyCode: true,
        issuedAt: true,
        type: true,
      },
    }),
  ])

  for (const entry of journalEntries) {
    const bucket = monthly[entry.postedAt.getMonth()]
    for (const line of entry.lines) {
      const account = accountById.get(line.accountId)
      if (!account) continue
      if (account.type === "revenue") {
        bucket.revenue += line.credit - line.debit
      }
      if (account.type === "cogs" || account.type === "expense") {
        bucket.costs += line.debit - line.credit
      }
    }
  }

  for (const transaction of transactions) {
    if (!transaction.issuedAt) continue
    const bucket = monthly[transaction.issuedAt.getMonth()]
    bucket.transactionCount += 1
    bucket.transactionTotal += transaction.convertedTotal || transaction.total || 0
  }

  for (const month of monthly) {
    month.netIncome = month.revenue - month.costs
  }

  const elapsedMonthly = monthly
  const ytd = elapsedMonthly.reduce(
    (totals, month) => ({
      revenue: totals.revenue + month.revenue,
      costs: totals.costs + month.costs,
      netIncome: totals.netIncome + month.netIncome,
      transactionCount: totals.transactionCount + month.transactionCount,
      transactionTotal: totals.transactionTotal + month.transactionTotal,
    }),
    { revenue: 0, costs: 0, netIncome: 0, transactionCount: 0, transactionTotal: 0 }
  )

  return { year, ytd, monthly: elapsedMonthly, recentTransactions }
})

export async function reverseJournalEntry({
  organizationId,
  journalEntryId,
  createdById,
  postedAt,
}: {
  organizationId: string
  journalEntryId: string
  createdById?: string
  postedAt?: Date
}) {
  const original = await prisma.journalEntry.findFirst({
    where: { id: journalEntryId, organizationId },
    include: { lines: true },
  })
  if (!original) throw new Error("Journal entry not found")
  if (original.reversedEntryId) throw new Error("Journal entry is already reversed")

  const reversal = await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: `Reversal of ${original.entryNumber}`,
    postedAt: postedAt || new Date(),
    source: "reversal",
    sourceId: original.id,
    reversedEntryId: original.id,
    lines: original.lines.map((line) => ({
      accountId: line.accountId,
      debit: line.credit,
      credit: line.debit,
      memo: `Reversal: ${line.memo || original.description || original.entryNumber}`,
      taxCodeId: line.taxCodeId || undefined,
    })),
  })

  await prisma.journalEntry.update({
    where: { id: original.id },
    data: { reversedEntryId: reversal.id, status: "reversed" },
  })

  return reversal
}

export async function closeAccountingPeriod(organizationId: string, periodId: string, userId?: string) {
  const period = await prisma.accountingPeriod.findFirst({ where: { id: periodId, organizationId } })
  if (!period) throw new Error("Accounting period not found")
  const updated = await prisma.accountingPeriod.update({
    where: { id: period.id },
    data: { isClosed: true },
  })
  await writeAuditLog({
    organizationId,
    userId,
    action: "period.close",
    entityType: "accounting_period",
    entityId: period.id,
    data: { name: period.name },
  })
  return updated
}

export const getAccountingPeriods = cache(async (organizationId: string, year?: number) => {
  return prisma.accountingPeriod.findMany({
    where: { organizationId, startsAt: prismaDateInYear(year) },
    orderBy: { startsAt: "desc" },
  })
})

async function accountBalances(organizationId: string, postedAt?: { gte?: Date; lte?: Date }): Promise<AccountBalance[]> {
  const accounts = await getLedgerAccounts(organizationId)
  const lines = await prisma.journalLine.groupBy({
    by: ["accountId"],
    where: {
      organizationId,
      journalEntry: postedAt ? { postedAt } : undefined,
    },
    _sum: {
      debit: true,
      credit: true,
    },
  })
  const totals = new Map(lines.map((line) => [line.accountId, line._sum]))

  return accounts.map((account) => {
    const accountTotals = totals.get(account.id)
    const debit = accountTotals?.debit || 0
    const credit = accountTotals?.credit || 0
    const balance = account.normalBalance === "debit" ? debit - credit : credit - debit

    return {
      accountId: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      normalBalance: account.normalBalance,
      debit,
      credit,
      balance,
    }
  })
}

function sumByTypes(balances: AccountBalance[], types: string[]) {
  return balances
    .filter((balance) => types.includes(balance.type))
    .reduce((sum, account) => sum + account.balance, 0)
}

async function getAccount(organizationId: string, code: string) {
  const account = await prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code } } })
  if (!account) throw new Error(`Missing account ${code}`)
  return account
}

function dollarsToCents(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.round(numeric * 100)
}

export function formatMoney(cents: number, currency = "CAD") {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(cents / 100)
}

export function trialBalanceCsv(accounts: AccountBalance[]) {
  const header = ["Code", "Name", "Type", "Debit", "Credit", "Balance"]
  const rows = accounts.map((account) => [
    account.code,
    account.name.replaceAll(",", " "),
    account.type,
    (account.debit / 100).toFixed(2),
    (account.credit / 100).toFixed(2),
    (account.balance / 100).toFixed(2),
  ])
  const debit = accounts.reduce((sum, account) => sum + account.debit, 0)
  const credit = accounts.reduce((sum, account) => sum + account.credit, 0)
  rows.push(["", "Totals", "", (debit / 100).toFixed(2), (credit / 100).toFixed(2), ""])
  return [header, ...rows].map((row) => row.join(",")).join("\n")
}
