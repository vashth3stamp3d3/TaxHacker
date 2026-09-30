"use server"

import { createBalancedJournalEntry } from "@/models/accounting"
import { addCustomT2Adjustment, deleteCustomT2Adjustment, saveT2Adjustments } from "@/models/t2"
import { getCurrentUser } from "@/lib/auth"
import { fiscalPeriodForYear, parseDollarsToCents, parseTaxYear, type AdjustmentSection } from "@/lib/tax/t2-worksheet"
import { prisma } from "@/lib/db"
import { ensureActiveOrganization } from "@/models/organizations"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function saveT2AdjustmentsAction(formData: FormData) {
  const year = parseTaxYear(formData.get("year"))
  try {
    const user = await getCurrentUser()
    const organization = await ensureActiveOrganization(user)
    const rows = [...formData.entries()]
      .filter(([key]) => key.startsWith("amount_"))
      .map(([key, value]) => {
        const amountCents = parseDollarsToCents(value)
        if (amountCents === null || amountCents < 0) {
          throw new Error(`Enter a valid dollar amount for ${key.slice("amount_".length)}`)
        }
        return { code: key.slice("amount_".length), amountCents }
      })

    if (rows.length === 0) throw new Error("No adjustment amounts were submitted")
    await saveT2Adjustments(organization.id, year, rows)
  } catch (error) {
    rethrowIfRedirect(error)
    redirect(t2Path(year, error instanceof Error ? error.message : "Could not save adjustments"))
  }

  revalidatePath("/taxes/t2")
  redirect(t2Path(year, null, "adjustments"))
}

export async function addCustomT2AdjustmentAction(formData: FormData) {
  const year = parseTaxYear(formData.get("year"))
  try {
    const user = await getCurrentUser()
    const organization = await ensureActiveOrganization(user)
    const amountCents = parseDollarsToCents(formData.get("amount"))
    if (amountCents === null || amountCents < 0) throw new Error("Enter a valid custom adjustment amount")
    await addCustomT2Adjustment(organization.id, year, {
      label: String(formData.get("label") || ""),
      section: String(formData.get("section") || "") as AdjustmentSection,
      amountCents,
      note: String(formData.get("note") || ""),
    })
  } catch (error) {
    rethrowIfRedirect(error)
    redirect(t2Path(year, error instanceof Error ? error.message : "Could not add adjustment"))
  }

  revalidatePath("/taxes/t2")
  redirect(t2Path(year, null, "custom"))
}

export async function deleteCustomT2AdjustmentAction(formData: FormData) {
  const year = parseTaxYear(formData.get("year"))
  try {
    const user = await getCurrentUser()
    const organization = await ensureActiveOrganization(user)
    await deleteCustomT2Adjustment(organization.id, year, String(formData.get("code") || ""))
  } catch (error) {
    rethrowIfRedirect(error)
    redirect(t2Path(year, error instanceof Error ? error.message : "Could not remove adjustment"))
  }

  revalidatePath("/taxes/t2")
  redirect(t2Path(year, null, "removed"))
}

export async function createT2JournalEntryAction(formData: FormData) {
  const year = parseTaxYear(formData.get("year"))
  try {
    const user = await getCurrentUser()
    const organization = await ensureActiveOrganization(user)
    const amountCents = parseDollarsToCents(formData.get("amount"))
    const debitAccountId = String(formData.get("debitAccountId") || "")
    const creditAccountId = String(formData.get("creditAccountId") || "")
    const description = String(formData.get("description") || "2025 T2 worksheet entry").trim() || "T2 worksheet entry"
    const postedOn = String(formData.get("postedAt") || "")
    if (!/^\d{4}-\d{2}-\d{2}$/.test(postedOn)) throw new Error("Choose a posting date inside the fiscal year")
    if (amountCents === null || amountCents <= 0) throw new Error("Amount must be greater than zero")
    if (!debitAccountId || !creditAccountId || debitAccountId === creditAccountId) {
      throw new Error("Choose two different debit and credit accounts")
    }

    const worksheetAccounts = await prisma.ledgerAccount.findMany({
      where: { organizationId: organization.id, id: { in: [debitAccountId, creditAccountId] } },
    })
    if (worksheetAccounts.length !== 2) throw new Error("Those accounts are not on this organization's ledger")

    const postedAt = new Date(`${postedOn}T12:00:00.000Z`)
    const period = fiscalPeriodForYear(year, organization.fiscalYearStartMonth)
    if (postedAt < period.startsAt || postedAt > period.endsAt) {
      throw new Error(`Post the entry between ${period.startsAt.toISOString().slice(0, 10)} and ${period.endsAt.toISOString().slice(0, 10)} so this worksheet includes it`)
    }

    await createBalancedJournalEntry({
      organizationId: organization.id,
      createdById: user.id,
      description,
      postedAt,
      source: "t2_worksheet",
      lines: [
        { accountId: debitAccountId, debit: amountCents, credit: 0, memo: description },
        { accountId: creditAccountId, debit: 0, credit: amountCents, memo: description },
      ],
    })
  } catch (error) {
    rethrowIfRedirect(error)
    redirect(t2Path(year, error instanceof Error ? error.message : "Could not post journal entry"))
  }

  revalidatePath("/taxes/t2")
  revalidatePath("/accounting")
  revalidatePath("/accounting/journal-entries")
  revalidatePath("/reports")
  redirect(t2Path(year, null, "journal"))
}

function t2Path(year: number, error: string | null, saved?: string) {
  const params = new URLSearchParams({ year: String(year) })
  if (error) params.set("error", error)
  if (saved) params.set("saved", saved)
  return `/taxes/t2?${params.toString()}`
}

function rethrowIfRedirect(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  ) {
    throw error
  }
}
