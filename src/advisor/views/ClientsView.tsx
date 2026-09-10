import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWorkspace } from '../workspace/WorkspaceStore'
import { searchCases } from '../workspace/selectors'
import { StatusChip } from '../StatusChip'
import { Sheet } from '../../components/Sheet'
import type { WorkspaceCase } from '../workspace/types'
import { PageHeader, PageBody, SurfaceCard, Stat, StatRow, LetterAvatar } from '../kit'

function ClientDetail({ c, onSaveNotes }: { c: WorkspaceCase; onSaveNotes: (notes: string) => void }) {
  const [notes, setNotes] = useState(c.client.notes)

  return (
    <div className="tf-client-detail">
      <p className="tf-client-detail__contact">
        {c.client.email} · {c.client.city} · {c.client.language.toUpperCase()}
      </p>

      <div className="tf-client-detail__history">
        <h3 className="tf-client-detail__history-title">Filing history</h3>
        {c.client.history.length === 0 ? (
          <p className="tf-client-detail__history-empty">First-time filer, no filing history yet.</p>
        ) : (
          <ul className="tf-client-detail__history-list">
            {c.client.history.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </div>

      {/* ClientsView is mounted at route path "clients" (sibling to "cases/:id"),
          so this needs to step up a level before crossing into "cases/:id".
          a bare "cases/id" would route-relative-resolve to "/clients/cases/id". */}
      <Link className="tf-client-detail__open-case" to={`../cases/${c.client.id}`}>
        Open case
      </Link>

      <label className="tf-client-detail__notes">
        Notes
        <textarea
          className="tf-textarea"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => onSaveNotes(notes)}
          placeholder="No notes yet, anything worth remembering about this client?"
        />
      </label>
    </div>
  )
}

export function ClientsView() {
  const { ws, updateNotes } = useWorkspace()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [openId, setOpenId] = useState<string | null>(null)

  const clients = searchCases(ws, query)
  const selected = openId ? ws.cases[openId] : undefined

  const firstTimers = Object.values(ws.cases).filter(c => c.client.history.length === 0).length

  return (
    <section className="tf-clients">
      <PageHeader
        eyebrow="Everyone you file for"
        title="Clients"
        description="Tap a name for contact details, filing history and your notes."
        stats={
          <StatRow>
            <Stat label="Clients" value={Object.keys(ws.cases).length} />
            <Stat label="New to filing" value={firstTimers} />
          </StatRow>
        }
      />

      <PageBody>
      <SurfaceCard padded={false}>
      {clients.length === 0 ? (
        <p className="dk-quiet">No clients match “{query}”.</p>
      ) : (
        <ul className="dk-rows">
          {clients.map(c => (
            <li key={c.client.id}>
              <button
                type="button"
                className="tf-clients-row"
                data-testid="clients-row"
                onClick={() => setOpenId(c.client.id)}
              >
                <LetterAvatar name={c.client.name} />
                <div className="tf-clients-row__info">
                  <span className="tf-clients-row__name">{c.client.name}</span>
                  <span className="tf-clients-row__meta">
                    {c.client.city} · {c.client.language.toUpperCase()}
                  </span>
                </div>
                <StatusChip c={c} />
                <span className="tf-clients-row__joined">Joined {c.client.joined.slice(0, 4)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      </SurfaceCard>
      </PageBody>

      <Sheet open={!!selected} onClose={() => setOpenId(null)} title={selected?.client.name ?? ''}>
        {selected && (
          <ClientDetail key={selected.client.id} c={selected} onSaveNotes={notes => updateNotes(selected.client.id, notes)} />
        )}
      </Sheet>
    </section>
  )
}
