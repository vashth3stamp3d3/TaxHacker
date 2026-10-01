import { describe, expect, it } from "vitest"
import {
  ENMAX_2025_BILLS,
  enmaxAmountDueCents,
  enmaxBillBalances,
  enmaxGstCents,
  enmaxNewChargeCents,
  enmaxUtilityCents,
} from "./enmax-2025-utilities"

describe("ENMAX 2025 shop utilities", () => {
  it("covers twelve monthly bills in date order", () => {
    expect(ENMAX_2025_BILLS).toHaveLength(12)
    expect(ENMAX_2025_BILLS.map((bill) => bill.billDate)).toEqual([
      "2025-01-21",
      "2025-02-19",
      "2025-03-19",
      "2025-04-17",
      "2025-05-20",
      "2025-06-18",
      "2025-07-21",
      "2025-08-20",
      "2025-09-18",
      "2025-10-21",
      "2025-11-19",
      "2025-12-17",
    ])
  })

  it("books electricity, gas, and GST without expensing the returned January payment twice", () => {
    let utilities = 0
    let gst = 0
    for (const bill of ENMAX_2025_BILLS) {
      expect(enmaxBillBalances(bill)).toBe(true)
      expect(bill.electricityCents + bill.naturalGasCents + bill.lateFeeCents + enmaxGstCents(bill)).toBe(
        enmaxNewChargeCents(bill)
      )
      utilities += enmaxUtilityCents(bill)
      gst += enmaxGstCents(bill)
    }
    const february = ENMAX_2025_BILLS[1]
    expect(february.returnedPaymentCents).toBe(49_905)
    expect(enmaxAmountDueCents(february)).toBe(104_066)
    expect(enmaxNewChargeCents(february)).toBe(54_161)
    expect(utilities).toBe(365_463)
    expect(gst).toBe(18_224)
    expect(utilities + gst).toBe(383_687)
  })
})
