import { getCurrentUser } from "@/lib/auth"
import { getTrialBalance, trialBalanceCsv } from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"
import { getWorkingYear } from "@/lib/working-year"

export async function GET() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const year = await getWorkingYear()
  const balances = await getTrialBalance(organization.id, year.year)
  return new Response(trialBalanceCsv(balances), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="trial-balance-${year.year}.csv"`,
    },
  })
}
