import { describe, expect, it } from "vitest"
import { TRADINGVIEW_2025, tradingViewBalances, tradingViewJournalLines } from "./tradingview-2025"

describe("TradingView 2025 Premium invoice", () => {
  it("books software, GST ITC, and the shareholder loan from invoice CA00443457", () => {
    expect(TRADINGVIEW_2025.invoiceNumber).toBe("FP-0055")
    expect(TRADINGVIEW_2025.vendorInvoiceNumber).toBe("CA00443457")
    expect(TRADINGVIEW_2025.transactionId).toBe("4EK74602Y25965939")
    expect(TRADINGVIEW_2025.netCents).toBe(34_124)
    expect(TRADINGVIEW_2025.gstCents).toBe(1_706)
    expect(TRADINGVIEW_2025.totalCents).toBe(35_830)
    expect(tradingViewBalances()).toBe(true)
    const lines = tradingViewJournalLines()
    expect(lines).toEqual([
      expect.objectContaining({ accountCode: "6020", debitCents: 34_124 }),
      expect.objectContaining({ accountCode: "1160", debitCents: 1_706, taxCode: "GST_5_ITC" }),
      expect.objectContaining({ accountCode: "2310", creditCents: 35_830 }),
    ])
  })
})
