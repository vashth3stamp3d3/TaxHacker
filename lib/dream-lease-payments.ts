/**
 * Dream Connect lease payments for Formulated Prints Corporation (tenant 740824-1).
 * Exported 30 Sep 2026. Paid from company CIBC (7607) through Versapay, not a personal card.
 *
 * Commercial rent is GST-included. The 5% GST is an input tax credit.
 * The 1 Feb 2025 payment was reversed NSF on 5 Feb and replaced the same day.
 * The open balance of $2,782.59 is not a payment and is not booked.
 */

export const DREAM_LEASE_SOURCE = "dream-lease"
export const DREAM_TENANT = "Formulated Prints Corporation (740824-1)"

export type DreamLeasePayment = {
  entryNumber: string
  paidDate: string
  paymentNumber: string
  invoiceNumber: string
  /** Negative when Versapay reversed the payment. */
  appliedCents: number
  status: "completed" | "reversal"
}

export type DreamJournalLine = {
  accountCode: string
  accountName: string
  debitCents: number
  creditCents: number
  memo: string
  taxCode?: string
}

const RENT_2025_CENTS = 263_803
const RENT_2026_CENTS = 278_259

export const DREAM_LEASE_PAYMENTS: DreamLeasePayment[] = [
  { entryNumber: "DREAM-2026-09-22", paidDate: "2026-09-22", paymentNumber: "1UFYUIR1R4EQ", invoiceNumber: "455927-RH-740824", appliedCents: 195_907, status: "completed" },
  { entryNumber: "DREAM-2026-09-01", paidDate: "2026-09-01", paymentNumber: "2FW5SDNKF9GT", invoiceNumber: "470622-RD-740824", appliedCents: RENT_2026_CENTS, status: "completed" },
  { entryNumber: "DREAM-2026-08-01", paidDate: "2026-08-01", paymentNumber: "59MYIS8AMXVE", invoiceNumber: "468994-RD-740824", appliedCents: RENT_2026_CENTS, status: "completed" },
  { entryNumber: "DREAM-2026-07-01", paidDate: "2026-07-01", paymentNumber: "912E23A8AVIV", invoiceNumber: "465675-RD-740824", appliedCents: RENT_2026_CENTS, status: "completed" },
  { entryNumber: "DREAM-2026-06-01", paidDate: "2026-06-01", paymentNumber: "157ALWNRMY4N", invoiceNumber: "462318-RD-740824", appliedCents: RENT_2026_CENTS, status: "completed" },
  { entryNumber: "DREAM-2026-05-01", paidDate: "2026-05-01", paymentNumber: "36QRM7EZCT8M", invoiceNumber: "458674-RD-740824", appliedCents: RENT_2026_CENTS, status: "completed" },
  { entryNumber: "DREAM-2026-04-01", paidDate: "2026-04-01", paymentNumber: "21FFFESC5Q89", invoiceNumber: "455455-RD-740824", appliedCents: RENT_2026_CENTS, status: "completed" },
  { entryNumber: "DREAM-2026-03-01", paidDate: "2026-03-01", paymentNumber: "97E12HVZUSLN", invoiceNumber: "450942-RD-740824", appliedCents: RENT_2026_CENTS, status: "completed" },
  { entryNumber: "DREAM-2026-02-01", paidDate: "2026-02-01", paymentNumber: "1J1ZRR9FJIYL", invoiceNumber: "446055-RD-740824", appliedCents: RENT_2026_CENTS, status: "completed" },
  { entryNumber: "DREAM-2026-01-01", paidDate: "2026-01-01", paymentNumber: "6NSTEP71333K", invoiceNumber: "443436-RD-740824", appliedCents: RENT_2026_CENTS, status: "completed" },
  { entryNumber: "DREAM-2025-12-01", paidDate: "2025-12-01", paymentNumber: "61DPM4HG1BR1", invoiceNumber: "439991-RD-740824", appliedCents: RENT_2025_CENTS, status: "completed" },
  { entryNumber: "DREAM-2025-11-01", paidDate: "2025-11-01", paymentNumber: "7AXFV11ZQSKP", invoiceNumber: "437275-RD-740824", appliedCents: RENT_2025_CENTS, status: "completed" },
  { entryNumber: "DREAM-2025-10-01", paidDate: "2025-10-01", paymentNumber: "9Q7BEJ8KBGH3", invoiceNumber: "434215-RD-740824", appliedCents: RENT_2025_CENTS, status: "completed" },
  { entryNumber: "DREAM-2025-09-01", paidDate: "2025-09-01", paymentNumber: "9YJX6VVHI9IH", invoiceNumber: "431169-RD-740824", appliedCents: RENT_2025_CENTS, status: "completed" },
  { entryNumber: "DREAM-2025-08-01", paidDate: "2025-08-01", paymentNumber: "2F1UD88E7NT9", invoiceNumber: "427958-RD-740824", appliedCents: RENT_2025_CENTS, status: "completed" },
  { entryNumber: "DREAM-2025-07-01", paidDate: "2025-07-01", paymentNumber: "938Y68WA8AL1", invoiceNumber: "425418-RD-740824", appliedCents: RENT_2025_CENTS, status: "completed" },
  { entryNumber: "DREAM-2025-06-01", paidDate: "2025-06-01", paymentNumber: "2P87375F69F1", invoiceNumber: "422472-RD-740824", appliedCents: RENT_2025_CENTS, status: "completed" },
  { entryNumber: "DREAM-2025-05-01", paidDate: "2025-05-01", paymentNumber: "8K7HGCCS4YSV", invoiceNumber: "418773-RD-740824", appliedCents: RENT_2025_CENTS, status: "completed" },
  { entryNumber: "DREAM-2025-04-01", paidDate: "2025-04-01", paymentNumber: "9S347EQZHHDB", invoiceNumber: "415604-RD-740824", appliedCents: RENT_2025_CENTS, status: "completed" },
  { entryNumber: "DREAM-2025-03-01", paidDate: "2025-03-01", paymentNumber: "2H3H4KJZ7LTS", invoiceNumber: "412397-RD-740824", appliedCents: RENT_2025_CENTS, status: "completed" },
  { entryNumber: "DREAM-2025-02-05", paidDate: "2025-02-05", paymentNumber: "3XV9S2MZC725", invoiceNumber: "409638-RD-740824", appliedCents: RENT_2025_CENTS, status: "completed" },
  { entryNumber: "DREAM-2025-02-05-NSF", paidDate: "2025-02-05", paymentNumber: "9F312Z7LEKD.NSF", invoiceNumber: "409638-RD-740824", appliedCents: -RENT_2025_CENTS, status: "reversal" },
  { entryNumber: "DREAM-2025-02-01", paidDate: "2025-02-01", paymentNumber: "9F312Z7LEKD", invoiceNumber: "409638-RD-740824", appliedCents: RENT_2025_CENTS, status: "completed" },
]

