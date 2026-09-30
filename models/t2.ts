import {
  computeT2Worksheet,
  customAdjustmentCode,
  DEFAULT_T2_YEAR,
  fiscalPeriodForYear,
  parseTaxYear,
  SCHEDULE_1_FIELDS,
  type AdjustmentSection,
  type SavedAdjustment,
} from "@/lib/tax/t2-worksheet"
import { prisma } from "@/lib/db"
import { getLedgerAccounts } from "@/models/accounting"

const MAX_CENTS = 2_000_000_000

export async function getT2Worksheet(organizationId: string, year = DEFAULT_T2_YEAR) {
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } })
  const period = fiscalPeriodForYear(year, organization.fiscalYearStartMonth)
  const [accounts, lines, adjustments] = await Promise.all([
    prisma.ledgerAccount.findMany({ where: { organizationId } }),
    prisma.journalLine.findMany({
      where: {
        organizationId,
        journalEntry: {
          postedAt: { gte: period.startsAt, lte: period.endsAt },
          status: "posted",
        },
      },
      select: {
        debit: true,
        credit: true,
        accountId: true,
        journalEntry: { select: { postedAt: true } },
      },
    }),
    prisma.t2ScheduleAdjustment.findMany({
      where: { organizationId, taxYear: year },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
  ])
  const accountsById = new Map(accounts.map((account) => [account.id, account]))

  return computeT2Worksheet({
    year,
    province: organization.province,
    fiscalYearStartMonth: organization.fiscalYearStartMonth,
    lines: lines.flatMap((line) => {
      const account = accountsById.get(line.accountId)
      if (!account) return []
      return [
        {
          postedAt: line.journalEntry.postedAt,
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type,
          debitCents: line.debit,
          creditCents: line.credit,
        },
      ]
    }),
    adjustments: adjustments.map(toSavedAdjustment),
  })
}

export async function getT2PageData(organizationId: string, requestedYear: unknown) {
  const year = parseTaxYear(requestedYear, DEFAULT_T2_YEAR)
  const worksheet = await getT2Worksheet(organizationId, year)
  const period = fiscalPeriodForYear(year, worksheet.period.fiscalYearStartMonth)
  const [accounts, entries] = await Promise.all([
    getLedgerAccounts(organizationId),
    prisma.journalEntry.findMany({
      where: {
        organizationId,
        status: "posted",
        postedAt: { gte: period.startsAt, lte: period.endsAt },
      },
      include: { lines: true },
      orderBy: [{ postedAt: "desc" }, { entryNumber: "desc" }],
      take: 25,
    }),
  ])

  return { year, worksheet, accounts, entries }
}

export async function saveT2Adjustments(
  organizationId: string,
  year: number,
  rows: Array<{ code: string; amountCents: number; note?: string }>
) {
  const existing = await prisma.t2ScheduleAdjustment.findMany({ where: { organizationId, taxYear: year } })
  const existingByCode = new Map(existing.map((row) => [row.code, row]))

  await prisma.$transaction(
    rows.map((row) => {
      const current = existingByCode.get(row.code)
      const definition = current
        ? {
            label: current.label,
            section: current.section,
            sortOrder: current.sortOrder,
            isCustom: current.isCustom,
          }
        : undefined
      if (!definition && !isKnownCode(row.code)) {
        throw new Error(`Unknown adjustment ${row.code}`)
      }
      const amountCents = assertCents(row.amountCents)
      return prisma.t2ScheduleAdjustment.upsert({
        where: { organizationId_taxYear_code: { organizationId, taxYear: year, code: row.code } },
        update: { amountCents, note: row.note || null },
        create: {
          organizationId,
          taxYear: year,
          code: row.code,
          label: definition?.label || labelForKnownCode(row.code),
          section: definition?.section || sectionForKnownCode(row.code),
          amountCents,
          note: row.note || null,
          sortOrder: definition?.sortOrder || sortForKnownCode(row.code),
          isCustom: definition?.isCustom || false,
        },
      })
    })
  )
}

export async function addCustomT2Adjustment(
  organizationId: string,
  year: number,
  input: { label: string; section: AdjustmentSection; amountCents: number; note?: string }
) {
  const label = input.label.trim()
  if (label.length < 2) throw new Error("Enter a label for the custom adjustment")
  const amountCents = assertCents(input.amountCents)
  const section = input.section
  if (!["schedule1_addition", "schedule1_deduction", "taxable_income_deduction"].includes(section)) {
    throw new Error("Choose an adjustment section")
  }

  return prisma.t2ScheduleAdjustment.create({
    data: {
      organizationId,
      taxYear: year,
      code: customAdjustmentCode(label),
      label,
      section,
      amountCents,
      note: input.note?.trim() || null,
      sortOrder: section === "taxable_income_deduction" ? 340 : section === "schedule1_deduction" ? 320 : 300,
      isCustom: true,
    },
  })
}

export async function deleteCustomT2Adjustment(organizationId: string, year: number, code: string) {
  const row = await prisma.t2ScheduleAdjustment.findUnique({
    where: { organizationId_taxYear_code: { organizationId, taxYear: year, code } },
  })
  if (!row || !row.isCustom) throw new Error("Only custom adjustments can be removed")
  await prisma.t2ScheduleAdjustment.delete({ where: { id: row.id } })
}

function toSavedAdjustment(row: {
  code: string
  label: string
  section: string
  amountCents: number
  note: string | null
  sortOrder: number
  isCustom: boolean
}): SavedAdjustment {
  return {
    code: row.code,
    label: row.label,
    section: row.section as AdjustmentSection,
    amountCents: row.amountCents,
    note: row.note || "",
    sortOrder: row.sortOrder,
    isCustom: row.isCustom,
  }
}

function assertCents(amountCents: number) {
  if (!Number.isInteger(amountCents) || amountCents < 0 || amountCents > MAX_CENTS) {
    throw new Error("Enter an amount from $0.00 to $20,000,000.00")
  }
  return amountCents
}

function isKnownCode(code: string) {
  return sectionForKnownCode(code) !== ""
}

function labelForKnownCode(code: string) {
  return knownField(code)?.label || code
}

function sectionForKnownCode(code: string) {
  return knownField(code)?.section || ""
}

function sortForKnownCode(code: string) {
  return knownField(code)?.sortOrder || 0
}

function knownField(code: string) {
  return SCHEDULE_1_FIELDS.find((field) => field.code === code)
}
