import { updateCustomerAction } from "@/app/(app)/customers/actions"
import { PortalPageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { getWorkingYear } from "@/lib/working-year"
import { formatMoney } from "@/models/accounting"
import { getCustomer, getOpenAr } from "@/models/commerce"
import { ensureActiveOrganization } from "@/models/organizations"
import { notFound } from "next/navigation"

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const year = await getWorkingYear()
  const customer = await getCustomer(organization.id, id)
  if (!customer) notFound()
  const invoices = await getOpenAr(organization.id, customer.id, year.year)

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5 self-center p-5">
      <PortalPageHeader
        title={customer.name}
        organizationName={organization.name}
        gstNumber={organization.gstHstRegistrationNumber}
        workingYear={year.year}
        description={`${customer.code} · ${customer.paymentTerms}`}
        entityType="customer"
        entityId={customer.id}
      />
      <Card>
        <CardHeader>
          <CardTitle>Customer record</CardTitle>
          <CardDescription>Tax-exempt customers do not get GST on invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateCustomerAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value={customer.id} />
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={customer.name} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" defaultValue={customer.email || ""} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={customer.phone || ""} />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Payment terms</Label>
              <Input id="paymentTerms" name="paymentTerms" defaultValue={customer.paymentTerms} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={customer.address || ""} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="taxExempt" defaultChecked={customer.taxExempt} />
              GST tax exempt
            </label>
            <div className="flex items-end">
              <Button type="submit">Save customer</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Open invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.status}</TableCell>
                  <TableCell className="text-right">{formatMoney(invoice.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
