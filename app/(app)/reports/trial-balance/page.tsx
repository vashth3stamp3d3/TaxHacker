import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PortalPageHeader } from "@/components/portal/page-header"
import { getCurrentUser } from "@/lib/auth"
import { getTrialBalance } from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"
import { AccountBalanceTable } from "../_components"

export const metadata = {
  title: "Trial Balance",
}

export default async function TrialBalancePage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const balances = await getTrialBalance(organization.id)

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <PortalPageHeader
        title="Trial balance"
        organizationName={organization.name}
        gstNumber={organization.gstHstRegistrationNumber}
        description="All ledger account debits, credits, and normal balances"
        actions={
          <Button asChild variant="outline">
            <a href="/reports/trial-balance/export">Export CSV</a>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Accounts with no activity are included so setup gaps are visible.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountBalanceTable accounts={balances} />
        </CardContent>
      </Card>
    </div>
  )
}
