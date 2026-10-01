/**
 * ENMAX Easymax bills for Formulated Prints Corp, account 503330614,
 * shop site 4558 14 St NE. Twelve statements, January–December 2025.
 *
 * Amounts are before GST. GST is an input tax credit.
 * The February bill also re-bills the January total as a returned payment.
 * That $499.05 is the January bill again, so it is not a second utility expense.
 */

export const ENMAX_2025_SOURCE = "enmax-2025"
export const ENMAX_ACCOUNT = "503330614"
export const ENMAX_GST_NUMBERS = ["870024940RT", "878134519RT"] as const

export type EnmaxBill = {
  entryNumber: string
  billDate: string
  withdrawalDate: string
  electricityCents: number
  electricityGstCents: number
  naturalGasCents: number
  naturalGasGstCents: number
  lateFeeCents: number
  /** January amount put back on the February bill after the card payment was returned. */
  returnedPaymentCents: number
}

export type EnmaxJournalLine = {
  accountCode: string
  accountName: string
  debitCents: number
  creditCents: number
  memo: string
  taxCode?: string
}

export const ENMAX_2025_BILLS: EnmaxBill[] = [
  { entryNumber: "ENMAX-2025-01", billDate: "2025-01-21", withdrawalDate: "2025-02-18", electricityCents: 31_950, electricityGstCents: 1_598, naturalGasCents: 15_578, naturalGasGstCents: 779, lateFeeCents: 0, returnedPaymentCents: 0 },
  { entryNumber: "ENMAX-2025-02", billDate: "2025-02-19", withdrawalDate: "2025-02-26", electricityCents: 30_407, electricityGstCents: 1_520, naturalGasCents: 21_175, naturalGasGstCents: 1_059, lateFeeCents: 0, returnedPaymentCents: 49_905 },
  { entryNumber: "ENMAX-2025-03", billDate: "2025-03-19", withdrawalDate: "2025-04-14", electricityCents: 21_750, electricityGstCents: 1_088, naturalGasCents: 25_624, naturalGasGstCents: 1_281, lateFeeCents: 998, returnedPaymentCents: 0 },
  { entryNumber: "ENMAX-2025-04", billDate: "2025-04-17", withdrawalDate: "2025-05-12", electricityCents: 16_405, electricityGstCents: 820, naturalGasCents: 14_460, naturalGasGstCents: 723, lateFeeCents: 0, returnedPaymentCents: 0 },
  { entryNumber: "ENMAX-2025-05", billDate: "2025-05-20", withdrawalDate: "2025-06-16", electricityCents: 16_952, electricityGstCents: 848, naturalGasCents: 11_397, naturalGasGstCents: 570, lateFeeCents: 0, returnedPaymentCents: 0 },
  { entryNumber: "ENMAX-2025-06", billDate: "2025-06-18", withdrawalDate: "2025-07-14", electricityCents: 16_529, electricityGstCents: 826, naturalGasCents: 6_497, naturalGasGstCents: 325, lateFeeCents: 0, returnedPaymentCents: 0 },
  { entryNumber: "ENMAX-2025-07", billDate: "2025-07-21", withdrawalDate: "2025-08-15", electricityCents: 16_974, electricityGstCents: 849, naturalGasCents: 3_624, naturalGasGstCents: 181, lateFeeCents: 0, returnedPaymentCents: 0 },
  { entryNumber: "ENMAX-2025-08", billDate: "2025-08-20", withdrawalDate: "2025-09-15", electricityCents: 18_171, electricityGstCents: 909, naturalGasCents: 4_629, naturalGasGstCents: 231, lateFeeCents: 0, returnedPaymentCents: 0 },
  { entryNumber: "ENMAX-2025-09", billDate: "2025-09-18", withdrawalDate: "2025-10-14", electricityCents: 15_422, electricityGstCents: 771, naturalGasCents: 4_894, naturalGasGstCents: 245, lateFeeCents: 0, returnedPaymentCents: 0 },
  { entryNumber: "ENMAX-2025-10", billDate: "2025-10-21", withdrawalDate: "2025-11-17", electricityCents: 15_106, electricityGstCents: 755, naturalGasCents: 3_639, naturalGasGstCents: 182, lateFeeCents: 0, returnedPaymentCents: 0 },
  { entryNumber: "ENMAX-2025-11", billDate: "2025-11-19", withdrawalDate: "2025-12-15", electricityCents: 17_089, electricityGstCents: 854, naturalGasCents: 8_276, naturalGasGstCents: 414, lateFeeCents: 0, returnedPaymentCents: 0 },
  { entryNumber: "ENMAX-2025-12", billDate: "2025-12-17", withdrawalDate: "2026-01-12", electricityCents: 15_227, electricityGstCents: 761, naturalGasCents: 12_690, naturalGasGstCents: 635, lateFeeCents: 0, returnedPaymentCents: 0 },
]

export function enmaxGstCents(bill: EnmaxBill) {
  return bill.electricityGstCents + bill.naturalGasGstCents
}

export function enmaxUtilityCents(bill: EnmaxBill) {
  return bill.electricityCents + bill.naturalGasCents + bill.lateFeeCents
}

/** New cost of this bill. Excludes a returned payment that belongs to an earlier bill. */
export function enmaxNewChargeCents(bill: EnmaxBill) {
  return enmaxUtilityCents(bill) + enmaxGstCents(bill)
}

export function enmaxAmountDueCents(bill: EnmaxBill) {
  return enmaxNewChargeCents(bill) + bill.returnedPaymentCents
}

export function enmaxJournalLines(bill: EnmaxBill): EnmaxJournalLine[] {
  const lines: EnmaxJournalLine[] = [
    {
      accountCode: "6010",
      accountName: "Utilities",
      debitCents: bill.electricityCents,
      creditCents: 0,
      memo: `ENMAX electricity ${bill.entryNumber}`,
    },
    {
      accountCode: "6010",
      accountName: "Utilities",
      debitCents: bill.naturalGasCents,
      creditCents: 0,
      memo: `ENMAX natural gas ${bill.entryNumber}`,
    },
  ]
  if (bill.lateFeeCents > 0) {
    lines.push({
      accountCode: "6010",
      accountName: "Utilities",
      debitCents: bill.lateFeeCents,
      creditCents: 0,
      memo: `ENMAX late payment charge ${bill.entryNumber}`,
    })
  }
  lines.push(
    {
      accountCode: "1160",
      accountName: "GST Input Tax Credits Receivable",
      debitCents: enmaxGstCents(bill),
      creditCents: 0,
      memo: `GST ITC ${bill.entryNumber}`,
      taxCode: "GST_5_ITC",
    },
    {
      accountCode: "2300",
      accountName: "Credit Card Payable",
      debitCents: 0,
      creditCents: enmaxNewChargeCents(bill),
      memo: `ENMAX pre-authorized credit card ${bill.entryNumber}`,
    }
  )
  return lines
}

export function enmaxBillBalances(bill: EnmaxBill) {
  const lines = enmaxJournalLines(bill)
  const debit = lines.reduce((sum, line) => sum + line.debitCents, 0)
  const credit = lines.reduce((sum, line) => sum + line.creditCents, 0)
  return debit === credit && credit === enmaxNewChargeCents(bill)
}
