"use server"

import { prisma } from "@/lib/db"
import { PORTAL_ROLES } from "@/lib/portal-access"
import { requirePortalContext } from "@/models/access"
import { revalidatePath } from "next/cache"

export async function updateCompanyAction(formData: FormData) {
  const { organization } = await requirePortalContext("company_settings")
  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      name: String(formData.get("name") || organization.name),
      legalName: String(formData.get("legalName") || "") || null,
      tradeName: String(formData.get("tradeName") || "") || null,
      businessNumber: String(formData.get("businessNumber") || "") || null,
      gstHstRegistrationNumber: String(formData.get("gstHstRegistrationNumber") || "") || null,
      gstRemittanceFrequency: String(formData.get("gstRemittanceFrequency") || "quarterly"),
      accountantName: String(formData.get("accountantName") || "") || null,
      accountantEmail: String(formData.get("accountantEmail") || "") || null,
      ownerDisplayName: String(formData.get("ownerDisplayName") || "") || null,
      address: String(formData.get("address") || "") || null,
    },
  })
  revalidatePath("/settings/company")
  revalidatePath("/")
}

export async function updateMemberRoleAction(formData: FormData) {
  const { organization } = await requirePortalContext("members")
  const memberId = String(formData.get("memberId") || "")
  const role = String(formData.get("role") || "staff")
  if (!PORTAL_ROLES.includes(role as (typeof PORTAL_ROLES)[number])) {
    throw new Error("Choose superuser, owner, staff, or accountant")
  }
  await prisma.organizationMember.updateMany({
    where: { id: memberId, organizationId: organization.id },
    data: { role },
  })
  revalidatePath("/settings/company")
}
