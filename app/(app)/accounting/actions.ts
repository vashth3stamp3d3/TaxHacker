"use server"

import { ActionState } from "@/lib/actions"
import { closeAccountingPeriod, createBalancedJournalEntry, reverseJournalEntry } from "@/models/accounting"
import { requirePortalContext } from "@/models/access"
import { JournalEntry } from "@/prisma/client"
import { revalidatePath } from "next/cache"

export async function createJournalEntryAction(
  _prevState: ActionState<JournalEntry> | null,
  formData: FormData
): Promise<ActionState<JournalEntry>> {
  try {
    const { user, organization, postedAt, workingYear } = await requirePortalContext("books_write")
    const amount = Math.round(Number(formData.get("amount") || 0) * 100)
    const debitAccountId = String(formData.get("debitAccountId") || "")
    const creditAccountId = String(formData.get("creditAccountId") || "")
    const description = String(formData.get("description") || "Manual journal entry")
    const postedOn = String(formData.get("postedAt") || "")
    let resolvedPostedAt = /^\d{4}-\d{2}-\d{2}$/.test(postedOn) ? new Date(`${postedOn}T12:00:00.000Z`) : postedAt
    if (resolvedPostedAt < workingYear.startsAt || resolvedPostedAt > workingYear.endsAt) {
      resolvedPostedAt = postedAt
    }

    if (!amount || amount <= 0) {
      return { success: false, error: "Amount must be greater than zero" }
    }

    const journalEntry = await createBalancedJournalEntry({
      organizationId: organization.id,
      createdById: user.id,
      description,
      postedAt: resolvedPostedAt,
      lines: [
        { accountId: debitAccountId, debit: amount, credit: 0, memo: description },
        { accountId: creditAccountId, debit: 0, credit: amount, memo: description },
      ],
    })

    revalidatePath("/accounting")
    revalidatePath("/accounting/journal-entries")
    revalidatePath("/reports")
    revalidatePath("/taxes/gst")
    revalidatePath("/taxes/t2")

    return { success: true, data: journalEntry }
  } catch (error) {
    console.error("Failed to create journal entry:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to create journal entry" }
  }
}

export async function reverseJournalEntryAction(formData: FormData) {
  const { user, organization, postedAt } = await requirePortalContext("books_write")
  await reverseJournalEntry({
    organizationId: organization.id,
    journalEntryId: String(formData.get("journalEntryId") || ""),
    createdById: user.id,
    postedAt,
  })
  revalidatePath("/accounting/journal-entries")
  revalidatePath("/reports")
  revalidatePath("/taxes/gst")
}

export async function closePeriodAction(formData: FormData) {
  const { user, organization } = await requirePortalContext("period_close")
  await closeAccountingPeriod(organization.id, String(formData.get("periodId") || ""), user.id)
  revalidatePath("/accounting")
  revalidatePath("/accounting/journal-entries")
}
