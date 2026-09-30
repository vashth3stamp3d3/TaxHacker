import { prisma } from "@/lib/db"
import { taxableTotals } from "@/lib/tax/gst"
import { prismaDateInYear } from "@/lib/working-year"
import { cache } from "react"
import { createBalancedJournalEntry, getNextNumber, getTaxCodes, type JournalLineInput } from "./accounting"
import { writeAuditLog } from "./audit"

export const getCustomers = cache(async (organizationId: string) => {
  return prisma.customer.findMany({ where: { organizationId }, orderBy: { name: "asc" } })
})

export const getVendors = cache(async (organizationId: string) => {
  return prisma.vendor.findMany({ where: { organizationId }, orderBy: { name: "asc" } })
})

export const getCustomer = cache(async (organizationId: string, id: string) => {
  return prisma.customer.findFirst({ where: { id, organizationId } })
})

export const getVendor = cache(async (organizationId: string, id: string) => {
  return prisma.vendor.findFirst({ where: { id, organizationId } })
})

export const getCustomerInvoices = cache(async (organizationId: string, year?: number) => {
  return prisma.customerInvoice.findMany({
    where: { organizationId, issuedAt: prismaDateInYear(year) },
    orderBy: { issuedAt: "desc" },
    take: 100,
  })
})

export const getVendorBills = cache(async (organizationId: string, year?: number) => {
  return prisma.vendorBill.findMany({
    where: { organizationId, issuedAt: prismaDateInYear(year) },
    orderBy: { issuedAt: "desc" },
    take: 100,
  })
})

export const getCustomerInvoice = cache(async (organizationId: string, id: string) => {
  return prisma.customerInvoice.findFirst({
    where: { id, organizationId },
  })
})

export const getInvoiceLines = cache(async (invoiceId: string) => {
  return prisma.invoiceLine.findMany({ where: { invoiceId }, orderBy: { description: "asc" } })
})

export const getCustomerPayments = cache(async (organizationId: string, year?: number) => {
  return prisma.customerPayment.findMany({
    where: { organizationId, paidAt: prismaDateInYear(year) },
    orderBy: { paidAt: "desc" },
    take: 100,
  })
})

export const getVendorPayments = cache(async (organizationId: string, year?: number) => {
  return prisma.vendorPayment.findMany({
    where: { organizationId, paidAt: prismaDateInYear(year) },
    orderBy: { paidAt: "desc" },
    take: 100,
  })
})

export async function getDefaultGstRate(organizationId: string) {
  const profile = await prisma.provinceTaxProfile.findFirst({
    where: { organizationId, isDefault: true },
  })
  return profile?.rateBasisPoints ?? 500
}

export async function createCustomer(
  organizationId: string,
  data: { name: string; email?: string; phone?: string; address?: string; taxExempt?: boolean; paymentTerms?: string }
) {
  const code = `CUST-${String((await prisma.customer.count({ where: { organizationId } })) + 1).padStart(4, "0")}`
  return prisma.customer.create({ data: { organizationId, code, ...data } })
}

export async function updateCustomer(
  organizationId: string,
  id: string,
  data: { name?: string; email?: string | null; phone?: string | null; address?: string | null; taxExempt?: boolean; paymentTerms?: string }
) {
  return prisma.customer.update({ where: { id }, data })
}

export async function createVendor(
  organizationId: string,
  data: { name: string; email?: string; phone?: string; gstNumber?: string; address?: string }
) {
  const code = `VEND-${String((await prisma.vendor.count({ where: { organizationId } })) + 1).padStart(4, "0")}`
  return prisma.vendor.create({ data: { organizationId, code, ...data } })
}

export async function updateVendor(
  organizationId: string,
  id: string,
  data: { name?: string; email?: string | null; phone?: string | null; gstNumber?: string | null; address?: string | null }
) {
  return prisma.vendor.update({ where: { id }, data })
}

