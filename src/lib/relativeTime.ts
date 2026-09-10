const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

// Some activity timestamps in the workspace are date-only ('2026-09-01') rather
// than full ISO datetimes. Date.parse handles both natively (a date-only ISO
// string is interpreted as UTC midnight), so no special-casing is needed here.
function formatDate(ms: number): string {
  const d = new Date(ms)
  const day = d.getDate()
  const month = d.toLocaleDateString('en-GB', { month: 'short' })
  return `${day} ${month}`
}

export function relativeTime(iso: string, now?: string): string {
  const then = Date.parse(iso)
  const nowMs = now ? Date.parse(now) : Date.now()
  const diff = nowMs - then

  if (diff < MINUTE_MS) return 'just now'
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)} min ago`
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)} h ago`

  const days = Math.floor(diff / DAY_MS)
  if (days <= 7) return `${days} d ago`

  return formatDate(then)
}
