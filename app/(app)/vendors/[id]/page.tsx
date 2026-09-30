import { updateVendorAction } from "@/app/(app)/vendors/actions"
import { PortalPageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { getWorkingYear } from "@/lib/working-year"
import { formatMoney } from "@/models/accounting"
import { getOpenAp, getVendor } from "@/models/commerce"
import { ensureActiveOrganization } from "@/models/organizations"
import { notFound } from "next/navigation"

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const year = await getWorkingYear()
  const vendor = await getVendor(organization.id, id)
  if (!vendor) notFound()
  const bills = await getOpenAp(organization.id, vendor.id, year.year)

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5 self-center p-5">
      <PortalPageHeader
        title={vendor.name}
        organizationName={organization.name}
        gstNumber={organization.gstHstRegistrationNumber}
        workingYear={year.year}
        description={vendor.gstNumber ? `Vendor GST ${vendor.gstNumber}` : "No GST number on file"}
        entityType="vendor"
        entityId={vendor.id}
      />
      <Card>
        <CardHeader>
          <CardTitle>Vendor record</CardTitle>
          <CardDescription>ITCs are claimed only when a GST number is present.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateVendorAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value={vendor.id} />
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={vendor.name} />
            </div>
            <div>
              <Label htmlFor="gstNumber">GST number</Label>
              <Input id="gstNumber" name="gstNumber" defaultValue={vendor.gstNumber || ""} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" defaultValue={vendor.email || ""} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={vendor.phone || ""} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={vendor.address || ""} />
            </div>
            <Button type="submit">Save vendor</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Open bills</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-mono">{bill.billNumber}</TableCell>
                  <TableCell>{bill.status}</TableCell>
                  <TableCell className="text-right">{formatMoney(bill.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
