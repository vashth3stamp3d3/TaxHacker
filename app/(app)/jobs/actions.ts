"use server"

import { getCurrentUser } from "@/lib/auth"
import { ensureActiveOrganization } from "@/models/organizations"
import { addJobLabor, addJobMaterial, advancePrintJobStatus, createPrintJob } from "@/models/operations"
import { revalidatePath } from "next/cache"

export async function createPrintJobAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
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
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await addJobMaterial({
    organizationId: organization.id,
    printJobId: String(formData.get("printJobId") || ""),
    itemId: String(formData.get("itemId") || ""),
    quantity: Math.round(Number(formData.get("quantity") || 0)),
    unitCost: Math.round(Number(formData.get("unitCost") || 0) * 100),
  })
  revalidatePath("/jobs")
}

export async function addJobLaborAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
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
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await advancePrintJobStatus(organization.id, String(formData.get("printJobId") || ""), String(formData.get("status") || "in_progress"))
  revalidatePath("/jobs")
}
