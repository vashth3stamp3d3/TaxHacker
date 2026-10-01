/**
 * Shopify Analytics for Formulated Prints, 1 Jan 2025–31 Dec 2025, CAD.
 * Source: Shopify admin total-sales breakdown (compared on screen to 2024; only 2025 is booked).
 *
 * Net income uses net sales plus shipping. GST is a liability, not income.
 * Discounts and sales reversals reduce print sales. The debit sits in
 * Undeposited Funds because this export is not a bank payout report.
 */

export const SHOPIFY_2025_SOURCE = "shopify-analytics-2025"
export const SHOPIFY_2025_ENTRY = "SHOP-2025"
export const SHOPIFY_2025_POSTED_AT = new Date(Date.UTC(2025, 11, 31, 12, 0, 0))

export const SHOPIFY_2025_SALES = {
  currency: "CAD",
  periodStart: "2025-01-01",
  periodEnd: "2025-12-31",
  grossSalesCents: 13_921_828,
  discountsCents: 285_893,
  salesReversalsCents: 108_451,
  netSalesCents: 13_527_484,
  shippingChargesCents: 441_218,
  returnFeesCents: 0,
  taxesCents: 698_331,
  totalSalesCents: 14_667_033,
  orders: 2_442,
  ordersFulfilled: 1_989,
  reportedAverageOrderValueCents: 5_583,
  sessions: 17_466,
  conversionRateBasisPoints: 1_322,
  returningCustomerRateBasisPoints: 6_273,
} as const

export type ShopifyJournalLine = {
  accountCode: string
  accountName: string
  debitCents: number
  creditCents: number
  memo: string
  taxCode?: string
}

export function shopify2025JournalLines(): ShopifyJournalLine[] {
  const sales = SHOPIFY_2025_SALES
  return [
    {
      accountCode: "1020",
      accountName: "Undeposited Funds",
      debitCents: sales.totalSalesCents,
      creditCents: 0,
      memo: "Shopify 2025 total sales, pending payout match",
    },
    {
      accountCode: "4000",
      accountName: "Print Sales",
      debitCents: 0,
      creditCents: sales.grossSalesCents,
      memo: "Shopify 2025 gross sales",
    },
    {
      accountCode: "4900",
      accountName: "Discounts and Returns",
      debitCents: sales.discountsCents,
      creditCents: 0,
      memo: "Shopify 2025 discounts",
    },
    {
      accountCode: "4900",
      accountName: "Discounts and Returns",
      debitCents: sales.salesReversalsCents,
      creditCents: 0,
      memo: "Shopify 2025 sales reversals",
    },
    {
      accountCode: "4300",
      accountName: "Shipping Income",
      debitCents: 0,
      creditCents: sales.shippingChargesCents,
      memo: "Shopify 2025 shipping charges",
    },
    {
      accountCode: "2100",
      accountName: "GST Collected Payable",
      debitCents: 0,
      creditCents: sales.taxesCents,
      memo: "Shopify 2025 taxes collected",
      taxCode: "GST_5_COLLECTED",
    },
  ]
}

export function shopify2025OperatingRevenueCents() {
  const sales = SHOPIFY_2025_SALES
  return sales.netSalesCents + sales.shippingChargesCents + sales.returnFeesCents
}

export function shopify2025Balances() {
  const lines = shopify2025JournalLines()
  const debit = lines.reduce((sum, line) => sum + line.debitCents, 0)
  const credit = lines.reduce((sum, line) => sum + line.creditCents, 0)
  const revenue = lines
    .filter((line) => line.accountCode === "4000" || line.accountCode === "4300" || line.accountCode === "4900")
    .reduce((sum, line) => sum + line.creditCents - line.debitCents, 0)
  return {
    debit,
    credit,
    balanced: debit === credit && debit === SHOPIFY_2025_SALES.totalSalesCents + SHOPIFY_2025_SALES.discountsCents + SHOPIFY_2025_SALES.salesReversalsCents,
    revenue,
  }
}
