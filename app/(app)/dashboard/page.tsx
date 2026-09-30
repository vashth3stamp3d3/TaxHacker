import DashboardDropZoneWidget from "@/components/dashboard/drop-zone-widget"
import { StatsWidget } from "@/components/dashboard/stats-widget"
import DashboardUnsortedWidget from "@/components/dashboard/unsorted-widget"
import { WelcomeWidget } from "@/components/dashboard/welcome-widget"
import { PortalPageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getCurrentUser } from "@/lib/auth"
import config from "@/lib/config"
import { getWorkingYear } from "@/lib/working-year"
import { formatMoney, getIncomeStatement } from "@/models/accounting"
import { getAutomationSuggestions } from "@/models/automation"
import { getCustomerInvoices, getOpenAp, getOpenAr, getVendorBills } from "@/models/commerce"
import { getUnsortedFiles } from "@/models/files"
import { getPrintJobs } from "@/models/operations"
import { ensureActiveOrganization } from "@/models/organizations"
import { getSettings } from "@/models/settings"
import { getGstRegister } from "@/models/tax"
import { TransactionFilters } from "@/models/transactions"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Portal home",
  description: config.app.description,
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<TransactionFilters> }) {
  const filters = await searchParams
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const year = await getWorkingYear()
  const yearFilters = {
    ...filters,
    dateFrom: filters.dateFrom || year.startsAt.toISOString().slice(0, 10),
    dateTo: filters.dateTo || year.endsAt.toISOString().slice(0, 10),
  }
  const [unsortedFiles, settings, gst, income, openAr, openAp, jobs, invoices, bills, suggestions] = await Promise.all([
    getUnsortedFiles(user.id, organization.id),
    getSettings(user.id),
    getGstRegister(organization.id, { from: year.startsAt, to: year.endsAt }),
    getIncomeStatement(organization.id, year.year),
    getOpenAr(organization.id, undefined, year.year),
    getOpenAp(organization.id, undefined, year.year),
    getPrintJobs(organization.id, year.year),
    getCustomerInvoices(organization.id, year.year),
    getVendorBills(organization.id, year.year),
    getAutomationSuggestions(organization.id),
  ])
  const jobsDue = jobs.filter((job) => job.status !== "complete" && job.status !== "cancelled")
  const pendingAutomation = suggestions.filter((suggestion) => suggestion.status === "pending")
  const arBalance = openAr.reduce((sum, row) => sum + row.balance, 0)
  const apBalance = openAp.reduce((sum, row) => sum + row.balance, 0)

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <PortalPageHeader
        title="Operator cockpit"
        organizationName={organization.name}
        gstNumber={organization.gstHstRegistrationNumber}
        workingYear={year.year}
        description="Inbox, books, shop, and GST in one portal"
        actions={
          <Button asChild>
            <Link href="/taxes/advisor">Ask tax advisor</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CockpitCard title="Inbox" href="/unsorted" value={String(unsortedFiles.length)} detail="Documents waiting for review" />
        <CockpitCard title="Books (GL)" href="/reports" value={formatMoney(income.netIncome)} detail="Net income from posted journals" />
        <CockpitCard title="GST net tax" href="/taxes/gst" value={formatMoney(gst.netTax)} detail="Collected GST less ITCs" />
        <CockpitCard
          title="Open AR / AP"
          href="/sales"
          value={`${formatMoney(arBalance)} / ${formatMoney(apBalance)}`}
          detail={`${invoices.length} invoices · ${bills.length} bills in ${year.year}`}
        />
        <CockpitCard title="Jobs in shop" href="/jobs" value={String(jobsDue.length)} detail="Open production jobs" />
        <CockpitCard
          title="Automation"
          href="/automation"
          value={String(pendingAutomation.length)}
          detail="Pending suggestions"
        />
        <CockpitCard title="Inbox archive" href="/transactions" value="Transactions" detail="TaxHacker document ledger, separate from GL totals" />
        <CockpitCard title="Company" href="/settings/company" value={organization.province} detail={organization.legalName || organization.name} />
      </div>

      <div className="flex flex-col sm:flex-row gap-5 items-stretch h-full">
        <DashboardDropZoneWidget />
        <DashboardUnsortedWidget files={unsortedFiles} />
      </div>

      {settings.is_welcome_message_hidden !== "true" && <WelcomeWidget />}

      <Separator />

      <StatsWidget filters={yearFilters} />
    </div>
  )
}

function CockpitCard({
  title,
  value,
  detail,
  href,
}: {
  title: string
  value: string
  detail: string
  href: string
}) {
  return (
    <Link href={href}>
      <Card className="h-full hover:border-primary/40">
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CardDescription>{detail}</CardDescription>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{value}</CardContent>
      </Card>
    </Link>
  )
}
