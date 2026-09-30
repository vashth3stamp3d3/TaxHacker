import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { getWorkingYear } from "@/lib/working-year"
import { getIncomeStatement } from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"
import { AccountBalanceTable, StatementCard } from "../_components"

export const metadata = {
  title: "Income Statement",
}

export default async function IncomeStatementPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const year = await getWorkingYear()
  const statement = await getIncomeStatement(organization.id, year.year)

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Income Statement</h1>
        <p className="text-muted-foreground">
          Canadian corporation revenue, COGS, expenses, and net income for {year.year}
          {year.year === 2024 ? ". This matches the filed 2024 T2 GIFI." : "."}
        </p>
      </div>
      <StatementCard
        title="Summary"
        description="Current posted ledger totals."
        rows={[
          { label: "Revenue", value: statement.revenue },
          { label: "COGS", value: statement.cogs },
          { label: "Gross Profit", value: statement.grossProfit, strong: true },
          { label: "Expenses", value: statement.expenses },
          { label: "Net Income", value: statement.netIncome, strong: true },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Income statement accounts</CardTitle>
          <CardDescription>Revenue, COGS, and expense account detail.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountBalanceTable accounts={statement.accounts} />
        </CardContent>
      </Card>
    </div>
  )
}
