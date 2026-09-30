import { prisma } from "@/lib/db"
import { taxableTotals } from "@/lib/tax/gst"
import { cache } from "react"
import { createBalancedJournalEntry, getNextNumber } from "./accounting"
import { createCustomerInvoiceWithPosting, getDefaultGstRate } from "./commerce"
import { consumeInventory } from "./inventory"

export const getQuotes = cache(async (organizationId: string) => {
  return prisma.quote.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100 })
})

export const getQuote = cache(async (organizationId: string, id: string) => {
  return prisma.quote.findFirst({ where: { id, organizationId } })
})

export const getQuoteLines = cache(async (quoteId: string) => {
  return prisma.quoteLine.findMany({ where: { quoteId } })
})

export const getSalesOrders = cache(async (organizationId: string) => {
  return prisma.salesOrder.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100 })
})

export const getSalesOrder = cache(async (organizationId: string, id: string) => {
  return prisma.salesOrder.findFirst({ where: { id, organizationId } })
})

export const getSalesOrderLines = cache(async (salesOrderId: string) => {
  return prisma.salesOrderLine.findMany({ where: { salesOrderId } })
})

export const getPrintJobs = cache(async (organizationId: string) => {
  return prisma.printJob.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100 })
})

export const getPrintJob = cache(async (organizationId: string, id: string) => {
  return prisma.printJob.findFirst({ where: { id, organizationId } })
})

export const getJobMaterials = cache(async (organizationId: string, printJobId?: string) => {
  return prisma.jobMaterial.findMany({
    where: { organizationId, printJobId: printJobId || undefined },
    orderBy: { consumedAt: "desc" },
  })
})

export const getJobLabor = cache(async (organizationId: string, printJobId?: string) => {
  return prisma.jobLabor.findMany({
    where: { organizationId, printJobId: printJobId || undefined },
    orderBy: { workedAt: "desc" },
  })
})

export const getJobStatusEvents = cache(async (printJobId: string) => {
  return prisma.jobStatusEvent.findMany({ where: { printJobId }, orderBy: { createdAt: "asc" } })
})

type LineInput = { description: string; quantity: number; unitPrice: number; itemId?: string }

async function totalsForLines(organizationId: string, lines: LineInput[], taxExempt = false) {
  const rate = taxExempt ? 0 : await getDefaultGstRate(organizationId)
  const prepared = lines.map((line) => ({
    description: line.description,
    quantity: Math.max(1, Math.round(line.quantity || 1)),
    unitPrice: Math.round(line.unitPrice),
    itemId: line.itemId,
    total: Math.max(1, Math.round(line.quantity || 1)) * Math.round(line.unitPrice),
  }))
  const subtotal = prepared.reduce((sum, line) => sum + line.total, 0)
  return { prepared, ...taxableTotals(subtotal, rate, taxExempt) }
}

export async function createQuote({
  organizationId,
  customerId,
  description,
  amount,
  lines,
}: {
  organizationId: string
  customerId?: string
  description: string
  amount?: number
  lines?: LineInput[]
}) {
  const quoteLines = lines?.length ? lines : [{ description, quantity: 1, unitPrice: Math.round(amount || 0) }]
  const totals = await totalsForLines(organizationId, quoteLines)
  const quote = await prisma.quote.create({
    data: {
      organizationId,
      quoteNumber: await getNextNumber(organizationId, "quote"),
      customerId,
      status: "draft",
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.quoteLine.createMany({
    data: totals.prepared.map((line) => ({
      organizationId,
      quoteId: quote.id,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
    })),
  })
  return quote
}

export async function convertQuoteToSalesOrder(organizationId: string, quoteId: string) {
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, organizationId } })
  if (!quote) throw new Error("Quote not found")
  const quoteLines = await prisma.quoteLine.findMany({ where: { quoteId } })
  const order = await prisma.salesOrder.create({
    data: {
      organizationId,
      orderNumber: await getNextNumber(organizationId, "sales_order"),
      customerId: quote.customerId,
      quoteId: quote.id,
      status: "open",
      subtotal: quote.subtotal,
      taxTotal: quote.taxTotal,
      total: quote.total,
    },
  })
  if (quoteLines.length) {
    await prisma.salesOrderLine.createMany({
      data: quoteLines.map((line) => ({
        organizationId,
        salesOrderId: order.id,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: line.total,
      })),
    })
  }
  await prisma.quote.update({ where: { id: quote.id }, data: { status: "accepted" } })
  return order
}

export async function createSalesOrder({
  organizationId,
  customerId,
  quoteId,
  amount,
  description = "Sales order",
  lines,
}: {
  organizationId: string
  customerId?: string
  quoteId?: string
  amount?: number
  description?: string
  lines?: LineInput[]
}) {
  if (quoteId) return convertQuoteToSalesOrder(organizationId, quoteId)
  const orderLines = lines?.length ? lines : [{ description, quantity: 1, unitPrice: Math.round(amount || 0) }]
  const totals = await totalsForLines(organizationId, orderLines)
  const order = await prisma.salesOrder.create({
    data: {
      organizationId,
      orderNumber: await getNextNumber(organizationId, "sales_order"),
      customerId,
      status: "open",
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
    },
  })
  await prisma.salesOrderLine.createMany({
    data: totals.prepared.map((line) => ({
      organizationId,
      salesOrderId: order.id,
      itemId: line.itemId,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
    })),
  })
  return order
}

