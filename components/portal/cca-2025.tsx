import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CCA_2025, CCA_2025_YEAR, cca2025AssetRows } from "@/lib/cca-2025"
import { formatMoney } from "@/models/accounting"

export function Cca2025Card({ year }: { year: number }) {
  if (year !== CCA_2025_YEAR) return null
  const claim = CCA_2025
  const assets = cca2025AssetRows()

  return (
    <Card>
      <CardHeader>
        <CardTitle>2025 depreciation · maximum CCA</CardTitle>
        <CardDescription>
          The shop machine from the filed 2024 T2 is in this claim. Original cost{" "}
          {formatMoney(claim.priorEquipmentCostCents)}, 2024 CCA already taken {formatMoney(claim.priorCcaCents)},
          remaining UCC {formatMoney(claim.class8.openingUccCents)} × 20% = {formatMoney(claim.class8.ccaCents)}. First-year
          accelerated CCA does not apply again to last year’s machine. 2025 Amazon items under $500 take class 12 at
          100%. Total book depreciation {formatMoney(claim.bookDepreciationCents)}.
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
              <TableHead>Source</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Basis</TableHead>
              <TableHead className="text-right">2025 CCA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((item) => (
              <TableRow key={item.source}>
                <TableCell className="font-mono">{item.source}</TableCell>
                <TableCell>
                  {item.description}
                  <span className="block text-muted-foreground">Class {item.classNumber}</span>
                </TableCell>
                <TableCell>
                  {formatMoney(item.basisCents)} {item.basisLabel}
                </TableCell>
                <TableCell className="text-right">{formatMoney(item.ccaCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
