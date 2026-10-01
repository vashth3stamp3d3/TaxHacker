import { describe, expect, it } from "vitest"
import { ALIBABA_SHAREHOLDER_INVOICES } from "./alibaba-shareholder-invoices"
import { AMAZON_SHAREHOLDER_INVOICES } from "./amazon-shareholder-invoices"
import { DREAM_LEASE_PAYMENTS } from "./dream-lease-payments"
import { ENMAX_2025_BILLS } from "./enmax-2025-utilities"
import { MACBOOK_2025 } from "./macbook-2025"
import { jerrold2025Journals } from "./jerrold-2025-income"
import { neoMonthlyJournals } from "./neo-2025-claims"
import { SHOP_BOOK_BATCHES_2025, SHOP_BOOK_ENTRY_COUNT_2025 } from "./post-2025-shop-books"
import { TRADINGVIEW_2025 } from "./tradingview-2025"

describe("2025 shop book batches", () => {
  it("covers Alibaba, Amazon, Dream, ENMAX, Shopify, TradingView, Mac, Neo, Jerrold T4, and 2025 CCA in one production seed", () => {
    expect(SHOP_BOOK_BATCHES_2025.map((batch) => batch.id)).toEqual([
      "alibaba",
      "amazon",
      "dream",
      "enmax",
      "shopify",
      "tradingview",
      "macbook",
      "neo",
      "jerrold",
      "cca",
    ])
    expect(ALIBABA_SHAREHOLDER_INVOICES).toHaveLength(10)
    expect(AMAZON_SHAREHOLDER_INVOICES).toHaveLength(8)
    expect(DREAM_LEASE_PAYMENTS).toHaveLength(23)
    expect(ENMAX_2025_BILLS).toHaveLength(12)
    expect(TRADINGVIEW_2025.invoiceNumber).toBe("FP-0055")
    expect(MACBOOK_2025.invoiceNumber).toBe("FP-0056")
    expect(neoMonthlyJournals()).toHaveLength(12)
    expect(jerrold2025Journals()).toHaveLength(2)
    expect(SHOP_BOOK_ENTRY_COUNT_2025).toBe(71)
  })
})
