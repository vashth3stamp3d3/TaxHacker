import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import {
  formatMoney,
  getFinancialBreakdown,
  getGstSummary,
  getIncomeStatement,
  getTrialBalance,
} from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"
import Link from "next/link"

export const metadata = {
  title: "Accounting",
}

export default async function AccountingPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const [trialBalance, incomeStatement, gstSummary, financialBreakdown] = await Promise.all([
    getTrialBalance(organization.id),
    getIncomeStatement(organization.id),
    getGstSummary(organization.id),
    getFinancialBreakdown(organization.id, user.id),
  ])
  const activeAccounts = trialBalance.filter((account) => account.balance !== 0).length

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
        <p className="text-muted-foreground">
          Canadian double-entry accounting for {organization.name}, with Alberta GST defaults.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Net Income</CardTitle>
            <CardDescription>Revenue minus COGS and expenses</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(incomeStatement.netIncome)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>GST Net Tax</CardTitle>
            <CardDescription>GST collected less input tax credits</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(gstSummary.netTax)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Accounts</CardTitle>
            <CardDescription>Accounts with posted balances</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{activeAccounts}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chart of Accounts</CardTitle>
            <CardDescription>Review the Alberta print shop account structure.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/accounting/chart-of-accounts">Open chart of accounts</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Journal Entries</CardTitle>
            <CardDescription>Post balanced entries into the general ledger.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/accounting/journal-entries">Open journal entries</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>YTD and Monthly Breakdown</CardTitle>
          <CardDescription>
            High-level revenue, costs, net income, and transaction activity for {financialBreakdown.year}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">YTD Revenue</div>
              <div className="text-2xl font-semibold">{formatMoney(financialBreakdown.ytd.revenue)}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">YTD Costs</div>
              <div className="text-2xl font-semibold">{formatMoney(financialBreakdown.ytd.costs)}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">YTD Net Income</div>
              <div className="text-2xl font-semibold">{formatMoney(financialBreakdown.ytd.netIncome)}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">YTD Transactions</div>
              <div className="text-2xl font-semibold">{financialBreakdown.ytd.transactionCount}</div>
              <div className="text-sm text-muted-foreground">{formatMoney(financialBreakdown.ytd.transactionTotal)} total</div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Costs</TableHead>
                <TableHead className="text-right">Net Income</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Transaction Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financialBreakdown.monthly.map((month) => (
                <TableRow key={month.month}>
                  <TableCell className="font-medium">{month.label}</TableCell>
                  <TableCell className="text-right">{formatMoney(month.revenue)}</TableCell>
                  <TableCell className="text-right">{formatMoney(month.costs)}</TableCell>
                  <TableCell className="text-right">{formatMoney(month.netIncome)}</TableCell>
                  <TableCell className="text-right">{month.transactionCount}</TableCell>
                  <TableCell className="text-right">{formatMoney(month.transactionTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div>
            <h3 className="mb-3 font-semibold">Recent Transaction Details</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financialBreakdown.recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.issuedAt?.toLocaleDateString("en-CA") || "-"}</TableCell>
                    <TableCell>{transaction.merchant || "-"}</TableCell>
                    <TableCell>{transaction.name || "-"}</TableCell>
                    <TableCell className="capitalize">{transaction.type || "-"}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(transaction.total || 0, transaction.currencyCode || organization.baseCurrency)}
                    </TableCell>
                  </TableRow>
                ))}
                {financialBreakdown.recentTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No transactions posted this year yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
