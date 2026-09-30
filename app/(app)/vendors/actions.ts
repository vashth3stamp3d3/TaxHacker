"use server"

import { requirePortalContext } from "@/models/access"
import { createVendor, updateVendor } from "@/models/commerce"
import { revalidatePath } from "next/cache"

export async function createVendorAction(formData: FormData) {
  const { organization } = await requirePortalContext("shop_write")
  await createVendor(organization.id, {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    gstNumber: String(formData.get("gstNumber") || "") || undefined,
  })
  revalidatePath("/vendors")
}

export async function updateVendorAction(formData: FormData) {
  const { organization } = await requirePortalContext("shop_write")
  const id = String(formData.get("id") || "")
  await updateVendor(organization.id, id, {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    gstNumber: String(formData.get("gstNumber") || "") || null,
    address: String(formData.get("address") || "") || null,
  })
  revalidatePath("/vendors")
  revalidatePath(`/vendors/${id}`)
}
