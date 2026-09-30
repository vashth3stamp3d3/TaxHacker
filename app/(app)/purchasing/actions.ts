"use server"

import { requirePortalContext } from "@/models/access"
import { createVendorBillWithPosting, createVendorPaymentWithPosting } from "@/models/commerce"
import { createPurchaseOrder, getItems, receivePurchaseOrder } from "@/models/inventory"
import { revalidatePath } from "next/cache"

function revalidatePurchasing() {
  revalidatePath("/purchasing")
  revalidatePath("/inventory")
  revalidatePath("/reports")
  revalidatePath("/taxes/gst")
  revalidatePath("/taxes/t2")
}

export async function createVendorBillAction(formData: FormData) {
  const { user, organization } = await requirePortalContext("shop_write")
  await createVendorBillWithPosting({
    organizationId: organization.id,
    createdById: user.id,
    vendorId: String(formData.get("vendorId") || "") || undefined,
    goodsReceiptId: String(formData.get("goodsReceiptId") || "") || undefined,
    description: String(formData.get("description") || "Vendor bill"),
    taxableAmount: Math.round(Number(formData.get("amount") || 0) * 100),
  })
  revalidatePurchasing()
}

export async function createVendorPaymentAction(formData: FormData) {
  const { user, organization } = await requirePortalContext("shop_write")
  await createVendorPaymentWithPosting({
    organizationId: organization.id,
    createdById: user.id,
    vendorId: String(formData.get("vendorId") || "") || undefined,
    vendorBillId: String(formData.get("vendorBillId") || "") || undefined,
    amount: Math.round(Number(formData.get("amount") || 0) * 100),
    memo: String(formData.get("memo") || "Vendor payment"),
  })
  revalidatePurchasing()
}

export async function createPurchaseOrderAction(formData: FormData) {
  const { organization } = await requirePortalContext("shop_write")
  const itemId = String(formData.get("itemId") || "") || undefined
  const items = itemId ? await getItems(organization.id) : []
  const item = items.find((row) => row.id === itemId)
  await createPurchaseOrder({
    organizationId: organization.id,
    vendorId: String(formData.get("vendorId") || "") || undefined,
    lines: [
      {
        itemId,
        description: item?.name || String(formData.get("description") || "Purchase"),
        quantity: Math.round(Number(formData.get("quantity") || 1)),
        unitCost: Math.round(Number(formData.get("unitCost") || 0) * 100),
      },
    ],
  })
  revalidatePurchasing()
}

export async function receivePurchaseOrderAction(formData: FormData) {
  const { user, organization } = await requirePortalContext("shop_write")
  await receivePurchaseOrder({
    organizationId: organization.id,
    purchaseOrderId: String(formData.get("purchaseOrderId") || ""),
    warehouseId: String(formData.get("warehouseId") || ""),
    createdById: user.id,
  })
  revalidatePurchasing()
}
