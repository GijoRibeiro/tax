import type { CaseState, FollowUp } from '../../types'
import { caseStatus } from '../../store/state'
import type { WorkspaceState, WorkspaceCase, ActivityEvent } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

export interface AttentionItem {
  caseId: string
  client: string
  text: string
  kind: 'verify' | 'question' | 'draft'
}

function allRequiredVerified(s: CaseState): boolean {
  return s.items.filter(item => !item.optional).every(item => item.status === 'verified')
}

export function needsAttention(ws: WorkspaceState): AttentionItem[] {
  const out: AttentionItem[] = []
  const now = Date.now()

  for (const [caseId, c] of Object.entries(ws.cases)) {
    if (caseId === 'amara') continue // the relay-backed case is connection-state noise here
    if (c.special === 'on-hold') continue
    if (c.state.phase === 'awaiting_approval') continue // waiting on the client, not advisor work

    const uploadedCount = c.state.items.filter(item => item.status === 'uploaded').length
    if (uploadedCount > 0) {
      out.push({
        caseId,
        client: c.client.name,
        text: `${uploadedCount} document${uploadedCount === 1 ? '' : 's'} to check`,
        kind: 'verify',
      })
    }

    const openQuestions = c.state.followUps.filter(fu => fu.from === 'consumer' && fu.status === 'open')
    if (openQuestions.length > 0) {
      const oldest = openQuestions.reduce((a, b) => (Date.parse(a.createdAt) < Date.parse(b.createdAt) ? a : b))
      const days = Math.floor((now - Date.parse(oldest.createdAt)) / DAY_MS)
      out.push({
        caseId,
        client: c.client.name,
        text: `${openQuestions.length} question${openQuestions.length === 1 ? '' : 's'}, ${days} day${days === 1 ? '' : 's'} old`,
        kind: 'question',
      })
    }

    if (c.state.phase === 'preparing' && allRequiredVerified(c.state)) {
      out.push({ caseId, client: c.client.name, text: 'ready to draft', kind: 'draft' })
    }
  }

  return out
}

export interface InboxEntry {
  caseId: string
  client: string
  followUp: FollowUp
  group: 'needs-reply' | 'waiting'
}

export function inboxItems(ws: WorkspaceState): InboxEntry[] {
  const needsReply: InboxEntry[] = []
  const waiting: InboxEntry[] = []

  for (const [caseId, c] of Object.entries(ws.cases)) {
    for (const fu of c.state.followUps) {
      if (fu.status !== 'open') continue
      if (fu.from === 'consumer') {
        needsReply.push({ caseId, client: c.client.name, followUp: fu, group: 'needs-reply' })
      } else {
        waiting.push({ caseId, client: c.client.name, followUp: fu, group: 'waiting' })
      }
    }
  }

  needsReply.sort((a, b) => Date.parse(a.followUp.createdAt) - Date.parse(b.followUp.createdAt))
  waiting.sort((a, b) => Date.parse(a.followUp.createdAt) - Date.parse(b.followUp.createdAt))

  return [...needsReply, ...waiting]
}

export function deadlineRisk(ws: WorkspaceState, today: string): WorkspaceCase[] {
  const now = Date.parse(today)

  const risky = Object.values(ws.cases).filter(c => {
    if (c.state.phase === 'filed' || c.state.phase === 'approved') return false
    if (c.special === 'on-hold') return false

    const daysUntil = (Date.parse(c.deadline) - now) / DAY_MS
    const withinWindow = daysUntil <= 30 && (daysUntil >= 0 || c.special !== 'extension-filed')
    if (!withinWindow) return false

    return c.state.items.some(item => !item.optional && item.status === 'needed')
  })

  return risky.sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline))
}

/**
 * Headline workload counts for the dashboard tiles.
 *
 * These buckets are NOT a partition, `open` deliberately overlaps with `waiting`,
 * `ready`, and any in-progress case that is neither: it is the whole active caseload
 * (everything not filed and not on-hold), not "the rest after the other tiles." Do not
 * sum these four numbers expecting the case total; use `Object.keys(ws.cases).length`
 * for that.
 *
 * - `open`: active caseload, not filed, not on-hold.
 * - `waiting`: `caseStatus` is `waiting_on_client` (blocked on the client, docs missing).
 * - `ready`: `caseStatus` is `ready_to_work` only, actionable right now. `preparing`
 *   cases are already being worked and are intentionally excluded.
 * - `filed`: `caseStatus` is `filed`.
 */
export function workloadCounts(ws: WorkspaceState): { open: number; waiting: number; ready: number; filed: number } {
  const cases = Object.values(ws.cases)
  return {
    open: cases.filter(c => c.state.phase !== 'filed' && c.special !== 'on-hold').length,
    waiting: cases.filter(c => caseStatus(c.state) === 'waiting_on_client').length,
    ready: cases.filter(c => caseStatus(c.state) === 'ready_to_work').length,
    filed: cases.filter(c => caseStatus(c.state) === 'filed').length,
  }
}

export function searchCases(ws: WorkspaceState, q: string): WorkspaceCase[] {
  const query = q.trim().toLowerCase()
  const all = Object.values(ws.cases)
  if (!query) return all
  return all.filter(c => c.client.name.toLowerCase().includes(query))
}

export function activityFeed(ws: WorkspaceState, n: number): ActivityEvent[] {
  return [...ws.activity].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, n)
}

export function isStalled(c: WorkspaceCase, today: string): boolean {
  if (c.special === 'on-hold') return false
  if (c.state.phase === 'filed') return false

  const idleDays = (Date.parse(today) - Date.parse(c.lastActivity)) / DAY_MS
  if (idleDays <= 14) return false

  return c.state.items.some(item => !item.optional && item.status === 'needed')
}

export function flagCountFor(ws: WorkspaceState, caseId: string, itemId: string): number {
  return ws.activity.filter(e => e.caseId === caseId && e.type === 'FLAG_ISSUE' && e.itemId === itemId).length
}
