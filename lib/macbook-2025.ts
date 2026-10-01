/**
 * 14-inch MacBook Pro purchased at Apple Market Mall on 19 Apr 2025 and paid
 * personally on Mastercard •••• 4531. AppleCare+ bought with the computer is
 * added to class 50 capital cost (CRA: warranty acquired with the asset).
 *
 * GST on the receipt is an ITC. The shareholder loan is the amount paid.
 */

export const MACBOOK_2025_SOURCE = "macbook-2025"
export const MACBOOK_2025_ENTRY = "FP-0056"

export type MacbookJournalLine = {
  accountCode: string
  accountName: string
  debitCents: number
  creditCents: number
  memo: string
  taxCode?: string
}

export const MACBOOK_2025 = {
  invoiceNumber: MACBOOK_2025_ENTRY,
  receiptNumber: "20250419R3011031441",
  invoiceDate: "2025-04-19",
  store: "Apple Market Mall",
  gstRegistrant: "10023 6199 RT0001",
  purchaser: "Jerrold Jacobe",
  description: "14-inch MacBook Pro Space Black MX2H3LL/A with AppleCare+",
  serial: "HGQHY74RDX",
  partNumber: "MX2H3LL/A",
  applecarePartNumber: "SR122Z/A",
  applecareAgreement: "970301625043583",
  cardLast4: "4531",
  computerListCents: 269_900,
  computerEducationCents: 19_000,
  recyclingFeeCents: 80,
  applecareListCents: 37_900,
  applecareEducationCents: 4_000,
  netCents: 284_880,
  gstCents: 14_244,
  totalCents: 299_124,
} as const

export function macbookComputerCents() {
  return MACBOOK_2025.computerListCents - MACBOOK_2025.computerEducationCents + MACBOOK_2025.recyclingFeeCents
}

export function macbookApplecareCents() {
  return MACBOOK_2025.applecareListCents - MACBOOK_2025.applecareEducationCents
}

export function macbookCapitalCostCents() {
  return MACBOOK_2025.netCents
}

export function macbookJournalLines(): MacbookJournalLine[] {
  const invoice = MACBOOK_2025
  return [
    {
      accountCode: "1600",
      accountName: "Equipment",
      debitCents: invoice.netCents,
      creditCents: 0,
      memo: `${invoice.description} (${invoice.invoiceNumber})`,
    },
    {
      accountCode: "1160",
      accountName: "GST Input Tax Credits Receivable",
      debitCents: invoice.gstCents,
      creditCents: 0,
      memo: `GST ITC ${invoice.receiptNumber} (${invoice.invoiceNumber})`,
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

export function macbookBalances() {
  const lines = macbookJournalLines()
  const debit = lines.reduce((sum, line) => sum + line.debitCents, 0)
  const credit = lines.reduce((sum, line) => sum + line.creditCents, 0)
  return (
    debit === credit &&
    credit === MACBOOK_2025.totalCents &&
    MACBOOK_2025.netCents + MACBOOK_2025.gstCents === MACBOOK_2025.totalCents &&
    macbookComputerCents() + macbookApplecareCents() === MACBOOK_2025.netCents
  )
}
