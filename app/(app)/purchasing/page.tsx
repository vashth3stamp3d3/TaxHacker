import { createPurchaseOrderAction, createVendorBillAction, createVendorPaymentAction, receivePurchaseOrderAction } from "@/app/(app)/purchasing/actions"
import { PortalPageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { getWorkingYear } from "@/lib/working-year"
import { formatMoney } from "@/models/accounting"
import { getOpenAp, getVendorBills, getVendorPayments, getVendors } from "@/models/commerce"
import { getGoodsReceipts, getItems, getPurchaseOrders, getWarehouses } from "@/models/inventory"
import { ensureActiveOrganization } from "@/models/organizations"

export const metadata = {
  title: "Purchasing",
}

export default async function PurchasingPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const year = await getWorkingYear()
  const [vendors, bills, payments, purchaseOrders, receipts, items, warehouses, openAp] = await Promise.all([
    getVendors(organization.id),
    getVendorBills(organization.id, year.year),
    getVendorPayments(organization.id, year.year),
    getPurchaseOrders(organization.id, year.year),
    getGoodsReceipts(organization.id, year.year),
    getItems(organization.id),
    getWarehouses(organization.id),
    getOpenAp(organization.id, undefined, year.year),
  ])

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <PortalPageHeader
        title="Purchasing"
        organizationName={organization.name}
        gstNumber={organization.gstHstRegistrationNumber}
        workingYear={year.year}
        description="PO receives stock to GRNI; vendor bills post AP and GST ITCs"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create purchase order</CardTitle>
            <CardDescription>PO does not post. Receiving stocks inventory against GRNI.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createPurchaseOrderAction} className="space-y-3">
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
                <Label>Item</Label>
                <select name="itemId" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">No SKU</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} · {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" defaultValue="1" />
              </div>
              <div>
                <Label htmlFor="unitCost">Unit cost</Label>
                <Input id="unitCost" name="unitCost" type="number" step="0.01" defaultValue="10.00" />
              </div>
              <Button type="submit">Create PO</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Receive PO</CardTitle>
            <CardDescription>Debits inventory, credits 2010 GRNI. GST waits for the bill.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={receivePurchaseOrderAction} className="space-y-3">
              <div>
                <Label>Purchase order</Label>
                <select name="purchaseOrderId" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {purchaseOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber} · {order.status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Warehouse</Label>
                <select name="warehouseId" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit">Receive</Button>
            </form>
          </CardContent>
        </Card>
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
                <Label>Match goods receipt</Label>
                <select name="goodsReceiptId" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Expense bill (no inventory)</option>
                  {receipts.map((receipt) => (
                    <option key={receipt.id} value={receipt.id}>
                      {receipt.receiptNumber}
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
                <Label>Apply to bill</Label>
                <select name="vendorBillId" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Unapplied payment</option>
                  {openAp
                    .filter((bill) => bill.balance > 0)
                    .map((bill) => (
                      <option key={bill.id} value={bill.id}>
                        {bill.billNumber} · {formatMoney(bill.balance)} open
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
          <CardTitle>Purchase orders / receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((order) => (
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
