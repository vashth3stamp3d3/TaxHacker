import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { getWorkingYear } from "@/lib/working-year"
import { getBalanceSheet } from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"
import { AccountBalanceTable, StatementCard } from "../_components"

export const metadata = {
  title: "Balance Sheet",
}

export default async function BalanceSheetPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const year = await getWorkingYear()
  const statement = await getBalanceSheet(organization.id, year.year)

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Balance Sheet</h1>
        <p className="text-muted-foreground">Assets, liabilities, and equity as of {year.year}-12-31, including earlier posted activity.</p>
      </div>
      <StatementCard
        title="Summary"
        description="Balance sheet equation check."
        rows={[
          { label: "Assets", value: statement.assets },
          { label: "Liabilities", value: statement.liabilities },
          { label: "Equity", value: statement.equity },
          { label: "Check Difference", value: statement.check, strong: true },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Balance sheet accounts</CardTitle>
          <CardDescription>Asset, liability, and equity account detail.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountBalanceTable accounts={statement.accounts} />
        </CardContent>
      </Card>
    </div>
  )
}
