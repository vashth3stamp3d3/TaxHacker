/**
 * 2025 Alibaba purchases Jerrold Jacobe paid personally and invoiced to
 * Formulated Prints Inc. as shareholder-loan reimbursements.
 *
 * These continue the FP-0036 series. Amounts are the CAD figures printed on
 * the Alibaba receipts (contract currency is USD). No Canadian GST was
 * charged, and the receipts say they are not tax invoices, so GST is zero
 * and there is no input tax credit on these documents.
 */

export const ALIBABA_SHAREHOLDER_SOURCE = "alibaba-shareholder-2025"
export const SHAREHOLDER_LOAN_ACCOUNT = "2310"

export const EXPENSE_ACCOUNTS = {
  ink: { code: "5010", name: "Ink and Toner Cost" },
  supplies: { code: "5100", name: "Supplies Expense" },
  shipping: { code: "5040", name: "Shipping Cost" },
  processing_fee: { code: "6070", name: "Bank Fees" },
} as const

export type ExpenseKind = keyof typeof EXPENSE_ACCOUNTS

export type AlibabaGoodsLine = {
  description: string
  quantity: number
  unitPriceCents: number
  totalCents: number
  kind: Exclude<ExpenseKind, "shipping" | "processing_fee">
}

export type AlibabaShareholderInvoice = {
  invoiceNumber: string
  orderNumber: string
  seller: string
  orderDate: string
  paidDate: string
  paymentDetail: string
  usdPaidCents: number
  /** CAD per 1 USD, as printed on the Alibaba receipt. */
  fxRate: string
  orderTotalCents: number
  shippingCents: number
  processingFeeCents: number
  amountPaidCents: number
  /** Figure on the "Paid on" line when Alibaba prints it one cent under amount paid. */
  settledPrintCents?: number
  label: string
  lines: AlibabaGoodsLine[]
}

export type InvoicePresentationLine = {
  description: string
  quantity: number | null
  unitPriceCents: number | null
  totalCents: number
  accountCode: string
  accountName: string
}

export type ShareholderJournalLine = {
  accountCode: string
  accountName: string
  debitCents: number
  creditCents: number
  memo: string
}

