import { describe, expect, it } from "vitest"
import {
  AMAZON_SHAREHOLDER_INVOICES,
  amazonInvoiceBalances,
  amazonJournalLines,
  netCostCents,
} from "./amazon-shareholder-invoices"

describe("Amazon shareholder invoices", () => {
  it("continues after FP-0046 in invoice-date order", () => {
    expect(AMAZON_SHAREHOLDER_INVOICES.map((invoice) => invoice.invoiceNumber)).toEqual([
      "FP-0047",
      "FP-0048",
      "FP-0049",
      "FP-0050",
      "FP-0051",
      "FP-0052",
      "FP-0053",
      "FP-0054",
    ])
    const dates = AMAZON_SHAREHOLDER_INVOICES.map((invoice) => invoice.invoiceDate)
    expect([...dates].sort()).toEqual(dates)
  })

  it("books net cost, GST input tax credit, and the shareholder loan", () => {
    let paid = 0
    let gst = 0
    let equipment = 0
    let supplies = 0
    for (const invoice of AMAZON_SHAREHOLDER_INVOICES) {
      expect(amazonInvoiceBalances(invoice)).toBe(true)
      expect(Math.abs(netCostCents(invoice) * 5 - invoice.gstCents * 100)).toBeLessThanOrEqual(50)
      paid += invoice.totalCents
      gst += invoice.gstCents
      if (invoice.kind === "equipment") equipment += netCostCents(invoice)
      else supplies += netCostCents(invoice)
      const loan = amazonJournalLines(invoice).find((line) => line.accountCode === "2310")
      expect(loan?.creditCents).toBe(invoice.totalCents)
    }
    expect(paid).toBe(84_283)
    expect(gst).toBe(4_014)
    expect(equipment).toBe(62_157)
    expect(supplies).toBe(18_112)
  })
})
