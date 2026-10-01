import { getCurrentUser } from "@/lib/auth"
import { assertCanPerform, normalizePortalRole, type PortalAction, type PortalRole } from "@/lib/portal-access"
import { prisma } from "@/lib/db"
import { dateForNewPosting, getWorkingYear, type WorkingYear } from "@/lib/working-year"
import { ensureActiveOrganization } from "@/models/organizations"
import { Organization, User } from "@/prisma/client"

export type PortalContext = {
  user: User
  organization: Organization
  role: PortalRole
  workingYear: WorkingYear
  postedAt: Date
}

export async function requirePortalContext(action: PortalAction): Promise<PortalContext> {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
  })
  const role = normalizePortalRole(membership?.role)
  assertCanPerform(role, action)
  const workingYear = await getWorkingYear()
  return { user, organization, role, workingYear, postedAt: dateForNewPosting(workingYear) }
}

export async function getOrganizationMembers(organizationId: string) {
  return prisma.organizationMember.findMany({
    where: { organizationId, isActive: true },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  })
}
