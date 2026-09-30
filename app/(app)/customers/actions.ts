"use server"

import { requirePortalContext } from "@/models/access"
import { createCustomer, updateCustomer } from "@/models/commerce"
import { revalidatePath } from "next/cache"

export async function createCustomerAction(formData: FormData) {
  const { organization } = await requirePortalContext("shop_write")
  await createCustomer(organization.id, {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
  })
  revalidatePath("/customers")
}

export async function updateCustomerAction(formData: FormData) {
  const { organization } = await requirePortalContext("shop_write")
  const id = String(formData.get("id") || "")
  await updateCustomer(organization.id, id, {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    address: String(formData.get("address") || "") || null,
    taxExempt: formData.get("taxExempt") === "on",
    paymentTerms: String(formData.get("paymentTerms") || "Net 30"),
  })
  revalidatePath("/customers")
  revalidatePath(`/customers/${id}`)
}
