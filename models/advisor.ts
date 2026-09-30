import { prisma } from "@/lib/db"

export async function listAdvisorThreads(organizationId: string, userId: string) {
  return prisma.taxAdvisorThread.findMany({
    where: { organizationId, userId },
    orderBy: { updatedAt: "desc" },
    take: 40,
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })
}

export async function getAdvisorThread(organizationId: string, threadId: string) {
  return prisma.taxAdvisorThread.findFirst({
    where: { id: threadId, organizationId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  })
}

export async function upsertAdvisorThread({
  organizationId,
  userId,
  threadId,
  title,
  entityType,
  entityId,
  userMessage,
  assistantMessage,
  sources,
}: {
  organizationId: string
  userId: string
  threadId?: string | null
  title?: string
  entityType?: string | null
  entityId?: string | null
  userMessage: string
  assistantMessage: string
  sources?: unknown
}) {
  const thread = threadId
    ? await prisma.taxAdvisorThread.findFirst({ where: { id: threadId, organizationId, userId } })
    : null

  const saved =
    thread ||
    (await prisma.taxAdvisorThread.create({
      data: {
        organizationId,
        userId,
        title: title || userMessage.slice(0, 80) || "Tax advisor",
        entityType: entityType || null,
        entityId: entityId || null,
      },
    }))

  await prisma.taxAdvisorMessage.createMany({
    data: [
      { threadId: saved.id, role: "user", content: userMessage },
      { threadId: saved.id, role: "assistant", content: assistantMessage, sources: sources as object | undefined },
    ],
  })

  await prisma.taxAdvisorThread.update({
    where: { id: saved.id },
    data: { updatedAt: new Date(), title: saved.title || title || userMessage.slice(0, 80) },
  })

  return getAdvisorThread(organizationId, saved.id)
}

export type EntitySnapshot = {
  type: string
  id: string
  text: string
}

export function formatEntitySnapshot(parts: Array<[string, string | number | null | undefined]>) {
  return parts
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n")
}

export async function loadEntitySnapshot(organizationId: string, entityType?: string | null, entityId?: string | null) {
  if (!entityType || !entityId) return null

  if (entityType === "gst_period") {
    const period = await prisma.taxFilingPeriod.findFirst({ where: { id: entityId, organizationId } })
    if (!period) return null
    return {
      type: entityType,
      id: entityId,
      text: formatEntitySnapshot([
        ["GST period", `${period.startsAt.toISOString().slice(0, 10)} to ${period.endsAt.toISOString().slice(0, 10)}`],
        ["Status", period.status],
        ["Due", period.dueAt.toISOString().slice(0, 10)],
      ]),
    } satisfies EntitySnapshot
  }

  if (entityType === "customer_invoice") {
    const invoice = await prisma.customerInvoice.findFirst({
      where: { id: entityId, organizationId },
    })
    if (!invoice) return null
    const customer = invoice.customerId
      ? await prisma.customer.findFirst({ where: { id: invoice.customerId, organizationId } })
      : null
    return {
      type: entityType,
      id: entityId,
      text: formatEntitySnapshot([
        ["Customer invoice", invoice.invoiceNumber],
        ["Status", invoice.status],
        ["Customer", customer?.name],
        ["Tax exempt", customer?.taxExempt ? "yes" : "no"],
        ["Subtotal cents", invoice.subtotal],
        ["GST cents", invoice.taxTotal],
        ["Total cents", invoice.total],
      ]),
    } satisfies EntitySnapshot
  }

  if (entityType === "vendor_bill") {
    const bill = await prisma.vendorBill.findFirst({ where: { id: entityId, organizationId } })
    if (!bill) return null
    const vendor = bill.vendorId
      ? await prisma.vendor.findFirst({ where: { id: bill.vendorId, organizationId } })
      : null
    return {
      type: entityType,
      id: entityId,
      text: formatEntitySnapshot([
        ["Vendor bill", bill.billNumber],
        ["Status", bill.status],
        ["Vendor", vendor?.name],
        ["Vendor GST number", vendor?.gstNumber],
        ["Subtotal cents", bill.subtotal],
        ["GST ITC cents", bill.taxTotal],
        ["Total cents", bill.total],
      ]),
    } satisfies EntitySnapshot
  }

  if (entityType === "transaction") {
    const transaction = await prisma.transaction.findFirst({ where: { id: entityId, organizationId } })
    if (!transaction) return null
    return {
      type: entityType,
      id: entityId,
      text: formatEntitySnapshot([
        ["Inbox transaction", transaction.name],
        ["Merchant", transaction.merchant],
        ["Destination", transaction.destinationType],
        ["Posts to ledger", transaction.postsToLedger ? "yes" : "no"],
        ["Total cents", transaction.convertedTotal || transaction.total],
      ]),
    } satisfies EntitySnapshot
  }

  return null
}
