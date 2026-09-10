import type { ItemStatus } from '../types'

export interface StatusPillProps {
  status: ItemStatus
}

const COPY: Record<ItemStatus, string> = {
  needed: 'To share',
  uploaded: 'Sent',
  verified: 'Checked ✓',
  issue: 'Needs attention',
}

export function StatusPill({ status }: StatusPillProps) {
  return <span className={`tf-status-pill tf-status-pill--${status}`}>{COPY[status]}</span>
}
