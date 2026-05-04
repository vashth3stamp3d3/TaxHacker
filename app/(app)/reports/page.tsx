import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { formatMoney, getBalanceSheet, getCashFlowStatement, getGstSummary, getIncomeStatement } from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"
import Link from "next/link"

export const metadata = {
  title: "Reports",
}

export default async function ReportsPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const [income, balance, cashFlow, gst] = await Promise.all([
    getIncomeStatement(organization.id),
    getBalanceSheet(organization.id),
    getCashFlowStatement(organization.id),
    getGstSummary(organization.id),
  ])

  const reports = [
    ["Trial Balance", "/reports/trial-balance", "Verify debits and credits across all accounts."],
    ["Income Statement", "/reports/income-statement", "Revenue, COGS, expenses, and net income."],
    ["Balance Sheet", "/reports/balance-sheet", "Assets, liabilities, and equity."],
    ["Cash Flow", "/reports/cash-flow", "Cash movement summary from cash accounts."],
    ["GST Summary", "/taxes/gst", "GST collected, ITCs, and net remittance."],
  ] as const

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Financial statements powered by the general ledger.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Net Income</CardTitle>
            <CardDescription>Current GL net income</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(income.netIncome)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
            <CardDescription>Balance sheet assets</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(balance.assets)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ending Cash</CardTitle>
            <CardDescription>Cash account total</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(cashFlow.endingCash)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>GST Net Tax</CardTitle>
            <CardDescription>Collected less ITCs</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(gst.netTax)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map(([title, href, description]) => (
          <Card key={href}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={href}>Open report</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
