import { remitGstAction } from "@/app/(app)/taxes/gst/actions"
import { PortalPageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { formatMoney } from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"
import { getGstRegister, getTaxFilingPeriods, getTaxRemittances } from "@/models/tax"

export const metadata = {
  title: "GST",
}

export default async function GstPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; error?: string; saved?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const periods = await getTaxFilingPeriods(organization.id)
  const selected = periods.find((period) => period.id === params.period) || periods[0]
  const [register, remittances] = await Promise.all([
    getGstRegister(
      organization.id,
      selected ? { from: selected.startsAt, to: selected.endsAt } : undefined
    ),
    getTaxRemittances(organization.id),
  ])

  return (
    <div className="flex w-full max-w-7xl flex-col gap-5 self-center p-5">
      <PortalPageHeader
        title="GST register"
        organizationName={organization.name}
        gstNumber={organization.gstHstRegistrationNumber}
        description="Collected GST, ITCs, and remittance from posted journals"
        entityType={selected ? "gst_period" : undefined}
        entityId={selected?.id}
        actions={
          <Button asChild variant="outline">
            <a href={`/taxes/gst/export${selected ? `?period=${selected.id}` : ""}`}>Export CSV</a>
          </Button>
        }
      />

      {params.saved ? <div className="rounded-md border bg-muted px-4 py-3 text-sm">GST remittance posted.</div> : null}
      {params.error ? (
        <div className="rounded-md border border-destructive px-4 py-3 text-sm text-destructive">{params.error}</div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {periods.map((period) => (
          <Button key={period.id} asChild size="sm" variant={period.id === selected?.id ? "default" : "outline"}>
            <a href={`/taxes/gst?period=${period.id}`}>
              {period.startsAt.toISOString().slice(0, 10)} · {period.status}
            </a>
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Summary title="GST collected" amount={register.collected} detail="Credit-heavy GST journal lines" />
        <Summary title="Input tax credits" amount={register.inputCredits} detail="Debit-heavy GST journal lines" />
        <Summary title="Net tax" amount={register.netTax} detail="Estimated remittance or refund" />
      </div>

      {selected && selected.status === "open" ? (
        <Card>
          <CardHeader>
            <CardTitle>Post remittance</CardTitle>
            <CardDescription>
              Clears GST collected and ITCs for this period. Leave pay now unchecked to park the net in 2110.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={remitGstAction} className="flex flex-wrap items-center gap-4">
              <input type="hidden" name="filingPeriodId" value={selected.id} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="payNow" />
                Pay from operating cash now
              </label>
              <Button type="submit">Post GST remittance</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Register lines</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead className="text-right">ITC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {register.lines.map((line) => (
                <TableRow key={line.journalLineId}>
                  <TableCell>{line.postedAt.toISOString().slice(0, 10)}</TableCell>
                  <TableCell className="font-mono">{line.entryNumber}</TableCell>
                  <TableCell>{line.source}</TableCell>
                  <TableCell>{line.taxCode}</TableCell>
                  <TableCell className="text-right">{formatMoney(line.collected)}</TableCell>
                  <TableCell className="text-right">{formatMoney(line.inputCredit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Remittances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead className="text-right">ITCs</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {remittances.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.status}</TableCell>
                  <TableCell className="text-right">{formatMoney(row.collected)}</TableCell>
                  <TableCell className="text-right">{formatMoney(row.inputCredits)}</TableCell>
                  <TableCell className="text-right">{formatMoney(row.netTax)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Summary({ title, amount, detail }: { title: string; amount: number; detail: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{detail}</CardDescription>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{formatMoney(amount)}</CardContent>
    </Card>
  )
}
