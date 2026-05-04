import { prisma } from "@/lib/db"
import { cache } from "react"
import { createBalancedJournalEntry, getNextNumber } from "./accounting"

export const getCustomers = cache(async (organizationId: string) => {
  return prisma.customer.findMany({ where: { organizationId }, orderBy: { name: "asc" } })
})

export const getVendors = cache(async (organizationId: string) => {
  return prisma.vendor.findMany({ where: { organizationId }, orderBy: { name: "asc" } })
})

export const getCustomerInvoices = cache(async (organizationId: string) => {
  return prisma.customerInvoice.findMany({ where: { organizationId }, orderBy: { issuedAt: "desc" }, take: 100 })
})

export const getVendorBills = cache(async (organizationId: string) => {
  return prisma.vendorBill.findMany({ where: { organizationId }, orderBy: { issuedAt: "desc" }, take: 100 })
})

export const getCustomerPayments = cache(async (organizationId: string) => {
  return prisma.customerPayment.findMany({ where: { organizationId }, orderBy: { paidAt: "desc" }, take: 100 })
})

export const getVendorPayments = cache(async (organizationId: string) => {
  return prisma.vendorPayment.findMany({ where: { organizationId }, orderBy: { paidAt: "desc" }, take: 100 })
})

export async function createCustomer(organizationId: string, data: { name: string; email?: string; phone?: string }) {
  const code = `CUST-${String((await prisma.customer.count({ where: { organizationId } })) + 1).padStart(4, "0")}`
  return prisma.customer.create({ data: { organizationId, code, ...data } })
}

export async function createVendor(
  organizationId: string,
  data: { name: string; email?: string; phone?: string; gstNumber?: string }
) {
  const code = `VEND-${String((await prisma.vendor.count({ where: { organizationId } })) + 1).padStart(4, "0")}`
  return prisma.vendor.create({ data: { organizationId, code, ...data } })
}

export async function createCustomerInvoiceWithPosting({
  organizationId,
  customerId,
  createdById,
  description,
  taxableAmount,
}: {
  organizationId: string
  customerId?: string
  createdById?: string
  description: string
  taxableAmount: number
}) {
  const subtotal = Math.round(taxableAmount)
  const taxTotal = Math.round(subtotal * 0.05)
  const total = subtotal + taxTotal
  const [ar, revenue, gstPayable, gstTaxCode] = await Promise.all([
    getAccount(organizationId, "1100"),
    getAccount(organizationId, "4000"),
    getAccount(organizationId, "2100"),
    getTaxCode(organizationId, "GST_5_COLLECTED"),
  ])

  const journalEntry = await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: `Invoice: ${description}`,
    postedAt: new Date(),
    source: "customer_invoice",
    lines: [
      { accountId: ar.id, debit: total, credit: 0, memo: description },
      { accountId: revenue.id, debit: 0, credit: subtotal, memo: description },
      { accountId: gstPayable.id, debit: 0, credit: taxTotal, memo: "GST collected", taxCodeId: gstTaxCode.id },
    ],
  })

  return prisma.customerInvoice.create({
    data: {
      organizationId,
      invoiceNumber: await getNextNumber(organizationId, "customer_invoice"),
      customerId,
      journalEntryId: journalEntry.id,
      status: "posted",
      subtotal,
      taxTotal,
      total,
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
}

export async function createVendorBillWithPosting({
  organizationId,
  vendorId,
  createdById,
  description,
  taxableAmount,
}: {
  organizationId: string
  vendorId?: string
  createdById?: string
  description: string
  taxableAmount: number
}) {
  const subtotal = Math.round(taxableAmount)
  const taxTotal = Math.round(subtotal * 0.05)
  const total = subtotal + taxTotal
  const [expense, gstItc, ap, gstTaxCode] = await Promise.all([
    getAccount(organizationId, "6040"),
    getAccount(organizationId, "1160"),
    getAccount(organizationId, "2000"),
    getTaxCode(organizationId, "GST_5_ITC"),
  ])

  const journalEntry = await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: `Vendor bill: ${description}`,
    postedAt: new Date(),
    source: "vendor_bill",
    lines: [
      { accountId: expense.id, debit: subtotal, credit: 0, memo: description },
      { accountId: gstItc.id, debit: taxTotal, credit: 0, memo: "GST ITC", taxCodeId: gstTaxCode.id },
      { accountId: ap.id, debit: 0, credit: total, memo: description },
    ],
  })

  return prisma.vendorBill.create({
    data: {
      organizationId,
      billNumber: await getNextNumber(organizationId, "vendor_bill"),
      vendorId,
      journalEntryId: journalEntry.id,
      status: "posted",
      subtotal,
      taxTotal,
      total,
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
}

export async function createCustomerPaymentWithPosting({
  organizationId,
  customerId,
  createdById,
  amount,
  memo,
}: {
  organizationId: string
  customerId?: string
  createdById?: string
  amount: number
  memo?: string
}) {
  const [cash, ar] = await Promise.all([getAccount(organizationId, "1000"), getAccount(organizationId, "1100")])
  const journalEntry = await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: memo || "Customer payment",
    postedAt: new Date(),
    source: "customer_payment",
    lines: [
      { accountId: cash.id, debit: amount, credit: 0, memo },
      { accountId: ar.id, debit: 0, credit: amount, memo },
    ],
  })

  return prisma.customerPayment.create({
    data: { organizationId, customerId, journalEntryId: journalEntry.id, amount, memo },
  })
}

export async function createVendorPaymentWithPosting({
  organizationId,
  vendorId,
  createdById,
  amount,
  memo,
}: {
  organizationId: string
  vendorId?: string
  createdById?: string
  amount: number
  memo?: string
}) {
  const [ap, cash] = await Promise.all([getAccount(organizationId, "2000"), getAccount(organizationId, "1000")])
  const journalEntry = await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: memo || "Vendor payment",
    postedAt: new Date(),
    source: "vendor_payment",
    lines: [
      { accountId: ap.id, debit: amount, credit: 0, memo },
      { accountId: cash.id, debit: 0, credit: amount, memo },
    ],
  })

  return prisma.vendorPayment.create({
    data: { organizationId, vendorId, journalEntryId: journalEntry.id, amount, memo },
  })
}

async function getAccount(organizationId: string, code: string) {
  const account = await prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code } } })
  if (!account) throw new Error(`Missing account ${code}`)
  return account
}

async function getTaxCode(organizationId: string, code: string) {
  const taxCode = await prisma.taxCode.findUnique({ where: { organizationId_code: { organizationId, code } } })
  if (!taxCode) throw new Error(`Missing tax code ${code}`)
  return taxCode
}
