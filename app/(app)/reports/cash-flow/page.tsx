import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { getCashFlowStatement } from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"
import { AccountBalanceTable, StatementCard } from "../_components"

export const metadata = {
  title: "Cash Flow Statement",
}

export default async function CashFlowPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const statement = await getCashFlowStatement(organization.id)

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cash Flow Statement</h1>
        <p className="text-muted-foreground">Cash movement summary for operating, investing, and financing views.</p>
      </div>
      <StatementCard
        title="Summary"
        description="Initial cash flow view based on cash-classified accounts."
        rows={[
          { label: "Operating", value: statement.operating },
          { label: "Investing", value: statement.investing },
          { label: "Financing", value: statement.financing },
          { label: "Ending Cash", value: statement.endingCash, strong: true },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Cash accounts</CardTitle>
          <CardDescription>Accounts included in cash totals.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountBalanceTable accounts={statement.accounts} />
        </CardContent>
      </Card>
    </div>
  )
}
