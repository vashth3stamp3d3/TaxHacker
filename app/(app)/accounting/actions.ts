"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { createBalancedJournalEntry } from "@/models/accounting"
import { ensureActiveOrganization } from "@/models/organizations"
import { JournalEntry } from "@/prisma/client"
import { revalidatePath } from "next/cache"

export async function createJournalEntryAction(
  _prevState: ActionState<JournalEntry> | null,
  formData: FormData
): Promise<ActionState<JournalEntry>> {
  try {
    const user = await getCurrentUser()
    const organization = await ensureActiveOrganization(user)
    const amount = Math.round(Number(formData.get("amount") || 0) * 100)
    const debitAccountId = String(formData.get("debitAccountId") || "")
    const creditAccountId = String(formData.get("creditAccountId") || "")
    const description = String(formData.get("description") || "Manual journal entry")
    const postedAt = new Date(String(formData.get("postedAt") || new Date().toISOString()))

    if (!amount || amount <= 0) {
      return { success: false, error: "Amount must be greater than zero" }
    }

    const journalEntry = await createBalancedJournalEntry({
      organizationId: organization.id,
      createdById: user.id,
      description,
      postedAt,
      lines: [
        { accountId: debitAccountId, debit: amount, credit: 0, memo: description },
        { accountId: creditAccountId, debit: 0, credit: amount, memo: description },
      ],
    })

    revalidatePath("/accounting")
    revalidatePath("/accounting/journal-entries")
    revalidatePath("/reports")
    revalidatePath("/taxes/gst")

    return { success: true, data: journalEntry }
  } catch (error) {
    console.error("Failed to create journal entry:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to create journal entry" }
  }
}
