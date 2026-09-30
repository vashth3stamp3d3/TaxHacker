export const PORTAL_ROLES = ["owner", "staff", "accountant"] as const
export type PortalRole = (typeof PORTAL_ROLES)[number]

export const PORTAL_ACTIONS = [
  "inbox_review",
  "shop_write",
  "inventory_consume",
  "books_write",
  "period_close",
  "gst_remittance",
  "backups",
  "company_settings",
  "members",
] as const
export type PortalAction = (typeof PORTAL_ACTIONS)[number]

const ACTION_ROLES: Record<PortalAction, PortalRole[]> = {
  inbox_review: ["owner", "staff", "accountant"],
  shop_write: ["owner", "staff"],
  inventory_consume: ["owner", "staff"],
  books_write: ["owner", "accountant"],
  period_close: ["owner", "accountant"],
  gst_remittance: ["owner", "accountant"],
  backups: ["owner"],
  company_settings: ["owner"],
  members: ["owner"],
}

export function normalizePortalRole(role: string | null | undefined): PortalRole {
  if (role === "staff" || role === "accountant") return role
  return "owner"
}

export function canPerform(role: string | null | undefined, action: PortalAction) {
  return ACTION_ROLES[action].includes(normalizePortalRole(role))
}

export function assertCanPerform(role: string | null | undefined, action: PortalAction) {
  if (!canPerform(role, action)) {
    throw new Error("You do not have permission to do that in the Formulated Tax Portal.")
  }
}
