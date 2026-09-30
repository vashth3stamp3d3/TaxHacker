"use server"

import { requirePortalContext } from "@/models/access"
import { addJobLabor, addJobMaterial, advancePrintJobStatus, createPrintJob } from "@/models/operations"
import { revalidatePath } from "next/cache"

export async function createPrintJobAction(formData: FormData) {
  const { organization } = await requirePortalContext("shop_write")
  await createPrintJob({
    organizationId: organization.id,
    customerId: String(formData.get("customerId") || "") || undefined,
    salesOrderId: String(formData.get("salesOrderId") || "") || undefined,
    name: String(formData.get("name") || "Print job"),
    quotedTotal: Math.round(Number(formData.get("quotedTotal") || 0) * 100),
  })
  revalidatePath("/jobs")
}

export async function addJobMaterialAction(formData: FormData) {
  const { user, organization } = await requirePortalContext("inventory_consume")
  await addJobMaterial({
    organizationId: organization.id,
    createdById: user.id,
    printJobId: String(formData.get("printJobId") || ""),
    itemId: String(formData.get("itemId") || ""),
    quantity: Math.round(Number(formData.get("quantity") || 0)),
    unitCost: formData.get("unitCost") ? Math.round(Number(formData.get("unitCost")) * 100) : undefined,
  })
  revalidatePath("/jobs")
  revalidatePath("/inventory")
  revalidatePath("/reports")
}

export async function addJobLaborAction(formData: FormData) {
  const { organization } = await requirePortalContext("shop_write")
  await addJobLabor({
    organizationId: organization.id,
    printJobId: String(formData.get("printJobId") || ""),
    description: String(formData.get("description") || "Production labor"),
    minutes: Math.round(Number(formData.get("minutes") || 0)),
    rate: Math.round(Number(formData.get("rate") || 0) * 100),
  })
  revalidatePath("/jobs")
}

export async function advanceJobStatusAction(formData: FormData) {
  const { user, organization } = await requirePortalContext("shop_write")
  await advancePrintJobStatus(
    organization.id,
    String(formData.get("printJobId") || ""),
    String(formData.get("status") || "in_progress"),
    user.id
  )
  revalidatePath("/jobs")
  revalidatePath("/reports")
}
