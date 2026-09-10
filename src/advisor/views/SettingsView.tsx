import { useState } from 'react'
import { useWorkspace } from '../workspace/WorkspaceStore'
import { AdvisorCard } from '../../components/AdvisorCard'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import type { FollowUpTemplate } from '../workspace/types'
import { PageHeader, PageBody, TwoColumn, SurfaceCard } from '../kit'

// Anna's own contact details, not part of the shared ADVISOR const (which is
// reused by the consumer-facing app and has no email/city), so they live here.
const ADVISOR_CONTACT = { email: 'anna.weber@example.com', city: 'Leipzig' }

const NEW_TEMPLATE_ID = '__new__'

function slug(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// New-template ids are derived from the label and SAVE_TEMPLATE upserts by id,
// so a label that slugs to an id already in use (e.g. a second "Gap" template
// after the seeded "Numbers gap", both slug toward "gap") would otherwise
// silently overwrite the existing template instead of creating a new one.
// Only the creation path needs this: editing an existing template intentionally
// keeps its id (that's the upsert).
function uniqueTemplateId(base: string, existingIds: Set<string>): string {
  if (!existingIds.has(base)) return base
  let n = 2
  while (existingIds.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

interface TemplateFormProps {
  label: string
  body: string
  setLabel: (v: string) => void
  setBody: (v: string) => void
  onSave: () => void
  onCancel: () => void
}

function TemplateForm({ label, body, setLabel, setBody, onSave, onCancel }: TemplateFormProps) {
  return (
    <div className="tf-settings-template-form">
      <label className="tf-settings-template-form__field">
        Label
        <input value={label} onChange={e => setLabel(e.target.value)} />
      </label>
      <label className="tf-settings-template-form__field">
        Body
        <textarea className="tf-textarea" value={body} onChange={e => setBody(e.target.value)} />
      </label>
      <p className="tf-settings-template-form__hint">
        Use <code>&lt;item&gt;</code> as a placeholder for the document name.
      </p>
      <div className="tf-settings-template-form__actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  )
}

export function SettingsView() {
  const { ws, updateSettings, saveTemplate, deleteTemplate, resetWorkspace } = useWorkspace()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [body, setBody] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<FollowUpTemplate | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  function startEdit(t: FollowUpTemplate) {
    setEditingId(t.id)
    setLabel(t.label)
    setBody(t.body)
  }

  function startNew() {
    setEditingId(NEW_TEMPLATE_ID)
    setLabel('')
    setBody('')
  }

  function cancelEdit() {
    setEditingId(null)
    setLabel('')
    setBody('')
  }

  function save() {
    const trimmedLabel = label.trim()
    const trimmedBody = body.trim()
    if (!trimmedLabel || !trimmedBody) return
    const id =
      editingId === NEW_TEMPLATE_ID
        ? uniqueTemplateId(`t-${slug(trimmedLabel)}`, new Set(ws.templates.map(t => t.id)))
        : (editingId as string)
    saveTemplate({ id, label: trimmedLabel, body: trimmedBody })
    cancelEdit()
  }

  function confirmDelete() {
    if (deleteTarget) deleteTemplate(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <section className="tf-settings">
      <PageHeader
        eyebrow="Your desk"
        title="Settings"
        description="Who you are to clients, when you take new cases, what you hear about, and the words you reuse."
      />

      <PageBody>
      <TwoColumn>
      <div>
      <SurfaceCard title="Templates" description="Appear in every case's follow-up composer.">
        <ul className="tf-settings-templates">
          {ws.templates.map(t => (
            <li key={t.id} className="tf-settings-template-row" data-testid="template-row">
              {editingId === t.id ? (
                <TemplateForm
                  label={label}
                  body={body}
                  setLabel={setLabel}
                  setBody={setBody}
                  onSave={save}
                  onCancel={cancelEdit}
                />
              ) : (
                <>
                  <div className="tf-settings-template-row__text">
                    <span className="tf-settings-template-row__label">{t.label}</span>
                    <span className="tf-settings-template-row__preview">{t.body}</span>
                  </div>
                  <div className="tf-settings-template-row__actions">
                    <Button variant="secondary" onClick={() => startEdit(t)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => setDeleteTarget(t)}>
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        {editingId === NEW_TEMPLATE_ID ? (
          <TemplateForm
            label={label}
            body={body}
            setLabel={setLabel}
            setBody={setBody}
            onSave={save}
            onCancel={cancelEdit}
          />
        ) : (
          <Button variant="secondary" onClick={startNew}>
            New template
          </Button>
        )}

        <p className="tf-settings-templates__note">Templates appear in every case's follow-up composer.</p>
      </SurfaceCard>
      </div>

      <div>
      <SurfaceCard title="Profile" description="What clients see when they meet you.">
        <AdvisorCard />
        <p className="tf-settings-profile__contact">
          {ADVISOR_CONTACT.email} · {ADVISOR_CONTACT.city}
        </p>
      </SurfaceCard>

      <SurfaceCard title="Availability">
        <label className="tf-settings-toggle">
          <input
            type="checkbox"
            checked={ws.settings.acceptingNewCases}
            onChange={e => updateSettings({ acceptingNewCases: e.target.checked })}
          />
          Accepting new cases
        </label>
      </SurfaceCard>

      <SurfaceCard title="Notifications" description="Only the moments that need you.">
        <label className="tf-settings-checkbox">
          <input
            type="checkbox"
            checked={ws.settings.notifyClientUploads}
            onChange={e => updateSettings({ notifyClientUploads: e.target.checked })}
          />
          Client uploads a document
        </label>
        <label className="tf-settings-checkbox">
          <input
            type="checkbox"
            checked={ws.settings.notifyQuestions}
            onChange={e => updateSettings({ notifyQuestions: e.target.checked })}
          />
          Client asks a question
        </label>
        <label className="tf-settings-checkbox">
          <input
            type="checkbox"
            checked={ws.settings.notifyApprovals}
            onChange={e => updateSettings({ notifyApprovals: e.target.checked })}
          />
          Client approves a return
        </label>
      </SurfaceCard>

      <SurfaceCard title="Danger zone" description="Back to the seeded demo state.">
        <Button variant="ghost" onClick={() => setResetOpen(true)}>
          Reset workspace
        </Button>
      </SurfaceCard>
      </div>
      </TwoColumn>
      </PageBody>

      <Dialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.label ?? ''}"?`}
        confirmLabel="Delete"
        tone="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      >
        <p>This template will no longer be available in the follow-up composer.</p>
      </Dialog>

      <Dialog
        open={resetOpen}
        title="Reset workspace?"
        confirmLabel="Reset"
        tone="danger"
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetWorkspace()
          setResetOpen(false)
        }}
      >
        <p>This restores every case, template and setting to the seeded demo state. This can't be undone.</p>
      </Dialog>
    </section>
  )
}
