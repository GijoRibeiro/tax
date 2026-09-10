import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../workspace/WorkspaceStore'
import { inboxItems } from '../workspace/selectors'
import type { InboxEntry } from '../workspace/selectors'
import { EmptyState } from '../../components/EmptyState'
import { Button } from '../../components/Button'
import { QUICK_REPLIES } from '../ClientQuestions'
import { PageHeader, PageBody, TwoColumn, SurfaceCard, Stat, StatRow, LetterAvatar } from '../kit'

const DAY_MS = 24 * 60 * 60 * 1000

function ageLabel(createdAt: string, today: string): string {
  const days = Math.max(0, Math.floor((Date.parse(today) - Date.parse(createdAt)) / DAY_MS))
  return `${days} d`
}

export interface InboxViewProps {
  today?: string
}

export function InboxView({ today }: InboxViewProps = {}) {
  const { ws, dispatchCase } = useWorkspace()
  const effectiveToday = today ?? new Date().toISOString()
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const items = inboxItems(ws)
  const needsReply = items.filter(i => i.group === 'needs-reply')
  const waiting = items.filter(i => i.group === 'waiting')

  function itemTitle(caseId: string, itemId?: string): string | undefined {
    if (!itemId) return undefined
    return ws.cases[caseId]?.state.items.find(item => item.id === itemId)?.title
  }

  function send(entry: InboxEntry, reply: string) {
    const trimmed = reply.trim()
    if (!trimmed) return
    dispatchCase(entry.caseId, { type: 'ANSWER_FOLLOW_UP', followUpId: entry.followUp.id, reply: trimmed })
    setDrafts(d => ({ ...d, [entry.followUp.id]: '' }))
  }

  const header = (
    <PageHeader
      eyebrow="Questions from clients, and the ones you asked them"
      title="Inbox"
      description={needsReply.length === 0 ? 'Nothing waiting on you.' : `${needsReply.length} ${needsReply.length === 1 ? 'question needs' : 'questions need'} a reply. Quick replies are in your own words.`}
      stats={
        <StatRow>
          <Stat label="To reply" value={needsReply.length} tone={needsReply.length > 0 ? 'warning' : 'default'} />
          <Stat label="Sent, awaiting answer" value={waiting.length} />
        </StatRow>
      }
    />
  )

  if (items.length === 0) {
    return (
      <section className="tf-inbox">
        {header}
        <PageBody>
          <SurfaceCard>
            <EmptyState icon="📭" title="Inbox zero" body="Every question answered. Enjoy it while it lasts." />
          </SurfaceCard>
        </PageBody>
      </section>
    )
  }

  return (
    <section className="tf-inbox">
      {header}
      <PageBody>
      <TwoColumn>
      <div>
      {needsReply.length > 0 && (
        <SurfaceCard title="Needs your reply" padded={false}>
          <ul className="dk-rows">
            {needsReply.map(entry => {
              const chip = itemTitle(entry.caseId, entry.followUp.itemId)
              return (
                <li key={entry.followUp.id} className="tf-inbox-row" data-testid="inbox-reply-row">
                  <div className="tf-inbox-row__meta">
                    <LetterAvatar name={entry.client} size={28} />
                    <span className="tf-inbox-row__client">{entry.client}</span>
                    {chip && <span className="tf-inbox-row__chip">{chip}</span>}
                    <span className="tf-inbox-row__age">{ageLabel(entry.followUp.createdAt, effectiveToday)}</span>
                  </div>
                  <p className="tf-inbox-row__excerpt">{entry.followUp.message}</p>
                  <div className="tf-inbox-row__quick-replies">
                    {QUICK_REPLIES.map(text => (
                      <button
                        key={text}
                        type="button"
                        className="tf-advisor-quick-reply"
                        onClick={() => send(entry, text)}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="tf-textarea"
                    value={drafts[entry.followUp.id] ?? ''}
                    onChange={e => setDrafts(d => ({ ...d, [entry.followUp.id]: e.target.value }))}
                    placeholder="Write a reply"
                  />
                  <Button variant="primary" onClick={() => send(entry, drafts[entry.followUp.id] ?? '')}>
                    Send reply
                  </Button>
                </li>
              )
            })}
          </ul>
        </SurfaceCard>
      )}
      </div>
      <div>
      {waiting.length > 0 && (
        <SurfaceCard title="Waiting on client" description="Follow-ups you sent, not yet answered." padded={false}>
          <ul className="dk-rows">
            {waiting.map(entry => {
              const chip = itemTitle(entry.caseId, entry.followUp.itemId)
              return (
                <li key={entry.followUp.id} className="tf-inbox-waiting-row" data-testid="inbox-waiting-row">
                  <div className="tf-inbox-row__meta">
                    <span className="tf-inbox-row__client">{entry.client}</span>
                    {chip && <span className="tf-inbox-row__chip">{chip}</span>}
                    <span className="tf-inbox-row__age">{ageLabel(entry.followUp.createdAt, effectiveToday)} out</span>
                  </div>
                  <p className="tf-inbox-row__excerpt">{entry.followUp.message}</p>
                  {/* InboxView is mounted at route path "inbox" (sibling to "cases/:id"),
                      so this needs to step up a level before crossing into "cases/:id".
                      a bare "cases/id" would route-relative-resolve to "/inbox/cases/id". */}
                  <Link className="tf-button tf-button--secondary tf-inbox-waiting-row__link" to={`../cases/${entry.caseId}`}>
                    Open case
                  </Link>
                </li>
              )
            })}
          </ul>
        </SurfaceCard>
      )}
      </div>
      </TwoColumn>
      </PageBody>
    </section>
  )
}
