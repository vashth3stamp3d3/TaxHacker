import { PortalPageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { getWorkingYear } from "@/lib/working-year"
import { formatMoney, getBalanceSheet, getCashFlowStatement, getGstSummary, getIncomeStatement } from "@/models/accounting"
import { ensureActiveOrganization, getLedgerBalanceSnapshots } from "@/models/organizations"
import { FiledT2GifiCard } from "@/components/portal/filed-t2-gifi"
import { LedgerSnapshotsCard } from "@/components/portal/ledger-snapshots"
import Link from "next/link"

export const metadata = {
  title: "Reports",
}

export default async function ReportsPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const year = await getWorkingYear()
  const [income, balance, cashFlow, gst, snapshots] = await Promise.all([
    getIncomeStatement(organization.id, year.year),
    getBalanceSheet(organization.id, year.year),
    getCashFlowStatement(organization.id, year.year),
    getGstSummary(organization.id, { from: year.startsAt, to: year.endsAt }),
    getLedgerBalanceSnapshots(organization.id, year.year),
  ])

  const reports = [
    ["Trial Balance", "/reports/trial-balance", "Verify debits and credits across all accounts."],
    ["Income Statement", "/reports/income-statement", "Revenue, COGS, expenses, and net income."],
    ["Balance Sheet", "/reports/balance-sheet", "Assets, liabilities, and equity."],
    ["Cash Flow", "/reports/cash-flow", "Cash movement summary from cash accounts."],
    ["GST Summary", "/taxes/gst", "GST collected, ITCs, and net remittance."],
    ["T2 Worksheet", "/taxes/t2", `${year.year} corporate tax planning estimate from this fiscal year's books.`],
  ] as const

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <PortalPageHeader
        title="Reports"
        organizationName={organization.name}
        gstNumber={organization.gstHstRegistrationNumber}
        workingYear={year.year}
        description="Statements and GST from the general ledger for the selected year"
        actions={
          <Button asChild variant="outline">
            <a href="/reports/trial-balance/export">Export trial balance</a>
          </Button>
        }
      />

      <FiledT2GifiCard year={year.year} />
      <LedgerSnapshotsCard snapshots={snapshots} year={year.year} />

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
