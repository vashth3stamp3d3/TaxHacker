import { describe, expect, it } from "vitest"
import { ALIBABA_SHAREHOLDER_INVOICES } from "./alibaba-shareholder-invoices"
import { AMAZON_SHAREHOLDER_INVOICES } from "./amazon-shareholder-invoices"
import {
  JERROLD_2025_DEPOSITS_ENTRY,
  JERROLD_2025_INCOME,
  JERROLD_2025_WAGES_ENTRY,
  jerrold2025Balances,
  jerrold2025Journals,
} from "./jerrold-2025-income"
import { MACBOOK_2025 } from "./macbook-2025"
import { neoClaimTotals } from "./neo-2025-claims"
import { shopify2025SalesCashCents } from "./shopify-2025-sales"
import { T2_2024_SCHEDULE_100 } from "./tax/t2-2024-filed"
import { TRADINGVIEW_2025 } from "./tradingview-2025"

describe("2025 Jerrold personal-account deposits and officer wages", () => {
  it("clears Shopify cash to 2310 and T4s the residual so the loan stays a credit", () => {
    const alibaba = ALIBABA_SHAREHOLDER_INVOICES.reduce((sum, invoice) => sum + invoice.amountPaidCents, 0)
    const amazon = AMAZON_SHAREHOLDER_INVOICES.reduce((sum, invoice) => sum + invoice.totalCents, 0)
    const paid = alibaba + amazon + TRADINGVIEW_2025.totalCents + MACBOOK_2025.totalCents + neoClaimTotals().totalCents
    const deposits = shopify2025SalesCashCents()
    const wages = deposits - paid
    const totals = jerrold2025Balances()

    expect(alibaba).toBe(1_438_588)
    expect(amazon).toBe(84_283)
    expect(neoClaimTotals().totalCents).toBe(1_220_335)
    expect(deposits).toBe(14_225_815)
    expect(paid).toBe(3_078_160)
    expect(wages).toBe(11_147_655)
    expect(JERROLD_2025_INCOME).toEqual({
      depositsCents: 14_225_815,
      ownerPaidCents: 3_078_160,
      wagesCents: 11_147_655,
      openingLoanCreditCents: T2_2024_SCHEDULE_100.shareholderLoan,
      closingLoanCreditCents: 66_400,
    })
    expect(totals).toMatchObject({
      depositBalanced: true,
      wageBalanced: true,
      wagesAreResidual: true,
      loanStaysCredit: true,
    })
  })

  it("posts deposits then T4 wages to the shareholder loan", () => {
    const journals = jerrold2025Journals()
    expect(journals.map((journal) => journal.entryNumber)).toEqual([
      JERROLD_2025_DEPOSITS_ENTRY,
      JERROLD_2025_WAGES_ENTRY,
    ])
    expect(journals[0].lines).toEqual([
      expect.objectContaining({ accountCode: "2310", debitCents: 14_225_815, creditCents: 0 }),
      expect.objectContaining({ accountCode: "1020", debitCents: 0, creditCents: 14_225_815 }),
    ])
    expect(journals[1].lines).toEqual([
      expect.objectContaining({ accountCode: "6200", debitCents: 11_147_655, creditCents: 0 }),
      expect.objectContaining({ accountCode: "2310", debitCents: 0, creditCents: 11_147_655 }),
    ])
  })
})
