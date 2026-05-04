"use server"

import { getCurrentUser } from "@/lib/auth"
import { createInventoryItem, receiveInventory, consumeInventory } from "@/models/inventory"
import { ensureActiveOrganization } from "@/models/organizations"
import { revalidatePath } from "next/cache"

export async function createInventoryItemAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await createInventoryItem(organization.id, {
    sku: String(formData.get("sku") || ""),
    name: String(formData.get("name") || ""),
    unitOfMeasure: String(formData.get("unitOfMeasure") || "each"),
    standardCost: Math.round(Number(formData.get("standardCost") || 0) * 100),
    salesPrice: Math.round(Number(formData.get("salesPrice") || 0) * 100),
  })
  revalidatePath("/inventory")
}

export async function receiveInventoryAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await receiveInventory({
    organizationId: organization.id,
    createdById: user.id,
    itemId: String(formData.get("itemId") || ""),
    warehouseId: String(formData.get("warehouseId") || ""),
    quantity: Math.round(Number(formData.get("quantity") || 0)),
    unitCost: Math.round(Number(formData.get("unitCost") || 0) * 100),
  })
  revalidatePath("/inventory")
  revalidatePath("/reports")
}

export async function consumeInventoryAction(formData: FormData) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await consumeInventory({
    organizationId: organization.id,
    createdById: user.id,
    itemId: String(formData.get("itemId") || ""),
    warehouseId: String(formData.get("warehouseId") || ""),
    quantity: Math.round(Number(formData.get("quantity") || 0)),
    unitCost: Math.round(Number(formData.get("unitCost") || 0) * 100),
  })
  revalidatePath("/inventory")
  revalidatePath("/reports")
}
