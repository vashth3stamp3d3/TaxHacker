"use server"

import { getCurrentUser } from "@/lib/auth"
import { createVendorBillWithPosting, createVendorPaymentWithPosting } from "@/models/commerce"
import { ensureActiveOrganization } from "@/models/organizations"
import { revalidatePath } from "next/cache"

export async function createVendorBillAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await createVendorBillWithPosting({
    organizationId: organization.id,
    createdById: user.id,
    vendorId: String(formData.get("vendorId") || "") || undefined,
    description: String(formData.get("description") || "Vendor bill"),
    taxableAmount: Math.round(Number(formData.get("amount") || 0) * 100),
  })
  revalidatePath("/purchasing")
  revalidatePath("/reports")
  revalidatePath("/taxes/gst")
}

export async function createVendorPaymentAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await createVendorPaymentWithPosting({
    organizationId: organization.id,
    createdById: user.id,
    vendorId: String(formData.get("vendorId") || "") || undefined,
    amount: Math.round(Number(formData.get("amount") || 0) * 100),
    memo: String(formData.get("memo") || "Vendor payment"),
  })
  revalidatePath("/purchasing")
  revalidatePath("/reports")
}
