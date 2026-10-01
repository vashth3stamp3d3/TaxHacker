/**
 * TradingView Premium annual subscription invoiced to Jerrold Jacobe at the
 * shop address and paid personally (PayPal). GST on the invoice is an ITC.
 * The shareholder loan is the amount paid, including GST.
 *
 * Card statements also show a PayPal TradingView charge; book this invoice
 * only so the subscription is not claimed twice.
 */

export const TRADINGVIEW_2025_SOURCE = "tradingview-2025"
export const TRADINGVIEW_2025_ENTRY = "FP-0055"

export type TradingViewJournalLine = {
  accountCode: string
  accountName: string
  debitCents: number
  creditCents: number
  memo: string
  taxCode?: string
}

export const TRADINGVIEW_2025 = {
  invoiceNumber: TRADINGVIEW_2025_ENTRY,
  vendorInvoiceNumber: "CA00443457",
  transactionId: "4EK74602Y25965939",
  invoiceDate: "2025-09-05",
  seller: "TradingView, Inc.",
  gstRegistrant: "705716306RT9999",
  purchaser: "Jerrold Jacobe",
  shopAddress: "4558 14 St NE, Calgary, AB T2E 6T7",
  description: "TradingView Premium annual subscription commencing 05 Sep 2025",
  netCents: 34_124,
  gstCents: 1_706,
  totalCents: 35_830,
} as const

export function tradingViewJournalLines(): TradingViewJournalLine[] {
  const invoice = TRADINGVIEW_2025
  return [
    {
      accountCode: "6020",
      accountName: "Software",
      debitCents: invoice.netCents,
      creditCents: 0,
      memo: `${invoice.description} (${invoice.invoiceNumber})`,
    },
    {
      accountCode: "1160",
      accountName: "GST Input Tax Credits Receivable",
      debitCents: invoice.gstCents,
      creditCents: 0,
      memo: `GST ITC ${invoice.vendorInvoiceNumber} (${invoice.invoiceNumber})`,
      taxCode: "GST_5_ITC",
    },
    {
      accountCode: "2310",
      accountName: "Shareholder Loan - Jerrold",
      debitCents: 0,
      creditCents: invoice.totalCents,
      memo: `Reimbursement to Jerrold Jacobe (${invoice.invoiceNumber})`,
    },
  ]
}

export function tradingViewBalances() {
  const lines = tradingViewJournalLines()
  const debit = lines.reduce((sum, line) => sum + line.debitCents, 0)
  const credit = lines.reduce((sum, line) => sum + line.creditCents, 0)
  return debit === credit && credit === TRADINGVIEW_2025.totalCents && TRADINGVIEW_2025.netCents + TRADINGVIEW_2025.gstCents === TRADINGVIEW_2025.totalCents
}
