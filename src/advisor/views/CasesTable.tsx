import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWorkspace } from '../workspace/WorkspaceStore'
import { searchCases, isStalled } from '../workspace/selectors'
import { caseStatus, sharedCount, requiredItems, openFollowUpsFor } from '../../store/state'
import { relativeTime } from '../../lib/relativeTime'
import { StatusChip } from '../StatusChip'
import type { WorkspaceCase } from '../workspace/types'
import { PageHeader, PageBody, SurfaceCard, Stat, StatRow, LetterAvatar } from '../kit'

const DAY_MS = 24 * 60 * 60 * 1000

type FilterKey = 'all' | 'waiting' | 'blocked' | 'ready' | 'review' | 'done'
type SortKey = 'deadline' | 'activity' | 'name'
type CaseBucket = Exclude<FilterKey, 'all'>

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'waiting', label: 'Waiting on client' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'ready', label: 'Ready' },
  { key: 'review', label: 'In review' },
  { key: 'done', label: 'Done' },
]

/**
 * Which filter pill a case belongs in. Deliberately independent of `special`.
 * on-hold and extension-filed only change the StatusChip's label/tone, not which
 * bucket a case counts toward, so a paused case still reads as "Waiting on client"
 * and an extension-filed case still counts as "Done".
 */
export function caseBucket(c: WorkspaceCase): CaseBucket {
  const status = caseStatus(c.state)
  if (status === 'filed' || status === 'approved') return 'done'
  if (status === 'awaiting_approval') return 'review'
  if (status === 'preparing' || status === 'ready_to_work') return 'ready'
  return openFollowUpsFor(c.state, 'advisor').length > 0 ? 'blocked' : 'waiting'
}

export type DeadlineTone = 'calm' | 'warning' | 'issue'

export interface DeadlineCell {
  text: string
  tone: DeadlineTone
}

// A case's deadline stops being "operative" once it's filed, approved, or paused.
// only cases still actively moving toward the deadline get the distance-and-coloring
// treatment below. Never countdown copy, distance text only, and never alarming red
// for work that's already done. Exported so other views (e.g. Today's At-risk
// strip) render the same calm distance language instead of a raw ISO date.
export function deadlineCell(c: WorkspaceCase, today: string): DeadlineCell {
  if (c.special === 'extension-filed') {
    return { text: 'passed · extension filed', tone: 'warning' }
  }
  if (c.special === 'on-hold') {
    return { text: '–', tone: 'calm' }
  }

  const status = caseStatus(c.state)
  if (status === 'filed') {
    return { text: `Filed ${relativeTime(c.state.filedAt ?? c.lastActivity, today)}`, tone: 'calm' }
  }
  if (status === 'approved') {
    return { text: 'Approved · ready to file', tone: 'calm' }
  }

  const days = Math.round((Date.parse(c.deadline) - Date.parse(today)) / DAY_MS)

  if (days < 0) {
    // 31 July is behind us, but a return filed by a Steuerberater runs to 30 April of the
    // year after next. Say that, in warning tone: it is late for her own deadline, not lost.
    return { text: '31 July passed · advised until 30 Apr 2027', tone: 'warning' }
  }

  if (days <= 30) {
    return { text: days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'}`, tone: 'warning' }
  }

  const weeks = Math.round(days / 7)
  return { text: `in ${weeks} week${weeks === 1 ? '' : 's'}`, tone: 'calm' }
}

function sortCases(cases: WorkspaceCase[], sort: SortKey): WorkspaceCase[] {
  const sorted = [...cases]
  if (sort === 'name') {
    sorted.sort((a, b) => a.client.name.localeCompare(b.client.name))
  } else if (sort === 'activity') {
    sorted.sort((a, b) => Date.parse(b.lastActivity) - Date.parse(a.lastActivity))
  } else {
    sorted.sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline))
  }
  return sorted
}

// Betina is the one relay-backed, live-demo case, she's pinned first regardless
// of sort or filter so the live sync story is always front and center.
function pinBetinaFirst(cases: WorkspaceCase[]): WorkspaceCase[] {
  const amara = cases.find(c => c.client.id === 'amara')
  if (!amara) return cases
  return [amara, ...cases.filter(c => c.client.id !== 'amara')]
}

