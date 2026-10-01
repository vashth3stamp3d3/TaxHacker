/**
 * 2025 Amazon.ca invoices billed to Jerrold Jacobe and paid personally.
 * They continue the shareholder-loan series after the Alibaba set (FP-0037–FP-0046).
 *
 * GST shown on the invoice is an input tax credit. The shareholder loan is the
 * total paid, including GST. Discounts reduce the cost before GST.
 */

export const AMAZON_SHAREHOLDER_SOURCE = "amazon-shareholder-2025"
export const SHAREHOLDER_LOAN_ACCOUNT = "2310"
export const GST_ITC_ACCOUNT = "1160"

export type AmazonExpenseKind = "equipment" | "supplies"

export const AMAZON_EXPENSE_ACCOUNTS = {
  equipment: { code: "1600", name: "Equipment" },
  supplies: { code: "5100", name: "Supplies Expense" },
} as const

export type AmazonShareholderInvoice = {
  invoiceNumber: string
  amazonInvoiceNumber: string
  orderNumber: string
  seller: string
  gstRegistrant: string
  invoiceDate: string
  description: string
  kind: AmazonExpenseKind
  listPriceCents: number
  discountCents: number
  gstCents: number
  totalCents: number
  delivery: string
}

export type AmazonJournalLine = {
  accountCode: string
  accountName: string
  debitCents: number
  creditCents: number
  memo: string
  taxCode?: string
}

export const AMAZON_SHAREHOLDER_INVOICES: AmazonShareholderInvoice[] = [
  {
    invoiceNumber: "FP-0047",
    amazonInvoiceNumber: "CA5245H9DIWI",
    orderNumber: "701-6880339-0756243",
    seller: "Shenzhen Bawtron Technology Co., Ltd.",
    gstRegistrant: "Amazon.com.ca ULC 857305932RT0001",
    invoiceDate: "2025-06-04",
    description: "Lumix DMW-BLC12 batteries and dual charger",
    kind: "supplies",
    listPriceCents: 3_599,
    discountCents: 360,
    gstCents: 162,
    totalCents: 3_401,
    delivery: "284 Carrington Way NW, Calgary",
  },
  {
    invoiceNumber: "FP-0048",
    amazonInvoiceNumber: "CA51X8SKAACCUI",
    orderNumber: "701-6053922-1946622",
    seller: "Amazon.com.ca ULC",
    gstRegistrant: "Amazon.com.ca ULC 857305932RT0001",
    invoiceDate: "2025-07-10",
    description: "Eva-dry E-333 renewable dehumidifier",
    kind: "supplies",
    listPriceCents: 4_031,
    discountCents: 0,
    gstCents: 202,
    totalCents: 4_233,
    delivery: "284 Carrington Way NW, Calgary",
  },
  {
    invoiceNumber: "FP-0049",
    amazonInvoiceNumber: "CA52DD68JJISI",
    orderNumber: "702-2194999-6661848",
    seller: "VIVOSUN INC",
    gstRegistrant: "Amazon.com.ca ULC 857305932RT0001",
    invoiceDate: "2025-07-18",
    description: "VIVOSUN 6 inch inline duct fan, 240 CFM",
    kind: "equipment",
    listPriceCents: 4_299,
    discountCents: 0,
    gstCents: 215,
    totalCents: 4_514,
    delivery: "284 Carrington Way NW, Calgary",
  },
  {
    invoiceNumber: "FP-0050",
    amazonInvoiceNumber: "CA52EWN8JJISI",
    orderNumber: "701-1859194-0565063",
    seller: "VIVOSUN INC",
    gstRegistrant: "Amazon.com.ca ULC 857305932RT0001",
    invoiceDate: "2025-07-24",
    description: "VIVOSUN Z6 6 inch inline duct fan, 440 CFM",
    kind: "equipment",
    listPriceCents: 10_999,
    discountCents: 0,
    gstCents: 550,
    totalCents: 11_549,
    delivery: "284 Carrington Way NW, Calgary",
  },
  {
    invoiceNumber: "FP-0051",
    amazonInvoiceNumber: "CA59BVOX4AI",
    orderNumber: "702-5254689-1568211",
    seller: "EIONO INDUSTRIES CORP.",
    gstRegistrant: "EIONO INDUSTRIES CORP. 759599806RT0001",
    invoiceDate: "2025-09-09",
    description: "EIONO 4x6 direct thermal shipping labels, 500",
    kind: "supplies",
    listPriceCents: 1_795,
    discountCents: 0,
    gstCents: 90,
    totalCents: 1_885,
    delivery: "284 Carrington Way NW, Calgary",
  },
  {
    invoiceNumber: "FP-0052",
    amazonInvoiceNumber: "CA52XY4KQACCUI",
    orderNumber: "702-5606482-7729857",
    seller: "Amazon.com.ca ULC",
    gstRegistrant: "Amazon.com.ca ULC 857305932RT0001",
    invoiceDate: "2025-10-13",
    description: "Filtrete 18x18x1 furnace air filters, 6-pack",
    kind: "supplies",
    listPriceCents: 9_047,
    discountCents: 0,
    gstCents: 452,
    totalCents: 9_499,
    delivery: "284 Carrington Way NW, Calgary",
  },
  {
    invoiceNumber: "FP-0053",
    amazonInvoiceNumber: "CA5AABBW6XEI",
    orderNumber: "701-1227824-1401051",
    seller: "Hangzhou Weiying Zhineng Keji Youxian Gongsi",
    gstRegistrant: "Hangzhou Weiying Zhineng Keji Youxian Gongsi 744693300RT0001",
    invoiceDate: "2025-12-11",
    description: "HIKMICRO Mini2 V2 thermal camera",
    kind: "equipment",
    listPriceCents: 31_400,
    discountCents: 3_140,
    gstCents: 1_413,
    totalCents: 29_673,
    delivery: "284 Carrington Way NW, Calgary",
  },
  {
    invoiceNumber: "FP-0054",
    amazonInvoiceNumber: "CA5BPNX0LEYI",
    orderNumber: "702-5838326-7555437",
    seller: "dongguanshiaoyunkejiyouxiangongsi",
    gstRegistrant: "Amazon.com.ca ULC 857305932RT0001",
    invoiceDate: "2025-12-18",
    description: "Hon&Guan 8 inch inline duct fan, 760 CFM",
    kind: "equipment",
    listPriceCents: 18_599,
    discountCents: 0,
    gstCents: 930,
    totalCents: 19_529,
    delivery: "Formulated Prints, 4558 14 Street NE, Calgary",
  },
]

