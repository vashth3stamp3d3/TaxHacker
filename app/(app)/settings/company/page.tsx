import { updateCompanyAction } from "@/app/(app)/settings/company/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentUser } from "@/lib/auth"
import { ensureActiveOrganization } from "@/models/organizations"

export const metadata = {
  title: "Company ERP",
}

export default async function CompanySettingsPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)

  return (
    <div className="w-full max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Canadian company setup</CardTitle>
          <CardDescription>Alberta GST and ERP defaults used across accounting, invoices, and reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateCompanyAction} className="grid gap-4">
            <div>
              <Label htmlFor="name">Display name</Label>
              <Input id="name" name="name" defaultValue={organization.name} />
            </div>
            <div>
              <Label htmlFor="legalName">Legal name</Label>
              <Input id="legalName" name="legalName" defaultValue={organization.legalName || ""} />
            </div>
            <div>
              <Label htmlFor="tradeName">Trade name</Label>
              <Input id="tradeName" name="tradeName" defaultValue={organization.tradeName || ""} />
            </div>
            <div>
              <Label htmlFor="businessNumber">CRA business number</Label>
              <Input id="businessNumber" name="businessNumber" defaultValue={organization.businessNumber || ""} />
            </div>
            <div>
              <Label htmlFor="gstHstRegistrationNumber">GST/HST registration number</Label>
              <Input
                id="gstHstRegistrationNumber"
                name="gstHstRegistrationNumber"
                defaultValue={organization.gstHstRegistrationNumber || ""}
              />
            </div>
            <div>
              <Label htmlFor="gstRemittanceFrequency">GST remittance frequency</Label>
              <select
                id="gstRemittanceFrequency"
                name="gstRemittanceFrequency"
                defaultValue={organization.gstRemittanceFrequency}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <Label htmlFor="address">Business address</Label>
              <Input id="address" name="address" defaultValue={organization.address || ""} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="accountantName">Accountant name</Label>
                <Input id="accountantName" name="accountantName" defaultValue={organization.accountantName || ""} />
              </div>
              <div>
                <Label htmlFor="accountantEmail">Accountant email</Label>
                <Input
                  id="accountantEmail"
                  name="accountantEmail"
                  type="email"
                  defaultValue={organization.accountantEmail || ""}
                />
              </div>
            </div>
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Province is locked to Alberta and base currency is CAD for the first Canadian ERP version.
            </div>
            <Button type="submit">Save Company Setup</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
