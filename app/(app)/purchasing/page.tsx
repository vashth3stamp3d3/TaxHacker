import { createVendorBillAction, createVendorPaymentAction } from "@/app/(app)/purchasing/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { formatMoney } from "@/models/accounting"
import { getVendorBills, getVendorPayments, getVendors } from "@/models/commerce"
import { ensureActiveOrganization } from "@/models/organizations"

export const metadata = {
  title: "Purchasing",
}

export default async function PurchasingPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const [vendors, bills, payments] = await Promise.all([
    getVendors(organization.id),
    getVendorBills(organization.id),
    getVendorPayments(organization.id),
  ])

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Purchasing</h1>
        <p className="text-muted-foreground">Vendor bills and payments with GST ITC and AP postings.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Post vendor bill</CardTitle>
            <CardDescription>Creates expense, GST ITC, and AP journal lines.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createVendorBillAction} className="space-y-3">
              <div>
                <Label>Vendor</Label>
                <select name="vendorId" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Unassigned vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" defaultValue="Shop supplies" />
              </div>
              <div>
                <Label htmlFor="amount">Taxable subtotal</Label>
                <Input id="amount" name="amount" type="number" min="0.01" step="0.01" defaultValue="100.00" />
              </div>
              <Button type="submit">Post Bill</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Record vendor payment</CardTitle>
            <CardDescription>Creates AP and cash journal lines.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createVendorPaymentAction} className="space-y-3">
              <div>
                <Label>Vendor</Label>
                <select name="vendorId" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Unassigned vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="paymentAmount">Amount</Label>
                <Input id="paymentAmount" name="amount" type="number" min="0.01" step="0.01" defaultValue="105.00" />
              </div>
              <div>
                <Label htmlFor="memo">Memo</Label>
                <Input id="memo" name="memo" defaultValue="Vendor payment" />
              </div>
              <Button type="submit">Record Payment</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor bills</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">GST ITC</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-mono">{bill.billNumber}</TableCell>
                  <TableCell>{bill.status}</TableCell>
                  <TableCell className="text-right">{formatMoney(bill.subtotal)}</TableCell>
                  <TableCell className="text-right">{formatMoney(bill.taxTotal)}</TableCell>
                  <TableCell className="text-right">{formatMoney(bill.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Memo</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.paidAt.toLocaleDateString("en-CA")}</TableCell>
                  <TableCell>{payment.memo}</TableCell>
                  <TableCell className="text-right">{formatMoney(payment.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
