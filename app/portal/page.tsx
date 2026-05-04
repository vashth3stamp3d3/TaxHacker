import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import config from "@/lib/config"
import { isSafePortalRedirect } from "@/lib/portal-auth"
import Image from "next/image"

type PortalPageProps = {
  searchParams: Promise<{
    error?: string
    next?: string
  }>
}

export default async function PortalPage({ searchParams }: PortalPageProps) {
  const params = await searchParams
  const nextPath = isSafePortalRedirect(params.next ?? null) ? params.next : "/dashboard"

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <Image src="/logo/512.png" alt="Formulated Tax" width={96} height={96} className="h-24 w-24" priority />
          <CardTitle className="text-2xl">Formulated Tax Portal</CardTitle>
          <CardDescription>Enter the portal password to access this private ERP.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/portal/unlock" method="post" className="flex flex-col gap-4">
            <input type="hidden" name="next" value={nextPath} />
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Portal password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            {params.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Incorrect portal password. Please try again.
              </p>
            ) : null}
            {!config.portal.password ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Portal locking is not active until PORTAL_PASSWORD is configured.
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              Unlock Portal
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
