import { addJobLaborAction, addJobMaterialAction, advanceJobStatusAction, createPrintJobAction } from "@/app/(app)/jobs/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { formatMoney } from "@/models/accounting"
import { getCustomers } from "@/models/commerce"
import { getItems } from "@/models/inventory"
import { ensureActiveOrganization } from "@/models/organizations"
import { getJobLabor, getJobMaterials, getPrintJobs, getSalesOrders } from "@/models/operations"

export const metadata = {
  title: "Print Jobs",
}

export default async function JobsPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const [customers, salesOrders, jobs, items, materials, labor] = await Promise.all([
    getCustomers(organization.id),
    getSalesOrders(organization.id),
    getPrintJobs(organization.id),
    getItems(organization.id),
    getJobMaterials(organization.id),
    getJobLabor(organization.id),
  ])

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Print Jobs</h1>
        <p className="text-muted-foreground">Production tracking, material/labor capture, and quote-to-actual costing.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create print job</CardTitle>
          <CardDescription>Start a production job from a customer or sales order.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createPrintJobAction} className="grid gap-4 md:grid-cols-5">
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
              <Label>Sales order</Label>
              <select name="salesOrderId" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">No order</option>
                {salesOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="name">Job name</Label>
              <Input id="name" name="name" defaultValue="Print job" />
            </div>
            <div>
              <Label htmlFor="quotedTotal">Quoted total</Label>
              <Input id="quotedTotal" name="quotedTotal" type="number" step="0.01" defaultValue="100.00" />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Create Job
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <JobMaterialForm jobs={jobs} items={items} />
        <JobLaborForm jobs={jobs} />
        <JobStatusForm jobs={jobs} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>Actual cost updates from material and labor entries.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quoted</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono">{job.jobNumber}</TableCell>
                  <TableCell>{job.name}</TableCell>
                  <TableCell>{job.status}</TableCell>
                  <TableCell className="text-right">{formatMoney(job.quotedTotal)}</TableCell>
                  <TableCell className="text-right">{formatMoney(job.actualCost)}</TableCell>
                  <TableCell className="text-right">{formatMoney(job.quotedTotal - job.actualCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Material usage</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>{jobs.find((job) => job.id === material.printJobId)?.jobNumber}</TableCell>
                    <TableCell>{items.find((item) => item.id === material.itemId)?.name}</TableCell>
                    <TableCell className="text-right">{material.quantity}</TableCell>
                    <TableCell className="text-right">{formatMoney(material.quantity * material.unitCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Labor</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Minutes</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labor.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{jobs.find((job) => job.id === line.printJobId)?.jobNumber}</TableCell>
                    <TableCell>{line.description}</TableCell>
                    <TableCell className="text-right">{line.minutes}</TableCell>
                    <TableCell className="text-right">{formatMoney(Math.round((line.minutes / 60) * line.rate))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function JobMaterialForm({
  jobs,
  items,
}: {
  jobs: { id: string; jobNumber: string; name: string }[]
  items: { id: string; sku: string; name: string; standardCost: number }[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add material</CardTitle>
        <CardDescription>Capture actual job materials.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={addJobMaterialAction} className="space-y-3">
          <JobSelect jobs={jobs} />
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
          <Input name="quantity" type="number" min="1" defaultValue="1" />
          <Input name="unitCost" type="number" min="0.01" step="0.01" defaultValue="1.00" />
          <Button type="submit" disabled={!jobs.length || !items.length}>
            Add Material
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function JobLaborForm({ jobs }: { jobs: { id: string; jobNumber: string; name: string }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add labor</CardTitle>
        <CardDescription>Track production labor cost.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={addJobLaborAction} className="space-y-3">
          <JobSelect jobs={jobs} />
          <Input name="description" defaultValue="Production labor" />
          <Input name="minutes" type="number" min="1" defaultValue="30" />
          <Input name="rate" type="number" min="0.01" step="0.01" defaultValue="35.00" />
          <Button type="submit" disabled={!jobs.length}>
            Add Labor
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function JobStatusForm({ jobs }: { jobs: { id: string; jobNumber: string; name: string }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Advance status</CardTitle>
        <CardDescription>Move jobs through production.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={advanceJobStatusAction} className="space-y-3">
          <JobSelect jobs={jobs} />
          <select name="status" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="planned">Planned</option>
            <option value="in_progress">In progress</option>
            <option value="proofing">Proofing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
          </select>
          <Button type="submit" disabled={!jobs.length}>
            Update Status
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function JobSelect({ jobs }: { jobs: { id: string; jobNumber: string; name: string }[] }) {
  return (
    <div>
      <Label>Job</Label>
      <select name="printJobId" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
        {jobs.map((job) => (
          <option key={job.id} value={job.id}>
            {job.jobNumber} - {job.name}
          </option>
        ))}
      </select>
    </div>
  )
}
