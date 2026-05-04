"use server"

import { getCurrentUser } from "@/lib/auth"
import { createVendor } from "@/models/commerce"
import { ensureActiveOrganization } from "@/models/organizations"
import { revalidatePath } from "next/cache"

export async function createVendorAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await createVendor(organization.id, {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    gstNumber: String(formData.get("gstNumber") || "") || undefined,
  })
  revalidatePath("/vendors")
}
