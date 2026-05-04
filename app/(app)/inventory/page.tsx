import { consumeInventoryAction, createInventoryItemAction, receiveInventoryAction } from "@/app/(app)/inventory/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { formatMoney } from "@/models/accounting"
import { getInventoryMovements, getItems, getStockBalances, getWarehouses } from "@/models/inventory"
import { ensureActiveOrganization } from "@/models/organizations"

export const metadata = {
  title: "Inventory",
}

export default async function InventoryPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const [items, warehouses, balances, movements] = await Promise.all([
    getItems(organization.id),
    getWarehouses(organization.id),
    getStockBalances(organization.id),
    getInventoryMovements(organization.id),
  ])
  const defaultWarehouse = warehouses[0]

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Item catalog, stock balances, movements, valuation, and COGS postings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add item</CardTitle>
          <CardDescription>Create paper, ink, toner, supply, or finished-good SKUs.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createInventoryItemAction} className="grid gap-4 md:grid-cols-6">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" required />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="unitOfMeasure">Unit</Label>
              <Input id="unitOfMeasure" name="unitOfMeasure" defaultValue="each" />
            </div>
            <div>
              <Label htmlFor="standardCost">Cost</Label>
              <Input id="standardCost" name="standardCost" type="number" step="0.01" defaultValue="0.00" />
            </div>
            <div>
              <Label htmlFor="salesPrice">Price</Label>
              <Input id="salesPrice" name="salesPrice" type="number" step="0.01" defaultValue="0.00" />
            </div>
            <div className="md:col-span-6">
              <Button type="submit">Add Item</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <InventoryMovementForm
          title="Receive stock"
          description="Debit inventory and credit accrued AP."
          action={receiveInventoryAction}
          items={items}
          warehouseId={defaultWarehouse?.id}
          submitLabel="Receive"
        />
        <InventoryMovementForm
          title="Consume stock"
          description="Debit COGS and credit inventory."
          action={consumeInventoryAction}
          items={items}
          warehouseId={defaultWarehouse?.id}
          submitLabel="Consume"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Average Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((balance) => {
                const item = items.find((candidate) => candidate.id === balance.itemId)
                return (
                  <TableRow key={balance.id}>
                    <TableCell>{item ? `${item.sku} - ${item.name}` : balance.itemId}</TableCell>
                    <TableCell className="text-right">{balance.quantityOnHand}</TableCell>
                    <TableCell className="text-right">{formatMoney(balance.averageCost)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent movements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => {
                const item = items.find((candidate) => candidate.id === movement.itemId)
                return (
                  <TableRow key={movement.id}>
                    <TableCell>{movement.occurredAt.toLocaleDateString("en-CA")}</TableCell>
                    <TableCell>{movement.movementType}</TableCell>
                    <TableCell>{item ? `${item.sku} - ${item.name}` : movement.itemId}</TableCell>
                    <TableCell className="text-right">{movement.quantity}</TableCell>
                    <TableCell className="text-right">{formatMoney(movement.unitCost)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function InventoryMovementForm({
  title,
  description,
  action,
  items,
  warehouseId,
  submitLabel,
}: {
  title: string
  description: string
  action: (formData: FormData) => Promise<void>
  items: { id: string; sku: string; name: string; standardCost: number }[]
  warehouseId?: string
  submitLabel: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-3">
          <input type="hidden" name="warehouseId" value={warehouseId || ""} />
          <div>
            <Label>Item</Label>
            <select name="itemId" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor={`${submitLabel}-quantity`}>Quantity</Label>
            <Input id={`${submitLabel}-quantity`} name="quantity" type="number" min="1" step="1" defaultValue="1" />
          </div>
          <div>
            <Label htmlFor={`${submitLabel}-unitCost`}>Unit cost</Label>
            <Input id={`${submitLabel}-unitCost`} name="unitCost" type="number" min="0.01" step="0.01" defaultValue="1.00" />
          </div>
          <Button type="submit" disabled={!items.length || !warehouseId}>
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
