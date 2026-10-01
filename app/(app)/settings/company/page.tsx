import { updateCompanyAction, updateMemberRoleAction } from "@/app/(app)/settings/company/actions"
import { PortalPageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentUser } from "@/lib/auth"
import { getOrganizationMembers } from "@/models/access"
import { ensureActiveOrganization } from "@/models/organizations"

export const metadata = {
  title: "Company ERP",
}

export default async function CompanySettingsPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const members = await getOrganizationMembers(organization.id)

  return (
    <div className="flex w-full max-w-3xl flex-col gap-5">
      <PortalPageHeader
        title="Company ERP"
        organizationName={organization.name}
        gstNumber={organization.gstHstRegistrationNumber}
        description="Alberta GST and Canadian corporation identity used across books, invoices, and the tax advisor"
      />
      <Card>
        <CardHeader>
          <CardTitle>Canadian corporation</CardTitle>
          <CardDescription>Formulated Prints is a Canadian corporation. Alberta GST and T2 defaults are used across accounting, invoices, and reports.</CardDescription>
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
              <Label htmlFor="ownerDisplayName">Owner display name</Label>
              <Input
                id="ownerDisplayName"
                name="ownerDisplayName"
                defaultValue={organization.ownerDisplayName || ""}
                placeholder="Used on shareholder loan prompts"
              />
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
              Entity type is locked to Canadian corporation. Province is Alberta and base currency is CAD.
            </div>
            <Button type="submit">Save Company Setup</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Portal members</CardTitle>
          <CardDescription>
            Site password is the outer lock. These roles control who can post, remit GST, consume inventory, or restore
            backups.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member) => (
            <form key={member.id} action={updateMemberRoleAction} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="memberId" value={member.id} />
              <div className="min-w-48 flex-1">
                <div className="font-medium">{member.user.name || member.user.email}</div>
                <div className="text-sm text-muted-foreground">{member.user.email}</div>
              </div>
              <select
                name="role"
                defaultValue={member.role}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="superuser">Superuser</option>
                <option value="owner">Owner</option>
                <option value="staff">Staff</option>
                <option value="accountant">Accountant</option>
              </select>
              <Button type="submit" variant="outline" size="sm">
                Save role
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
