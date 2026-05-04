import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { getLedgerAccounts } from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"

export const metadata = {
  title: "Chart of Accounts",
}

export default async function ChartOfAccountsPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const accounts = await getLedgerAccounts(organization.id)

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
        <p className="text-muted-foreground">Default Alberta print shop accounts, ready for GST-aware posting.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{accounts.length} accounts</CardTitle>
          <CardDescription>Accounts are grouped by type and use debit/credit normal balances.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subtype</TableHead>
                <TableHead>Normal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono">{account.code}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{account.type}</Badge>
                  </TableCell>
                  <TableCell>{account.subtype}</TableCell>
                  <TableCell>{account.normalBalance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
