import { describe, expect, it } from "vitest"
import { canPerform, normalizePortalRole } from "./portal-access"

describe("portal roles", () => {
  it("treats unknown roles as owner for the single-user shop", () => {
    expect(normalizePortalRole("")).toBe("owner")
    expect(normalizePortalRole("owner")).toBe("owner")
  })

  it("lets staff run shop work but not remittance", () => {
    expect(canPerform("staff", "shop_write")).toBe(true)
    expect(canPerform("staff", "gst_remittance")).toBe(false)
    expect(canPerform("staff", "inventory_consume")).toBe(true)
  })

  it("lets accountants close periods and remit GST but not consume inventory", () => {
    expect(canPerform("accountant", "gst_remittance")).toBe(true)
    expect(canPerform("accountant", "period_close")).toBe(true)
    expect(canPerform("accountant", "inventory_consume")).toBe(false)
    expect(canPerform("accountant", "inbox_review")).toBe(true)
  })

  it("lets superusers do every portal action", () => {
    expect(canPerform("superuser", "backups")).toBe(true)
    expect(canPerform("superuser", "gst_remittance")).toBe(true)
    expect(canPerform("superuser", "inventory_consume")).toBe(true)
    expect(canPerform("superuser", "members")).toBe(true)
    expect(normalizePortalRole("superuser")).toBe("superuser")
  })

  it("reserves backups and company settings for owners", () => {
    expect(canPerform("owner", "backups")).toBe(true)
    expect(canPerform("accountant", "backups")).toBe(false)
    expect(canPerform("staff", "company_settings")).toBe(false)
  })
})
