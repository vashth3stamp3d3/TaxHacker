export type TaxableTotals = {
  subtotal: number
  taxTotal: number
  total: number
}

export type GstRemittanceAmounts = {
  collected: number
  inputCredits: number
  adjustments: number
  netTax: number
}

export function taxCents(subtotalCents: number, rateBasisPoints: number) {
  if (!Number.isFinite(subtotalCents) || !Number.isFinite(rateBasisPoints) || subtotalCents <= 0 || rateBasisPoints <= 0) {
    return 0
  }
  return Math.round((subtotalCents * rateBasisPoints) / 10000)
}

export function taxableTotals(subtotalCents: number, rateBasisPoints: number, taxExempt = false): TaxableTotals {
  const subtotal = Math.max(0, Math.round(subtotalCents || 0))
  if (taxExempt) {
    return { subtotal, taxTotal: 0, total: subtotal }
  }
  const taxTotal = taxCents(subtotal, rateBasisPoints)
  return { subtotal, taxTotal, total: subtotal + taxTotal }
}

export function gstRemittanceAmounts(collected: number, inputCredits: number, adjustments = 0): GstRemittanceAmounts {
  const safeCollected = Math.max(0, Math.round(collected || 0))
  const safeCredits = Math.max(0, Math.round(inputCredits || 0))
  const safeAdjustments = Math.round(adjustments || 0)
  return {
    collected: safeCollected,
    inputCredits: safeCredits,
    adjustments: safeAdjustments,
    netTax: safeCollected - safeCredits + safeAdjustments,
  }
}

export function gstRemittancePosting(amounts: GstRemittanceAmounts) {
  const debitCollected = amounts.collected
  const creditItc = amounts.inputCredits
  const net = amounts.netTax
  return {
    debitCollected,
    creditItc,
    netToPayable: Math.max(0, net),
    netRefund: Math.max(0, -net),
  }
}

export function lineAmount(quantity: number, unitPrice: number) {
  return Math.max(0, Math.round(quantity) * Math.round(unitPrice))
}

export function sumDocumentLines(lines: Array<{ quantity: number; unitPrice: number }>, rateBasisPoints: number, taxExempt = false) {
  const subtotal = lines.reduce((sum, line) => sum + lineAmount(line.quantity, line.unitPrice), 0)
  return taxableTotals(subtotal, rateBasisPoints, taxExempt)
}

export function inventoryAccountCodeForType(type: string | null | undefined) {
  switch (type) {
    case "ink":
      return "1210"
    case "supplies":
      return "1220"
    case "finished":
      return "1400"
    case "paper":
    case "material":
    default:
      return "1200"
  }
}

export function cogsAccountCodeForType(type: string | null | undefined) {
  switch (type) {
    case "ink":
      return "5010"
    case "supplies":
      return "5100"
    case "paper":
    case "material":
    default:
      return "5000"
  }
}

export function weightedAverageCost(oldQty: number, oldAvg: number, addQty: number, addUnitCost: number) {
  const nextQty = oldQty + addQty
  if (nextQty <= 0) {
    return { quantity: nextQty, averageCost: addUnitCost }
  }
  return {
    quantity: nextQty,
    averageCost: Math.round((oldQty * oldAvg + addQty * addUnitCost) / nextQty),
  }
}

export const DOCUMENT_DESTINATIONS = ["paid_expense", "vendor_bill", "customer_invoice", "inventory_receipt"] as const
export type DocumentDestination = (typeof DOCUMENT_DESTINATIONS)[number]

export const DOCUMENT_TYPES = [
  "receipt",
  "vendor_invoice",
  "customer_invoice",
  "credit_memo",
  "bank_statement",
  "packing_slip",
  "other",
] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export function destinationPostsToLedger(destination: DocumentDestination) {
  return destination === "paid_expense"
}

export function journalLinesAreBalanced(lines: Array<{ debit: number; credit: number }>) {
  const debit = lines.reduce((sum, line) => sum + Math.max(0, Math.round(line.debit || 0)), 0)
  const credit = lines.reduce((sum, line) => sum + Math.max(0, Math.round(line.credit || 0)), 0)
  return { debit, credit, balanced: debit === credit && debit > 0 }
}

export function customerInvoiceJournal(subtotalCents: number, rateBasisPoints: number, taxExempt = false) {
  const totals = taxableTotals(subtotalCents, rateBasisPoints, taxExempt)
  return {
    totals,
    lines: [
      { account: "1100", debit: totals.total, credit: 0, taxCode: null as string | null },
      { account: "4000", debit: 0, credit: totals.subtotal, taxCode: null },
      ...(totals.taxTotal > 0 ? [{ account: "2100", debit: 0, credit: totals.taxTotal, taxCode: "GST_5_COLLECTED" }] : []),
    ],
  }
}

export function vendorBillJournal(subtotalCents: number, rateBasisPoints: number, viaGrni = false, claimItc = true) {
  const totals = taxableTotals(subtotalCents, claimItc ? rateBasisPoints : 0)
  return {
    totals,
    lines: [
      { account: viaGrni ? "2010" : "6040", debit: totals.subtotal, credit: 0, taxCode: null as string | null },
      ...(totals.taxTotal > 0 ? [{ account: "1160", debit: totals.taxTotal, credit: 0, taxCode: "GST_5_ITC" }] : []),
      { account: "2000", debit: 0, credit: totals.total, taxCode: null },
    ],
  }
}

export function inventoryReceiveJournal(costCents: number, inventoryAccount = "1200") {
  return [
    { account: inventoryAccount, debit: costCents, credit: 0 },
    { account: "2010", debit: 0, credit: costCents },
  ]
}

export function gstRemittanceJournal(amounts: GstRemittanceAmounts, payNow = false) {
  const posting = gstRemittancePosting(amounts)
  const lines: Array<{ account: string; debit: number; credit: number }> = [
    { account: "2100", debit: posting.debitCollected, credit: 0 },
  ]
  if (posting.netRefund > 0 && !payNow) {
    lines.push({ account: "1160", debit: 0, credit: posting.debitCollected })
  } else {
    lines.push({ account: "1160", debit: 0, credit: posting.creditItc })
    if (posting.netToPayable > 0) {
      lines.push({ account: payNow ? "1000" : "2110", debit: 0, credit: posting.netToPayable })
    }
    if (posting.netRefund > 0) {
      lines.push({ account: "1000", debit: posting.netRefund, credit: 0 })
    }
  }
  return lines.filter((line) => line.debit > 0 || line.credit > 0)
}

export function suggestedDestination(documentType?: string | null): DocumentDestination {
  switch (documentType) {
    case "vendor_invoice":
      return "vendor_bill"
    case "customer_invoice":
      return "customer_invoice"
    case "packing_slip":
      return "inventory_receipt"
    default:
      return "paid_expense"
  }
}
