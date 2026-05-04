"use server"

import { getCurrentUser } from "@/lib/auth"
import { refreshAutomationSuggestions, updateSuggestionStatus } from "@/models/automation"
import { ensureActiveOrganization } from "@/models/organizations"
import { revalidatePath } from "next/cache"

export async function refreshAutomationAction() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  await refreshAutomationSuggestions(organization.id)
  revalidatePath("/automation")
}

export async function dismissSuggestionAction(formData: FormData) {
  await updateSuggestionStatus(String(formData.get("id") || ""), "dismissed")
  revalidatePath("/automation")
}

export async function approveSuggestionAction(formData: FormData) {
  await updateSuggestionStatus(String(formData.get("id") || ""), "approved")
  revalidatePath("/automation")
}
