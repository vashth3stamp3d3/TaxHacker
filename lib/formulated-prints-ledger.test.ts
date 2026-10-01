import { describe, expect, it } from "vitest"
import {
  EXPECTED_BEGINNING_BALANCES,
  EXPECTED_ENDING_BALANCES,
  loadBeginningSnapshot,
  loadEndingSnapshot,
  loadFp36Entries,
  snapshotTotals,
  summarizeEntries,
} from "./formulated-prints-ledger"

describe("Formulated Prints ledger workbooks", () => {
  it("logs v5 as beginning balances without treating it as the live GL", async () => {
    const beginning = await loadBeginningSnapshot()
    expect(beginning.kind).toBe("beginning")
    expect(beginning.sourceFile).toContain("complete-accounting-and-ledger-v5")
    expect(snapshotTotals(beginning.lines)).toEqual(EXPECTED_BEGINNING_BALANCES)
  })

  it("logs FP36 as ending balances that match the posted journal totals", async () => {
    const [ending, entries] = await Promise.all([loadEndingSnapshot(), loadFp36Entries()])
    const totals = summarizeEntries(entries)
    expect(ending.kind).toBe("ending")
    expect(ending.sourceFile).toContain("fp36-updated-accounting-and-ledger")
    expect(snapshotTotals(ending.lines)).toEqual(EXPECTED_ENDING_BALANCES)
    expect(entries).toHaveLength(36)
    expect(entries.reduce((count, entry) => count + entry.lines.length, 0)).toBe(72)
    expect(Object.fromEntries(totals)).toEqual(EXPECTED_ENDING_BALANCES)
  })
})
