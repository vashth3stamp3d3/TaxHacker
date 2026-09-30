import { describe, expect, it } from "vitest"
import {
  addCalendarMonths,
  computeT2Worksheet,
  fiscalPeriodForYear,
  formatReconciliation,
  formatWorksheetForAdvisor,
  reconcileChatAmounts,
  taxYearFromAdvisorUrl,
  worksheetToCsv,
  type JournalActivityLine,
} from "./t2-worksheet"

function line(partial: Partial<JournalActivityLine> & Pick<JournalActivityLine, "postedAt" | "accountCode" | "accountType">): JournalActivityLine {
  return {
    accountName: partial.accountCode,
    debitCents: 0,
    creditCents: 0,
    ...partial,
  }
}

describe("fiscal period", () => {
  it("uses the calendar year when the fiscal year starts in January", () => {
    const period = fiscalPeriodForYear(2025, 1)
    expect(period.startsAt.toISOString()).toBe("2025-01-01T00:00:00.000Z")
    expect(period.endsAt.toISOString()).toBe("2025-12-31T23:59:59.999Z")
  })

  it("starts a non-calendar fiscal year in the named year", () => {
    const period = fiscalPeriodForYear(2025, 4)
    expect(period.startsAt.toISOString()).toBe("2025-04-01T00:00:00.000Z")
    expect(period.endsAt.toISOString()).toBe("2026-03-31T23:59:59.999Z")
  })
})

describe("computeT2Worksheet", () => {
  const lines: JournalActivityLine[] = [
    line({ postedAt: new Date("2024-12-31T12:00:00.000Z"), accountCode: "4000", accountType: "revenue", creditCents: 9_999_00 }),
    line({ postedAt: new Date("2025-06-01T12:00:00.000Z"), accountCode: "4000", accountName: "Print Sales", accountType: "revenue", creditCents: 600_000_00 }),
    line({ postedAt: new Date("2025-06-01T12:00:00.000Z"), accountCode: "4900", accountName: "Discounts", accountType: "revenue", debitCents: 10_000_00 }),
    line({ postedAt: new Date("2025-06-01T12:00:00.000Z"), accountCode: "5000", accountName: "Paper", accountType: "cogs", debitCents: 80_000_00 }),
    line({ postedAt: new Date("2025-06-01T12:00:00.000Z"), accountCode: "6090", accountName: "Depreciation", accountType: "expense", debitCents: 5_000_00 }),
    line({ postedAt: new Date("2025-06-01T12:00:00.000Z"), accountCode: "6000", accountName: "Rent", accountType: "expense", debitCents: 20_000_00 }),
    line({ postedAt: new Date("2026-01-02T12:00:00.000Z"), accountCode: "4000", accountType: "revenue", creditCents: 8_888_00 }),
    line({ postedAt: new Date("2025-06-01T12:00:00.000Z"), accountCode: "1000", accountName: "Cash", accountType: "asset", debitCents: 50_000_00 }),
  ]

  it("keeps book income inside the 2025 fiscal year", () => {
    const worksheet = computeT2Worksheet({ year: 2025, fiscalYearStartMonth: 1, lines })
    expect(worksheet.books.revenueCents).toBe(590_000_00)
    expect(worksheet.books.cogsCents).toBe(80_000_00)
    expect(worksheet.books.expenseCents).toBe(25_000_00)
    expect(worksheet.books.netIncomeCents).toBe(485_000_00)
    expect(worksheet.books.accounts.some((account) => account.code === "1000")).toBe(false)
  })

  it("applies Schedule 1 and the small-business limit", () => {
    const worksheet = computeT2Worksheet({
      year: 2025,
      fiscalYearStartMonth: 1,
      lines,
      adjustments: [
        { code: "accounting_depreciation", amountCents: 5_000_00 },
        { code: "cca", amountCents: 3_000_00 },
        { code: "charitable_donations_expensed", amountCents: 2_000_00 },
        { code: "charitable_donation_claim", amountCents: 2_000_00 },
        { code: "non_capital_losses", amountCents: 10_000_00 },
      ],
    })

    expect(worksheet.schedule1.additionsCents).toBe(7_000_00)
    expect(worksheet.schedule1.deductionsCents).toBe(3_000_00)
    expect(worksheet.schedule1.netIncomeForTaxCents).toBe(489_000_00)
    expect(worksheet.taxableIncome.donationAllowedCents).toBe(2_000_00)
    expect(worksheet.taxableIncome.taxableIncomeCents).toBe(477_000_00)
    expect(worksheet.tax.smallBusinessIncomeCents).toBe(477_000_00)
    expect(worksheet.tax.generalIncomeCents).toBe(0)
    expect(worksheet.tax.federalTaxCents).toBe(Math.round((477_000_00 * 900) / 10_000))
    expect(worksheet.tax.albertaTaxCents).toBe(Math.round((477_000_00 * 200) / 10_000))
    expect(worksheet.tax.totalTaxCents).toBe(worksheet.tax.federalTaxCents + worksheet.tax.albertaTaxCents)
  })

  it("splits income above $500,000 between small-business and general rates", () => {
    const worksheet = computeT2Worksheet({
      year: 2025,
      fiscalYearStartMonth: 1,
      lines: [line({ postedAt: new Date("2025-03-01T00:00:00.000Z"), accountCode: "4000", accountType: "revenue", creditCents: 600_000_00 })],
    })
    expect(worksheet.tax.smallBusinessIncomeCents).toBe(500_000_00)
    expect(worksheet.tax.generalIncomeCents).toBe(100_000_00)
    expect(worksheet.tax.federalTaxCents).toBe(45_000_00 + 15_000_00)
    expect(worksheet.tax.albertaTaxCents).toBe(10_000_00 + 8_000_00)
    expect(worksheet.tax.totalTaxCents).toBe(78_000_00)
  })

  it("caps the donation claim at 75% and does not tax a loss", () => {
    const worksheet = computeT2Worksheet({
      year: 2025,
      fiscalYearStartMonth: 1,
      lines: [line({ postedAt: new Date("2025-03-01T00:00:00.000Z"), accountCode: "6000", accountType: "expense", debitCents: 1_000_00 })],
      adjustments: [{ code: "charitable_donation_claim", amountCents: 5_000_00 }],
    })
    expect(worksheet.schedule1.netIncomeForTaxCents).toBe(-1_000_00)
    expect(worksheet.taxableIncome.donationAllowedCents).toBe(0)
    expect(worksheet.taxableIncome.taxableIncomeCents).toBe(0)
    expect(worksheet.tax.totalTaxCents).toBe(0)
  })

  it("sets CCPC filing and balance-due dates from a December 31 year end", () => {
    const worksheet = computeT2Worksheet({ year: 2025, fiscalYearStartMonth: 1, lines: [] })
    expect(worksheet.deadlines.yearEnd).toBe("2025-12-31")
    expect(worksheet.deadlines.filingDue).toBe("2026-06-30")
    expect(worksheet.deadlines.balanceDueCcpc).toBe("2026-03-31")
    expect(worksheet.deadlines.balanceDueGeneral).toBe("2026-02-28")
    expect(worksheet.disclaimer).toMatch(/not a filed T2/i)
  })

  it("flags missing depreciation add-back", () => {
    const worksheet = computeT2Worksheet({ year: 2025, fiscalYearStartMonth: 1, lines })
    const item = worksheet.checklist.find((entry) => entry.id === "depreciation")
    expect(item?.status).toBe("review")
  })
})

