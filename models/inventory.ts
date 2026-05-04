import { prisma } from "@/lib/db"
import { cache } from "react"
import { createBalancedJournalEntry } from "./accounting"

export const getItems = cache(async (organizationId: string) => {
  return prisma.item.findMany({ where: { organizationId }, orderBy: { name: "asc" } })
})

export const getWarehouses = cache(async (organizationId: string) => {
  return prisma.warehouse.findMany({ where: { organizationId }, orderBy: { code: "asc" } })
})

export const getStockBalances = cache(async (organizationId: string) => {
  return prisma.stockBalance.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" } })
})

export const getInventoryMovements = cache(async (organizationId: string) => {
  return prisma.inventoryMovement.findMany({
    where: { organizationId },
    orderBy: { occurredAt: "desc" },
    take: 100,
  })
})

export const getReorderRules = cache(async (organizationId: string) => {
  return prisma.reorderRule.findMany({ where: { organizationId, isActive: true } })
})

export async function createInventoryItem(
  organizationId: string,
  data: { sku: string; name: string; unitOfMeasure?: string; standardCost?: number; salesPrice?: number }
) {
  return prisma.item.create({
    data: {
      organizationId,
      sku: data.sku,
      name: data.name,
      unitOfMeasure: data.unitOfMeasure || "each",
      standardCost: data.standardCost || 0,
      salesPrice: data.salesPrice || 0,
    },
  })
}

export async function receiveInventory({
  organizationId,
  itemId,
  warehouseId,
  quantity,
  unitCost,
  createdById,
}: {
  organizationId: string
  itemId: string
  warehouseId: string
  quantity: number
  unitCost: number
  createdById?: string
}) {
  const totalCost = quantity * unitCost
  const [inventoryAccount, apAccount] = await Promise.all([getAccount(organizationId, "1200"), getAccount(organizationId, "2000")])

  const movement = await prisma.inventoryMovement.create({
    data: {
      organizationId,
      itemId,
      warehouseId,
      movementType: "receipt",
      quantity,
      unitCost,
      memo: "Inventory receipt",
    },
  })

  await prisma.stockBalance.upsert({
    where: { organizationId_itemId_warehouseId: { organizationId, itemId, warehouseId } },
    update: {
      quantityOnHand: { increment: quantity },
      averageCost: unitCost,
    },
    create: { organizationId, itemId, warehouseId, quantityOnHand: quantity, averageCost: unitCost },
  })

  await prisma.inventoryValuationLayer.create({
    data: { organizationId, itemId, movementId: movement.id, quantity, unitCost, remainingQuantity: quantity },
  })

  await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: "Inventory receipt",
    postedAt: new Date(),
    source: "inventory_receipt",
    sourceId: movement.id,
    lines: [
      { accountId: inventoryAccount.id, debit: totalCost, credit: 0, memo: "Inventory received" },
      { accountId: apAccount.id, debit: 0, credit: totalCost, memo: "Accrued inventory payable" },
    ],
  })

  return movement
}

export async function consumeInventory({
  organizationId,
  itemId,
  warehouseId,
  quantity,
  unitCost,
  createdById,
}: {
  organizationId: string
  itemId: string
  warehouseId: string
  quantity: number
  unitCost: number
  createdById?: string
}) {
  const totalCost = quantity * unitCost
  const [cogsAccount, inventoryAccount] = await Promise.all([
    getAccount(organizationId, "5000"),
    getAccount(organizationId, "1200"),
  ])

  const movement = await prisma.inventoryMovement.create({
    data: {
      organizationId,
      itemId,
      warehouseId,
      movementType: "consumption",
      quantity: -Math.abs(quantity),
      unitCost,
      memo: "Inventory consumed by job",
    },
  })

  await prisma.stockBalance.upsert({
    where: { organizationId_itemId_warehouseId: { organizationId, itemId, warehouseId } },
    update: { quantityOnHand: { decrement: quantity } },
    create: { organizationId, itemId, warehouseId, quantityOnHand: -Math.abs(quantity), averageCost: unitCost },
  })

  await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: "Inventory consumption",
    postedAt: new Date(),
    source: "inventory_consumption",
    sourceId: movement.id,
    lines: [
      { accountId: cogsAccount.id, debit: totalCost, credit: 0, memo: "Material consumed" },
      { accountId: inventoryAccount.id, debit: 0, credit: totalCost, memo: "Inventory reduction" },
    ],
  })

  return movement
}

async function getAccount(organizationId: string, code: string) {
  const account = await prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code } } })
  if (!account) throw new Error(`Missing account ${code}`)
  return account
}
