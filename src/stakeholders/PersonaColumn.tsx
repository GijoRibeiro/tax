import { useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { StakeholderMessage } from '../store/stakeholders'
import { DISCLAIMER } from './personas'
import type { PersonaMeta } from './personas'

interface Props {
  persona: PersonaMeta
  messages: StakeholderMessage[]
  pending: StakeholderMessage | null
  online: boolean
  onAsk: (text: string) => void
  onReset: () => void
}

export function PersonaColumn({ persona, messages, pending, online, onAsk, onReset }: Props) {
  const [draft, setDraft] = useState('')
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const logRef = useRef<HTMLDivElement | null>(null)
  const mounted = useRef(false)
  const firstName = persona.name.split(' ')[0]

  // First paint (including a hot reload): land at the bottom instantly, no
  // animation. Only a message that arrives while mounted scrolls smoothly, and
  // only this column does, never the neighbour.
  useLayoutEffect(() => {
    const el = logRef.current
    if (!el) return
    if (!mounted.current) {
      el.scrollTop = el.scrollHeight
      mounted.current = true
      return
    }
    el.scrollTo?.({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length, pending?.id])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    onAsk(text)
    setDraft('')
  }

  return (
    <section className="sh-column" aria-label={`${persona.name} interview`}>
      <header className="sh-column__header">
        <img className="sh-portrait" src={persona.portrait} alt="" width={44} height={44} />
        <div className="sh-column__identity">
          <h2 className="sh-column__name">{persona.name}</h2>
          <p className="sh-column__situation">{persona.short}</p>
        </div>
        <div className="sh-column__actions">
          <button type="button" className="sh-link" onClick={() => setSourcesOpen(o => !o)} aria-expanded={sourcesOpen}>
            Sources
          </button>
          <button type="button" className="sh-link" onClick={onReset}>
            Reset
          </button>
        </div>
      </header>

      {sourcesOpen && (
        <div className="sh-sources" role="region" aria-label={`${persona.name} sources`}>
          <p className="sh-sources__disclaimer">{DISCLAIMER}</p>
          <ul className="sh-sources__list">
            {persona.sources.map(s => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sh-transcript" role="log" aria-live="polite" ref={logRef}>
        {messages.length === 0 && (
          <p className="sh-transcript__empty">No conversation yet. Ask {firstName} anything.</p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`sh-msg sh-msg--${m.role}`}>
            <p className="sh-msg__text">{m.text}</p>
          </div>
        ))}
        {pending && online && (
          <div className="sh-typing" role="status">
            <span className="sh-typing__dots" aria-hidden="true"><i /><i /><i /></span>
            {firstName} is typing…
          </div>
        )}
      </div>

      <form className="sh-composer" onSubmit={submit}>
        <input
          className="sh-composer__input"
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={`Ask ${firstName}…`}
          aria-label={`Ask ${firstName}`}
          disabled={!online}
        />
        <button
          type="submit"
          className="sh-composer__send"
          disabled={!online || !draft.trim()}
          aria-label={`Send to ${firstName}`}
          title="Send"
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M10 16V4M10 4l-5 5M10 4l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
      {!online && (
        <p className="sh-offline" role="status">
          <span className="sh-offline__dot" aria-hidden="true" />
          Server is offline.
        </p>
      )}
    </section>
  )
}
