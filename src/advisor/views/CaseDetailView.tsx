import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useWorkspace } from '../workspace/WorkspaceStore'
import { flagCountFor, isStalled } from '../workspace/selectors'
import type { WorkspaceCase } from '../workspace/types'
import { CaseDetail } from '../CaseDetail'
import { StatusChip } from '../StatusChip'
import { EmptyState } from '../../components/EmptyState'
import { Banner } from '../../components/Banner'
import { Button } from '../../components/Button'
import { relativeTime } from '../../lib/relativeTime'
import { NUDGE_MESSAGE } from '../nudge'
import { sharedCount, requiredItems } from '../../store/state'
import { PageHeader, PageBody, SurfaceCard, Stat, StatRow, LetterAvatar, Quiet } from '../kit'

export interface CaseDetailViewProps {
  today?: string
}

// Reads :id off the route, pulls that case's slice of workspace state, and composes
// the client header and history around CaseDetail (checklist, composer, questions,
// prepare controls, request form). An unknown id renders a "Case not found" state.
export function CaseDetailView({ today }: CaseDetailViewProps = {}) {
  const { id } = useParams<{ id: string }>()
  const { ws, markRead } = useWorkspace()
  const c = id ? ws.cases[id] : undefined

  useEffect(() => {
    if (id && c?.unread) markRead(id)
  }, [id, c?.unread, markRead])

  if (!id || !c) {
    return (
      <section className="tf-case-detail-view">
        <PageBody>
          <EmptyState icon="🔍" title="Case not found" body="This case doesn't exist, or may have been removed." />
        </PageBody>
        <Link className="tf-case-detail-view__back" to="/advisor/cases">← Back to cases</Link>
      </section>
    )
  }

  // Keyed on id so switching cases resets local UI state instead of leaking it.
  return <CaseDetailBody key={id} id={id} c={c} today={today} />
}

// The money state as a stat: short value, the explanation in the hint.
function moneyStat(c: WorkspaceCase): { value: string; hint: string } {
  const s = c.state
  if (s.chargedAt) return { value: '€119.99', hint: 'Charged at approval' }
  if (s.cardHeldAt) return { value: `•••• ${s.cardLast4 ?? '····'}`, hint: 'Card saved, charged at approval' }
  if (s.submittedAt) return { value: 'No card', hint: 'Sent without a card on file' }
  return { value: 'No card yet', hint: 'The client has not sent yet' }
}

function CaseDetailBody({ id, c, today }: { id: string; c: WorkspaceCase; today?: string }) {
  const { ws, dispatchCase, updateNotes, reopenCase, liveConnected } = useWorkspace()
  const [notes, setNotes] = useState(c.client.notes)
  const [nudgeSent, setNudgeSent] = useState(false)
  const onHold = c.special === 'on-hold'
  const effectiveToday = today ?? new Date().toISOString()

  // Betina is the one relay-backed, live-demo case: while the relay is disconnected her
  // phone cannot see anything done here, so mutating actions are disabled and a banner says why.
  const offline = id === 'amara' && !liveConnected
  const stalled = isStalled(c, effectiveToday)

  const history = ws.activity
    .filter(event => event.caseId === id)
    .slice()
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))

  const docs = `${sharedCount(c.state)} of ${requiredItems(c.state).length}`
  const openQuestions = c.state.followUps.filter(f => f.from === 'consumer' && f.status === 'open').length

  return (
    <section className="tf-case-detail-view">
      <PageHeader
        eyebrow={<Link to="/advisor/cases">Cases</Link>}
        title={
          <span className="dk-case-title">
            <LetterAvatar name={c.client.name} size={44} />
            <span>{c.client.name}</span>
            <StatusChip c={c} today={today} />
            {c.client.id === 'amara' && <span className="dk-chip dk-chip--live">Live demo</span>}
          </span>
        }
        description={
          <span className="dk-case-facts">
            <span><b>Return {c.client.year}</b></span>
            <span>{c.client.email}</span>
            <span>{c.client.city}</span>
            <span className="dk-chip dk-chip--lang" aria-label="Client language">{c.client.language.toUpperCase()}</span>
          </span>
        }
        actions={
          stalled ? (
            nudgeSent ? (
              <span className="tf-today-nudge-sent">Nudge sent ✓</span>
            ) : (
              <>
                <span className="tf-today-badge tf-today-badge--stalled">Stalled</span>
                <Button
                  variant="secondary"
                  onClick={() => { dispatchCase(id, { type: 'SEND_FOLLOW_UP', message: NUDGE_MESSAGE }); setNudgeSent(true) }}
                >
                  Send a nudge
                </Button>
              </>
            )
          ) : undefined
        }
        stats={
          <StatRow>
            <Stat label="Documents in" value={docs} />
            <Stat label="Open questions" value={openQuestions} tone={openQuestions > 0 ? 'warning' : 'default'} />
            <Stat label="Money" value={moneyStat(c).value} hint={moneyStat(c).hint} />
          </StatRow>
        }
      />

      <PageBody>
        {offline && (
          <Banner tone="issue">
            Live sync offline. Betina's phone can't see changes right now. Reconnecting…
          </Banner>
        )}

        {onHold ? (
          <Banner tone="info">
            <p className="tf-case-header__hold-title">On hold, client withdrew</p>
            {c.client.notes && <p className="tf-case-header__hold-reason">{c.client.notes}</p>}
            <Button variant="secondary" onClick={() => reopenCase(id)}>Reopen case</Button>
          </Banner>
        ) : (
          <CaseDetail
            state={c.state}
            dispatch={action => dispatchCase(id, action)}
            templates={ws.templates}
            disabled={offline}
            getFlagCount={itemId => flagCountFor(ws, id, itemId)}
            aside={
              <>
                <SurfaceCard title="Notes" description="Anything worth remembering about this client.">
                  <label className="tf-case-header__notes">
                    Notes
                    <textarea
                      className="tf-case-header__notes-input"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      onBlur={() => updateNotes(id, notes)}
                      placeholder="No notes yet, anything worth remembering about this client?"
                    />
                  </label>
                </SurfaceCard>
                <SurfaceCard title="History" padded={false}>
                  {history.length === 0 ? (
                    <Quiet>No activity yet.</Quiet>
                  ) : (
                    <ul className="dk-rows">
                      {history.map(event => (
                        <li key={event.id} className="dk-row dk-row--static" data-testid="case-history-row">
                          <span className="dk-row__main"><span className="dk-row__text">{event.text}</span></span>
                          <span className="dk-row__meta">{relativeTime(event.at, today)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </SurfaceCard>
              </>
            }
          />
        )}
      </PageBody>
    </section>
  )
}
