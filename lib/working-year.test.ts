import { describe, expect, it } from "vitest"
import { dateForNewPosting, parseWorkingYear, shouldKeepFiscalYearOpen, workingYearRange } from "./working-year"

describe("working year", () => {
  it("defaults unknown values to 2025", () => {
    expect(parseWorkingYear("nope")).toBe(2025)
    expect(parseWorkingYear("2026")).toBe(2026)
  })

  it("builds UTC calendar bounds for the selected year only", () => {
    const year = workingYearRange(2025)
    expect(year.startsAt.toISOString()).toBe("2025-01-01T00:00:00.000Z")
    expect(year.endsAt.toISOString()).toBe("2025-12-31T23:59:59.999Z")
  })

  it("posts into the selected year when today is outside it", () => {
    const year = workingYearRange(2025)
    expect(dateForNewPosting(year, new Date("2026-09-30T12:00:00Z")).toISOString()).toBe("2025-12-31T23:59:59.999Z")
    expect(dateForNewPosting(year, new Date("2025-06-15T12:00:00Z")).toISOString()).toBe("2025-06-15T12:00:00.000Z")
  })

  it("keeps 2025 and 2026 as the only app-wide working years", () => {
    expect(shouldKeepFiscalYearOpen(2025)).toBe(true)
    expect(shouldKeepFiscalYearOpen(2026)).toBe(true)
    expect(shouldKeepFiscalYearOpen(2024)).toBe(false)
  })
})
