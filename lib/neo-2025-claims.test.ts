import { describe, expect, it } from "vitest"
import {
  NEO_2025_CLAIMS,
  NEO_GST_INCLUSIVE_KINDS,
  neoCcaItems,
  neoClaimTotals,
  neoMealClaims,
  neoMealsNondeductibleCents,
  neoMonthBalances,
  neoMonthJournalLines,
  neoMonthlyJournals,
  splitGstInclusiveCents,
} from "./neo-2025-claims"

describe("Neo 2025 claimable print-shop charges", () => {
  it("covers shareholder-loan lines that each balance net plus GST", () => {
    const totals = neoClaimTotals()
    const meals = neoMealClaims()
    expect(NEO_2025_CLAIMS).toHaveLength(287)
    expect(meals).toHaveLength(162)
    expect(totals).toEqual({ count: 287, totalCents: 1_220_335, netCents: 1_180_854, gstCents: 39_481 })
    for (const claim of NEO_2025_CLAIMS) {
      expect(claim.netCents + claim.gstCents).toBe(claim.totalCents)
      if ((NEO_GST_INCLUSIVE_KINDS as readonly string[]).includes(claim.kind)) {
        expect(splitGstInclusiveCents(claim.totalCents)).toEqual({
          gstCents: claim.gstCents,
          netCents: claim.netCents,
        })
      } else {
        expect(claim.gstCents).toBe(0)
      }
    }
  })

  it("posts twelve monthly journals to the shareholder loan", () => {
    const months = neoMonthlyJournals()
    expect(months.map((month) => month.entryNumber)).toEqual([
      "NEO-2025-01",
      "NEO-2025-02",
      "NEO-2025-03",
      "NEO-2025-04",
      "NEO-2025-05",
      "NEO-2025-06",
      "NEO-2025-07",
      "NEO-2025-08",
      "NEO-2025-09",
      "NEO-2025-10",
      "NEO-2025-11",
      "NEO-2025-12",
    ])
    let paid = 0
    for (const month of months) {
      expect(neoMonthBalances(month)).toBe(true)
      const loan = neoMonthJournalLines(month).find((line) => line.accountCode === "2310")
      expect(loan?.creditCents).toBe(neoClaimTotals(month.claims).totalCents)
      paid += loan!.creditCents
    }
    expect(paid).toBe(1_220_335)
  })

  it("labels blanks, freight, software, marketing, meals, and capital equipment", () => {
    const byKind = (kind: string) => NEO_2025_CLAIMS.filter((claim) => claim.kind === kind)
    expect(byKind("blanks").every((claim) => claim.accountCode === "5000")).toBe(true)
    expect(byKind("nucleo").every((claim) => claim.accountCode === "6050")).toBe(true)
    expect(byKind("meta").every((claim) => claim.accountCode === "6050")).toBe(true)
    expect(byKind("cursor").every((claim) => claim.accountCode === "6020")).toBe(true)
    expect(byKind("meals").every((claim) => claim.accountCode === "6100")).toBe(true)
    expect(neoMealClaims().reduce((sum, claim) => sum + claim.netCents, 0)).toBe(237_666)
    expect(neoMealsNondeductibleCents()).toBe(118_833)
    expect(neoCcaItems("class8")).toEqual([
      { invoiceNumber: "NEO-2025-01", description: "Bambu Lab 3D printer", costCents: 65_514 },
    ])
    expect(neoCcaItems("class50")).toEqual([
      { invoiceNumber: "NEO-2025-10", description: "Memory Express computer parts", costCents: 30_129 },
    ])
  })

  it("omits grocery, gas, insurance, phone, and California trip spend", () => {
    const haystack = NEO_2025_CLAIMS.map((claim) => `${claim.label} ${claim.description}`).join("\n")
    expect(haystack).not.toMatch(
      /ALLSTATE|FIDO|ROGERS|SHAW |SHELL|SUPER SAVE|COSTCO|WALMART|T&T|FREESTONE|H-MART|DISNEY|ANAHEIM|IN-N-OUT|DIN TAI FUNG|CROLUX|LIZ FLORIST|KLARNA|ENMAX/i
    )
    expect(neoMealClaims().every((claim) => claim.description.includes("CAN"))).toBe(true)
  })
})
