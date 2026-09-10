import { useState } from 'react'
import type { CaseState } from '../types'
import type { Action } from '../store/state'
import { caseStatus } from '../store/state'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'

const DRAFT_FIELDS = [
  { key: 'income', label: 'Income', seed: '€54,200' },
  { key: 'taxPaid', label: 'Tax paid', seed: '€11,830' },
  { key: 'deductions', label: 'Deductions found', seed: '€2,410' },
  { key: 'refundEstimate', label: 'Refund estimate', seed: '€1,286' },
] as const

type DraftField = (typeof DRAFT_FIELDS)[number]['key']

export interface PrepareControlsProps {
  state: CaseState
  dispatch: (a: Action) => void
  disabled?: boolean
}

export function PrepareControls({ state, dispatch, disabled }: PrepareControlsProps) {
  const [draft, setDraft] = useState<Record<DraftField, string>>(
    Object.fromEntries(DRAFT_FIELDS.map(f => [f.key, f.seed])) as Record<DraftField, string>,
  )
  const status = caseStatus(state)

  if (status === 'ready_to_work')
    return (
      <Button variant="primary" onClick={() => dispatch({ type: 'START_PREPARING' })} disabled={disabled}>
        Start preparing
      </Button>
    )
  if (status === 'preparing')
    return (
      <div className="tf-advisor-draft">
        {DRAFT_FIELDS.map(f => (
          <label key={f.key} className="tf-advisor-draft__field">
            {f.label}
            <input
              value={draft[f.key]}
              onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
              disabled={disabled}
            />
          </label>
        ))}
        <Button
          variant="primary"
          disabled={disabled}
          onClick={() => dispatch({
            type: 'SEND_DRAFT',
            draft: {
              income: draft.income, taxPaid: draft.taxPaid,
              deductions: draft.deductions, refundEstimate: draft.refundEstimate,
            },
          })}
        >
          Send to Betina for approval
        </Button>
      </div>
    )
  if (status === 'awaiting_approval') return <Banner tone="info">Waiting for Betina to approve.</Banner>
  if (status === 'approved')
    return (
      <Button variant="primary" onClick={() => dispatch({ type: 'MARK_FILED' })} disabled={disabled}>
        Mark as filed
      </Button>
    )
  if (status === 'filed') return <Banner tone="success">Filed with Finanzamt Berlin. Done.</Banner>
  return <p className="dk-quiet">Nothing to prepare yet. The button appears here the moment the client sends.</p>
}
