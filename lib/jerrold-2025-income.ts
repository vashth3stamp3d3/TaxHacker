/**
 * 2025 Shopify payouts already landed in Jerrold Jacobe's personal account
 * and were used to pay shop bills. Sales stay corporate income. The cash is
 * moved off 1020 onto 2310, owner-paid bills already credit 2310, and the
 * leftover draw is 2025 officer wages so it is T4 income to Jerrold and a
 * deductible expense to Formulated Prints. That keeps 2310 as a credit
 * (company owes him the filed 2024 $664.00) instead of a 15(2) debit.
 *
 * CPP, EI, and source deductions are not remitted by this journal. Issue a
 * T4 for the wage amount and file payroll with a CPA.
 */

import { ALIBABA_SHAREHOLDER_INVOICES } from "@/lib/alibaba-shareholder-invoices"
import { AMAZON_SHAREHOLDER_INVOICES } from "@/lib/amazon-shareholder-invoices"
import { MACBOOK_2025 } from "@/lib/macbook-2025"
import { neoClaimTotals } from "@/lib/neo-2025-claims"
import { shopify2025SalesCashCents } from "@/lib/shopify-2025-sales"
import { T2_2024_SCHEDULE_100 } from "@/lib/tax/t2-2024-filed"
import { TRADINGVIEW_2025 } from "@/lib/tradingview-2025"

export const JERROLD_2025_SOURCE = "jerrold-2025-income"
export const JERROLD_2025_DEPOSITS_ENTRY = "JERROLD-2025-DEPOSITS"
export const JERROLD_2025_WAGES_ENTRY = "T4-2025"
export const JERROLD_2025_YEAR = 2025
export const JERROLD_2025_POSTED_AT = new Date(Date.UTC(2025, 11, 31, 18, 0, 0, 0))

export type JerroldJournalLine = {
  accountCode: string
  accountName: string
  debitCents: number
  creditCents: number
  memo: string
}

export function jerrold2025OwnerPaidCents() {
  const alibaba = ALIBABA_SHAREHOLDER_INVOICES.reduce((sum, invoice) => sum + invoice.amountPaidCents, 0)
  const amazon = AMAZON_SHAREHOLDER_INVOICES.reduce((sum, invoice) => sum + invoice.totalCents, 0)
  return alibaba + amazon + TRADINGVIEW_2025.totalCents + MACBOOK_2025.totalCents + neoClaimTotals().totalCents
}

export function jerrold2025DepositsCents() {
  return shopify2025SalesCashCents()
}

export function jerrold2025OfficerWagesCents() {
  return jerrold2025DepositsCents() - jerrold2025OwnerPaidCents()
}

export function jerrold2025ClosingLoanCreditCents() {
  return T2_2024_SCHEDULE_100.shareholderLoan
}

export const JERROLD_2025_INCOME = {
  depositsCents: jerrold2025DepositsCents(),
  ownerPaidCents: jerrold2025OwnerPaidCents(),
  wagesCents: jerrold2025OfficerWagesCents(),
  openingLoanCreditCents: T2_2024_SCHEDULE_100.shareholderLoan,
  closingLoanCreditCents: jerrold2025ClosingLoanCreditCents(),
} as const

export function jerrold2025DepositLines(): JerroldJournalLine[] {
  const depositsCents = jerrold2025DepositsCents()
  return [
    {
      accountCode: "2310",
      accountName: "Shareholder Loan - Jerrold",
      debitCents: depositsCents,
      creditCents: 0,
      memo: "Shopify 2025 payouts deposited to Jerrold Jacobe",
    },
    {
      accountCode: "1020",
      accountName: "Undeposited Funds",
      debitCents: 0,
      creditCents: depositsCents,
      memo: "Clear Shopify 2025 undeposited funds to shareholder",
    },
  ]
}

export function jerrold2025WageLines(): JerroldJournalLine[] {
  const wagesCents = jerrold2025OfficerWagesCents()
  return [
    {
      accountCode: "6200",
      accountName: "Officer Wages - Jerrold",
      debitCents: wagesCents,
      creditCents: 0,
      memo: "2025 officer wages equal to net personal-account draw",
    },
    {
      accountCode: "2310",
      accountName: "Shareholder Loan - Jerrold",
      debitCents: 0,
      creditCents: wagesCents,
      memo: "T4-2025 wages already taken from personal deposits",
    },
  ]
}

export function jerrold2025Journals() {
  return [
    {
      entryNumber: JERROLD_2025_DEPOSITS_ENTRY,
      postedAt: JERROLD_2025_POSTED_AT,
      description: "Shopify 2025 payouts deposited to Jerrold Jacobe",
      lines: jerrold2025DepositLines(),
    },
    {
      entryNumber: JERROLD_2025_WAGES_ENTRY,
      postedAt: JERROLD_2025_POSTED_AT,
      description: "2025 officer wages — Jerrold Jacobe T4",
      lines: jerrold2025WageLines(),
    },
  ]
}

export function jerrold2025Balances() {
  const deposits = jerrold2025DepositsCents()
  const paid = jerrold2025OwnerPaidCents()
  const wages = jerrold2025OfficerWagesCents()
  const depositLines = jerrold2025DepositLines()
  const wageLines = jerrold2025WageLines()
  const depositDebit = depositLines.reduce((sum, line) => sum + line.debitCents, 0)
  const depositCredit = depositLines.reduce((sum, line) => sum + line.creditCents, 0)
  const wageDebit = wageLines.reduce((sum, line) => sum + line.debitCents, 0)
  const wageCredit = wageLines.reduce((sum, line) => sum + line.creditCents, 0)
  return {
    deposits,
    paid,
    wages,
    depositBalanced: depositDebit === depositCredit && depositDebit === deposits,
    wageBalanced: wageDebit === wageCredit && wageDebit === wages,
    wagesAreResidual: wages === deposits - paid && wages > 0,
    loanStaysCredit: jerrold2025ClosingLoanCreditCents() === T2_2024_SCHEDULE_100.shareholderLoan,
  }
}
