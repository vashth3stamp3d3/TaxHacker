"use server"

import { getCurrentUser } from "@/lib/auth"
import { createCustomerInvoiceWithPosting, createCustomerPaymentWithPosting } from "@/models/commerce"
import { ensureActiveOrganization } from "@/models/organizations"
import { createQuote, createSalesOrder } from "@/models/operations"
import { revalidatePath } from "next/cache"

export async function createQuoteAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await createQuote({
    organizationId: organization.id,
    customerId: String(formData.get("customerId") || "") || undefined,
    description: String(formData.get("description") || "Print shop quote"),
    amount: Math.round(Number(formData.get("amount") || 0) * 100),
  })
  revalidatePath("/sales")
}

export async function createSalesOrderAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await createSalesOrder({
    organizationId: organization.id,
    customerId: String(formData.get("customerId") || "") || undefined,
    amount: Math.round(Number(formData.get("amount") || 0) * 100),
  })
  revalidatePath("/sales")
}

export async function createCustomerInvoiceAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await createCustomerInvoiceWithPosting({
    organizationId: organization.id,
    createdById: user.id,
    customerId: String(formData.get("customerId") || "") || undefined,
    description: String(formData.get("description") || "Print shop sale"),
    taxableAmount: Math.round(Number(formData.get("amount") || 0) * 100),
  })
  revalidatePath("/sales")
  revalidatePath("/reports")
  revalidatePath("/taxes/gst")
}

export async function createCustomerPaymentAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await createCustomerPaymentWithPosting({
    organizationId: organization.id,
    createdById: user.id,
    customerId: String(formData.get("customerId") || "") || undefined,
    amount: Math.round(Number(formData.get("amount") || 0) * 100),
    memo: String(formData.get("memo") || "Customer payment"),
  })
  revalidatePath("/sales")
  revalidatePath("/reports")
}
