import config from "@/lib/config"
import { isSafePortalRedirect } from "@/lib/portal-auth"
import { parseWorkingYear, WORKING_YEAR_COOKIE } from "@/lib/working-year"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const year = parseWorkingYear(formData.get("year"))
  const nextPath = isSafePortalRedirect(String(formData.get("next") || "")) ? String(formData.get("next")) : "/dashboard"
  const response = NextResponse.redirect(new URL(nextPath, config.app.baseURL), { status: 303 })
  response.cookies.set({
    name: WORKING_YEAR_COOKIE,
    value: String(year),
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 400,
    path: "/",
  })
  return response
}
