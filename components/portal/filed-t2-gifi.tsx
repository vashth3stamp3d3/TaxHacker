import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  T2_2024_GIFI_LINES,
  T2_2024_IDENTITY,
  T2_2024_SCHEDULE_100_LINES,
  T2_2024_TAX,
  T2_2024_YEAR,
} from "@/lib/tax/t2-2024-filed"
import { formatMoney } from "@/models/accounting"

export function FiledT2GifiCard({ year }: { year: number }) {
  if (year !== T2_2024_YEAR) return null

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Filed 2024 T2 · Schedule 125</CardTitle>
          <CardDescription>
            Official income statement from the 2024 Formulated Prints T2 ({T2_2024_IDENTITY.businessNumber}). Net income
            $11,045 is closed to retained earnings.
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

      <Card>
        <CardHeader>
          <CardTitle>Filed 2024 T2 · Schedule 100</CardTitle>
          <CardDescription>
            Official year-end balance sheet. 2025 opening equals these amounts. Class 8 CCA {formatMoney(T2_2024_TAX.cca)}
            , closing UCC {formatMoney(T2_2024_TAX.class8UccEnd)}. Federal Part I {formatMoney(T2_2024_TAX.federalPartI)} +
            Alberta {formatMoney(T2_2024_TAX.albertaTax)}.
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
              {T2_2024_SCHEDULE_100_LINES.map((line) => (
                <TableRow key={line.code}>
                  <TableCell className="font-mono">{line.code}</TableCell>
                  <TableCell>{line.label}</TableCell>
                  <TableCell className="text-right">{formatMoney(line.amountCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
