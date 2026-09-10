import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { CaseState } from '../types'
import type { Action } from '../store/state'
import { Button } from '../components/Button'
import type { ItemGroup } from '../types'

const GROUPS: { value: ItemGroup; label: string }[] = [
  { value: 'identity', label: 'Identity' },
  { value: 'employment', label: 'Employment' },
  { value: 'benefits', label: 'Benefits' },
  { value: 'deductions', label: 'Deductions' },
]

function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export interface RequestDocumentFormProps {
  state: CaseState
  dispatch: (a: Action) => void
  disabled?: boolean
}

// Imperative handle so the second-flag escalation suggestion (CaseDetail) can
// jump the advisor straight here with the flagged item's title prefilled,
// instead of the advisor retyping it.
export interface RequestDocumentFormHandle {
  focusWithTitle: (title: string) => void
}

// Anna's #3 ask: real Mandate need more than the fixed checklist, let her add
// an item (Pendlerpauschale, a second employer's Lohnsteuerbescheinigung, …)
// with the same plain-English explainer treatment the built-in items get.
export const RequestDocumentForm = forwardRef<RequestDocumentFormHandle, RequestDocumentFormProps>(
  function RequestDocumentForm({ state, dispatch, disabled }, ref) {
    const [title, setTitle] = useState('')
    const [group, setGroup] = useState<ItemGroup>('deductions')
    const [optional, setOptional] = useState(true)
    const [explainer, setExplainer] = useState('')
    const [lookLike, setLookLike] = useState('')
    const titleRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      focusWithTitle: (t: string) => {
        setTitle(t)
        titleRef.current?.focus()
        try {
          titleRef.current?.scrollIntoView({ block: 'center' })
        } catch {
          /* jsdom doesn't implement scrollIntoView, safe to ignore */
        }
      },
    }))

    const submit = () => {
      const trimmedTitle = title.trim()
      if (!trimmedTitle) return
      const id = slugify(trimmedTitle)
      if (!id || state.items.some(item => item.id === id)) return
      dispatch({
        type: 'ADD_ITEM',
        item: {
          id,
          group,
          title: trimmedTitle,
          explainer: explainer.trim() || `${trimmedTitle}. Anna will explain more if you're unsure.`,
          lookLike: lookLike.trim() || 'Whatever document covers this. Anna will confirm once she sees it.',
          optional,
        },
      })
      setTitle('')
      setExplainer('')
      setLookLike('')
      setOptional(true)
    }

    return (
      <div className="tf-advisor-composer">
        <h3 className="tf-advisor-composer__title">Request another document</h3>
        <div className="tf-advisor-composer__row">
          <label className="tf-advisor-composer__field">
            Document title
            <input
              ref={titleRef}
              className="tf-advisor-flag__input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Commute distance"
              disabled={disabled}
            />
          </label>
          <label className="tf-advisor-composer__field">
            Category
            <select value={group} onChange={e => setGroup(e.target.value as ItemGroup)} disabled={disabled}>
              {GROUPS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="tf-advisor-composer__field">
          One-line explainer
          <input
            className="tf-advisor-flag__input"
            value={explainer}
            onChange={e => setExplainer(e.target.value)}
            placeholder="Why the client needs this, in plain English"
            disabled={disabled}
          />
        </label>
        <label className="tf-advisor-composer__field">
          What it looks like <span className="tf-advisor-composer__optional">(optional)</span>
          <input
            className="tf-advisor-flag__input"
            value={lookLike}
            onChange={e => setLookLike(e.target.value)}
            placeholder="e.g. One page, your name and address at the top"
            disabled={disabled}
          />
        </label>
        <label className="tf-advisor-composer__checkbox">
          <input
            type="checkbox"
            checked={optional}
            onChange={e => setOptional(e.target.checked)}
            disabled={disabled}
          />
          Optional
        </label>
        <Button variant="primary" onClick={submit} disabled={disabled}>
          Request document
        </Button>
      </div>
    )
  },
)