export const ALIBABA_SHAREHOLDER_INVOICES: AlibabaShareholderInvoice[] = [
  {
    invoiceNumber: "FP-0037",
    orderNumber: "256952166501026578",
    seller: "Guangzhou Douyin Special Equipment Co., Ltd.",
    orderDate: "2025-05-08",
    paidDate: "2025-05-09",
    paymentDetail: "Personal credit/debit card ending in 4531",
    usdPaidCents: 337_396,
    fxRate: "1.407334",
    orderTotalCents: 461_043,
    shippingCents: 56_294,
    processingFeeCents: 13_787,
    amountPaidCents: 474_829,
    label: "Supplies purchase — DTF film, ink, UV film, and ink shaker",
    lines: [
      {
        description: "DTF PET transfer film, 60 cm roll",
        quantity: 40,
        unitPriceCents: 5_067,
        totalCents: 202_657,
        kind: "supplies",
      },
      {
        description: "DTF water-based pigment ink, 1000 ml",
        quantity: 42,
        unitPriceCents: 2_534,
        totalCents: 106_395,
        kind: "ink",
      },
      {
        description: "Hot-peel DTF transfer film, 60 cm, 75u",
        quantity: 2,
        unitPriceCents: 4_645,
        totalCents: 9_289,
        kind: "supplies",
      },
      {
        description: "UV DTF AB transfer film, 60 cm",
        quantity: 2,
        unitPriceCents: 16_607,
        totalCents: 33_214,
        kind: "supplies",
      },
      {
        description: "UV pigment ink, 1 litre",
        quantity: 14,
        unitPriceCents: 2_534,
        totalCents: 35_465,
        kind: "ink",
      },
      {
        description: "Print-head moisturizing liquid",
        quantity: 3,
        unitPriceCents: 1_689,
        totalCents: 5_067,
        kind: "supplies",
      },
      {
        description: "DTF white-ink shaker (shop supply, expensed)",
        quantity: 1,
        unitPriceCents: 12_667,
        totalCents: 12_667,
        kind: "supplies",
      },
    ],
  },
  {
    invoiceNumber: "FP-0038",
    orderNumber: "258005251001026578",
    seller: "Guangzhou Douyin Special Equipment Co., Ltd.",
    orderDate: "2025-05-14",
    paidDate: "2025-05-14",
    paymentDetail: "Personal PayPal",
    usdPaidCents: 11_844,
    fxRate: "1.407536",
    orderTotalCents: 16_187,
    shippingCents: 14_076,
    processingFeeCents: 485,
    amountPaidCents: 16_671,
    label: "Supplies purchase — hot-peel DTF film",
    lines: [
      {
        description: "Hot-peel DTF transfer film, 60 cm, 75u",
        quantity: 1,
        unitPriceCents: 2_112,
        totalCents: 2_112,
        kind: "supplies",
      },
    ],
  },
  {
    invoiceNumber: "FP-0039",
    orderNumber: "258604862501026578",
    seller: "Guangzhou Douyin Special Equipment Co., Ltd.",
    orderDate: "2025-05-15",
    paidDate: "2025-05-23",
    paymentDetail: "Personal credit/debit card ending in 4531",
    usdPaidCents: 153_456,
    fxRate: "1.397436",
    orderTotalCents: 208_218,
    shippingCents: 92_511,
    processingFeeCents: 6_227,
    amountPaidCents: 214_445,
    settledPrintCents: 214_444,
    label: "Supplies purchase — DTF ink, film, and print-head parts",
    lines: [
      {
        description: "DTF water-based pigment ink, 1000 ml",
        quantity: 12,
        unitPriceCents: 2_516,
        totalCents: 30_185,
        kind: "ink",
      },
      {
        description: "DTF PET transfer film, 60 cm roll",
        quantity: 4,
        unitPriceCents: 5_031,
        totalCents: 20_124,
        kind: "supplies",
      },
      {
        description: "DTF white ink, water-based pigment",
        quantity: 20,
        unitPriceCents: 2_516,
        totalCents: 50_308,
        kind: "ink",
      },
      {
        description: "Ink capping, dampers, and wipers",
        quantity: 2,
        unitPriceCents: 7_547,
        totalCents: 15_093,
        kind: "supplies",
      },
    ],
  },
  {
    invoiceNumber: "FP-0040",
    orderNumber: "258707350501026578",
    seller: "Henan Zunsun Machinery Co., Ltd.",
    orderDate: "2025-05-16",
    paidDate: "2025-05-24",
    paymentDetail: "Personal credit/debit card ending in 4531",
    usdPaidCents: 28_735,
    fxRate: "1.397436",
    orderTotalCents: 38_989,
    shippingCents: 29_207,
    processingFeeCents: 1_167,
    amountPaidCents: 40_156,
    settledPrintCents: 40_154,
    label: "Supplies purchase — UV DTF AB film",
    lines: [
      {
        description: "UV DTF AB transfer film, 43 cm x 100 m",
        quantity: 1,
        unitPriceCents: 9_783,
        totalCents: 9_783,
        kind: "supplies",
      },
    ],
  },
  {
    invoiceNumber: "FP-0041",
    orderNumber: "265519946001026578",
    seller: "Guangzhou Douyin Special Equipment Co., Ltd.",
    orderDate: "2025-06-09",
    paidDate: "2025-06-10",
    paymentDetail: "Personal PayPal",
    usdPaidCents: 72_609,
    fxRate: "1.384912",
    orderTotalCents: 97_637,
    shippingCents: 57_751,
    processingFeeCents: 2_921,
    amountPaidCents: 100_558,
    settledPrintCents: 100_556,
    label: "Supplies purchase — hot-peel DTF film",
    lines: [
      {
        description: "Hot-peel DTF transfer film, 60 cm, 75u",
        quantity: 8,
        unitPriceCents: 4_986,
        totalCents: 39_886,
        kind: "supplies",
      },
    ],
  },
  {
    invoiceNumber: "FP-0042",
    orderNumber: "265554427001026578",
    seller: "Dongguan Cowint New Material Technology Co., Ltd.",
    orderDate: "2025-06-11",
    paidDate: "2025-06-12",
    paymentDetail: "Personal Klarna",
    usdPaidCents: 113_908,
    fxRate: "1.376529",
    orderTotalCents: 152_245,
    shippingCents: 49_005,
    processingFeeCents: 4_554,
    amountPaidCents: 156_798,
    settledPrintCents: 156_797,
    label: "Supplies purchase — hot melt powder",
    lines: [
      {
        description: "Cowint P1 hot melt powder",
        quantity: 75,
        unitPriceCents: 1_377,
        totalCents: 103_240,
        kind: "supplies",
      },
    ],
  },
  {
    invoiceNumber: "FP-0043",
    orderNumber: "268129999001026578",
    seller: "Dongguan Cowint New Material Technology Co., Ltd.",
    orderDate: "2025-07-04",
    paidDate: "2025-07-04",
    paymentDetail: "Personal PayPal",
    usdPaidCents: 34_812,
    fxRate: "1.371479",
    orderTotalCents: 46_356,
    shippingCents: 25_784,
    processingFeeCents: 1_388,
    amountPaidCents: 47_744,
    settledPrintCents: 47_743,
    label: "Supplies purchase — hot melt powder",
    lines: [
      {
        description: "Cowint P1 hot melt powder",
        quantity: 15,
        unitPriceCents: 1_372,
        totalCents: 20_573,
        kind: "supplies",
      },
    ],
  },
  {
    invoiceNumber: "FP-0044",
    orderNumber: "268743810501026578",
    seller: "Chongqing Ka-Ka Packaging Co., Ltd.",
    orderDate: "2025-07-08",
    paidDate: "2025-07-08",
    paymentDetail: "Personal Klarna",
    usdPaidCents: 50_466,
    fxRate: "1.381074",
    orderTotalCents: 67_673,
    shippingCents: 0,
    processingFeeCents: 2_025,
    amountPaidCents: 69_698,
    settledPrintCents: 69_697,
    label: "Supplies purchase — corrugated shipping cartons",
    lines: [
      {
        description: "6 x 6 x 25 in C-flute corrugated shipping cartons",
        quantity: 500,
        unitPriceCents: 136,
        totalCents: 67_673,
        kind: "supplies",
      },
    ],
  },
  {
    invoiceNumber: "FP-0045",
    orderNumber: "273811878501026578",
    seller: "Henan Zunsun Machinery Co., Ltd.",
    orderDate: "2025-08-22",
    paidDate: "2025-08-22",
    paymentDetail: "Personal Klarna",
    usdPaidCents: 97_017,
    fxRate: "1.405213",
    orderTotalCents: 132_372,
    shippingCents: 77_287,
    processingFeeCents: 3_959,
    amountPaidCents: 136_330,
    settledPrintCents: 136_329,
    label: "Supplies purchase — UV DTF film and UV ink",
    lines: [
      {
        description: "UV DTF AB transfer film, 43 cm x 100 m",
        quantity: 2,
        unitPriceCents: 9_837,
        totalCents: 19_673,
        kind: "supplies",
      },
      {
        description: "UV curable pigment ink for Epson UV DTF",
        quantity: 4,
        unitPriceCents: 3_373,
        totalCents: 13_491,
        kind: "ink",
      },
      {
        description: "UV curable pigment ink for Epson UV DTF",
        quantity: 6,
        unitPriceCents: 3_654,
        totalCents: 21_922,
        kind: "ink",
      },
    ],
  },
  {
    invoiceNumber: "FP-0046",
    orderNumber: "278635902501026578",
    seller: "Guangzhou Douyin Special Equipment Co., Ltd.",
    orderDate: "2025-10-08",
    paidDate: "2025-10-19",
    paymentDetail: "Personal Klarna",
    usdPaidCents: 127_812,
    fxRate: "1.418949",
    orderTotalCents: 176_092,
    shippingCents: 60_306,
    processingFeeCents: 5_268,
    amountPaidCents: 181_359,
    settledPrintCents: 181_358,
    label: "Supplies purchase — DTF film, ink, and print-head cleaner",
    lines: [
      {
        description: "Hot-peel DTF transfer film, 60 cm, 75u",
        quantity: 10,
        unitPriceCents: 5_109,
        totalCents: 51_083,
        kind: "supplies",
      },
      {
        description: "DTF pigment ink, 1 L, for Epson and XP600 heads",
        quantity: 24,
        unitPriceCents: 2_555,
        totalCents: 61_299,
        kind: "ink",
      },
      {
        description: "DTF print-head cleaning solution, 1000 ml",
        quantity: 2,
        unitPriceCents: 1_703,
        totalCents: 3_406,
        kind: "supplies",
      },
    ],
  },
]

