import { getOrCreateSelfHostedUser } from "../models/users"
import { ensureActiveOrganization } from "../models/organizations"
import { createUserDefaults } from "../models/defaults"

async function main() {
  const user = await getOrCreateSelfHostedUser()
  await createUserDefaults(user.id).catch(() => null)
  const org = await ensureActiveOrganization(user)
  console.log(JSON.stringify({ userId: user.id, orgId: org.id, orgName: org.name, entityType: org.entityType }))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
