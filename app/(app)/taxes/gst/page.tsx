import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { formatMoney, getGstSummary } from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"

export const metadata = {
  title: "GST",
}

export default async function GstPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const summary = await getGstSummary(organization.id)

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">GST</h1>
        <p className="text-muted-foreground">Alberta GST tracking for collected GST, ITCs, and remittance planning.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>GST Collected</CardTitle>
            <CardDescription>Tax collected on taxable sales</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(summary.collected)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Input Tax Credits</CardTitle>
            <CardDescription>Recoverable GST on eligible purchases</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(summary.inputCredits)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net Tax</CardTitle>
            <CardDescription>Estimated remittance or refund</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(summary.netTax)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tax codes</CardTitle>
          <CardDescription>Default Alberta GST setup, expandable for other provinces later.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Recoverable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.taxCodes.map((taxCode) => (
                <TableRow key={taxCode.id}>
                  <TableCell className="font-mono">{taxCode.code}</TableCell>
                  <TableCell>{taxCode.name}</TableCell>
                  <TableCell>{taxCode.taxType}</TableCell>
                  <TableCell className="text-right">{(taxCode.rateBasisPoints / 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-right">
                    {(taxCode.recoverableBasisPoints / 100).toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