export const DREAM_OPEN_BALANCE_CENTS = 278_259

export function splitGstIncluded(totalCents: number) {
  const sign = totalCents < 0 ? -1 : 1
  const absolute = Math.abs(totalCents)
  const approx = Math.round(absolute / 1.05)
  for (let base = approx - 3; base <= approx + 3; base++) {
    const gst = Math.round(base * 0.05)
    if (base + gst === absolute) return { rentCents: sign * base, gstCents: sign * gst }
  }
  throw new Error(`Payment ${totalCents} does not split into rent plus 5% GST`)
}

export function dreamJournalLines(payment: DreamLeasePayment): DreamJournalLine[] {
  const { rentCents, gstCents } = splitGstIncluded(payment.appliedCents)
  const memo = `Dream lease ${payment.invoiceNumber} (${payment.entryNumber})`
  const rentDebit = Math.max(0, rentCents)
  const rentCredit = Math.max(0, -rentCents)
  const gstDebit = Math.max(0, gstCents)
  const gstCredit = Math.max(0, -gstCents)
  const cashCredit = Math.max(0, payment.appliedCents)
  const cashDebit = Math.max(0, -payment.appliedCents)
  return [
    { accountCode: "6000", accountName: "Rent", debitCents: rentDebit, creditCents: rentCredit, memo },
    {
      accountCode: "1160",
      accountName: "GST Input Tax Credits Receivable",
      debitCents: gstDebit,
      creditCents: gstCredit,
      memo: `GST ITC ${memo}`,
      taxCode: "GST_5_ITC",
    },
    {
      accountCode: "1000",
      accountName: "Operating Cash",
      debitCents: cashDebit,
      creditCents: cashCredit,
      memo: `CIBC (7607) Versapay ${payment.paymentNumber}`,
    },
  ]
}

export function dreamPaymentBalances(payment: DreamLeasePayment) {
  const lines = dreamJournalLines(payment)
  const debit = lines.reduce((sum, line) => sum + line.debitCents, 0)
  const credit = lines.reduce((sum, line) => sum + line.creditCents, 0)
  return debit === credit && debit === Math.abs(payment.appliedCents)
}

export function dreamNetAppliedCents(year?: number) {
  return DREAM_LEASE_PAYMENTS.filter((payment) => (year ? payment.paidDate.startsWith(String(year)) : true)).reduce(
    (sum, payment) => sum + payment.appliedCents,
    0
  )
}
