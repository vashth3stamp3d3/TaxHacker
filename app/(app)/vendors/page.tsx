import { createVendorAction } from "@/app/(app)/vendors/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { getVendors } from "@/models/commerce"
import { ensureActiveOrganization } from "@/models/organizations"

export const metadata = {
  title: "Vendors",
}

export default async function VendorsPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const vendors = await getVendors(organization.id)

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
        <p className="text-muted-foreground">Vendor master data for purchasing, AP, and GST input credits.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add vendor</CardTitle>
          <CardDescription>Create a supplier record for purchases and payables.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createVendorAction} className="grid gap-4 md:grid-cols-5">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div>
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input id="gstNumber" name="gstNumber" />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Add Vendor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{vendors.length} vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>GST Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-mono">{vendor.code}</TableCell>
                  <TableCell>{vendor.name}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.phone}</TableCell>
                  <TableCell>{vendor.gstNumber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
