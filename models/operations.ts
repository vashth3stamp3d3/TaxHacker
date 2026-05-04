import { prisma } from "@/lib/db"
import { cache } from "react"
import { getNextNumber } from "./accounting"

export const getQuotes = cache(async (organizationId: string) => {
  return prisma.quote.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100 })
})

export const getSalesOrders = cache(async (organizationId: string) => {
  return prisma.salesOrder.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100 })
})

export const getPrintJobs = cache(async (organizationId: string) => {
  return prisma.printJob.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100 })
})

export const getJobMaterials = cache(async (organizationId: string) => {
  return prisma.jobMaterial.findMany({ where: { organizationId }, orderBy: { consumedAt: "desc" } })
})

export const getJobLabor = cache(async (organizationId: string) => {
  return prisma.jobLabor.findMany({ where: { organizationId }, orderBy: { workedAt: "desc" } })
})

export async function createQuote({
  organizationId,
  customerId,
  description,
  amount,
}: {
  organizationId: string
  customerId?: string
  description: string
  amount: number
}) {
  const taxTotal = Math.round(amount * 0.05)
  return prisma.quote.create({
    data: {
      organizationId,
      quoteNumber: await getNextNumber(organizationId, "quote"),
      customerId,
      status: "draft",
      subtotal: amount,
      taxTotal,
      total: amount + taxTotal,
    },
  })
}

export async function createSalesOrder({
  organizationId,
  customerId,
  quoteId,
  amount,
}: {
  organizationId: string
  customerId?: string
  quoteId?: string
  amount: number
}) {
  const taxTotal = Math.round(amount * 0.05)
  return prisma.salesOrder.create({
    data: {
      organizationId,
      orderNumber: await getNextNumber(organizationId, "sales_order"),
      customerId,
      quoteId,
      status: "open",
      subtotal: amount,
      taxTotal,
      total: amount + taxTotal,
    },
  })
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
}: {
  organizationId: string
  printJobId: string
  itemId: string
  quantity: number
  unitCost: number
}) {
  const material = await prisma.jobMaterial.create({
    data: { organizationId, printJobId, itemId, quantity, unitCost, consumedAt: new Date() },
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

export async function advancePrintJobStatus(organizationId: string, printJobId: string, status: string) {
  await prisma.printJob.update({ where: { id: printJobId }, data: { status } })
  return prisma.jobStatusEvent.create({ data: { organizationId, printJobId, status } })
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
