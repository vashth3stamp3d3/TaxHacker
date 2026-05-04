import config from "@/lib/config"
import { createPortalToken, isSafePortalRedirect } from "@/lib/portal-auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const password = String(formData.get("password") || "")
  const nextPath = String(formData.get("next") || "")
  const redirectPath = isSafePortalRedirect(nextPath) ? nextPath : "/dashboard"

  if (!config.portal.password || password !== config.portal.password) {
    const retryUrl = new URL("/portal", config.app.baseURL)
    retryUrl.searchParams.set("error", "1")
    retryUrl.searchParams.set("next", redirectPath)
    return NextResponse.redirect(retryUrl, { status: 303 })
  }

  const response = NextResponse.redirect(new URL(redirectPath, config.app.baseURL), { status: 303 })
  response.cookies.set({
    name: config.portal.cookieName,
    value: await createPortalToken(config.portal.password, config.portal.cookieSecret),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: config.portal.maxAgeSeconds,
    path: "/",
  })

  return response
}
