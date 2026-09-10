import { useState } from 'react'
import type { CaseState } from '../types'
import type { Action } from '../store/state'
import { openFollowUpsFor } from '../store/state'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'

// One-click canned answers in Anna's voice. ANSWER_FOLLOW_UP sets status
// "answered" + reply on any follow-up by id regardless of who asked it, so
// reusing it here for advisor-answers-consumer is the same action the
// free-text reply path already uses.
export const QUICK_REPLIES = [
  "Good question, skip it for now, I'll confirm once I see your other documents.",
  'Yes, this applies to you, the checklist explains where to find it.',
  "Not this time. I'll flag it if that changes.",
]

export interface ClientQuestionsProps {
  state: CaseState
  dispatch: (a: Action) => void
  disabled?: boolean
}

export function ClientQuestions({ state, dispatch, disabled }: ClientQuestionsProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const open = openFollowUpsFor(state, 'consumer')

  const reply = (id: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    dispatch({ type: 'ANSWER_FOLLOW_UP', followUpId: id, reply: trimmed })
    setDrafts(d => ({ ...d, [id]: '' }))
  }

  return (
    <div className="tf-advisor-questions">
      <h3 className="tf-advisor-questions__title">Client questions</h3>
      {open.length === 0 && (
        <EmptyState icon="✓" title="Nothing waiting on you" body="Client questions land here." />
      )}
      {open.map(fu => (
        <div className="tf-advisor-question" key={fu.id}>
          <p className="tf-advisor-question__message">{fu.message}</p>
          <div className="tf-advisor-question__quick-replies">
            {QUICK_REPLIES.map(text => (
              <button
                key={text}
                type="button"
                className="tf-advisor-quick-reply"
                onClick={() => reply(fu.id, text)}
                disabled={disabled}
              >
                {text}
              </button>
            ))}
          </div>
          <textarea
            className="tf-textarea"
            value={drafts[fu.id] ?? ''}
            onChange={e => setDrafts(d => ({ ...d, [fu.id]: e.target.value }))}
            placeholder="Write a reply"
            disabled={disabled}
          />
          <Button variant="primary" onClick={() => reply(fu.id, drafts[fu.id] ?? '')} disabled={disabled}>
            Send reply
          </Button>
        </div>
      ))}
    </div>
  )
}
