import { prisma } from "@/lib/db"
import { cogsAccountCodeForType, inventoryAccountCodeForType, weightedAverageCost } from "@/lib/tax/gst"
import { prismaDateInYear } from "@/lib/working-year"
import { cache } from "react"
import { createBalancedJournalEntry, getNextNumber } from "./accounting"

export const getItems = cache(async (organizationId: string) => {
  return prisma.item.findMany({ where: { organizationId }, orderBy: { name: "asc" } })
})

export const getWarehouses = cache(async (organizationId: string) => {
  return prisma.warehouse.findMany({ where: { organizationId }, orderBy: { code: "asc" } })
})

export const getStockBalances = cache(async (organizationId: string) => {
  return prisma.stockBalance.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" } })
})

export const getInventoryMovements = cache(async (organizationId: string, year?: number) => {
  return prisma.inventoryMovement.findMany({
    where: { organizationId, occurredAt: prismaDateInYear(year) },
    orderBy: { occurredAt: "desc" },
    take: 100,
  })
})

export const getReorderRules = cache(async (organizationId: string) => {
  return prisma.reorderRule.findMany({ where: { organizationId, isActive: true } })
})

export const getPurchaseOrders = cache(async (organizationId: string, year?: number) => {
  return prisma.purchaseOrder.findMany({
    where: { organizationId, createdAt: prismaDateInYear(year) },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
})

export const getGoodsReceipts = cache(async (organizationId: string, year?: number) => {
  return prisma.goodsReceipt.findMany({
    where: { organizationId, receivedAt: prismaDateInYear(year) },
    orderBy: { receivedAt: "desc" },
    take: 100,
  })
})

export async function createInventoryItem(
  organizationId: string,
  data: {
    sku: string
    name: string
    unitOfMeasure?: string
    standardCost?: number
    salesPrice?: number
    type?: string
  }
) {
  const type = data.type || "material"
  return prisma.item.create({
    data: {
      organizationId,
      sku: data.sku,
      name: data.name,
      type,
      unitOfMeasure: data.unitOfMeasure || "each",
      standardCost: data.standardCost || 0,
      salesPrice: data.salesPrice || 0,
      inventoryAccountCode: inventoryAccountCodeForType(type),
    },
  })
}

async function inventoryAccountForItem(organizationId: string, itemId: string) {
  const item = await prisma.item.findFirst({ where: { id: itemId, organizationId } })
  const code = item?.inventoryAccountCode || inventoryAccountCodeForType(item?.type)
  return getAccount(organizationId, code)
}

async function cogsAccountForItem(organizationId: string, itemId: string) {
  const item = await prisma.item.findFirst({ where: { id: itemId, organizationId } })
  return getAccount(organizationId, cogsAccountCodeForType(item?.type))
}

export async function receiveInventory({
  organizationId,
  itemId,
  warehouseId,
  quantity,
  unitCost,
  createdById,
  sourceType = "inventory_receipt",
  sourceId,
  postToGrni = true,
  postedAt,
}: {
  organizationId: string
  itemId: string
  warehouseId: string
  quantity: number
  unitCost: number
  createdById?: string
  sourceType?: string
  sourceId?: string
  postToGrni?: boolean
  postedAt?: Date
}) {
  const totalCost = quantity * unitCost
  const existing = await prisma.stockBalance.findUnique({
    where: { organizationId_itemId_warehouseId: { organizationId, itemId, warehouseId } },
  })
  const next = weightedAverageCost(existing?.quantityOnHand || 0, existing?.averageCost || 0, quantity, unitCost)
  const inventoryAccount = await inventoryAccountForItem(organizationId, itemId)
  const creditAccount = postToGrni
    ? await getAccount(organizationId, "2010").catch(() => getAccount(organizationId, "2000"))
    : await getAccount(organizationId, "2000")
  const occurredAt = postedAt || new Date()

  const movement = await prisma.inventoryMovement.create({
    data: {
      organizationId,
      itemId,
      warehouseId,
      movementType: "receipt",
      quantity,
      unitCost,
      sourceType,
      sourceId,
      memo: "Inventory receipt",
      occurredAt,
    },
  })

  await prisma.stockBalance.upsert({
    where: { organizationId_itemId_warehouseId: { organizationId, itemId, warehouseId } },
    update: { quantityOnHand: next.quantity, averageCost: next.averageCost },
    create: { organizationId, itemId, warehouseId, quantityOnHand: next.quantity, averageCost: next.averageCost },
  })

  await prisma.inventoryValuationLayer.create({
    data: { organizationId, itemId, movementId: movement.id, quantity, unitCost, remainingQuantity: quantity },
  })

  const journalEntry = await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: "Inventory receipt",
    postedAt: occurredAt,
    source: sourceType,
    sourceId: sourceId || movement.id,
    lines: [
      { accountId: inventoryAccount.id, debit: totalCost, credit: 0, memo: "Inventory received" },
      { accountId: creditAccount.id, debit: 0, credit: totalCost, memo: postToGrni ? "GRNI" : "Accrued inventory payable" },
    ],
  })

  return { movement, journalEntry }
}

