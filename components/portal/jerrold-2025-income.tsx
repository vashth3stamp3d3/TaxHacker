import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { JERROLD_2025_INCOME, JERROLD_2025_YEAR } from "@/lib/jerrold-2025-income"
import { formatMoney } from "@/models/accounting"

export function Jerrold2025IncomeCard({ year }: { year: number }) {
  if (year !== JERROLD_2025_YEAR) return null
  const row = JERROLD_2025_INCOME
  return (
    <Card>
      <CardHeader>
        <CardTitle>2025 officer wages · personal-account loop</CardTitle>
        <CardDescription>
          Shopify 2025 payouts already went to Jerrold Jacobe and paid the shop bills. Sales stay corporate income. The
          leftover draw is T4 officer wages so it is income to him and deductible to the company. Account 2310 stays a
          credit of {formatMoney(row.closingLoanCreditCents)} from the filed 2024 T2. Issue a T4 for{" "}
          {formatMoney(row.wagesCents)}; CPP and source deductions still need to be remitted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Step</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Shopify payouts to Jerrold (cleared from 1020)</TableCell>
              <TableCell className="text-right">{formatMoney(row.depositsCents)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Owner-paid shop bills already on 2310</TableCell>
              <TableCell className="text-right">{formatMoney(row.ownerPaidCents)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">T4-2025 officer wages</TableCell>
              <TableCell className="text-right font-medium">{formatMoney(row.wagesCents)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>2310 leftover (company still owes Jerrold)</TableCell>
              <TableCell className="text-right">{formatMoney(row.closingLoanCreditCents)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
