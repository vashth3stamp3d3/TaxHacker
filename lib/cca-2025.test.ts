import { describe, expect, it } from "vitest"
import { netCostCents } from "./amazon-shareholder-invoices"
import {
  CCA_2025,
  CCA_2025_ENTRY,
  CCA_2025_SOURCE,
  CLASS_12_COST_LIMIT_CENTS,
  allClass8RiipCcaCents,
  assertCca2025Math,
  cca2025AssetRows,
  cca2025Balances,
  cca2025JournalLines,
  cca2025T2Adjustments,
  class12EquipmentInvoices,
  computeCca2025,
} from "./cca-2025"
import { T2_2024_SCHEDULE_100, T2_2024_TAX } from "./tax/t2-2024-filed"

describe("2025 maximum CCA", () => {
  it("writes off every 2025 equipment addition under $500 in class 12", () => {
    const invoices = class12EquipmentInvoices()
    expect(invoices.map((invoice) => invoice.invoiceNumber)).toEqual(["FP-0049", "FP-0050", "FP-0053", "FP-0054"])
    expect(invoices.every((invoice) => netCostCents(invoice) < CLASS_12_COST_LIMIT_CENTS)).toBe(true)
    expect(CCA_2025.class12.additionsCents).toBe(62_157)
    expect(CCA_2025.class12.ccaCents).toBe(62_157)
    expect(CCA_2025.class12.closingUccCents).toBe(0)
    expect(CCA_2025.class8.additionsCents).toBe(0)
  })

  it("claims 20% of the filed 2024 class 8 UCC", () => {
    expect(CCA_2025.class8.openingUccCents).toBe(T2_2024_TAX.class8UccEnd)
    expect(CCA_2025.class8.openingUccCents).toBe(3_362_400)
    expect(CCA_2025.class8.ccaCents).toBe(672_480)
    expect(CCA_2025.class8.closingUccCents).toBe(2_689_920)
    expect(CCA_2025.priorEquipmentCostCents).toBe(3_780_700)
    expect(CCA_2025.priorCcaCents).toBe(418_300)
  })

  it("lists the 2024 shop machine before the 2025 Amazon tools", () => {
    const rows = cca2025AssetRows()
    expect(rows[0]).toMatchObject({
      source: "T2-2024",
      classNumber: 8,
      basisCents: 3_362_400,
      ccaCents: 672_480,
    })
    expect(rows.map((row) => row.source)).toEqual(["T2-2024", "FP-0049", "FP-0050", "FP-0053", "FP-0054"])
    expect(rows.reduce((sum, row) => sum + row.ccaCents, 0)).toBe(734_637)
  })

  it("uses the class 12 path because it is larger than class 8 RIIP", () => {
    expect(CCA_2025.totalCcaCents).toBe(734_637)
    expect(CCA_2025.bookDepreciationCents).toBe(734_637)
    expect(CCA_2025.allClass8RiipCents).toBe(allClass8RiipCcaCents(3_362_400, 62_157))
    expect(CCA_2025.allClass8RiipCents).toBe(691_127)
    expect(CCA_2025.totalCcaCents).toBeGreaterThan(CCA_2025.allClass8RiipCents)
  })

  it("keeps net book value equal to closing UCC", () => {
    expect(() => assertCca2025Math()).not.toThrow()
    expect(CCA_2025.equipmentCostCents).toBe(T2_2024_SCHEDULE_100.equipment + 62_157)
    expect(CCA_2025.accumDepCents).toBe(T2_2024_SCHEDULE_100.accumDep + 734_637)
    expect(CCA_2025.netBookValueCents).toBe(2_689_920)
    expect(computeCca2025()).toEqual(CCA_2025)
  })

  it("posts Dr 6090 and Cr 1690 for the claimed amount", () => {
    const lines = cca2025JournalLines()
    expect(CCA_2025_ENTRY).toBe("DEP-2025")
    expect(CCA_2025_SOURCE).toBe("cca-2025")
    expect(cca2025Balances().balanced).toBe(true)
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatchObject({ accountCode: "6090", debitCents: 734_637, creditCents: 0 })
    expect(lines[1]).toMatchObject({ accountCode: "1690", debitCents: 0, creditCents: 734_637 })
  })

  it("adds book depreciation back and deducts the same CCA on the 2025 T2", () => {
    const rows = cca2025T2Adjustments()
    expect(rows.map((row) => row.code)).toEqual(["accounting_depreciation", "cca"])
    expect(rows[0].amountCents).toBe(734_637)
    expect(rows[1].amountCents).toBe(734_637)
    expect(rows[0].section).toBe("schedule1_addition")
    expect(rows[1].section).toBe("schedule1_deduction")
  })
})