export async function consumeInventory({
  organizationId,
  itemId,
  warehouseId,
  quantity,
  unitCost,
  createdById,
  toWip = false,
  sourceType = "inventory_consumption",
  sourceId,
  postedAt,
}: {
  organizationId: string
  itemId: string
  warehouseId: string
  quantity: number
  unitCost?: number
  createdById?: string
  toWip?: boolean
  sourceType?: string
  sourceId?: string
  postedAt?: Date
}) {
  const balance = await prisma.stockBalance.findUnique({
    where: { organizationId_itemId_warehouseId: { organizationId, itemId, warehouseId } },
  })
  const cost = unitCost || balance?.averageCost || 0
  const totalCost = quantity * cost
  const debitAccount = toWip ? await getAccount(organizationId, "1300") : await cogsAccountForItem(organizationId, itemId)
  const inventoryAccount = await inventoryAccountForItem(organizationId, itemId)
  const occurredAt = postedAt || new Date()

  const movement = await prisma.inventoryMovement.create({
    data: {
      organizationId,
      itemId,
      warehouseId,
      movementType: "consumption",
      quantity: -Math.abs(quantity),
      unitCost: cost,
      sourceType,
      sourceId,
      memo: toWip ? "Issued to WIP" : "Inventory consumed",
      occurredAt,
    },
  })

  await prisma.stockBalance.upsert({
    where: { organizationId_itemId_warehouseId: { organizationId, itemId, warehouseId } },
    update: { quantityOnHand: { decrement: quantity } },
    create: { organizationId, itemId, warehouseId, quantityOnHand: -Math.abs(quantity), averageCost: cost },
  })

  const journalEntry = await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: toWip ? "WIP material issue" : "Inventory consumption",
    postedAt: occurredAt,
    source: sourceType,
    sourceId: sourceId || movement.id,
    lines: [
      { accountId: debitAccount.id, debit: totalCost, credit: 0, memo: toWip ? "WIP" : "Material consumed" },
      { accountId: inventoryAccount.id, debit: 0, credit: totalCost, memo: "Inventory reduction" },
    ],
  })

  return { movement, journalEntry, unitCost: cost, totalCost }
}

