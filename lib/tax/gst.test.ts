import { describe, expect, it } from "vitest"
import {
  cogsAccountCodeForType,
  customerInvoiceJournal,
  destinationPostsToLedger,
  gstRemittanceAmounts,
  gstRemittanceJournal,
  gstRemittancePosting,
  inventoryAccountCodeForType,
  inventoryReceiveJournal,
  journalLinesAreBalanced,
  suggestedDestination,
  sumDocumentLines,
  taxCents,
  taxableTotals,
  vendorBillJournal,
  weightedAverageCost,
} from "./gst"

describe("GST math", () => {
  it("computes 5% GST in cents without floating residue", () => {
    expect(taxCents(10000, 500)).toBe(500)
    expect(taxCents(1999, 500)).toBe(100)
    expect(taxableTotals(10000, 500)).toEqual({ subtotal: 10000, taxTotal: 500, total: 10500 })
    expect(taxableTotals(10000, 500, true)).toEqual({ subtotal: 10000, taxTotal: 0, total: 10000 })
  })

  it("builds remittance posting that stays in balance", () => {
    const amounts = gstRemittanceAmounts(10500, 2100)
    expect(amounts.netTax).toBe(8400)
    const posting = gstRemittancePosting(amounts)
    expect(posting.debitCollected + posting.netRefund).toBe(posting.creditItc + posting.netToPayable)
  })

  it("refunds when ITCs exceed collected GST", () => {
    const posting = gstRemittancePosting(gstRemittanceAmounts(1000, 2500))
    expect(posting.netToPayable).toBe(0)
    expect(posting.netRefund).toBe(1500)
    expect(posting.debitCollected + posting.netRefund).toBe(posting.creditItc + posting.netToPayable)
  })

  it("sums document lines with GST", () => {
    expect(sumDocumentLines([{ quantity: 2, unitPrice: 5000 }, { quantity: 1, unitPrice: 1000 }], 500)).toEqual({
      subtotal: 11000,
      taxTotal: 550,
      total: 11550,
    })
  })

  it("maps print-shop item types to inventory and COGS accounts", () => {
    expect(inventoryAccountCodeForType("ink")).toBe("1210")
    expect(inventoryAccountCodeForType("paper")).toBe("1200")
    expect(cogsAccountCodeForType("supplies")).toBe("5100")
  })

  it("updates weighted-average cost on receive", () => {
    expect(weightedAverageCost(10, 200, 10, 300)).toEqual({ quantity: 20, averageCost: 250 })
  })

  it("routes inbox document types to ERP destinations", () => {
    expect(suggestedDestination("vendor_invoice")).toBe("vendor_bill")
    expect(suggestedDestination("receipt")).toBe("paid_expense")
    expect(suggestedDestination("packing_slip")).toBe("inventory_receipt")
    expect(destinationPostsToLedger("paid_expense")).toBe(true)
    expect(destinationPostsToLedger("vendor_bill")).toBe(false)
    expect(destinationPostsToLedger("customer_invoice")).toBe(false)
  })

  it("posts AR invoices with GST collected and keeps the journal in balance", () => {
    const posting = customerInvoiceJournal(10000, 500)
    expect(posting.totals).toEqual({ subtotal: 10000, taxTotal: 500, total: 10500 })
    expect(posting.lines.find((line) => line.account === "2100")?.taxCode).toBe("GST_5_COLLECTED")
    expect(journalLinesAreBalanced(posting.lines).balanced).toBe(true)
    expect(journalLinesAreBalanced(customerInvoiceJournal(10000, 500, true).lines).balanced).toBe(true)
  })

  it("posts vendor bills to AP and ITC, or GRNI when matching a receipt", () => {
    const expenseBill = vendorBillJournal(20000, 500)
    expect(expenseBill.lines[0].account).toBe("6040")
    expect(expenseBill.lines.find((line) => line.account === "1160")?.taxCode).toBe("GST_5_ITC")
    expect(journalLinesAreBalanced(expenseBill.lines).balanced).toBe(true)

    const grniBill = vendorBillJournal(20000, 500, true)
    expect(grniBill.lines[0].account).toBe("2010")
    expect(journalLinesAreBalanced(grniBill.lines).balanced).toBe(true)
    expect(journalLinesAreBalanced(vendorBillJournal(20000, 500, false, false).lines).balanced).toBe(true)
  })

  it("credits GRNI rather than AP when inventory is received", () => {
    const lines = inventoryReceiveJournal(15000, "1210")
    expect(lines).toEqual([
      { account: "1210", debit: 15000, credit: 0 },
      { account: "2010", debit: 0, credit: 15000 },
    ])
    expect(journalLinesAreBalanced(lines).balanced).toBe(true)
  })

  it("builds remittance journals that stay in balance for payable and refund cases", () => {
    const payable = gstRemittanceJournal(gstRemittanceAmounts(10500, 2100))
    expect(journalLinesAreBalanced(payable).balanced).toBe(true)
    expect(payable.find((line) => line.account === "2110")?.credit).toBe(8400)

    const payNow = gstRemittanceJournal(gstRemittanceAmounts(10500, 2100), true)
    expect(payNow.find((line) => line.account === "1000")?.credit).toBe(8400)

    const refundHold = gstRemittanceJournal(gstRemittanceAmounts(1000, 2500))
    expect(journalLinesAreBalanced(refundHold).balanced).toBe(true)
    expect(refundHold.some((line) => line.account === "1000")).toBe(false)
  })
})
