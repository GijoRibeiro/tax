import { useRef, useState } from 'react'
import type { CaseState } from '../types'
import type { Action } from '../store/state'
import { advisorCanStart, caseStatus, requiredItems } from '../store/state'
import type { ChecklistItem } from '../types'
import type { FollowUpTemplate } from './workspace/types'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { StatusPill } from '../components/StatusPill'
import { Sheet } from '../components/Sheet'
import { FollowUpComposer } from './FollowUpComposer'
import { ClientQuestions } from './ClientQuestions'
import { PrepareControls } from './PrepareControls'
import { RequestDocumentForm } from './RequestDocumentForm'
import type { RequestDocumentFormHandle } from './RequestDocumentForm'
import type { ReactNode } from 'react'
import { SurfaceCard, TwoColumn } from './kit'

// The fixed preset list from edge §6.4, free text is still available (via
// the note input), but "Something else" is the only preset that requires it.
const FLAG_PRESETS = [
  "Can't open / password-protected",
  'Cut off / illegible',
  'Wrong document',
  'Something else',
] as const

const SOMETHING_ELSE = 'Something else'

export interface CaseDetailProps {
  state: CaseState
  dispatch: (a: Action) => void
  templates: FollowUpTemplate[]
  disabled?: boolean
  // Prior FLAG_ISSUE count for an item, drives the second-flag escalation
  // suggestion (edge §6.3). Defaults to "never flagged" when not supplied.
  getFlagCount?: (itemId: string) => number
  /** Context cards for the right column (notes, history), supplied by the view. */
  aside?: ReactNode
}

