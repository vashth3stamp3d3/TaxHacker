"use server"

import { requirePortalContext } from "@/models/access"
import { approveSuggestion, refreshAutomationSuggestions, updateSuggestionStatus } from "@/models/automation"
import { revalidatePath } from "next/cache"

export async function refreshAutomationAction() {
  const { organization } = await requirePortalContext("shop_write")
  await refreshAutomationSuggestions(organization.id)
  revalidatePath("/automation")
}

export async function dismissSuggestionAction(formData: FormData) {
  await requirePortalContext("shop_write")
  await updateSuggestionStatus(String(formData.get("id") || ""), "dismissed")
  revalidatePath("/automation")
}

export async function approveSuggestionAction(formData: FormData) {
  const { user, organization } = await requirePortalContext("shop_write")
  await approveSuggestion(organization.id, String(formData.get("id") || ""), user.id)
  revalidatePath("/automation")
  revalidatePath("/inventory")
  revalidatePath("/vendors")
}
