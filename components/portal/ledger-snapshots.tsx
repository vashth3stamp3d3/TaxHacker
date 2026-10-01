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

export function LedgerSnapshotsCard({
  snapshots,
  year,
}: {
  snapshots: LedgerBalanceSnapshot[]
  year?: number
}) {
  if (snapshots.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opening and ending balances</CardTitle>
        <CardDescription>
          {year === 2024
            ? "2024 opening is filed Schedule 101 ($100 cash and common shares). 2024 ending is filed Schedule 100."
            : year === 2025
              ? "2025 opening is the filed 2024 Schedule 100 so the years tie."
              : "Balances for the selected books year."}
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
              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground">No opening balance-sheet amounts. 2024 starts from the filed T2.</p>
              ) : (
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
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
