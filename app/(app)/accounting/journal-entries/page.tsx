import { createJournalEntryAction, reverseJournalEntryAction } from "@/app/(app)/accounting/actions"
import { PortalPageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { getWorkingYear, isoDateInput } from "@/lib/working-year"
import { formatMoney, getJournalEntries, getLedgerAccounts } from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"

export const metadata = {
  title: "Journal Entries",
}

export default async function JournalEntriesPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const year = await getWorkingYear()
  const [accounts, entries] = await Promise.all([
    getLedgerAccounts(organization.id),
    getJournalEntries(organization.id, year.year),
  ])

  async function createAction(formData: FormData) {
    "use server"
    await createJournalEntryAction(null, formData)
  }

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <PortalPageHeader
        title="Journal entries"
        organizationName={organization.name}
        gstNumber={organization.gstHstRegistrationNumber}
        workingYear={year.year}
        description="Post balanced debits and credits into the general ledger"
      />

      <Card>
        <CardHeader>
          <CardTitle>Quick balanced entry</CardTitle>
          <CardDescription>Create a two-line journal entry. Amounts are entered in dollars CAD.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" defaultValue="Opening or adjusting entry" />
            </div>
            <div>
              <Label htmlFor="postedAt">Date</Label>
              <Input id="postedAt" name="postedAt" type="date" defaultValue={isoDateInput(year)} />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" min="0.01" step="0.01" defaultValue="0.00" />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Post Entry
              </Button>
            </div>
            <div className="md:col-span-2">
              <Label>Debit Account</Label>
              <select name="debitAccountId" defaultValue={accounts[0]?.id} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Credit Account</Label>
              <select name="creditAccountId" defaultValue={accounts[1]?.id} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent entries</CardTitle>
          <CardDescription>Latest 100 posted entries in {year.year}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debits</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const debit = entry.lines.reduce((sum, line) => sum + line.debit, 0)
                const credit = entry.lines.reduce((sum, line) => sum + line.credit, 0)
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                    <TableCell>{entry.postedAt.toLocaleDateString("en-CA")}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-right">{formatMoney(debit)}</TableCell>
                    <TableCell className="text-right">{formatMoney(credit)}</TableCell>
                    <TableCell>
                      {entry.status !== "reversed" && !entry.reversedEntryId ? (
                        <form action={reverseJournalEntryAction}>
                          <input type="hidden" name="journalEntryId" value={entry.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Reverse
                          </Button>
                        </form>
                      ) : (
                        <span className="text-xs text-muted-foreground">Reversed</span>
                      )}
                    </TableCell>
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
