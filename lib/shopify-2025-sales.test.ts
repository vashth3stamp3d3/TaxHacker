import { describe, expect, it } from "vitest"
import {
  SHOPIFY_2025_SALES,
  shopify2025Balances,
  shopify2025JournalLines,
  shopify2025OperatingRevenueCents,
} from "./shopify-2025-sales"

describe("Shopify 2025 sales", () => {
  it("foots the Analytics total-sales breakdown", () => {
    const sales = SHOPIFY_2025_SALES
    expect(sales.grossSalesCents - sales.discountsCents - sales.salesReversalsCents).toBe(sales.netSalesCents)
    expect(sales.netSalesCents + sales.shippingChargesCents + sales.returnFeesCents + sales.taxesCents).toBe(
      sales.totalSalesCents
    )
  })

  it("books revenue, shipping, discounts, reversals, and GST as a balanced entry", () => {
    const totals = shopify2025Balances()
    expect(totals.balanced).toBe(true)
    expect(totals.revenue).toBe(shopify2025OperatingRevenueCents())
    expect(totals.revenue).toBe(13_968_702)

    const gst = shopify2025JournalLines().find((line) => line.accountCode === "2100")
    expect(gst?.creditCents).toBe(SHOPIFY_2025_SALES.taxesCents)
    expect(gst?.taxCode).toBe("GST_5_COLLECTED")
    expect(totals.revenue).not.toBe(SHOPIFY_2025_SALES.totalSalesCents)
  })

  it("keeps a flat 5% GST check as a note, not a plug", () => {
    const base = SHOPIFY_2025_SALES.netSalesCents + SHOPIFY_2025_SALES.shippingChargesCents
    const flatFivePercent = Math.round(base * 0.05)
    expect(flatFivePercent - SHOPIFY_2025_SALES.taxesCents).toBe(104)
  })
})
