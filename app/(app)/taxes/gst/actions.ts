"use server"

import { requirePortalContext } from "@/models/access"
import { postGstRemittance } from "@/models/tax"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function remitGstAction(formData: FormData) {
  const { user, organization } = await requirePortalContext("gst_remittance")
  const filingPeriodId = String(formData.get("filingPeriodId") || "")
  const payNow = formData.get("payNow") === "on"
  try {
    await postGstRemittance({
      organizationId: organization.id,
      createdById: user.id,
      filingPeriodId,
      payNow,
    })
  } catch (error) {
    redirect(`/taxes/gst?error=${encodeURIComponent(error instanceof Error ? error.message : "Remittance failed")}`)
  }
  revalidatePath("/taxes/gst")
  revalidatePath("/reports")
  revalidatePath("/accounting")
  revalidatePath("/dashboard")
  redirect("/taxes/gst?saved=1")
}
