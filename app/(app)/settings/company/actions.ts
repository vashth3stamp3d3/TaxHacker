"use server"

import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { ensureActiveOrganization } from "@/models/organizations"
import { revalidatePath } from "next/cache"

export async function updateCompanyAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
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
      address: String(formData.get("address") || "") || null,
    },
  })
  revalidatePath("/settings/company")
  revalidatePath("/")
}
