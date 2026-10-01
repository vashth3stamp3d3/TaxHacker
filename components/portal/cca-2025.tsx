import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CCA_2025, CCA_2025_YEAR, formatCad } from "@/lib/cca-2025"
import { formatMoney } from "@/models/accounting"

export function Cca2025Card({ year }: { year: number }) {
  if (year !== CCA_2025_YEAR) return null
  const claim = CCA_2025

  return (
    <Card>
      <CardHeader>
        <CardTitle>2025 depreciation · maximum CCA</CardTitle>
        <CardDescription>
          Book depreciation {formatMoney(claim.bookDepreciationCents)} equals the largest 2025 CCA claim. Class 12 writes
          off each Amazon equipment item under $500 in the year of purchase. Opening class 8 from the filed 2024 T2 stays
          at 20%. Leaving those additions in class 8 with RIIP would only be {formatMoney(claim.allClass8RiipCents)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Opening UCC</TableHead>
              <TableHead>Additions</TableHead>
              <TableHead>CCA</TableHead>
              <TableHead className="text-right">Closing UCC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[claim.class8, claim.class12].map((row) => (
              <TableRow key={row.classNumber}>
                <TableCell>Class {row.classNumber}</TableCell>
                <TableCell>{formatMoney(row.openingUccCents)}</TableCell>
                <TableCell>{formatMoney(row.additionsCents)}</TableCell>
                <TableCell>{formatMoney(row.ccaCents)}</TableCell>
                <TableCell className="text-right">{formatMoney(row.closingUccCents)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell>{formatMoney(claim.class8.openingUccCents)}</TableCell>
              <TableCell>{formatMoney(claim.class12.additionsCents + claim.class8.additionsCents)}</TableCell>
              <TableCell className="font-medium">{formatMoney(claim.totalCcaCents)}</TableCell>
              <TableCell className="text-right font-medium">{formatMoney(claim.netBookValueCents)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claim.class12.items.map((item) => (
              <TableRow key={item.invoiceNumber}>
                <TableCell className="font-mono">{item.invoiceNumber}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-right">{formatCad(item.costCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
