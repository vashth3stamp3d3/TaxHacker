export const PORTAL_ROLES = ["superuser", "owner", "staff", "accountant"] as const
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
  inbox_review: ["superuser", "owner", "staff", "accountant"],
  shop_write: ["superuser", "owner", "staff"],
  inventory_consume: ["superuser", "owner", "staff"],
  books_write: ["superuser", "owner", "accountant"],
  period_close: ["superuser", "owner", "accountant"],
  gst_remittance: ["superuser", "owner", "accountant"],
  backups: ["superuser", "owner"],
  company_settings: ["superuser", "owner"],
  members: ["superuser", "owner"],
}

export function normalizePortalRole(role: string | null | undefined): PortalRole {
  if (role === "superuser" || role === "staff" || role === "accountant") return role
  return "owner"
}

export function canPerform(role: string | null | undefined, action: PortalAction) {
  const normalized = normalizePortalRole(role)
  if (normalized === "superuser") return true
  return ACTION_ROLES[action].includes(normalized)
}

export function assertCanPerform(role: string | null | undefined, action: PortalAction) {
  if (!canPerform(role, action)) {
    throw new Error("You do not have permission to do that in the Formulated Tax Portal.")
  }
}

export function roleLabel(role: string | null | undefined) {
  switch (normalizePortalRole(role)) {
    case "superuser":
      return "Superuser"
    case "staff":
      return "Staff"
    case "accountant":
      return "Accountant"
    default:
      return "Owner"
  }
}
