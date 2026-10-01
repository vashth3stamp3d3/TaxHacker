/**
 * 2025 maximum capital cost allowance and matching book depreciation.
 *
 * Opening class 8 UCC is the filed 2024 T2 closing UCC ($33,624.00).
 * 2025 capital additions are the Amazon shareholder-loan equipment lines.
 * Each costs less than $500, so the largest first-year write-off is Class 12
 * at 100% with no half-year rule. Opening class 8 stays at 20%.
 *
 * Immediate expensing for CCPCs ended for property available for use after
 * 2023. Leaving everything in class 8 and claiming 2025 RIIP (30% on
 * additions) is smaller than Class 12. Book depreciation equals the CCA
 * claimed, the same policy as the filed 2024 T2.
 */

import { AMAZON_SHAREHOLDER_INVOICES, netCostCents, type AmazonShareholderInvoice } from "@/lib/amazon-shareholder-invoices"
import { T2_2024_SCHEDULE_100, T2_2024_TAX } from "@/lib/tax/t2-2024-filed"

export const CCA_2025_SOURCE = "cca-2025"
export const CCA_2025_ENTRY = "DEP-2025"
export const CCA_2025_YEAR = 2025
export const CCA_2025_POSTED_AT = new Date(Date.UTC(2025, 11, 31, 23, 0, 0, 0))
export const CLASS_12_COST_LIMIT_CENTS = 50_000
export const CLASS_8_RATE_BPS = 2_000
export const CLASS_12_RATE_BPS = 10_000
export const RIIP_FIRST_YEAR_MULTIPLIER_BPS = 15_000

export type CcaClassLine = {
  classNumber: 8 | 12
  description: string
  openingUccCents: number
  additionsCents: number
  ccaCents: number
  closingUccCents: number
  items: Array<{ invoiceNumber: string; description: string; costCents: number }>
}

export type Cca2025Claim = {
  year: number
  method: "class12_plus_class8"
  class8: CcaClassLine
  class12: CcaClassLine
  totalCcaCents: number
  bookDepreciationCents: number
  priorEquipmentCostCents: number
  priorCcaCents: number
  equipmentCostCents: number
  accumDepCents: number
  netBookValueCents: number
  allClass8RiipCents: number
}

export type CcaAssetRow = {
  source: string
  description: string
  classNumber: 8 | 12
  basisCents: number
  basisLabel: "remaining UCC" | "cost"
  ccaCents: number
}

export type CcaJournalLine = {
  accountCode: string
  accountName: string
  debitCents: number
  creditCents: number
  memo: string
}

export type T2CcaAdjustment = {
  code: "accounting_depreciation" | "cca"
  label: string
  section: "schedule1_addition" | "schedule1_deduction"
  amountCents: number
  note: string
  sortOrder: number
}

function roundRate(cents: number, rateBps: number) {
  return Math.round((cents * rateBps) / 10_000)
}

export function amazonEquipmentInvoices(): AmazonShareholderInvoice[] {
  return AMAZON_SHAREHOLDER_INVOICES.filter((invoice) => invoice.kind === "equipment")
}

export function class12EquipmentInvoices(): AmazonShareholderInvoice[] {
  return amazonEquipmentInvoices().filter((invoice) => netCostCents(invoice) < CLASS_12_COST_LIMIT_CENTS)
}

export function class8EquipmentInvoices(): AmazonShareholderInvoice[] {
  return amazonEquipmentInvoices().filter((invoice) => netCostCents(invoice) >= CLASS_12_COST_LIMIT_CENTS)
}

function additionItems(invoices: AmazonShareholderInvoice[]) {
  return invoices.map((invoice) => ({
    invoiceNumber: invoice.invoiceNumber,
    description: invoice.description,
    costCents: netCostCents(invoice),
  }))
}

function additionsCents(invoices: AmazonShareholderInvoice[]) {
  return invoices.reduce((sum, invoice) => sum + netCostCents(invoice), 0)
}

