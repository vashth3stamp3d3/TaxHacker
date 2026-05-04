import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AccountBalance, formatMoney } from "@/models/accounting"

export function StatementCard({
  title,
  description,
  rows,
}: {
  title: string
  description: string
  rows: { label: string; value: number; strong?: boolean }[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className={row.strong ? "flex justify-between border-t pt-2 font-semibold" : "flex justify-between"}>
            <span>{row.label}</span>
            <span>{formatMoney(row.value)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function AccountBalanceTable({ accounts }: { accounts: AccountBalance[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Account</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Debit</TableHead>
          <TableHead className="text-right">Credit</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => (
          <TableRow key={account.accountId}>
            <TableCell>
              <span className="font-mono">{account.code}</span> {account.name}
            </TableCell>
            <TableCell>{account.type}</TableCell>
            <TableCell className="text-right">{formatMoney(account.debit)}</TableCell>
            <TableCell className="text-right">{formatMoney(account.credit)}</TableCell>
            <TableCell className="text-right">{formatMoney(account.balance)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
