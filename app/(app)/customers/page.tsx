import { createCustomerAction } from "@/app/(app)/customers/actions"
import { PortalPageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import Link from "next/link"
import { getCustomers } from "@/models/commerce"
import { ensureActiveOrganization } from "@/models/organizations"

export const metadata = {
  title: "Customers",
}

export default async function CustomersPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const customers = await getCustomers(organization.id)

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <PortalPageHeader
        title="Customers"
        organizationName={organization.name}
        gstNumber={organization.gstHstRegistrationNumber}
        description="Parties, tax-exempt flags, and open AR"
      />
      <Card>
        <CardHeader>
          <CardTitle>Add customer</CardTitle>
          <CardDescription>Create a customer record for sales and receivables.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCustomerAction} className="grid gap-4 md:grid-cols-4">
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
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Add Customer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{customers.length} customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-mono">{customer.code}</TableCell>
                  <TableCell>
                    <Link href={`/customers/${customer.id}`} className="font-medium underline-offset-4 hover:underline">
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