export function allClass8RiipCcaCents(openingUccCents: number, additionsCentsValue: number) {
  return roundRate(openingUccCents, CLASS_8_RATE_BPS) + roundRate(additionsCentsValue, roundRate(CLASS_8_RATE_BPS, RIIP_FIRST_YEAR_MULTIPLIER_BPS))
}

export function computeCca2025(): Cca2025Claim {
  const class12Invoices = class12EquipmentInvoices()
  const class8Invoices = class8EquipmentInvoices()
  const class12Adds = additionsCents(class12Invoices)
  const class8Adds = additionsCents(class8Invoices)
  const class8Opening = T2_2024_TAX.class8UccEnd
  const class8RiipRateBps = roundRate(CLASS_8_RATE_BPS, RIIP_FIRST_YEAR_MULTIPLIER_BPS)
  const class8Cca = roundRate(class8Opening, CLASS_8_RATE_BPS) + roundRate(class8Adds, class8RiipRateBps)
  const class12Cca = roundRate(class12Adds, CLASS_12_RATE_BPS)
  const totalCca = class8Cca + class12Cca
  const class8Close = class8Opening + class8Adds - class8Cca
  const class12Close = class12Adds - class12Cca
  const equipmentCost = T2_2024_SCHEDULE_100.equipment + class12Adds + class8Adds
  const accumDep = T2_2024_SCHEDULE_100.accumDep + totalCca

  return {
    year: CCA_2025_YEAR,
    method: "class12_plus_class8",
    class8: {
      classNumber: 8,
      description: "Machinery, equipment, furniture and fixtures from the filed 2024 T2",
      openingUccCents: class8Opening,
      additionsCents: class8Adds,
      ccaCents: class8Cca,
      closingUccCents: class8Close,
      items: additionItems(class8Invoices),
    },
    class12: {
      classNumber: 12,
      description: "2025 Amazon equipment costing less than $500 per tool",
      openingUccCents: 0,
      additionsCents: class12Adds,
      ccaCents: class12Cca,
      closingUccCents: class12Close,
      items: additionItems(class12Invoices),
    },
    totalCcaCents: totalCca,
    bookDepreciationCents: totalCca,
    priorEquipmentCostCents: T2_2024_SCHEDULE_100.equipment,
    priorCcaCents: T2_2024_TAX.cca,
    equipmentCostCents: equipmentCost,
    accumDepCents: accumDep,
    netBookValueCents: equipmentCost - accumDep,
    allClass8RiipCents: allClass8RiipCcaCents(class8Opening, class12Adds + class8Adds),
  }
}

export const CCA_2025 = computeCca2025()

export function cca2025AssetRows(): CcaAssetRow[] {
  const claim = CCA_2025
  return [
    {
      source: "T2-2024",
      description: "Shop machinery and equipment already on the filed 2024 T2",
      classNumber: 8,
      basisCents: claim.class8.openingUccCents,
      basisLabel: "remaining UCC",
      ccaCents: claim.class8.ccaCents,
    },
    ...claim.class12.items.map((item) => ({
      source: item.invoiceNumber,
      description: item.description,
      classNumber: 12 as const,
      basisCents: item.costCents,
      basisLabel: "cost" as const,
      ccaCents: item.costCents,
    })),
  ]
}

