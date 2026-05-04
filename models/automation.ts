import { prisma } from "@/lib/db"
import { cache } from "react"

export const getAutomationSuggestions = cache(async (organizationId: string) => {
  return prisma.automationSuggestion.findMany({
    where: { organizationId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  })
})

export const getNotificationTasks = cache(async (organizationId: string) => {
  return prisma.notificationTask.findMany({
    where: { organizationId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  })
})

export async function refreshAutomationSuggestions(organizationId: string) {
  await Promise.all([
    suggestLowStock(organizationId),
    suggestJobMarginIssues(organizationId),
    suggestCashFlowReview(organizationId),
    suggestGstReview(organizationId),
  ])
}

export async function updateSuggestionStatus(id: string, status: string) {
  return prisma.automationSuggestion.update({ where: { id }, data: { status } })
}

async function suggestLowStock(organizationId: string) {
  const balances = await prisma.stockBalance.findMany({ where: { organizationId } })
  const items = await prisma.item.findMany({ where: { organizationId } })
  const lowBalances = balances.filter((balance) => balance.quantityOnHand <= 5)

  await Promise.all(
    lowBalances.map((balance) => {
      const item = items.find((candidate) => candidate.id === balance.itemId)
      return prisma.automationSuggestion.create({
        data: {
          organizationId,
          type: "inventory_reorder",
          title: `Low stock: ${item?.name || balance.itemId}`,
          description: `${item?.sku || "Item"} has ${balance.quantityOnHand} units on hand. Review reorder quantity.`,
          sourceType: "stock_balance",
          sourceId: balance.id,
          confidence: 80,
          proposedData: {
            itemId: balance.itemId,
            quantityOnHand: balance.quantityOnHand,
            suggestedAction: "reorder",
          },
        },
      }).catch(() => null)
    })
  )
}

async function suggestJobMarginIssues(organizationId: string) {
  const jobs = await prisma.printJob.findMany({ where: { organizationId } })
  const riskyJobs = jobs.filter((job) => job.quotedTotal > 0 && job.actualCost / job.quotedTotal > 0.8)

  await Promise.all(
    riskyJobs.map((job) =>
      prisma.automationSuggestion.create({
        data: {
          organizationId,
          type: "job_margin",
          title: `Margin risk: ${job.jobNumber}`,
          description: `${job.name} has actual costs near or above the quoted amount.`,
          sourceType: "print_job",
          sourceId: job.id,
          confidence: 85,
          proposedData: {
            quotedTotal: job.quotedTotal,
            actualCost: job.actualCost,
            suggestedAction: "review_job_costing",
          },
        },
      }).catch(() => null)
    )
  )
}

async function suggestCashFlowReview(organizationId: string) {
  const [ar, ap, cash] = await Promise.all([
    accountBalance(organizationId, "1100"),
    accountBalance(organizationId, "2000"),
    accountBalance(organizationId, "1000"),
  ])

  if (ap > cash + ar) {
    await prisma.automationSuggestion.create({
      data: {
        organizationId,
        type: "cash_flow",
        title: "Cash flow review recommended",
        description: "Accounts payable is higher than available cash plus receivables.",
        confidence: 75,
        proposedData: { cash, accountsReceivable: ar, accountsPayable: ap },
      },
    }).catch(() => null)
  }
}

async function suggestGstReview(organizationId: string) {
  const gstPayable = await accountBalance(organizationId, "2100")
  const gstItc = await accountBalance(organizationId, "1160")
  const netTax = gstPayable - gstItc

  if (netTax > 0) {
    await prisma.notificationTask.create({
      data: {
        organizationId,
        type: "gst_remittance",
        title: "GST remittance planning",
        description: `Estimated GST net tax is ${(netTax / 100).toFixed(2)} CAD. Review before filing.`,
      },
    }).catch(() => null)
  }
}

async function accountBalance(organizationId: string, code: string) {
  const account = await prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code } } })
  if (!account) return 0
  const totals = await prisma.journalLine.aggregate({
    where: { organizationId, accountId: account.id },
    _sum: { debit: true, credit: true },
  })
  const debit = totals._sum.debit || 0
  const credit = totals._sum.credit || 0
  return account.normalBalance === "debit" ? debit - credit : credit - debit
}
