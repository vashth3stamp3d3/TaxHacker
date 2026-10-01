import { describe, expect, it } from "vitest"
import {
  ALIBABA_SHAREHOLDER_INVOICES,
  EXPENSE_ACCOUNTS,
  goodsSubtotalCents,
  journalBalances,
  presentationLines,
  settlementRoundingCents,
  shareholderJournalLines,
  usdToCadCents,
} from "./alibaba-shareholder-invoices"

describe("Alibaba shareholder reimbursement invoices", () => {
  it("continues the FP-0036 series in payment-date order", () => {
    expect(ALIBABA_SHAREHOLDER_INVOICES.map((invoice) => invoice.invoiceNumber)).toEqual([
      "FP-0037",
      "FP-0038",
      "FP-0039",
      "FP-0040",
      "FP-0041",
      "FP-0042",
      "FP-0043",
      "FP-0044",
      "FP-0045",
      "FP-0046",
    ])
    const dates = ALIBABA_SHAREHOLDER_INVOICES.map((invoice) => invoice.paidDate)
    expect([...dates].sort()).toEqual(dates)
  })

  it("books each receipt to labeled expense accounts and the shareholder loan", () => {
    for (const invoice of ALIBABA_SHAREHOLDER_INVOICES) {
      expect(journalBalances(invoice)).toBe(true)
      const lines = shareholderJournalLines(invoice)
      expect(lines.some((line) => line.accountCode === "2310" && line.creditCents === invoice.amountPaidCents)).toBe(true)
      expect(lines.some((line) => line.accountCode === "1160")).toBe(false)
      expect(lines.some((line) => line.memo.includes("GST"))).toBe(false)
      for (const line of presentationLines(invoice)) {
        expect(["5010", "5040", "5100", "6070"]).toContain(line.accountCode)
      }
    }
  })

  it("labels ink, film, freight, and card fees on separate accounts", () => {
    const first = ALIBABA_SHAREHOLDER_INVOICES[0]
    const codes = new Set(presentationLines(first).map((line) => line.accountCode))
    expect(codes).toEqual(
      new Set([
        EXPENSE_ACCOUNTS.ink.code,
        EXPENSE_ACCOUNTS.supplies.code,
        EXPENSE_ACCOUNTS.shipping.code,
        EXPENSE_ACCOUNTS.processing_fee.code,
      ])
    )
    const cartons = ALIBABA_SHAREHOLDER_INVOICES.find((invoice) => invoice.invoiceNumber === "FP-0044")!
    expect(cartons.shippingCents).toBe(0)
    expect(presentationLines(cartons).some((line) => line.accountCode === "5040")).toBe(false)
    expect(presentationLines(cartons).some((line) => line.accountCode === "5100")).toBe(true)
  })

  it("uses the Alibaba CAD amount paid, with USD conversion inside two cents", () => {
    let total = 0
    for (const invoice of ALIBABA_SHAREHOLDER_INVOICES) {
      total += invoice.amountPaidCents
      const converted = usdToCadCents(invoice.usdPaidCents, invoice.fxRate)
      expect(Math.abs(converted - invoice.amountPaidCents)).toBeLessThanOrEqual(2)
      expect(Math.abs(invoice.orderTotalCents + invoice.processingFeeCents - invoice.amountPaidCents)).toBeLessThanOrEqual(1)
      expect(Math.abs(settlementRoundingCents(invoice))).toBeLessThanOrEqual(6)
      expect(goodsSubtotalCents(invoice)).toBeGreaterThan(0)
    }
    expect(total).toBe(1_438_588)
  })
})
