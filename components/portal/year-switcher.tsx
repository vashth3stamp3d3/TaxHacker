"use client"

import { usePathname } from "next/navigation"

export function YearSwitcher({
  year,
  years,
}: {
  year: number
  years: Array<number | { year: number; isClosed?: boolean; isFiled?: boolean }>
}) {
  const pathname = usePathname()
  const options = years.map((candidate) =>
    typeof candidate === "number" ? { year: candidate, isClosed: false, isFiled: false } : candidate
  )

  return (
    <form action="/year/set" method="post" className="flex min-w-0 flex-col gap-1">
      <input type="hidden" name="next" value={pathname || "/dashboard"} />
      <label htmlFor="working-year" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Books year
      </label>
      <select
        id="working-year"
        name="year"
        defaultValue={String(year)}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-9 w-full rounded-md border bg-background px-2 text-sm font-medium"
      >
        {options.map((candidate) => (
          <option key={candidate.year} value={candidate.year}>
            {candidate.year} · {candidate.isFiled ? "filed" : candidate.isClosed ? "closed" : "open"}
          </option>
        ))}
      </select>
    </form>
  )
}
