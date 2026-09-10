import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../workspace/WorkspaceStore'
import { needsAttention, deadlineRisk, workloadCounts, activityFeed, isStalled } from '../workspace/selectors'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { relativeTime } from '../../lib/relativeTime'
import { deadlineCell } from './CasesTable'
import { NUDGE_MESSAGE } from '../nudge'
import { PageHeader, PageBody, TwoColumn, SurfaceCard, Stat, StatRow, LetterAvatar, Quiet, Icon } from '../kit'

// One `sent` flag per rendered row, enough to stop a double-click from dispatching two
// follow-ups, with no store changes needed.
function NudgeButton({ onSend }: { onSend: () => void }) {
  const [sent, setSent] = useState(false)
  if (sent) return <span className="tf-today-nudge-sent">Nudge sent ✓</span>
  return (
    <Button variant="ghost" onClick={() => { onSend(); setSent(true) }}>
      Send a nudge
    </Button>
  )
}

const DAY_MS = 24 * 60 * 60 * 1000

// Time-of-day and the "N weeks until 31 July" line read UTC components, so a fixed
// `today` prop is reproducible in tests regardless of where the suite runs.
function greeting(today: string): string {
  const hour = new Date(today).getUTCHours()
  if (hour < 12) return 'Good morning, Anna'
  if (hour < 18) return 'Good afternoon, Anna'
  return 'Good evening, Anna'
}

function deadlineSubline(today: string): string {
  const year = new Date(today).getUTCFullYear()
  const deadline = Date.parse(`${year}-07-31T00:00:00.000Z`)
  const todayStart = Date.parse(`${today.slice(0, 10)}T00:00:00.000Z`)
  const daysUntil = Math.round((deadline - todayStart) / DAY_MS)
  if (daysUntil < 0) return '31 July has passed; advised returns run to 30 April 2027'
  const weeks = Math.max(1, Math.ceil(daysUntil / 7))
  return `31 July is in ${weeks} week${weeks === 1 ? '' : 's'}`
}

function dateLine(today: string): string {
  return new Date(today).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
}

// The sentence that knows where Anna is, like Betina's home does.
function stateLine(ready: number, waiting: number, attention: number): string {
  const parts: string[] = []
  if (ready > 0) parts.push(`${ready} case${ready === 1 ? '' : 's'} can start`)
  if (attention > 0) parts.push(`${attention} thing${attention === 1 ? '' : 's'} need${attention === 1 ? 's' : ''} you`)
  if (waiting > 0) parts.push(`${waiting} ${waiting === 1 ? 'is' : 'are'} waiting on clients`)
  if (parts.length === 0) return 'Nothing needs you right now.'
  const s = parts.join(', ')
  return s.charAt(0).toUpperCase() + s.slice(1) + '.'
}

export interface TodayProps {
  today?: string
}

export function Today({ today }: TodayProps = {}) {
  const { ws, acceptRequest, declineRequest, dispatchCase } = useWorkspace()
  const effectiveToday = today ?? new Date().toISOString()
  const [declineOpen, setDeclineOpen] = useState(false)

  const counts = workloadCounts(ws)
  const attention = needsAttention(ws)
  const risky = deadlineRisk(ws, effectiveToday)
  const activity = activityFeed(ws, 8)
  const showRequest = ws.settings.acceptingNewCases && !!ws.incomingRequest

  return (
    <section className="tf-today">
      <PageHeader
        eyebrow={<>{dateLine(effectiveToday)} · <span>{deadlineSubline(effectiveToday)}</span></>}
        title={greeting(effectiveToday)}
        description={stateLine(counts.ready, counts.waiting, attention.length)}
        stats={
          <StatRow>
            <Stat value={counts.open} label="Open cases" />
            <Stat value={counts.waiting} label="Waiting on clients" tone="warning" />
            <Stat value={counts.ready} label="Ready to work" tone="success" />
            <Stat value={counts.filed} label="Filed this season" />
          </StatRow>
        }
      />

      <PageBody>
        <TwoColumn>
          <div>
            <SurfaceCard title="Needs you now" description="Documents to check, questions to answer, drafts to start." padded={false}>
              {attention.length === 0 ? (
                <Quiet>All clear, nothing needs you right now.</Quiet>
              ) : (
                <ul className="dk-rows">
                  {attention.map((item, i) => (
                    <li key={`${item.caseId}-${item.kind}-${i}`}>
                      <Link className="dk-row" to={`cases/${item.caseId}`}>
                        <LetterAvatar name={item.client} />
                        <span className="dk-row__main">
                          <span className="dk-row__title">{item.client}</span>
                          <span className="dk-row__text">{item.text}</span>
                        </span>
                        <Icon name="chevron" className="dk-row__chevron" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SurfaceCard>

            <SurfaceCard title="At risk" description="Deadline close or passed, and nothing moving." padded={false}>
              {risky.length === 0 ? (
                <Quiet>Nothing at risk right now.</Quiet>
              ) : (
                <ul className="dk-rows">
                  {risky.map(c => {
                    const deadline = deadlineCell(c, effectiveToday)
                    return (
                      <li key={c.client.id}>
                        <div className="dk-row dk-row--static">
                          <LetterAvatar name={c.client.name} />
                          <span className="dk-row__main">
                            <span className="dk-row__title">{`${c.client.name} · Return ${c.client.year}`}</span>
                          </span>
                          <span className="dk-row__meta">
                            <span className={`tf-cases-deadline--${deadline.tone}`}>{deadline.text}</span>
                            {isStalled(c, effectiveToday) && (
                              <>
                                <span className="tf-today-badge tf-today-badge--stalled">Stalled</span>
                                <NudgeButton
                                  onSend={() => dispatchCase(c.client.id, { type: 'SEND_FOLLOW_UP', message: NUDGE_MESSAGE })}
                                />
                              </>
                            )}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </SurfaceCard>
          </div>

          <div>
            {showRequest && ws.incomingRequest && (
              <SurfaceCard title="New case request" tone="accent">
                <p className="tf-today-request__name">
                  {ws.incomingRequest.name} · {ws.incomingRequest.city}
                </p>
                <p className="tf-today-request__summary">{ws.incomingRequest.summary}</p>
                <p className="tf-today-request__effort">{ws.incomingRequest.effort}</p>
                <div className="tf-today-request__actions">
                  <Button variant="primary" onClick={acceptRequest}>Accept</Button>
                  <Button variant="secondary" onClick={() => setDeclineOpen(true)}>Decline</Button>
                </div>
              </SurfaceCard>
            )}

            <SurfaceCard title="Recent activity" padded={false}>
              {activity.length === 0 ? (
                <Quiet>No activity yet today.</Quiet>
              ) : (
                <ul className="dk-rows">
                  {activity.map(event => (
                    <li key={event.id} className="dk-row dk-row--static" data-testid="today-activity-row">
                      <span className="dk-row__main">
                        <span className="dk-row__text">{event.text}</span>
                      </span>
                      <span className="dk-row__meta">{relativeTime(event.at, effectiveToday)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SurfaceCard>
          </div>
        </TwoColumn>
      </PageBody>

      <Dialog
        open={declineOpen}
        title="Decline this case?"
        confirmLabel="Decline"
        tone="danger"
        onClose={() => setDeclineOpen(false)}
        onConfirm={() => { declineRequest(); setDeclineOpen(false) }}
      >
        <p>Taxfix will route it to another advisor.</p>
      </Dialog>
    </section>
  )
}
