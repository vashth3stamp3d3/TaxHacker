import { describe, expect, it } from "vitest"
import { loadFp36Entries } from "../formulated-prints-ledger"
import {
  T2_2024_GIFI,
  assertFiledGifiMath,
  cashExpensesCents,
  endingCashCents,
  equipmentCentsFromHistorical,
  official2024BalanceSheet,
  official2024Journals,
} from "./t2-2024-filed"

describe("filed 2024 T2 GIFI", () => {
  it("adds through to the screenshot summary totals", () => {
    expect(() => assertFiledGifiMath()).not.toThrow()
    expect(T2_2024_GIFI.sales).toBe(7_588_900)
    expect(T2_2024_GIFI.netIncome).toBe(1_104_500)
    expect(cashExpensesCents()).toBe(6_066_100)
    expect(endingCashCents()).toBe(1_522_800)
  })

  it("ties 2024 ending assets to liabilities plus retained earnings", () => {
    const equipment = 2_882_934
    const { opening, ending } = official2024BalanceSheet(equipment)
    expect(opening).toEqual([])
    const debit = ending.reduce((sum, line) => sum + line.debitCents, 0)
    const credit = ending.reduce((sum, line) => sum + line.creditCents, 0)
    expect(debit).toBe(credit)
    expect(ending.find((line) => line.accountCode === "3100")?.creditCents).toBe(T2_2024_GIFI.netIncome)
  })

  it("uses 2024 FP36 equipment purchases on the official balance sheet", async () => {
    const equipment = equipmentCentsFromHistorical(await loadFp36Entries(), 2024)
    expect(equipment).toBe(2_882_934)
    const journals = official2024Journals(equipment)
    expect(journals.some((journal) => journal.entryNumber === "T2-2024-CLOSE")).toBe(true)
    expect(journals.find((journal) => journal.entryNumber === "T2-2024-04")?.lines[0].debitCents).toBe(equipment)
  })

  it("makes 2025 opening equal 2024 ending", () => {
    const { ending } = official2024BalanceSheet(2_882_934)
    expect(ending).toEqual(official2024BalanceSheet(2_882_934).ending)
  })
})