export async function getOpenAr(organizationId: string, customerId?: string, year?: number) {
  const invoices = await prisma.customerInvoice.findMany({
    where: {
      organizationId,
      customerId: customerId || undefined,
      status: { in: ["posted", "partial"] },
      issuedAt: prismaDateInYear(year),
    },
  })
  const payments = await prisma.customerPayment.findMany({
    where: { organizationId, customerId: customerId || undefined },
  })
  const paidByInvoice = new Map<string, number>()
  for (const payment of payments) {
    if (!payment.invoiceId) continue
    paidByInvoice.set(payment.invoiceId, (paidByInvoice.get(payment.invoiceId) || 0) + payment.amount)
  }
  return invoices.map((invoice) => ({
    ...invoice,
    paid: paidByInvoice.get(invoice.id) || 0,
    balance: invoice.total - (paidByInvoice.get(invoice.id) || 0),
  }))
}

export async function getOpenAp(organizationId: string, vendorId?: string, year?: number) {
  const bills = await prisma.vendorBill.findMany({
    where: {
      organizationId,
      vendorId: vendorId || undefined,
      status: { in: ["posted", "partial"] },
      issuedAt: prismaDateInYear(year),
    },
  })
  const payments = await prisma.vendorPayment.findMany({
    where: { organizationId, vendorId: vendorId || undefined },
  })
  const paidByBill = new Map<string, number>()
  for (const payment of payments) {
    if (!payment.vendorBillId) continue
    paidByBill.set(payment.vendorBillId, (paidByBill.get(payment.vendorBillId) || 0) + payment.amount)
  }
  return bills.map((bill) => ({
    ...bill,
    paid: paidByBill.get(bill.id) || 0,
    balance: bill.total - (paidByBill.get(bill.id) || 0),
  }))
}

type DocumentLineInput = {
  description: string
  quantity: number
  unitPrice: number
  itemId?: string
}

