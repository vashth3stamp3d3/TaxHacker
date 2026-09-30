import { prisma } from "@/lib/db"
import { gstRemittanceAmounts, gstRemittancePosting, selectGstFilingPeriod } from "@/lib/tax/gst"
import { cache } from "react"
import { createBalancedJournalEntry, formatMoney, getTaxCodes } from "./accounting"
import { writeAuditLog } from "./audit"

export type GstRegisterLine = {
  journalLineId: string
  journalEntryId: string
  entryNumber: string
  postedAt: Date
  source: string
  sourceId: string | null
  memo: string | null
  taxCode: string
  collected: number
  inputCredit: number
}

export const getTaxFilingPeriods = cache(async (organizationId: string) => {
  return prisma.taxFilingPeriod.findMany({
    where: { organizationId, taxType: "GST" },
    orderBy: { startsAt: "desc" },
  })
})

export { selectGstFilingPeriod }

export const getTaxRemittances = cache(async (organizationId: string) => {
  return prisma.taxRemittance.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 20,
  })
})

export async function getGstRegister(
  organizationId: string,
  range?: { from?: Date; to?: Date }
) {
  const taxCodes = await getTaxCodes(organizationId)
  const gstCodes = taxCodes.filter((code) => code.taxType === "GST")
  const gstCodeIds = gstCodes.map((code) => code.id)
  const taxCodeById = new Map(gstCodes.map((code) => [code.id, code]))

  const taxLines = await prisma.journalLine.findMany({
    where: {
      organizationId,
      taxCodeId: { in: gstCodeIds },
      journalEntry: range?.from || range?.to
        ? {
            postedAt: {
              gte: range.from,
              lte: range.to,
            },
          }
        : undefined,
    },
    include: { journalEntry: true },
    orderBy: { createdAt: "asc" },
  })

  const lines: GstRegisterLine[] = taxLines.map((line) => {
    const collected = Math.max(0, line.credit - line.debit)
    const inputCredit = Math.max(0, line.debit - line.credit)
    return {
      journalLineId: line.id,
      journalEntryId: line.journalEntryId,
      entryNumber: line.journalEntry.entryNumber,
      postedAt: line.journalEntry.postedAt,
      source: line.journalEntry.source,
      sourceId: line.journalEntry.sourceId,
      memo: line.memo,
      taxCode: taxCodeById.get(line.taxCodeId || "")?.code || "GST",
      collected,
      inputCredit,
    }
  })

  const collected = lines.reduce((sum, line) => sum + line.collected, 0)
  const inputCredits = lines.reduce((sum, line) => sum + line.inputCredit, 0)
  const summary = gstRemittanceAmounts(collected, inputCredits)

  return { ...summary, taxCodes, lines }
}

export async function postGstRemittance({
  organizationId,
  createdById,
  filingPeriodId,
  payNow = false,
}: {
  organizationId: string
  createdById?: string
  filingPeriodId: string
  payNow?: boolean
}) {
  const period = await prisma.taxFilingPeriod.findFirst({
    where: { id: filingPeriodId, organizationId },
  })
  if (!period) throw new Error("GST filing period not found")
  if (period.status === "filed") throw new Error("This GST period is already filed")

  const existing = await prisma.taxRemittance.findFirst({
    where: { organizationId, filingPeriodId, status: "posted" },
  })
  if (existing) throw new Error("A remittance is already posted for this period")

  const register = await getGstRegister(organizationId, { from: period.startsAt, to: period.endsAt })
  const posting = gstRemittancePosting(register)
  const [collectedAccount, itcAccount, remittanceAccount, cashAccount] = await Promise.all([
    getAccount(organizationId, "2100"),
    getAccount(organizationId, "1160"),
    getAccount(organizationId, "2110"),
    getAccount(organizationId, "1000"),
  ])

  const lines: { accountId: string; debit: number; credit: number; memo: string }[] = []
  if (posting.netRefund > 0 && !payNow) {
    lines.push(
      { accountId: collectedAccount.id, debit: posting.debitCollected, credit: 0, memo: "Clear GST collected" },
      { accountId: itcAccount.id, debit: 0, credit: posting.debitCollected, memo: "Offset collected GST against ITCs" }
    )
  } else {
    lines.push(
      { accountId: collectedAccount.id, debit: posting.debitCollected, credit: 0, memo: "Clear GST collected" },
      { accountId: itcAccount.id, debit: 0, credit: posting.creditItc, memo: "Apply GST ITCs" }
    )
    if (posting.netToPayable > 0) {
      lines.push({
        accountId: payNow ? cashAccount.id : remittanceAccount.id,
        debit: 0,
        credit: posting.netToPayable,
        memo: payNow ? "GST remitted" : "GST remittance payable",
      })
    }
    if (posting.netRefund > 0) {
      lines.push({
        accountId: cashAccount.id,
        debit: posting.netRefund,
        credit: 0,
        memo: "GST refund received",
      })
    }
  }

  const balancedLines = lines.filter((line) => line.debit > 0 || line.credit > 0)
  if (balancedLines.length < 2) {
    throw new Error("No GST activity to remit in this period")
  }

  const journalEntry = await createBalancedJournalEntry({
    organizationId,
    createdById,
    description: `GST remittance ${period.startsAt.toISOString().slice(0, 10)} to ${period.endsAt.toISOString().slice(0, 10)}`,
    postedAt: period.endsAt,
    source: "gst_remittance",
    sourceId: period.id,
    lines: balancedLines,
  })

  const remittance = await prisma.taxRemittance.create({
    data: {
      organizationId,
      filingPeriodId: period.id,
      taxType: "GST",
      collected: register.collected,
      inputCredits: register.inputCredits,
      adjustments: register.adjustments,
      netTax: register.netTax,
      status: "posted",
      remittedAt: new Date(),
      journalEntryId: journalEntry.id,
    },
  })

  await prisma.taxFilingPeriod.update({
    where: { id: period.id },
    data: { status: "filed" },
  })

  await writeAuditLog({
    organizationId,
    userId: createdById,
    action: "gst.remit",
    entityType: "tax_remittance",
    entityId: remittance.id,
    data: { filingPeriodId: period.id, netTax: register.netTax, payNow },
  })

  return { remittance, journalEntry, register }
}

export function gstRegisterCsv(register: Awaited<ReturnType<typeof getGstRegister>>) {
  const header = ["Date", "Entry", "Source", "Tax code", "Memo", "GST collected", "ITC"]
  const rows = register.lines.map((line) => [
    line.postedAt.toISOString().slice(0, 10),
    line.entryNumber,
    line.source,
    line.taxCode,
    (line.memo || "").replaceAll(",", " "),
    (line.collected / 100).toFixed(2),
    (line.inputCredit / 100).toFixed(2),
  ])
  rows.push(["", "", "", "", "Totals", (register.collected / 100).toFixed(2), (register.inputCredits / 100).toFixed(2)])
  rows.push(["", "", "", "", "Net tax", (register.netTax / 100).toFixed(2), ""])
  return [header, ...rows].map((row) => row.join(",")).join("\n")
}

export { formatMoney }

async function getAccount(organizationId: string, code: string) {
  const account = await prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code } } })
  if (!account) throw new Error(`Missing account ${code}`)
  return account
}
