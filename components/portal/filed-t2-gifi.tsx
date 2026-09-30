import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { T2_2024_GIFI_LINES, T2_2024_YEAR } from "@/lib/tax/t2-2024-filed"
import { formatMoney } from "@/models/accounting"

export function FiledT2GifiCard({ year }: { year: number }) {
  if (year !== T2_2024_YEAR) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filed 2024 T2 GIFI</CardTitle>
        <CardDescription>
          Official Schedule 125 income statement from the 2024 Formulated Prints T2. Opening inventory was blank. Net
          income $11,045 is closed to retained earnings and is the 2025 opening equity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GIFI</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {T2_2024_GIFI_LINES.filter((line) => line.amountCents !== 0 || line.code === "8300").map((line) => (
              <TableRow key={line.code}>
                <TableCell className="font-mono">{line.code}</TableCell>
                <TableCell>{line.label}</TableCell>
                <TableCell className="text-right">{line.amountCents ? formatMoney(line.amountCents) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
