import { getCurrentUser } from "@/lib/auth"
import { ensureActiveOrganization } from "@/models/organizations"
import { gstRegisterCsv, getGstRegister, getTaxFilingPeriods, selectGstFilingPeriod } from "@/models/tax"

export async function GET(request: Request) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const periodId = new URL(request.url).searchParams.get("period")
  const periods = await getTaxFilingPeriods(organization.id)
  const selected = selectGstFilingPeriod(periods, periodId)
  const register = await getGstRegister(
    organization.id,
    selected ? { from: selected.startsAt, to: selected.endsAt } : undefined
  )
  return new Response(gstRegisterCsv(register), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="gst-register.csv"`,
    },
  })
}