export function CaseDetail({ state, dispatch, templates, disabled, getFlagCount, aside }: CaseDetailProps) {
  const [flaggingId, setFlaggingId] = useState<string | null>(null)
  const [preset, setPreset] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const requestDocRef = useRef<RequestDocumentFormHandle>(null)

  const ready = advisorCanStart(state)
  const missing = requiredItems(state)
    .filter(item => item.status === 'needed' || item.status === 'issue')
    .map(item => item.title)
  // The client's name/year now live in CaseDetailView's header above this
  // component (Task 6), this title stays case-agnostic rather than hardcoding
  // Betina, since CaseDetail is shared across every case.
  const caseName = caseStatus(state) === 'onboarding' ? 'Case pending, client hasn\'t started' : 'Checklist'

  const startFlag = (itemId: string) => {
    setFlaggingId(itemId)
    setPreset(null)
    setNoteDraft('')
    setPreviewId(null)
  }

  const cancelFlag = () => {
    setFlaggingId(null)
    setPreset(null)
    setNoteDraft('')
  }

  const confirmFlag = (itemId: string) => {
    if (!preset) return
    const note = noteDraft.trim() ? `${preset}, ${noteDraft.trim()}` : preset
    dispatch({ type: 'FLAG_ISSUE', itemId, note })
    cancelFlag()
  }

  const requestDifferentDocument = (item: ChecklistItem) => {
    requestDocRef.current?.focusWithTitle(item.title)
    cancelFlag()
  }

  const verify = (itemId: string) => {
    dispatch({ type: 'VERIFY_ITEM', itemId })
    setPreviewId(null)
  }

  const canConfirm = !!preset && (preset !== SOMETHING_ELSE || noteDraft.trim().length > 0)

  // Verify / flag controls for one item, shared between the table row's
  // Actions cell and the preview modal's footer (Anna's #1 ask: let her act
  // on the document without leaving the preview).
  const renderVerifyFlagControls = (item: ChecklistItem) => {
    const flagCount = getFlagCount?.(item.id) ?? 0

    // A twice-flagged item sitting at 'issue' status (client hasn't re-sent
    // yet) never shows a "Flag issue" button, that only renders for
    // 'uploaded' items below, so the escalation suggestion would otherwise
    // be unreachable through the UI. Surface it directly on the row instead
    // of waiting for a third flag attempt (edge §6.3).
    if (item.status === 'issue' && flagCount >= 2) {
      return (
        <div className="tf-advisor-table__actions">
          <div className="tf-advisor-flag__escalation">
            <p className="tf-advisor-flag__escalation-text">
              Asked twice already, request a different document instead?
            </p>
            <Button variant="secondary" onClick={() => requestDifferentDocument(item)} disabled={disabled}>
              Request different document
            </Button>
          </div>
        </div>
      )
    }

    if (item.status !== 'uploaded') return null
    const flaggedBefore = flagCount >= 1
    return (
      <div className="tf-advisor-table__actions">
        <Button variant="secondary" onClick={() => verify(item.id)} disabled={disabled}>
          Verify ✓
        </Button>
        {flaggingId === item.id ? (
          <div className="tf-advisor-flag">
            {flaggedBefore && (
              <div className="tf-advisor-flag__escalation">
                <p className="tf-advisor-flag__escalation-text">
                  {flagCount >= 2
                    ? 'Asked twice already, request a different document instead?'
                    : 'This item came back once already, request a different document instead?'}
                </p>
                <Button variant="secondary" onClick={() => requestDifferentDocument(item)} disabled={disabled}>
                  Request different document
                </Button>
              </div>
            )}
            <div className="tf-advisor-flag__chips">
              {FLAG_PRESETS.map(reason => (
                <button
                  key={reason}
                  type="button"
                  className={`tf-advisor-chip-btn${preset === reason ? ' tf-advisor-chip-btn--selected' : ''}`}
                  onClick={() => setPreset(reason)}
                  disabled={disabled}
                  aria-pressed={preset === reason}
                >
                  {reason}
                </button>
              ))}
            </div>
            <input
              className="tf-advisor-flag__input"
              value={noteDraft}
              onChange={e => setNoteDraft(e.target.value)}
              placeholder={
                preset === SOMETHING_ELSE ? "What's wrong with this? (required)" : 'Add a note (optional)'
              }
              disabled={disabled}
            />
            <Button variant="primary" onClick={() => confirmFlag(item.id)} disabled={disabled || !canConfirm}>
              Confirm
            </Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => startFlag(item.id)} disabled={disabled}>
            Flag issue
          </Button>
        )}
      </div>
    )
  }

  const previewItem = previewId ? state.items.find(item => item.id === previewId) ?? null : null

  const banner = ready ? (
    <Banner tone="success">
      Sent by the client{state.cardLast4 ? `, card saved (•••• ${state.cardLast4})` : ''}. You can start this return; the charge happens only when they approve.
    </Banner>
  ) : missing.length === 0 ? (
    <Banner tone="info">Everything is filled. Waiting for the client to press "Send to Anna"; nothing to do yet.</Banner>
  ) : (
    <Banner tone="info">You can start once: {missing.join(', ')}</Banner>
  )

  return (
    <section className="tf-advisor-detail">
      <TwoColumn>
        <div>
          <SurfaceCard
            title={caseName}
            description="The same list the client sees on the phone."
            padded={false}
            actions={<Button variant="ghost" onClick={() => dispatch({ type: 'RESET' })}>Reset demo</Button>}
          >
            <div className="dk-card__inset">{banner}</div>
            <table className="tf-advisor-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Status</th>
                  <th>File</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>
                      <StatusPill status={item.status} />
                      {item.status === 'issue' && item.issueNote && (
                        <p className="tf-advisor-detail__note">Flagged: {item.issueNote}</p>
                      )}
                    </td>
                    <td>{item.uploadedFileName ?? '–'}</td>
                    <td>
                      <div className="tf-advisor-table__actions">
                        {item.uploadedFileName && (
                          <Button variant="ghost" onClick={() => setPreviewId(item.id)} aria-label={`Preview ${item.title}`}>
                            Preview
                          </Button>
                        )}
                        {renderVerifyFlagControls(item)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SurfaceCard>

          <SurfaceCard title="Prepare and file" description="Starts only once the client has sent, with a card saved.">
            <PrepareControls state={state} dispatch={dispatch} disabled={disabled} />
          </SurfaceCard>

          <SurfaceCard>
            <RequestDocumentForm ref={requestDocRef} state={state} dispatch={dispatch} disabled={disabled} />
          </SurfaceCard>
        </div>

        <div>
          <SurfaceCard>
            <ClientQuestions state={state} dispatch={dispatch} disabled={disabled} />
          </SurfaceCard>
          <SurfaceCard>
            <FollowUpComposer state={state} dispatch={dispatch} templates={templates} disabled={disabled} />
          </SurfaceCard>
          {aside}
        </div>
      </TwoColumn>

      <Sheet open={!!previewItem} onClose={() => setPreviewId(null)} title={previewItem?.title ?? 'Preview'}>
        {previewItem && (
          <div className="tf-doc-preview">
            {/* Honest mock, uploads are simulated, so this is a styled placeholder, not a real render. */}
            <div className="tf-doc-preview__page">
              <p className="tf-doc-preview__title">{previewItem.title}</p>
              <div className="tf-doc-preview__line" style={{ width: '90%' }} />
              <div className="tf-doc-preview__line" style={{ width: '75%' }} />
              <div className="tf-doc-preview__line" style={{ width: '82%' }} />
              <div className="tf-doc-preview__line" style={{ width: '60%' }} />
              <div className="tf-doc-preview__line" style={{ width: '70%' }} />
              <div className="tf-doc-preview__line" style={{ width: '45%' }} />
            </div>
            <p className="tf-doc-preview__caption">{previewItem.uploadedFileName ?? 'submitted-document.pdf'}</p>
            <div className="tf-doc-preview__footer">
              {previewItem.status === 'verified' && <StatusPill status="verified" />}
              {renderVerifyFlagControls(previewItem)}
            </div>
          </div>
        )}
      </Sheet>
    </section>
  )
}
