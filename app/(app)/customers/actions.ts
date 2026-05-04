"use server"

import { getCurrentUser } from "@/lib/auth"
import { createCustomer } from "@/models/commerce"
import { ensureActiveOrganization } from "@/models/organizations"
import { revalidatePath } from "next/cache"

export async function createCustomerAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await createCustomer(organization.id, {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
  })
  revalidatePath("/customers")
}
