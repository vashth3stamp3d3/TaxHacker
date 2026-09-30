import { getCurrentUser } from "@/lib/auth"
import { parseTaxYear, worksheetToCsv } from "@/lib/tax/t2-worksheet"
import { ensureActiveOrganization } from "@/models/organizations"
import { getT2Worksheet } from "@/models/t2"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const year = parseTaxYear(request.nextUrl.searchParams.get("year"))
  const worksheet = await getT2Worksheet(organization.id, year)

  return new Response(worksheetToCsv(worksheet), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="t2-planning-estimate-${year}.csv"`,
    },
  })
}