export function cadPerUsd(rate: string): number {
  const [whole, fraction = ""] = rate.split(".")
  const scale = 10 ** fraction.length
  return (Number(whole) * scale + Number(fraction.padEnd(fraction.length, "0"))) / scale
}

export function usdToCadCents(usdCents: number, rate: string): number {
  const [whole, fraction = ""] = rate.split(".")
  const scale = 10 ** fraction.length
  const rateScaled = Number(whole) * scale + Number(fraction)
  return Math.round((usdCents * rateScaled) / scale)
}

export function goodsSubtotalCents(invoice: AlibabaShareholderInvoice): number {
  return invoice.lines.reduce((sum, line) => sum + line.totalCents, 0)
}

/** Alibaba's printed CAD parts often miss the amount-paid total by one or two cents. */
export function settlementRoundingCents(invoice: AlibabaShareholderInvoice): number {
  return invoice.amountPaidCents - (goodsSubtotalCents(invoice) + invoice.shippingCents + invoice.processingFeeCents)
}

export function presentationLines(invoice: AlibabaShareholderInvoice): InvoicePresentationLine[] {
  const lines: InvoicePresentationLine[] = invoice.lines.map((line) => {
    const account = EXPENSE_ACCOUNTS[line.kind]
    return {
      description: line.description,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      totalCents: line.totalCents,
      accountCode: account.code,
      accountName: account.name,
    }
  })

  if (invoice.shippingCents > 0) {
    lines.push({
      description: "Alibaba shipping",
      quantity: null,
      unitPriceCents: null,
      totalCents: invoice.shippingCents,
      accountCode: EXPENSE_ACCOUNTS.shipping.code,
      accountName: EXPENSE_ACCOUNTS.shipping.name,
    })
  }

  lines.push({
    description: "Alibaba payment processing fee",
    quantity: null,
    unitPriceCents: null,
    totalCents: invoice.processingFeeCents,
    accountCode: EXPENSE_ACCOUNTS.processing_fee.code,
    accountName: EXPENSE_ACCOUNTS.processing_fee.name,
  })

  const rounding = settlementRoundingCents(invoice)
  if (rounding !== 0) {
    lines.push({
      description: "CAD settlement rounding to Alibaba amount paid",
      quantity: null,
      unitPriceCents: null,
      totalCents: rounding,
      accountCode: EXPENSE_ACCOUNTS.processing_fee.code,
      accountName: EXPENSE_ACCOUNTS.processing_fee.name,
    })
  }

  return lines
}