function Row({ c, today, onOpen }: { c: WorkspaceCase; today: string; onOpen: (id: string) => void }) {
  const deadline = deadlineCell(c, today)
  const stalled = isStalled(c, today)

  return (
    <tr
      data-testid="cases-row"
      className="tf-cases-table__row"
      role="link"
      tabIndex={0}
      onClick={() => onOpen(c.client.id)}
      onKeyDown={e => {
        if (e.key === 'Enter') onOpen(c.client.id)
      }}
    >
      <td>
        <div className="tf-cases-table__client">
          <LetterAvatar name={c.client.name} size={32} />
          <div>
            <div className="tf-cases-table__client-line">
              {c.unread && <span className="tf-cases-table__unread-dot" data-testid="unread-dot" aria-hidden="true" />}
              <span className="tf-cases-table__name" data-testid="cases-name">
                {c.client.name}
              </span>
              {c.client.id === 'amara' && <span className="dk-chip dk-chip--live">Live demo</span>}
            </div>
            <div className="tf-cases-table__year">Return {c.client.year}</div>
          </div>
        </div>
      </td>
      <td>
        <StatusChip c={c} today={today} />
      </td>
      <td className="tf-cases-table__docs">
        {sharedCount(c.state)}/{requiredItems(c.state).length}
      </td>
      <td data-testid="deadline-cell" className={`tf-cases-deadline tf-cases-deadline--${deadline.tone}`}>
        {deadline.text}
        {stalled && <span className="tf-today-badge tf-today-badge--stalled">Stalled</span>}
      </td>
      <td className="tf-cases-table__activity">{relativeTime(c.lastActivity, today)}</td>
    </tr>
  )
}

export interface CasesTableProps {
  today?: string
}

export function CasesTable({ today }: CasesTableProps = {}) {
  const { ws, markRead } = useWorkspace()
  const navigate = useNavigate()
  const effectiveToday = today ?? new Date().toISOString()

  const [searchParams, setSearchParams] = useSearchParams()
  const qParam = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(qParam)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('deadline')

  // Topbar's global search (Task 8) navigates here with ?q=…, keep the local
  // input in sync whenever the URL param changes out from under us.
  useEffect(() => {
    setQuery(qParam)
  }, [qParam])

  function updateQuery(value: string) {
    setQuery(value)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  function handleOpen(id: string) {
    markRead(id)
    // Relative to this route's own path ("cases" / ".../cases"), so this
    // resolves to the sibling "cases/:id" route without doubling the
    // "cases" segment (see react-router's route-relative navigation).
    navigate(id)
  }

  function clearFilters() {
    setFilter('all')
    updateQuery('')
  }

  const searched = useMemo(() => searchCases(ws, query), [ws, query])

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: searched.length, waiting: 0, blocked: 0, ready: 0, review: 0, done: 0 }
    for (const item of searched) c[caseBucket(item)] += 1
    return c
  }, [searched])

  const filtered = useMemo(
    () => (filter === 'all' ? searched : searched.filter(c => caseBucket(c) === filter)),
    [searched, filter],
  )

  const rows = useMemo(() => pinBetinaFirst(sortCases(filtered, sort)), [filtered, sort])

  return (
    <section className="tf-cases">
      <PageHeader
        eyebrow="Every case, one line each"
        title="Cases"
        description="Sorted by deadline unless you say otherwise. Betina's live case stays on top."
        stats={
          <StatRow>
            <Stat label="All" value={counts.all} />
            <Stat label="Waiting on client" value={counts.waiting} tone="warning" />
            <Stat label="Ready" value={counts.ready} tone="success" />
            <Stat label="In review" value={counts.review} />
            <Stat label="Done" value={counts.done} />
          </StatRow>
        }
      />

      <PageBody wide>
      <div className="tf-cases__filters">
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            className={`tf-cases-pill${filter === f.key ? ' tf-cases-pill--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}

        <label className="tf-cases__sort">
          Sort
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}>
            <option value="deadline">Deadline</option>
            <option value="activity">Activity</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      <SurfaceCard padded={false}>
      {rows.length === 0 ? (
        <div className="tf-cases-empty">
          <p className="tf-cases-empty__title">No cases here, nice.</p>
          <button type="button" className="tf-cases-empty__clear" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <table className="tf-cases-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Status</th>
              <th>Docs</th>
              <th>Deadline</th>
              <th>Last activity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(c => (
              <Row key={c.client.id} c={c} today={effectiveToday} onOpen={handleOpen} />
            ))}
          </tbody>
        </table>
      )}
      </SurfaceCard>
      </PageBody>
    </section>
  )
}
