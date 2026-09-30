import { cookies } from "next/headers"

export const WORKING_YEAR_COOKIE = "formulated_tax_year"
export const WORKING_YEARS = [2024, 2025, 2026] as const
export const FILED_WORKING_YEARS = [2024] as const
export const SEEDED_FISCAL_YEARS = [2023, 2024, 2025, 2026] as const
export const DEFAULT_WORKING_YEAR = 2025

export type WorkingYearNumber = (typeof WORKING_YEARS)[number]

export type WorkingYear = {
  year: WorkingYearNumber
  startsAt: Date
  endsAt: Date
  label: string
}

export function isWorkingYear(value: unknown): value is WorkingYearNumber {
  const year = Number(value)
  return WORKING_YEARS.includes(year as WorkingYearNumber)
}

export function parseWorkingYear(value: unknown, fallback: WorkingYearNumber = DEFAULT_WORKING_YEAR): WorkingYearNumber {
  const year = Number(value)
  return isWorkingYear(year) ? year : fallback
}

export function workingYearRange(year: number): WorkingYear {
  const safeYear = parseWorkingYear(year)
  return {
    year: safeYear,
    startsAt: new Date(Date.UTC(safeYear, 0, 1, 0, 0, 0, 0)),
    endsAt: new Date(Date.UTC(safeYear, 11, 31, 23, 59, 59, 999)),
    label: `${safeYear} fiscal year`,
  }
}

export async function getWorkingYear(): Promise<WorkingYear> {
  const jar = await cookies()
  return workingYearRange(parseWorkingYear(jar.get(WORKING_YEAR_COOKIE)?.value))
}

export function dateForNewPosting(year: WorkingYear, now = new Date()) {
  if (now >= year.startsAt && now <= year.endsAt) return now
  if (now < year.startsAt) return year.startsAt
  return year.endsAt
}

export function prismaPostedRange(year: WorkingYear) {
  return { gte: year.startsAt, lte: year.endsAt }
}

export function prismaAsOf(year: WorkingYear) {
  return { lte: year.endsAt }
}

export function prismaDateInYear(year?: number) {
  if (!year) return undefined
  return prismaPostedRange(workingYearRange(year))
}

export function isoDateInput(year: WorkingYear, now = new Date()) {
  return dateForNewPosting(year, now).toISOString().slice(0, 10)
}

export function workingYearFilterDates(year: WorkingYear) {
  return {
    dateFrom: year.startsAt.toISOString().slice(0, 10),
    dateTo: year.endsAt.toISOString().slice(0, 10),
  }
}

export function shouldKeepFiscalYearOpen(year: number) {
  return isWorkingYear(year)
}

export function isFiledWorkingYear(year: number) {
  return FILED_WORKING_YEARS.includes(year as (typeof FILED_WORKING_YEARS)[number])
}
