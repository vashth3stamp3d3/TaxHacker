import {
  createCustomerInvoiceAction,
  createCustomerPaymentAction,
  createQuoteAction,
  createSalesOrderAction,
} from "@/app/(app)/sales/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { formatMoney } from "@/models/accounting"
import { getCustomerInvoices, getCustomerPayments, getCustomers } from "@/models/commerce"
import { ensureActiveOrganization } from "@/models/organizations"
import { getQuotes, getSalesOrders } from "@/models/operations"

export const metadata = {
  title: "Sales",
}

export default async function SalesPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const [customers, invoices, payments, quotes, salesOrders] = await Promise.all([
    getCustomers(organization.id),
    getCustomerInvoices(organization.id),
    getCustomerPayments(organization.id),
    getQuotes(organization.id),
    getSalesOrders(organization.id),
  ])

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
        <p className="text-muted-foreground">GST-aware invoices and customer payments that post automatically.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SalesDocumentForm
          title="Create quote"
          description="Start pricing for a print job before it becomes an order."
          action={createQuoteAction}
          customers={customers}
          submitLabel="Create Quote"
          defaultDescription="Quote for print job"
          defaultAmount="100.00"
        />
        <SalesDocumentForm
          title="Create sales order"
          description="Create an order ready for production and job tracking."
          action={createSalesOrderAction}
          customers={customers}
          submitLabel="Create Order"
          defaultDescription="Sales order"
          defaultAmount="100.00"
        />
        <Card>
          <CardHeader>
            <CardTitle>Post customer invoice</CardTitle>
            <CardDescription>Creates AR, revenue, and GST collected journal lines.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCustomerInvoiceAction} className="space-y-3">
              <div>
                <Label>Customer</Label>
                <select name="customerId" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Walk-in customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" defaultValue="Print job invoice" />
              </div>
              <div>
                <Label htmlFor="amount">Taxable subtotal</Label>
                <Input id="amount" name="amount" type="number" min="0.01" step="0.01" defaultValue="100.00" />
              </div>
              <Button type="submit">Post Invoice</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Record customer payment</CardTitle>
            <CardDescription>Creates cash and AR journal lines.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCustomerPaymentAction} className="space-y-3">
              <div>
                <Label>Customer</Label>
                <select name="customerId" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Walk-in customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
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
                <Input id="memo" name="memo" defaultValue="Customer payment" />
              </div>
              <Button type="submit">Record Payment</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono">{quote.quoteNumber}</TableCell>
                    <TableCell>{quote.status}</TableCell>
                    <TableCell className="text-right">{formatMoney(quote.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sales orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.orderNumber}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell className="text-right">{formatMoney(order.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">GST</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.status}</TableCell>
                  <TableCell className="text-right">{formatMoney(invoice.subtotal)}</TableCell>
                  <TableCell className="text-right">{formatMoney(invoice.taxTotal)}</TableCell>
                  <TableCell className="text-right">{formatMoney(invoice.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
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

function SalesDocumentForm({
  title,
  description,
  action,
  customers,
  submitLabel,
  defaultDescription,
  defaultAmount,
}: {
  title: string
  description: string
  action: (formData: FormData) => Promise<void>
  customers: { id: string; name: string }[]
  submitLabel: string
  defaultDescription: string
  defaultAmount: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-3">
          <div>
            <Label>Customer</Label>
            <select name="customerId" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">Walk-in customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor={`${submitLabel}-description`}>Description</Label>
            <Input id={`${submitLabel}-description`} name="description" defaultValue={defaultDescription} />
          </div>
          <div>
            <Label htmlFor={`${submitLabel}-amount`}>Taxable subtotal</Label>
            <Input id={`${submitLabel}-amount`} name="amount" type="number" min="0.01" step="0.01" defaultValue={defaultAmount} />
          </div>
          <Button type="submit">{submitLabel}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
