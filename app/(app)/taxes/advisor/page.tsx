import { PortalPageHeader } from "@/components/portal/page-header"
import { TaxAdvisorWorkspace } from "@/components/tax-advisor/tax-advisor-workspace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { listAdvisorThreads, getAdvisorThread } from "@/models/advisor"
import { ensureActiveOrganization } from "@/models/organizations"
import Link from "next/link"

export const metadata = {
  title: "Tax Advisor",
}

export default async function TaxAdvisorPage({ searchParams }: { searchParams: Promise<{ thread?: string }> }) {
  const params = await searchParams
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const threads = await listAdvisorThreads(organization.id, user.id)
  const selected = threads.find((thread) => thread.id === params.thread) || null
  const selectedFull = selected ? await getAdvisorThread(organization.id, selected.id) : null

  return (
    <div className="flex w-full max-w-6xl flex-col gap-5 self-center p-5">
      <PortalPageHeader
        title="Tax advisor"
        organizationName={organization.name}
        gstNumber={organization.gstHstRegistrationNumber}
        description="CRA-backed advisor with books context. Not a filed return or legal sign-off."
      />
      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Threads</CardTitle>
            <CardDescription>Saved conversations for this organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {threads.length === 0 ? <p className="text-muted-foreground">No saved threads yet.</p> : null}
            {threads.map((thread) => (
              <Link key={thread.id} href={`/taxes/advisor?thread=${thread.id}`} className="block rounded-md border p-3">
                <div className="font-medium">{thread.title}</div>
                <div className="text-muted-foreground">{thread.messages[0]?.content.slice(0, 80)}</div>
              </Link>
            ))}
          </CardContent>
        </Card>
        <TaxAdvisorWorkspace
          initialThreadId={selectedFull?.id}
          initialMessages={
            selectedFull?.messages.map((message) => ({
              role: message.role as "user" | "assistant",
              content: message.content,
            })) || undefined
          }
        />
      </div>
    </div>
  )
}
