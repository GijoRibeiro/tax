import { caseStatus, openFollowUpsFor, allRequiredFilled } from '../store/state'
import type { WorkspaceCase } from './workspace/types'

export type ChipTone = 'success' | 'warning' | 'neutral'

export interface ChipInfo {
  label: string
  tone: ChipTone
}

/**
 * Label/tone derivation for a case's status chip. `special` overrides win first
 * (on-hold, extension-filed read calmer than the raw `caseStatus` underneath them);
 * otherwise the label comes straight off `caseStatus(c.state)`, with the
 * `waiting_on_client` bucket split further into "blocked" (an open advisor-initiated
 * follow-up, we're waiting on a specific answer) vs plain "waiting on client".
 */
export function chipInfo(c: WorkspaceCase): ChipInfo {
  if (c.special === 'on-hold') return { label: 'On hold', tone: 'neutral' }
  if (c.special === 'extension-filed') return { label: 'Extension filed', tone: 'warning' }

  const status = caseStatus(c.state)
  switch (status) {
    case 'filed':
      return { label: 'Filed', tone: 'success' }
    case 'approved':
      return { label: 'Approved', tone: 'success' }
    case 'awaiting_approval':
      return { label: 'In review', tone: 'neutral' }
    case 'preparing':
      return { label: 'Preparing', tone: 'neutral' }
    case 'ready_to_work':
      return { label: 'Ready to work', tone: 'success' }
    default: {
      const blocked = openFollowUpsFor(c.state, 'advisor').length > 0
      if (blocked) return { label: 'Blocked, asked client', tone: 'warning' }
      // Everything is in the app but the client has not pressed "Send to Anna" yet.
      if (allRequiredFilled(c.state) && !c.state.submittedAt) return { label: 'Filled, not sent yet', tone: 'neutral' }
      return { label: 'Waiting on client', tone: 'neutral' }
    }
  }
}

export interface StatusChipProps {
  c: WorkspaceCase
  today?: string
}

export function StatusChip({ c }: StatusChipProps) {
  const { label, tone } = chipInfo(c)
  return <span className={`tf-advisor-chip tf-advisor-chip--${tone}`}>{label}</span>
}
