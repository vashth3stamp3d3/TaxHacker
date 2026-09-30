import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({ prisma: {} }))

import { formatEntitySnapshot } from "./advisor"

describe("advisor entity snapshots", () => {
  it("formats structured books fields for the tax advisor", () => {
    const text = formatEntitySnapshot([
      ["Customer invoice", "INV-00001"],
      ["GST cents", 500],
      ["Customer GST number", null],
      ["Tax exempt", "no"],
    ])
    expect(text).toContain("Customer invoice: INV-00001")
    expect(text).toContain("GST cents: 500")
    expect(text).not.toContain("Customer GST number")
  })
})
