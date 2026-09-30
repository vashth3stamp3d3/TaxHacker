import { getCurrentUser } from "@/lib/auth"
import { getTrialBalance, trialBalanceCsv } from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"

export async function GET() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const balances = await getTrialBalance(organization.id)
  return new Response(trialBalanceCsv(balances), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="trial-balance.csv"`,
    },
  })
}