export function shareholderJournalLines(invoice: AlibabaShareholderInvoice): ShareholderJournalLine[] {
  const debits = presentationLines(invoice)
    .filter((line) => line.totalCents !== 0)
    .map((line) => {
      const cents = line.totalCents
      return {
        accountCode: line.accountCode,
        accountName: line.accountName,
        debitCents: cents > 0 ? cents : 0,
        creditCents: cents < 0 ? -cents : 0,
        memo: `${line.description} (${invoice.invoiceNumber})`,
      }
    })

  return [
    ...debits,
    {
      accountCode: SHAREHOLDER_LOAN_ACCOUNT,
      accountName: "Shareholder Loan - Jerrold",
      debitCents: 0,
      creditCents: invoice.amountPaidCents,
      memo: `Reimbursement to Jerrold Jacobe (${invoice.invoiceNumber})`,
    },
  ]
}

export function journalBalances(invoice: AlibabaShareholderInvoice): boolean {
  const lines = shareholderJournalLines(invoice)
  const debit = lines.reduce((sum, line) => sum + line.debitCents, 0)
  const credit = lines.reduce((sum, line) => sum + line.creditCents, 0)
  const shareholderCredit = lines
    .filter((line) => line.accountCode === SHAREHOLDER_LOAN_ACCOUNT)
    .reduce((sum, line) => sum + line.creditCents, 0)
  const netExpense = lines
    .filter((line) => line.accountCode !== SHAREHOLDER_LOAN_ACCOUNT)
    .reduce((sum, line) => sum + line.debitCents - line.creditCents, 0)
  return debit === credit && shareholderCredit === invoice.amountPaidCents && netExpense === invoice.amountPaidCents
}

export function formatCad(cents: number): string {
  const sign = cents < 0 ? "-" : ""
  const absolute = Math.abs(cents)
  return `${sign}$${(absolute / 100).toFixed(2)}`
}
