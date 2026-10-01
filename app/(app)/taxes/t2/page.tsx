import {
  addCustomT2AdjustmentAction,
  createT2JournalEntryAction,
  deleteCustomT2AdjustmentAction,
  saveT2AdjustmentsAction,
} from "@/app/(app)/taxes/t2/actions"
import { Cca2025Card } from "@/components/portal/cca-2025"
import { FiledT2GifiCard } from "@/components/portal/filed-t2-gifi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { centsToDollarInput, formatCents, formatUtcDate } from "@/lib/tax/t2-worksheet"
import { WORKING_YEARS, getWorkingYear } from "@/lib/working-year"
import { formatMoney } from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"
import { getT2PageData } from "@/models/t2"
import Link from "next/link"

export const metadata = {
  title: "T2 Worksheet",
}

export const dynamic = "force-dynamic"

const YEAR_CHOICES = [...WORKING_YEARS]

export default async function T2WorksheetPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; error?: string; saved?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const workingYear = await getWorkingYear()
  const { year, worksheet, accounts, entries } = await getT2PageData(organization.id, params.year ?? workingYear.year)
  const additions = worksheet.adjustments.filter((row) => row.section === "schedule1_addition")
  const deductions = worksheet.adjustments.filter((row) => row.section === "schedule1_deduction")
  const taxableDeductions = worksheet.adjustments.filter((row) => row.section === "taxable_income_deduction")
  const savedMessage =
    params.saved === "journal"
      ? "Journal entry posted. Totals below were recomputed from the ledger."
      : params.saved
        ? "Saved. Totals below were recomputed from the fiscal-year ledger and these adjustments."
        : null

  return (
    <div className="flex w-full max-w-7xl flex-col gap-5 self-center p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{year} T2 worksheet</h1>
          <p className="text-muted-foreground">
            {organization.legalName || organization.name} · fiscal period {worksheet.period.startsAt} to {worksheet.period.endsAt}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {YEAR_CHOICES.map((choice) => (
            <Button key={choice} asChild variant={choice === year ? "default" : "outline"} size="sm">
              <Link href={`/taxes/t2?year=${choice}`}>{choice}</Link>
            </Button>
          ))}
          <Button asChild variant="outline" size="sm">
            <a href={`/taxes/t2/export?year=${year}`}>Export CSV</a>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">
          {year === 2024 ? "2024 book income is the filed T2 GIFI." : "Planning estimate, not a filed return."}
        </p>
        <p>
          {year === 2024
            ? "Schedule 125, Schedule 100, and Schedule 8 from the 2024 T2 are on the books. Book amortization $4,183 was added back and class 8 CCA $4,183 was deducted, so taxable income is $11,045. Filed tax is Part I $993 and Alberta $221."
            : year === 2025
              ? "2025 book depreciation is the maximum CCA $7,346.37: class 8 20% of opening UCC $33,624.00 plus class 12 100% of Amazon equipment under $500. Schedule 1 adds that amount back and deducts the same CCA, so depreciation does not change taxable income versus the books."
              : worksheet.disclaimer}
        </p>
      </div>

      <FiledT2GifiCard year={year} />
      <Cca2025Card year={year} />

      {savedMessage ? <div className="rounded-lg border bg-muted px-4 py-3 text-sm">{savedMessage}</div> : null}
      {params.error ? <div className="rounded-lg border border-destructive px-4 py-3 text-sm text-destructive">{params.error}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Book net income" detail="Fiscal-year journals only" amount={worksheet.books.netIncomeCents} />
        <SummaryCard title="Taxable income" detail="After Schedule 1 and taxable-income deductions" amount={worksheet.taxableIncome.taxableIncomeCents} />
        <SummaryCard title="Federal tax" detail="9% small business / 15% general" amount={worksheet.tax.federalTaxCents} />
        <SummaryCard title="Alberta tax" detail="2% small business / 8% general" amount={worksheet.tax.albertaTaxCents} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estimated tax payable</CardTitle>
          <CardDescription>
            Combined planning estimate {formatCents(worksheet.tax.totalTaxCents)}. Small-business income{" "}
            {formatCents(worksheet.tax.smallBusinessIncomeCents)}; general-rate income {formatCents(worksheet.tax.generalIncomeCents)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {worksheet.tax.assumptions.map((assumption) => (
            <p key={assumption}>{assumption}</p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Books for this fiscal year</CardTitle>
          <CardDescription>
            Revenue {formatCents(worksheet.books.revenueCents)}, COGS {formatCents(worksheet.books.cogsCents)}, expenses{" "}
            {formatCents(worksheet.books.expenseCents)}. Balance-sheet accounts and activity outside this period are excluded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Fiscal-year balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {worksheet.books.accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>No income-statement activity posted in this fiscal year yet.</TableCell>
                </TableRow>
              ) : (
                worksheet.books.accounts.map((account) => (
                  <TableRow key={account.code}>
                    <TableCell>
                      <span className="font-mono">{account.code}</span> {account.name}
                    </TableCell>
                    <TableCell>{account.type}</TableCell>
                    <TableCell className="text-right">{formatMoney(account.balanceCents)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule 1 and taxable income</CardTitle>
          <CardDescription>
            Net income for tax purposes {formatCents(worksheet.schedule1.netIncomeForTaxCents)}. Donation claim allowed{" "}
            {formatCents(worksheet.taxableIncome.donationAllowedCents)} of {formatCents(worksheet.taxableIncome.donationClaimedCents)}{" "}
            (limit {formatCents(worksheet.taxableIncome.donationLimitCents)}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveT2AdjustmentsAction} className="space-y-6">
            <input type="hidden" name="year" value={year} />
            <AdjustmentFields title="Schedule 1 additions" rows={additions} />
            <AdjustmentFields title="Schedule 1 deductions" rows={deductions} />
            <AdjustmentFields title="Deductions in computing taxable income" rows={taxableDeductions} />
            <Button type="submit">Save adjustments and refresh totals</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a custom adjustment</CardTitle>
          <CardDescription>Use this for an amount that is not in the standard fields. It is saved with this tax year.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addCustomT2AdjustmentAction} className="grid gap-4 md:grid-cols-4">
            <input type="hidden" name="year" value={year} />
            <div className="md:col-span-2">
              <Label htmlFor="label">Label</Label>
              <Input id="label" name="label" required placeholder="Example: non-deductible club dues" />
            </div>
            <div>
              <Label htmlFor="section">Section</Label>
              <select id="section" name="section" className="mt-1 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm" defaultValue="schedule1_addition">
                <option value="schedule1_addition">Schedule 1 addition</option>
                <option value="schedule1_deduction">Schedule 1 deduction</option>
                <option value="taxable_income_deduction">Taxable-income deduction</option>
              </select>
            </div>
            <div>
              <Label htmlFor="custom-amount">Amount (CAD)</Label>
              <Input id="custom-amount" name="amount" type="number" min="0" step="0.01" defaultValue="0.00" />
            </div>
            <div className="md:col-span-4">
              <Button type="submit">Add adjustment</Button>
            </div>
          </form>
          {worksheet.adjustments.some((row) => row.isCustom) ? (
            <div className="mt-4 space-y-2">
              {worksheet.adjustments
                .filter((row) => row.isCustom)
                .map((row) => (
                  <form key={row.code} action={deleteCustomT2AdjustmentAction} className="flex items-center justify-between gap-3 text-sm">
                    <input type="hidden" name="year" value={year} />
                    <input type="hidden" name="code" value={row.code} />
                    <span>
                      {row.label}: {formatCents(row.amountCents)}
                    </span>
                    <Button type="submit" variant="outline" size="sm">
                      Remove
                    </Button>
                  </form>
                ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Post a {year} journal entry</CardTitle>
          <CardDescription>
            This posts into the same general ledger the worksheet reads. The date must fall inside {worksheet.period.startsAt} to{" "}
            {worksheet.period.endsAt}. Amounts are CAD dollars.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={createT2JournalEntryAction} className="grid gap-4 md:grid-cols-4">
            <input type="hidden" name="year" value={year} />
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" defaultValue={`${year} adjusting entry`} />
            </div>
            <div>
              <Label htmlFor="postedAt">Date</Label>
              <Input id="postedAt" name="postedAt" type="date" defaultValue={worksheet.period.endsAt} required />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" min="0.01" step="0.01" defaultValue="0.00" required />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="debitAccountId">Debit account</Label>
              <select id="debitAccountId" name="debitAccountId" className="mt-1 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm" defaultValue={accounts[0]?.id}>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} — {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="creditAccountId">Credit account</Label>
              <select id="creditAccountId" name="creditAccountId" className="mt-1 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm" defaultValue={accounts[1]?.id || accounts[0]?.id}>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} — {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Button type="submit">Post to ledger and refresh totals</Button>
            </div>
          </form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>No journal entries posted in this fiscal year.</TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                    <TableCell>{formatUtcDate(entry.postedAt)}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-right">{formatMoney(entry.lines.reduce((sum, line) => sum + line.debit, 0))}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Filing deadlines</CardTitle>
            <CardDescription>Based on taxation year end {worksheet.deadlines.yearEnd}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>T2 filing due: {worksheet.deadlines.filingDue}</p>
            <p>Balance due if the CCPC three-month rule applies: {worksheet.deadlines.balanceDueCcpc}</p>
            <p>Balance due under the two-month rule: {worksheet.deadlines.balanceDueGeneral}</p>
            {worksheet.deadlines.notes.map((note) => (
              <p key={note} className="text-muted-foreground">
                {note}
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
            <CardDescription>The CRA tax advisor on this page recomputes these same figures from the database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {worksheet.checklist.map((item) => (
              <div key={item.id} className="text-sm">
                <p className="font-medium">
                  {item.status === "review" ? "Review: " : item.status === "done" ? "Done: " : ""}
                  {item.label}
                </p>
                <p className="text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SummaryCard({ title, detail, amount }: { title: string; detail: string; amount: number }) {
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

function AdjustmentFields({
  title,
  rows,
}: {
  title: string
  rows: Array<{ code: string; label: string; help: string; amountCents: number; isCustom: boolean }>
}) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold">{title}</h2>
      {rows.map((row) => (
        <div key={row.code} className="grid gap-2 md:grid-cols-[1fr_180px] md:items-center">
          <div>
            <Label htmlFor={`amount_${row.code}`}>{row.label}</Label>
            <p className="text-xs text-muted-foreground">{row.help}</p>
          </div>
          <Input
            id={`amount_${row.code}`}
            name={`amount_${row.code}`}
            type="number"
            min="0"
            step="0.01"
            defaultValue={centsToDollarInput(row.amountCents)}
          />
        </div>
      ))}
    </div>
  )
}