describe("deadlines", () => {
  it("lands on February 29 when the second month is a leap-year month end", () => {
    expect(addCalendarMonths(new Date("2023-12-31T23:59:59.999Z"), 2).toISOString().slice(0, 10)).toBe("2024-02-29")
  })
})

describe("tax advisor reconciliation", () => {
  const worksheet = computeT2Worksheet({
    year: 2025,
    fiscalYearStartMonth: 1,
    lines: [line({ postedAt: new Date("2025-05-01T00:00:00.000Z"), accountCode: "4000", accountType: "revenue", creditCents: 120_000_00 })],
  })

  it("reads the year from the T2 page URL and ignores other pages", () => {
    expect(taxYearFromAdvisorUrl("/taxes/t2")).toBe(2025)
    expect(taxYearFromAdvisorUrl("/taxes/t2?year=2026")).toBe(2026)
    expect(taxYearFromAdvisorUrl("/taxes/gst")).toBeNull()
  })

  it("compares chat figures to the computed worksheet and ignores the bare year", () => {
    const items = reconcileChatAmounts(
      worksheet,
      "For 2025, revenue was $100,000.00 but I think federal tax is $10,800. The year 2025 should not be an amount."
    )
    expect(items.map((item) => item.field)).toEqual(["revenueCents", "federalTaxCents"])
    expect(items[0]).toMatchObject({ statedCents: 10_000_000, worksheetCents: 12_000_000, matches: false })
    expect(items[1].matches).toBe(true)
    expect(formatReconciliation(worksheet, items)).toContain("computed from the ledger")
  })

  it("does not reconcile a different tax year mentioned in the message", () => {
    expect(reconcileChatAmounts(worksheet, "2024 revenue was $100,000.")).toEqual([])
  })

  it("puts the same computed cents into the advisor context", () => {
    const text = formatWorksheetForAdvisor(worksheet)
    expect(text).toContain("source=database_fresh_compute")
    expect(text).toContain(`${worksheet.books.revenueCents} cents`)
    expect(text).toContain(`${worksheet.tax.totalTaxCents} cents`)
    expect(text).toContain("All-time trial balance is not used")
  })

  it("exports the same totals", () => {
    const csv = worksheetToCsv(worksheet)
    expect(csv).toContain("planning_estimate")
    expect(csv).toContain("120000.00")
    expect(csv).toContain("not a filed T2")
  })
})
