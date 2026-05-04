import { default as globalConfig } from "@/lib/config"
import { createPortalToken } from "@/lib/portal-auth"
import { getSessionCookie } from "better-auth/cookies"
import { NextRequest, NextResponse } from "next/server"

export default async function middleware(request: NextRequest) {
  if (globalConfig.portal.password) {
    const pathname = request.nextUrl.pathname
    const isPortalRoute = pathname === "/portal" || pathname.startsWith("/portal/")
    const expectedToken = await createPortalToken(globalConfig.portal.password, globalConfig.portal.cookieSecret)
    const currentToken = request.cookies.get(globalConfig.portal.cookieName)?.value

    if (!isPortalRoute && currentToken !== expectedToken) {
      const portalUrl = new URL("/portal", globalConfig.app.baseURL)
      portalUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(portalUrl)
    }
  }

  if (globalConfig.selfHosted.isEnabled) {
    return NextResponse.next()
  }

  const sessionCookie = getSessionCookie(request, { cookiePrefix: "taxhacker" })
  if (!sessionCookie) {
    return NextResponse.redirect(new URL(globalConfig.auth.loginUrl, request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|site.webmanifest|logo/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml)$).*)",
  ],
}
