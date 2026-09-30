import { prisma } from "@/lib/db"
import { Prisma } from "@/prisma/client"

export async function attachDocument(input: {
  organizationId: string
  fileId: string
  transactionId?: string
  customerInvoiceId?: string
  vendorBillId?: string
  quoteId?: string
  salesOrderId?: string
  printJobId?: string
  purchaseOrderId?: string
  goodsReceiptId?: string
}) {
  return prisma.documentAttachment.create({
    data: {
      organizationId: input.organizationId,
      fileId: input.fileId,
      transactionId: input.transactionId,
      customerInvoiceId: input.customerInvoiceId,
      vendorBillId: input.vendorBillId,
      quoteId: input.quoteId,
      salesOrderId: input.salesOrderId,
      printJobId: input.printJobId,
      purchaseOrderId: input.purchaseOrderId,
      goodsReceiptId: input.goodsReceiptId,
    },
  })
}

export async function saveDocumentClassification(input: {
  organizationId: string
  fileId: string
  documentType: string
  partyName?: string | null
  taxCode?: string | null
  accountCode?: string | null
  confidence?: number
  extractedData?: Record<string, unknown>
}) {
  return prisma.documentClassification.create({
    data: {
      organizationId: input.organizationId,
      fileId: input.fileId,
      documentType: input.documentType,
      partyName: input.partyName || null,
      taxCode: input.taxCode || null,
      accountCode: input.accountCode || null,
      confidence: input.confidence || 0,
      extractedData: input.extractedData as Prisma.InputJsonValue | undefined,
    },
  })
}

export async function getLatestClassification(fileId: string) {
  return prisma.documentClassification.findFirst({
    where: { fileId },
    orderBy: { createdAt: "desc" },
  })
}

export async function findExistingSourceLinks(organizationId: string, sourceFileId: string) {
  const [transaction, bill, invoice, receipt] = await Promise.all([
    prisma.transaction.findFirst({ where: { organizationId, sourceFileId } }),
    prisma.vendorBill.findFirst({ where: { organizationId, sourceFileId } }),
    prisma.customerInvoice.findFirst({ where: { organizationId, sourceFileId } }),
    prisma.goodsReceipt.findFirst({ where: { organizationId, sourceFileId } }),
  ])
  return { transaction, bill, invoice, receipt }
}

export async function findExistingSourceDocument(organizationId: string, sourceFileId: string) {
  const links = await findExistingSourceLinks(organizationId, sourceFileId)
  return links.transaction || links.bill || links.invoice || links.receipt
}

export async function matchVendorByName(organizationId: string, name?: string | null) {
  const needle = name?.trim()
  if (!needle) return null
  return prisma.vendor.findFirst({
    where: { organizationId, name: { equals: needle, mode: "insensitive" } },
  })
}

export async function matchCustomerByName(organizationId: string, name?: string | null) {
  const needle = name?.trim()
  if (!needle) return null
  return prisma.customer.findFirst({
    where: { organizationId, name: { equals: needle, mode: "insensitive" } },
  })
}
