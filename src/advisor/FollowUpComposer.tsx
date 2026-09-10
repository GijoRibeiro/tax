import { useState } from 'react'
import type { CaseState } from '../types'
import type { Action } from '../store/state'
import type { FollowUpTemplate } from './workspace/types'
import { Button } from '../components/Button'

export interface FollowUpComposerProps {
  state: CaseState
  dispatch: (a: Action) => void
  templates: FollowUpTemplate[]
  disabled?: boolean
}

export function FollowUpComposer({ state, dispatch, templates, disabled }: FollowUpComposerProps) {
  const [itemId, setItemId] = useState(state.items[0]?.id ?? '')
  const [templateIndex, setTemplateIndex] = useState('')
  const [message, setMessage] = useState('')
  const [lastSent, setLastSent] = useState<string | null>(null)

  const itemTitle = (id: string) => state.items.find(item => item.id === id)?.title ?? ''

  const applyTemplate = (index: string, forItemId: string) => {
    setTemplateIndex(index)
    if (index === '') return
    const template = templates[Number(index)]
    if (!template) return
    setMessage(template.body.replace('<item>', itemTitle(forItemId)))
  }

  const send = () => {
    if (!message.trim()) return
    dispatch({ type: 'SEND_FOLLOW_UP', itemId: itemId || undefined, message })
    setLastSent(message)
    setMessage('')
    setTemplateIndex('')
  }

  return (
    <div className="tf-advisor-composer">
      <h3 className="tf-advisor-composer__title">Send a follow-up</h3>
      <div className="tf-advisor-composer__row">
        <label className="tf-advisor-composer__field">
          Item
          <select
            value={itemId}
            onChange={e => {
              setItemId(e.target.value)
              if (templateIndex !== '') applyTemplate(templateIndex, e.target.value)
            }}
            disabled={disabled}
          >
            {state.items.map(item => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="tf-advisor-composer__field">
          Template
          <select value={templateIndex} onChange={e => applyTemplate(e.target.value, itemId)} disabled={disabled}>
            <option value="">Choose a template…</option>
            {templates.map((tpl, i) => (
              <option key={tpl.id} value={String(i)}>
                {tpl.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <textarea
        className="tf-textarea"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Write a message"
        disabled={disabled}
      />
      <Button variant="primary" onClick={send} disabled={disabled}>
        Send follow-up
      </Button>
      {lastSent && (
        <p className="tf-advisor-composer__hint">Recently sent: “{lastSent}”</p>
      )}
    </div>
  )
}