export async function convertSalesOrderToInvoice(organizationId: string, salesOrderId: string, createdById?: string) {
  const order = await prisma.salesOrder.findFirst({ where: { id: salesOrderId, organizationId } })
  if (!order) throw new Error("Sales order not found")
  const orderLines = await prisma.salesOrderLine.findMany({ where: { salesOrderId } })
  const invoice = await createCustomerInvoiceWithPosting({
    organizationId,
    customerId: order.customerId || undefined,
    createdById,
    salesOrderId: order.id,
    description: `Invoice for ${order.orderNumber}`,
    taxableAmount: order.subtotal,
    lines: orderLines.length
      ? orderLines.map((line) => ({
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          itemId: line.itemId || undefined,
        }))
      : undefined,
  })
  await prisma.salesOrder.update({ where: { id: order.id }, data: { status: "invoiced" } })
  return invoice
}

export async function createPrintJob({
  organizationId,
  customerId,
  salesOrderId,
  name,
  quotedTotal,
}: {
  organizationId: string
  customerId?: string
  salesOrderId?: string
  name: string
  quotedTotal: number
}) {
  const job = await prisma.printJob.create({
    data: {
      organizationId,
      jobNumber: await getNextNumber(organizationId, "print_job"),
      customerId,
      salesOrderId,
      name,
      quotedTotal,
      status: "planned",
    },
  })

  await prisma.jobStatusEvent.create({
    data: { organizationId, printJobId: job.id, status: "planned", note: "Job created" },
  })

  return job
}

export async function addJobMaterial({
  organizationId,
  printJobId,
  itemId,
  quantity,
  unitCost,
  warehouseId,
  createdById,
}: {
  organizationId: string
  printJobId: string
  itemId: string
  quantity: number
  unitCost?: number
  warehouseId?: string
  createdById?: string
}) {
  const warehouse =
    warehouseId ||
    (await prisma.warehouse.findFirst({ where: { organizationId, isDefault: true } }))?.id ||
    (await prisma.warehouse.findFirst({ where: { organizationId } }))?.id
  if (!warehouse) throw new Error("No warehouse is configured")

  const consumed = await consumeInventory({
    organizationId,
    itemId,
    warehouseId: warehouse,
    quantity,
    unitCost,
    createdById,
    toWip: true,
    sourceType: "print_job",
    sourceId: printJobId,
  })

  const material = await prisma.jobMaterial.create({
    data: {
      organizationId,
      printJobId,
      itemId,
      quantity,
      unitCost: consumed.unitCost,
      consumedAt: new Date(),
    },
  })
  await updateJobActualCost(printJobId)
  return material
}

export async function addJobLabor({
  organizationId,
  printJobId,
  description,
  minutes,
  rate,
}: {
  organizationId: string
  printJobId: string
  description: string
  minutes: number
  rate: number
}) {
  const labor = await prisma.jobLabor.create({
    data: { organizationId, printJobId, description, minutes, rate },
  })
  await updateJobActualCost(printJobId)
  return labor
}

export async function advancePrintJobStatus(
  organizationId: string,
  printJobId: string,
  status: string,
  createdById?: string
) {
  const job = await prisma.printJob.findFirst({ where: { id: printJobId, organizationId } })
  if (!job) throw new Error("Print job not found")

  const normalizedStatus = status === "completed" ? "complete" : status
  if (normalizedStatus === "complete" && !job.cogsJournalEntryId && job.actualCost > 0) {
    const [cogs, wip] = await Promise.all([getAccount(organizationId, "5000"), getAccount(organizationId, "1300")])
    const entry = await createBalancedJournalEntry({
      organizationId,
      createdById,
      description: `Recognize COGS for ${job.jobNumber}`,
      postedAt: new Date(),
      source: "print_job_complete",
      sourceId: job.id,
      lines: [
        { accountId: cogs.id, debit: job.actualCost, credit: 0, memo: "Job COGS" },
        { accountId: wip.id, debit: 0, credit: job.actualCost, memo: "Clear WIP" },
      ],
    })
    await prisma.printJob.update({
      where: { id: job.id },
      data: { status: normalizedStatus, cogsJournalEntryId: entry.id },
    })
  } else {
    await prisma.printJob.update({ where: { id: printJobId }, data: { status: normalizedStatus } })
  }

  return prisma.jobStatusEvent.create({ data: { organizationId, printJobId, status: normalizedStatus } })
}

async function updateJobActualCost(printJobId: string) {
  const [materials, labor] = await Promise.all([
    prisma.jobMaterial.findMany({ where: { printJobId } }),
    prisma.jobLabor.findMany({ where: { printJobId } }),
  ])
  const materialCost = materials.reduce((sum, material) => sum + material.quantity * material.unitCost, 0)
  const laborCost = labor.reduce((sum, line) => sum + Math.round((line.minutes / 60) * line.rate), 0)

  await prisma.printJob.update({ where: { id: printJobId }, data: { actualCost: materialCost + laborCost } })
}

async function getAccount(organizationId: string, code: string) {
  const account = await prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code } } })
  if (!account) throw new Error(`Missing account ${code}`)
  return account
}