export function assertCca2025Math() {
  const claim = computeCca2025()
  if (claim.class12.items.length === 0) throw new Error("2025 CCA has no class 12 additions")
  for (const item of claim.class12.items) {
    if (item.costCents >= CLASS_12_COST_LIMIT_CENTS) {
      throw new Error(`${item.invoiceNumber} is ${item.costCents} and cannot go in class 12`)
    }
  }
  if (claim.class8.ccaCents !== roundRate(claim.class8.openingUccCents, CLASS_8_RATE_BPS)) {
    throw new Error("Class 8 CCA is not 20% of opening UCC")
  }
  if (claim.class12.ccaCents !== claim.class12.additionsCents) {
    throw new Error("Class 12 CCA is not 100% of additions")
  }
  if (claim.totalCcaCents !== claim.class8.ccaCents + claim.class12.ccaCents) {
    throw new Error("Total CCA does not equal class 8 plus class 12")
  }
  if (claim.bookDepreciationCents !== claim.totalCcaCents) {
    throw new Error("Book depreciation must equal the CCA claimed")
  }
  if (claim.totalCcaCents <= claim.allClass8RiipCents) {
    throw new Error("Claimed CCA is not the maximum versus leaving 2025 additions in class 8 with RIIP")
  }
  if (claim.class8.openingUccCents + claim.class8.additionsCents - claim.class8.ccaCents !== claim.class8.closingUccCents) {
    throw new Error("Class 8 UCC does not roll forward")
  }
  if (claim.class12.openingUccCents + claim.class12.additionsCents - claim.class12.ccaCents !== claim.class12.closingUccCents) {
    throw new Error("Class 12 UCC does not roll forward")
  }
  if (claim.netBookValueCents !== claim.class8.closingUccCents + claim.class12.closingUccCents) {
    throw new Error("Net book value does not equal closing UCC")
  }
  if (claim.class8.closingUccCents < 0 || claim.class12.closingUccCents < 0) {
    throw new Error("Closing UCC cannot be negative")
  }
}

export function cca2025JournalLines(): CcaJournalLine[] {
  assertCca2025Math()
  const claim = CCA_2025
  return [
    {
      accountCode: "6090",
      accountName: "Depreciation",
      debitCents: claim.bookDepreciationCents,
      creditCents: 0,
      memo: "2025 maximum CCA — 20% of the 2024 shop machine class 8 UCC plus class 12 100% of equipment under $500",
    },
    {
      accountCode: "1690",
      accountName: "Accumulated Depreciation",
      debitCents: 0,
      creditCents: claim.bookDepreciationCents,
      memo: "Accumulated depreciation 2025",
    },
  ]
}

export function cca2025Balances() {
  const lines = cca2025JournalLines()
  const debit = lines.reduce((sum, line) => sum + line.debitCents, 0)
  const credit = lines.reduce((sum, line) => sum + line.creditCents, 0)
  return { debit, credit, balanced: debit === credit && debit === CCA_2025.bookDepreciationCents }
}

export function cca2025Description() {
  return "2025 maximum CCA and matching book depreciation"
}

export function cca2025T2Adjustments(): T2CcaAdjustment[] {
  assertCca2025Math()
  const claim = CCA_2025
  const note = [
    `Maximum 2025 CCA ${formatCad(claim.totalCcaCents)}.`,
    `Shop machine from the 2024 T2: cost ${formatCad(claim.priorEquipmentCostCents)}, 2024 CCA already claimed ${formatCad(claim.priorCcaCents)}, remaining UCC ${formatCad(claim.class8.openingUccCents)} × 20% = ${formatCad(claim.class8.ccaCents)}.`,
    `Class 12 100% of Amazon equipment under $500 ${formatCad(claim.class12.additionsCents)} = ${formatCad(claim.class12.ccaCents)}.`,
    `Closing class 8 UCC ${formatCad(claim.class8.closingUccCents)}. Class 12 UCC nil.`,
    "Book depreciation equals CCA, same as the filed 2024 T2.",
  ].join(" ")
  return [
    {
      code: "accounting_depreciation",
      label: "Accounting depreciation and amortization",
      section: "schedule1_addition",
      amountCents: claim.bookDepreciationCents,
      note,
      sortOrder: 10,
    },
    {
      code: "cca",
      label: "Capital cost allowance",
      section: "schedule1_deduction",
      amountCents: claim.totalCcaCents,
      note,
      sortOrder: 110,
    },
  ]
}

export function formatCad(cents: number) {
  const sign = cents < 0 ? "-" : ""
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`
}