export async function createCustomerInvoiceWithPosting({
  organizationId,
  customerId,
  createdById,
  description,
  taxableAmount,
  lines,
  salesOrderId,
  sourceFileId,
  postedAt,
}: {
  organizationId: string
  customerId?: string
  createdById?: string
  description: string
  taxableAmount?: number
  lines?: DocumentLineInput[]
  salesOrderId?: string
  sourceFileId?: string
  postedAt?: Date
}) {
  if (sourceFileId) {
    const existing = await prisma.customerInvoice.findFirst({ where: { organizationId, sourceFileId } })
    if (existing) return existing
  }

  const customer = customerId ? await getCustomer(organizationId, customerId) : null
  const taxExempt = Boolean(customer?.taxExempt)
  const rate = taxExempt ? 0 : await getDefaultGstRate(organizationId)
  const collectedCode = await getTaxCode(organizationId, "GST_5_COLLECTED")
  const invoiceLines = lines?.length
    ? lines.map((line) => ({
        description: line.description,
        quantity: Math.max(1, Math.round(line.quantity || 1)),
        unitPrice: Math.round(line.unitPrice),
        itemId: line.itemId,
        total: Math.max(1, Math.round(line.quantity || 1)) * Math.round(line.unitPrice),
      }))
    : [
        {
          description,
          quantity: 1,
          unitPrice: Math.round(taxableAmount || 0),
          itemId: undefined as string | undefined,
          total: Math.round(taxableAmount || 0),
        },
      ]
  const subtotal = invoiceLines.reduce((sum, line) => sum + line.total, 0)
  const totals = taxableTotals(subtotal, rate, taxExempt)
  const [ar, revenue, gstPayable] = await Promise.all([
    getAccount(organizationId, "1100"),
    getAccount(organizationId, "4000"),
    getAccount(organizationId, "2100"),
  ])

  const journalLines: JournalLineInput[] = [
    { accountId: ar.id, debit: totals.total, credit: 0, memo: description },
    { accountId: revenue.id, debit: 0, credit: totals.subtotal, memo: description },
  ]
  if (totals.taxTotal > 0) {
    journalLines.push({
      accountId: gstPayable.id,
      debit: 0,
      credit: totals.taxTotal,
      memo: "GST collected",
      taxCodeId: collectedCode.id,
    })
  }

  const journalDate = postedAt || new Date()
  const journalEntry = await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: `Invoice: ${description}`,
    postedAt: journalDate,
    source: "customer_invoice",
    sourceId: sourceFileId,
    lines: journalLines,
  })

  const invoice = await prisma.customerInvoice.create({
    data: {
      organizationId,
      invoiceNumber: await getNextNumber(organizationId, "customer_invoice"),
      customerId,
      salesOrderId,
      journalEntryId: journalEntry.id,
      sourceFileId,
      status: "posted",
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      issuedAt: journalDate,
      dueAt: new Date(journalDate.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.invoiceLine.createMany({
    data: invoiceLines.map((line) => ({
      organizationId,
      invoiceId: invoice.id,
      itemId: line.itemId,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      taxCodeId: totals.taxTotal > 0 ? collectedCode.id : undefined,
      total: line.total,
    })),
  })

  await writeAuditLog({
    organizationId,
    userId: createdById,
    action: "invoice.post",
    entityType: "customer_invoice",
    entityId: invoice.id,
    data: { total: invoice.total, taxTotal: invoice.taxTotal },
  })

  return invoice
}

export async function createVendorBillWithPosting({
  organizationId,
  vendorId,
  createdById,
  description,
  taxableAmount,
  sourceFileId,
  goodsReceiptId,
  purchaseOrderId,
  warnWithoutGstNumber = true,
  postedAt,
}: {
  organizationId: string
  vendorId?: string
  createdById?: string
  description: string
  taxableAmount: number
  sourceFileId?: string
  goodsReceiptId?: string
  purchaseOrderId?: string
  warnWithoutGstNumber?: boolean
  postedAt?: Date
}) {
  if (sourceFileId) {
    const existing = await prisma.vendorBill.findFirst({ where: { organizationId, sourceFileId } })
    if (existing) return existing
  }

  const vendor = vendorId ? await getVendor(organizationId, vendorId) : null
  const rate = await getDefaultGstRate(organizationId)
  const itcCode = await getTaxCode(organizationId, "GST_5_ITC")
  const claimItc = Boolean(!vendor || vendor.gstNumber)
  const totals = taxableTotals(Math.round(taxableAmount), claimItc ? rate : 0)

  const [expense, gstItc, ap, grni] = await Promise.all([
    getAccount(organizationId, "6040"),
    getAccount(organizationId, "1160"),
    getAccount(organizationId, "2000"),
    getAccount(organizationId, "2010").catch(() => getAccount(organizationId, "2000")),
  ])

  const journalLines: JournalLineInput[] = goodsReceiptId
    ? [
        { accountId: grni.id, debit: totals.subtotal, credit: 0, memo: description },
        ...(totals.taxTotal > 0
          ? [{ accountId: gstItc.id, debit: totals.taxTotal, credit: 0, memo: "GST ITC", taxCodeId: itcCode.id }]
          : []),
        { accountId: ap.id, debit: 0, credit: totals.total, memo: description },
      ]
    : [
        { accountId: expense.id, debit: totals.subtotal, credit: 0, memo: description },
        ...(totals.taxTotal > 0
          ? [{ accountId: gstItc.id, debit: totals.taxTotal, credit: 0, memo: "GST ITC", taxCodeId: itcCode.id }]
          : []),
        { accountId: ap.id, debit: 0, credit: totals.total, memo: description },
      ]

  const journalDate = postedAt || new Date()
  const journalEntry = await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: `Vendor bill: ${description}`,
    postedAt: journalDate,
    source: "vendor_bill",
    sourceId: sourceFileId,
    lines: journalLines,
  })

  const bill = await prisma.vendorBill.create({
    data: {
      organizationId,
      billNumber: await getNextNumber(organizationId, "vendor_bill"),
      vendorId,
      journalEntryId: journalEntry.id,
      purchaseOrderId,
      goodsReceiptId,
      sourceFileId,
      status: "posted",
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      issuedAt: journalDate,
      dueAt: new Date(journalDate.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  await writeAuditLog({
    organizationId,
    userId: createdById,
    action: "bill.post",
    entityType: "vendor_bill",
    entityId: bill.id,
    data: {
      total: bill.total,
      taxTotal: bill.taxTotal,
      missingGstNumber: warnWithoutGstNumber && vendor && !vendor.gstNumber,
    },
  })

  return bill
}

export async function createCustomerPaymentWithPosting({
  organizationId,
  customerId,
  createdById,
  amount,
  memo,
  invoiceId,
  postedAt,
}: {
  organizationId: string
  customerId?: string
  createdById?: string
  amount: number
  memo?: string
  invoiceId?: string
  postedAt?: Date
}) {
  const payAmount = Math.round(amount)
  if (invoiceId) {
    const open = await getOpenAr(organizationId)
    const invoice = open.find((row) => row.id === invoiceId)
    if (!invoice) throw new Error("Invoice not found or already paid")
    if (payAmount > invoice.balance) throw new Error("Payment exceeds invoice balance")
  }

  const [cash, ar] = await Promise.all([getAccount(organizationId, "1000"), getAccount(organizationId, "1100")])
  const journalDate = postedAt || new Date()
  const journalEntry = await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: memo || "Customer payment",
    postedAt: journalDate,
    source: "customer_payment",
    sourceId: invoiceId,
    lines: [
      { accountId: cash.id, debit: payAmount, credit: 0, memo },
      { accountId: ar.id, debit: 0, credit: payAmount, memo },
    ],
  })

  const payment = await prisma.customerPayment.create({
    data: { organizationId, customerId, invoiceId, journalEntryId: journalEntry.id, amount: payAmount, memo, paidAt: journalDate },
  })

  if (invoiceId) {
    const open = await getOpenAr(organizationId)
    const invoice = open.find((row) => row.id === invoiceId)
    await prisma.customerInvoice.update({
      where: { id: invoiceId },
      data: { status: !invoice || invoice.balance <= 0 ? "paid" : "partial" },
    })
  }

  return payment
}

export async function createVendorPaymentWithPosting({
  organizationId,
  vendorId,
  createdById,
  amount,
  memo,
  vendorBillId,
  postedAt,
}: {
  organizationId: string
  vendorId?: string
  createdById?: string
  amount: number
  memo?: string
  vendorBillId?: string
  postedAt?: Date
}) {
  const payAmount = Math.round(amount)
  if (vendorBillId) {
    const open = await getOpenAp(organizationId)
    const bill = open.find((row) => row.id === vendorBillId)
    if (!bill) throw new Error("Vendor bill not found or already paid")
    if (payAmount > bill.balance) throw new Error("Payment exceeds bill balance")
  }

  const [ap, cash] = await Promise.all([getAccount(organizationId, "2000"), getAccount(organizationId, "1000")])
  const journalDate = postedAt || new Date()
  const journalEntry = await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: memo || "Vendor payment",
    postedAt: journalDate,
    source: "vendor_payment",
    sourceId: vendorBillId,
    lines: [
      { accountId: ap.id, debit: payAmount, credit: 0, memo },
      { accountId: cash.id, debit: 0, credit: payAmount, memo },
    ],
  })

  const payment = await prisma.vendorPayment.create({
    data: { organizationId, vendorId, vendorBillId, journalEntryId: journalEntry.id, amount: payAmount, memo, paidAt: journalDate },
  })

  if (vendorBillId) {
    const open = await getOpenAp(organizationId)
    const bill = open.find((row) => row.id === vendorBillId)
    await prisma.vendorBill.update({
      where: { id: vendorBillId },
      data: { status: !bill || bill.balance <= 0 ? "paid" : "partial" },
    })
  }

  return payment
}

async function getAccount(organizationId: string, code: string) {
  const account = await prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code } } })
  if (!account) throw new Error(`Missing account ${code}`)
  return account
}

async function getTaxCode(organizationId: string, code: string) {
  const taxCodes = await getTaxCodes(organizationId)
  const taxCode = taxCodes.find((item) => item.code === code)
  if (!taxCode) throw new Error(`Missing tax code ${code}`)
  return taxCode
}