export function netCostCents(invoice: AmazonShareholderInvoice) {
  return invoice.listPriceCents - invoice.discountCents
}

export function amazonJournalLines(invoice: AmazonShareholderInvoice): AmazonJournalLine[] {
  const account = AMAZON_EXPENSE_ACCOUNTS[invoice.kind]
  const net = netCostCents(invoice)
  return [
    {
      accountCode: account.code,
      accountName: account.name,
      debitCents: net,
      creditCents: 0,
      memo: `${invoice.description} (${invoice.invoiceNumber})`,
    },
    {
      accountCode: GST_ITC_ACCOUNT,
      accountName: "GST Input Tax Credits Receivable",
      debitCents: invoice.gstCents,
      creditCents: 0,
      memo: `GST ITC ${invoice.amazonInvoiceNumber} (${invoice.invoiceNumber})`,
      taxCode: "GST_5_ITC",
    },
    {
      accountCode: SHAREHOLDER_LOAN_ACCOUNT,
      accountName: "Shareholder Loan - Jerrold",
      debitCents: 0,
      creditCents: invoice.totalCents,
      memo: `Reimbursement to Jerrold Jacobe (${invoice.invoiceNumber})`,
    },
  ]
}

export function amazonInvoiceBalances(invoice: AmazonShareholderInvoice) {
  const lines = amazonJournalLines(invoice)
  const debit = lines.reduce((sum, line) => sum + line.debitCents, 0)
  const credit = lines.reduce((sum, line) => sum + line.creditCents, 0)
  return debit === credit && credit === invoice.totalCents && netCostCents(invoice) + invoice.gstCents === invoice.totalCents
}
