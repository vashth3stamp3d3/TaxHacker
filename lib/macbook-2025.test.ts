import { describe, expect, it } from "vitest"
import {
  MACBOOK_2025,
  macbookApplecareCents,
  macbookBalances,
  macbookCapitalCostCents,
  macbookComputerCents,
  macbookJournalLines,
} from "./macbook-2025"

describe("2025 MacBook Pro shareholder invoice", () => {
  it("capitalizes the computer, recycling fee, and AppleCare+ net of education pricing", () => {
    expect(MACBOOK_2025.invoiceNumber).toBe("FP-0056")
    expect(MACBOOK_2025.serial).toBe("HGQHY74RDX")
    expect(macbookComputerCents()).toBe(250_980)
    expect(macbookApplecareCents()).toBe(33_900)
    expect(macbookCapitalCostCents()).toBe(284_880)
    expect(MACBOOK_2025.gstCents).toBe(14_244)
    expect(MACBOOK_2025.totalCents).toBe(299_124)
    expect(macbookBalances()).toBe(true)
  })

  it("posts equipment, GST ITC, and the shareholder loan", () => {
    const lines = macbookJournalLines()
    expect(lines).toEqual([
      expect.objectContaining({ accountCode: "1600", debitCents: 284_880 }),
      expect.objectContaining({ accountCode: "1160", debitCents: 14_244, taxCode: "GST_5_ITC" }),
      expect.objectContaining({ accountCode: "2310", creditCents: 299_124 }),
    ])
  })
})
