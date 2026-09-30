import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoney } from "@/models/accounting"
import { LedgerBalanceSnapshot } from "@/prisma/client"

type SnapshotLine = {
  accountCode: string
  name?: string
  debitCents?: number
  creditCents?: number
}

export function LedgerSnapshotsCard({ snapshots }: { snapshots: LedgerBalanceSnapshot[] }) {
  if (snapshots.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imported beginning and ending balances</CardTitle>
        <CardDescription>
          v5 is the beginning snapshot. FP36 is the ending snapshot and the posted historical general ledger.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {snapshots.map((snapshot) => {
          const lines = (snapshot.lines as SnapshotLine[]) || []
          return (
            <div key={snapshot.id} className="rounded-md border p-3">
              <div className="font-medium">{snapshot.label}</div>
              <div className="mb-3 text-sm text-muted-foreground">
                {snapshot.sourceFile} · as of {snapshot.asOf.toISOString().slice(0, 10)}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={`${snapshot.id}-${line.accountCode}`}>
                      <TableCell>
                        <span className="font-mono">{line.accountCode}</span> {line.name}
                      </TableCell>
                      <TableCell className="text-right">{formatMoney(line.debitCents || 0)}</TableCell>
                      <TableCell className="text-right">{formatMoney(line.creditCents || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
