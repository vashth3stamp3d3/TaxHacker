import { describe, expect, it } from "vitest"
import {
  T2_2024_GIFI,
  T2_2024_SCHEDULE_100,
  T2_2024_TAX,
  assertFiledBalanceSheetMath,
  assertFiledGifiMath,
  official2024BalanceSheet,
  official2024Journals,
} from "./t2-2024-filed"

describe("filed 2024 T2", () => {
  it("matches Schedule 125 from the return", () => {
    expect(() => assertFiledGifiMath()).not.toThrow()
    expect(T2_2024_GIFI.sales).toBe(7_588_900)
    expect(T2_2024_GIFI.netIncome).toBe(1_104_500)
  })

  it("matches Schedule 100, Schedule 8, and tax payable from the return", () => {
    expect(() => assertFiledBalanceSheetMath()).not.toThrow()
    expect(T2_2024_SCHEDULE_100.totalAssets).toBe(4_490_000)
    expect(T2_2024_TAX.cca).toBe(418_300)
    expect(T2_2024_TAX.class8UccEnd).toBe(3_362_400)
    expect(T2_2024_TAX.federalPartI).toBe(99_300)
    expect(T2_2024_TAX.albertaTax).toBe(22_100)
  })

  it("ties 2024 ending and uses that same sheet as 2025 opening", () => {
    const { opening, ending } = official2024BalanceSheet()
    const debit = ending.reduce((sum, line) => sum + line.debitCents, 0)
    const credit = ending.reduce((sum, line) => sum + line.creditCents, 0)
    expect(debit).toBe(credit)
    expect(debit).toBe(4_908_300)
    expect(opening.find((line) => line.accountCode === "1000")?.debitCents).toBe(10_000)
    expect(ending.find((line) => line.accountCode === "3100")?.creditCents).toBe(T2_2024_GIFI.netIncome)
    expect(ending).toEqual(official2024BalanceSheet().ending)
  })

  it("posts a balanced opening, filed recap, and year close", () => {
    const journals = official2024Journals()
    expect(journals.map((journal) => journal.entryNumber)).toEqual(["T2-2024-00", "T2-2024-01", "T2-2024-CLOSE"])
    expect(journals[1].lines.find((line) => line.accountCode === "1600")?.debitCents).toBe(3_780_700)
  })
})
