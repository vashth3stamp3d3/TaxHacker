"use server"

import { requirePortalContext } from "@/models/access"
import { consumeInventory, createInventoryItem, receiveInventory } from "@/models/inventory"
import { revalidatePath } from "next/cache"

export async function createInventoryItemAction(formData: FormData) {
  const { organization } = await requirePortalContext("shop_write")
  await createInventoryItem(organization.id, {
    sku: String(formData.get("sku") || ""),
    name: String(formData.get("name") || ""),
    type: String(formData.get("type") || "material"),
    unitOfMeasure: String(formData.get("unitOfMeasure") || "each"),
    standardCost: Math.round(Number(formData.get("standardCost") || 0) * 100),
    salesPrice: Math.round(Number(formData.get("salesPrice") || 0) * 100),
  })
  revalidatePath("/inventory")
}

export async function receiveInventoryAction(formData: FormData) {
  const { user, organization, postedAt } = await requirePortalContext("shop_write")
  await receiveInventory({
    organizationId: organization.id,
    createdById: user.id,
    itemId: String(formData.get("itemId") || ""),
    warehouseId: String(formData.get("warehouseId") || ""),
    quantity: Math.round(Number(formData.get("quantity") || 0)),
    unitCost: Math.round(Number(formData.get("unitCost") || 0) * 100),
    postToGrni: true,
    postedAt,
  })
  revalidatePath("/inventory")
  revalidatePath("/reports")
}

export async function consumeInventoryAction(formData: FormData) {
  const { user, organization, postedAt } = await requirePortalContext("inventory_consume")
  await consumeInventory({
    organizationId: organization.id,
    createdById: user.id,
    itemId: String(formData.get("itemId") || ""),
    warehouseId: String(formData.get("warehouseId") || ""),
    quantity: Math.round(Number(formData.get("quantity") || 0)),
    unitCost: Math.round(Number(formData.get("unitCost") || 0) * 100),
    postedAt,
  })
  revalidatePath("/inventory")
  revalidatePath("/reports")
}
