"use server"

import { requirePortalContext } from "@/models/access"
import {
  createCustomerInvoiceWithPosting,
  createCustomerPaymentWithPosting,
} from "@/models/commerce"
import { convertQuoteToSalesOrder, convertSalesOrderToInvoice, createQuote, createSalesOrder } from "@/models/operations"
import { revalidatePath } from "next/cache"

function revalidateSales() {
  revalidatePath("/sales")
  revalidatePath("/reports")
  revalidatePath("/taxes/gst")
  revalidatePath("/taxes/t2")
  revalidatePath("/dashboard")
}

export async function createQuoteAction(formData: FormData) {
  const { organization } = await requirePortalContext("shop_write")
  await createQuote({
    organizationId: organization.id,
    customerId: String(formData.get("customerId") || "") || undefined,
    description: String(formData.get("description") || "Print shop quote"),
    amount: Math.round(Number(formData.get("amount") || 0) * 100),
  })
  revalidateSales()
}

export async function createSalesOrderAction(formData: FormData) {
  const { organization } = await requirePortalContext("shop_write")
  await createSalesOrder({
    organizationId: organization.id,
    customerId: String(formData.get("customerId") || "") || undefined,
    quoteId: String(formData.get("quoteId") || "") || undefined,
    amount: Math.round(Number(formData.get("amount") || 0) * 100),
  })
  revalidateSales()
}

export async function convertQuoteAction(formData: FormData) {
  const { organization } = await requirePortalContext("shop_write")
  await convertQuoteToSalesOrder(organization.id, String(formData.get("quoteId") || ""))
  revalidateSales()
}

export async function convertOrderAction(formData: FormData) {
  const { user, organization } = await requirePortalContext("shop_write")
  await convertSalesOrderToInvoice(organization.id, String(formData.get("salesOrderId") || ""), user.id)
  revalidateSales()
}

export async function createCustomerInvoiceAction(formData: FormData) {
  const { user, organization } = await requirePortalContext("shop_write")
  await createCustomerInvoiceWithPosting({
    organizationId: organization.id,
    createdById: user.id,
    customerId: String(formData.get("customerId") || "") || undefined,
    description: String(formData.get("description") || "Print shop sale"),
    taxableAmount: Math.round(Number(formData.get("amount") || 0) * 100),
  })
  revalidateSales()
}

export async function createCustomerPaymentAction(formData: FormData) {
  const { user, organization } = await requirePortalContext("shop_write")
  await createCustomerPaymentWithPosting({
    organizationId: organization.id,
    createdById: user.id,
    customerId: String(formData.get("customerId") || "") || undefined,
    invoiceId: String(formData.get("invoiceId") || "") || undefined,
    amount: Math.round(Number(formData.get("amount") || 0) * 100),
    memo: String(formData.get("memo") || "Customer payment"),
  })
  revalidateSales()
}