export async function createPurchaseOrder({
  organizationId,
  vendorId,
  lines,
}: {
  organizationId: string
  vendorId?: string
  lines: Array<{ itemId?: string; description: string; quantity: number; unitCost: number }>
}) {
  const poLines = lines.map((line) => ({
    ...line,
    quantity: Math.max(1, Math.round(line.quantity || 1)),
    unitCost: Math.round(line.unitCost),
    total: Math.max(1, Math.round(line.quantity || 1)) * Math.round(line.unitCost),
  }))
  const subtotal = poLines.reduce((sum, line) => sum + line.total, 0)
  const order = await prisma.purchaseOrder.create({
    data: {
      organizationId,
      orderNumber: await getNextNumber(organizationId, "purchase_order"),
      vendorId,
      status: "open",
      subtotal,
      taxTotal: 0,
      total: subtotal,
    },
  })
  await prisma.purchaseOrderLine.createMany({
    data: poLines.map((line) => ({
      organizationId,
      purchaseOrderId: order.id,
      itemId: line.itemId,
      description: line.description,
      quantity: line.quantity,
      unitCost: line.unitCost,
      total: line.total,
    })),
  })
  return order
}

export async function receivePurchaseOrder({
  organizationId,
  purchaseOrderId,
  warehouseId,
  createdById,
  sourceFileId,
  postedAt,
}: {
  organizationId: string
  purchaseOrderId: string
  warehouseId: string
  createdById?: string
  sourceFileId?: string
  postedAt?: Date
}) {
  if (sourceFileId) {
    const existing = await prisma.goodsReceipt.findFirst({ where: { organizationId, sourceFileId } })
    if (existing) return existing
  }

  const order = await prisma.purchaseOrder.findFirst({ where: { id: purchaseOrderId, organizationId } })
  if (!order) throw new Error("Purchase order not found")
  const lines = await prisma.purchaseOrderLine.findMany({ where: { purchaseOrderId } })
  const receipt = await prisma.goodsReceipt.create({
    data: {
      organizationId,
      receiptNumber: await getNextNumber(organizationId, "goods_receipt"),
      purchaseOrderId,
      vendorId: order.vendorId,
      sourceFileId,
      status: "received",
      receivedAt: postedAt || new Date(),
    },
  })

  let lastJournalId: string | undefined
  for (const line of lines) {
    if (!line.itemId) continue
    const result = await receiveInventory({
      organizationId,
      itemId: line.itemId,
      warehouseId,
      quantity: line.quantity,
      unitCost: line.unitCost,
      createdById,
      sourceType: "goods_receipt",
      sourceId: receipt.id,
      postToGrni: true,
      postedAt,
    })
    lastJournalId = result.journalEntry.id
  }

  if (lastJournalId) {
    await prisma.goodsReceipt.update({ where: { id: receipt.id }, data: { journalEntryId: lastJournalId } })
  }
  await prisma.purchaseOrder.update({ where: { id: purchaseOrderId }, data: { status: "received" } })
  return receipt
}

export async function receiveInboxInventory({
  organizationId,
  itemId,
  warehouseId,
  quantity,
  unitCost,
  createdById,
  sourceFileId,
  vendorId,
  postedAt,
}: {
  organizationId: string
  itemId: string
  warehouseId: string
  quantity: number
  unitCost: number
  createdById?: string
  sourceFileId?: string
  vendorId?: string
  postedAt?: Date
}) {
  if (sourceFileId) {
    const existing = await prisma.goodsReceipt.findFirst({ where: { organizationId, sourceFileId } })
    if (existing) return { receipt: existing }
  }

  const receipt = await prisma.goodsReceipt.create({
    data: {
      organizationId,
      receiptNumber: await getNextNumber(organizationId, "goods_receipt"),
      vendorId,
      sourceFileId,
      status: "received",
      receivedAt: postedAt || new Date(),
    },
  })

  const result = await receiveInventory({
    organizationId,
    itemId,
    warehouseId,
    quantity,
    unitCost,
    createdById,
    sourceType: "goods_receipt",
    sourceId: receipt.id,
    postToGrni: true,
    postedAt,
  })

  await prisma.goodsReceipt.update({
    where: { id: receipt.id },
    data: { journalEntryId: result.journalEntry.id },
  })

  return { receipt, ...result }
}

async function getAccount(organizationId: string, code: string) {
  const account = await prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code } } })
  if (!account) throw new Error(`Missing account ${code}`)
  return account
}
