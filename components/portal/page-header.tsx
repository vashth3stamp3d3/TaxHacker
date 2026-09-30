import Link from "next/link"
import { ReactNode } from "react"

export function PortalPageHeader({
  title,
  description,
  organizationName,
  gstNumber,
  entityType,
  entityId,
  actions,
}: {
  title: string
  description?: string
  organizationName?: string
  gstNumber?: string | null
  entityType?: string
  entityId?: string
  actions?: ReactNode
}) {
  return (
    <div
      className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      data-entity-type={entityType}
      data-entity-id={entityId}
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Formulated Tax Portal</p>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">
          {[organizationName, gstNumber ? `GST ${gstNumber}` : null, description].filter(Boolean).join(" · ")}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function PortalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}
