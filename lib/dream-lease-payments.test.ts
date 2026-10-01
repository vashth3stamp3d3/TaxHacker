import { describe, expect, it } from "vitest"
import {
  DREAM_LEASE_PAYMENTS,
  DREAM_OPEN_BALANCE_CENTS,
  dreamNetAppliedCents,
  dreamPaymentBalances,
  splitGstIncluded,
} from "./dream-lease-payments"

describe("Dream shop lease payments", () => {
  it("includes every Versapay row and leaves the open balance unpaid", () => {
    expect(DREAM_LEASE_PAYMENTS).toHaveLength(23)
    expect(DREAM_LEASE_PAYMENTS.filter((payment) => payment.status === "reversal")).toHaveLength(1)
    expect(DREAM_OPEN_BALANCE_CENTS).toBe(278_259)
    expect(DREAM_LEASE_PAYMENTS.some((payment) => payment.paidDate === "2025-01-01")).toBe(false)
  })

  it("splits each payment into rent and 5% GST and keeps the NSF from doubling February", () => {
    for (const payment of DREAM_LEASE_PAYMENTS) {
      expect(dreamPaymentBalances(payment)).toBe(true)
      const split = splitGstIncluded(payment.appliedCents)
      expect(split.rentCents + split.gstCents).toBe(payment.appliedCents)
    }
    const february = DREAM_LEASE_PAYMENTS.filter((payment) => payment.paidDate.startsWith("2025-02"))
    expect(february.reduce((sum, payment) => sum + payment.appliedCents, 0)).toBe(263_803)
    expect(splitGstIncluded(263_803)).toEqual({ rentCents: 251_241, gstCents: 12_562 })
    expect(splitGstIncluded(278_259)).toEqual({ rentCents: 265_009, gstCents: 13_250 })
    expect(splitGstIncluded(195_907)).toEqual({ rentCents: 186_578, gstCents: 9_329 })
  })

  it("totals the cash paid in 2025 and 2026", () => {
    expect(dreamNetAppliedCents(2025)).toBe(2_901_833)
    expect(dreamNetAppliedCents(2026)).toBe(2_700_238)
    expect(dreamNetAppliedCents()).toBe(5_602_071)
  })
})
