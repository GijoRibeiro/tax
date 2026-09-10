import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { CaseStoreProvider } from '../../store/CaseStore'
import { WorkspaceProvider, useWorkspace, STORAGE_KEY } from '../workspace/WorkspaceStore'
import { SEED_TODAY, seedWorkspace } from '../workspace/seedWorkspace'
import { SettingsView } from './SettingsView'
import { CaseDetailView } from './CaseDetailView'

type Ws = ReturnType<typeof useWorkspace>

function Probe({ onReady }: { onReady: (ws: Ws) => void }) {
  const ws = useWorkspace()
  onReady(ws)
  return null
}

function renderSettings() {
  let latest!: Ws
  const utils = render(
    <MemoryRouter>
      <CaseStoreProvider url={null}>
        <WorkspaceProvider>
          <Probe onReady={ws => { latest = ws }} />
          <SettingsView />
        </WorkspaceProvider>
      </CaseStoreProvider>
    </MemoryRouter>,
  )
  return { ...utils, getWs: () => latest }
}

function renderSettingsWithCaseDetail() {
  let latest!: Ws
  const utils = render(
    <MemoryRouter initialEntries={['/cases/jonas-brandt']}>
      <CaseStoreProvider url={null}>
        <WorkspaceProvider>
          <Probe onReady={ws => { latest = ws }} />
          <SettingsView />
          <Routes>
            <Route path="cases/:id" element={<CaseDetailView today={SEED_TODAY} />} />
          </Routes>
        </WorkspaceProvider>
      </CaseStoreProvider>
    </MemoryRouter>,
  )
  return { ...utils, getWs: () => latest }
}

beforeEach(() => {
  localStorage.clear()
})

test('profile card shows the advisor name, title, email and city', () => {
  renderSettings()
  expect(screen.getByText('Anna Weber')).toBeInTheDocument()
  expect(screen.getByText('Steuerberaterin')).toBeInTheDocument()
  expect(screen.getByText(/anna\.weber@example\.com/)).toBeInTheDocument()
  expect(screen.getByText(/Leipzig/)).toBeInTheDocument()
})

test('accepting new cases toggle reflects and updates settings', () => {
  const { getWs } = renderSettings()
  const toggle = screen.getByLabelText('Accepting new cases') as HTMLInputElement
  expect(toggle.checked).toBe(true)

  fireEvent.click(toggle)
  expect(getWs().ws.settings.acceptingNewCases).toBe(false)
})

test('notification checkboxes reflect and update all three prefs', () => {
  const { getWs } = renderSettings()

  const uploads = screen.getByLabelText(/client uploads a document/i) as HTMLInputElement
  const questions = screen.getByLabelText(/client asks a question/i) as HTMLInputElement
  const approvals = screen.getByLabelText(/client approves a return/i) as HTMLInputElement
  expect(uploads.checked).toBe(true)
  expect(questions.checked).toBe(true)
  expect(approvals.checked).toBe(true)

  fireEvent.click(uploads)
  fireEvent.click(questions)
  fireEvent.click(approvals)

  expect(getWs().ws.settings.notifyClientUploads).toBe(false)
  expect(getWs().ws.settings.notifyQuestions).toBe(false)
  expect(getWs().ws.settings.notifyApprovals).toBe(false)
})

test('templates list renders label and body preview for each seeded template', () => {
  renderSettings()
  const rows = screen.getAllByTestId('template-row')
  expect(rows.length).toBe(3)
  expect(screen.getByText('Numbers gap')).toBeInTheDocument()
})

test('template note about the follow-up composer is shown', () => {
  renderSettings()
  expect(screen.getByText("Templates appear in every case's follow-up composer.")).toBeInTheDocument()
})

test('editing a template updates it via saveTemplate', () => {
  const { getWs } = renderSettings()
  const row = screen.getByText('Numbers gap').closest('[data-testid="template-row"]') as HTMLElement
  fireEvent.click(within(row).getByText('Edit'))

  const labelInput = screen.getByLabelText('Label') as HTMLInputElement
  expect(labelInput.value).toBe('Numbers gap')
  fireEvent.change(labelInput, { target: { value: 'Numbers gap (updated)' } })
  fireEvent.click(screen.getByText('Save'))

  expect(getWs().ws.templates.find(t => t.id === 't-gap')?.label).toBe('Numbers gap (updated)')
})

test('the template form shows the <item> placeholder hint', () => {
  renderSettings()
  fireEvent.click(screen.getByText('New template'))
  const form = screen.getByLabelText('Label').closest('.tf-settings-template-form') as HTMLElement
  expect(within(form).getByText('<item>')).toBeInTheDocument()
})

test('creating a new template assigns id t-<slug> and appears in the list', () => {
  const { getWs } = renderSettings()
  fireEvent.click(screen.getByText('New template'))
  fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Photo tip' } })
  fireEvent.change(screen.getByLabelText('Body'), { target: { value: "Here's a tip for your <item>." } })
  fireEvent.click(screen.getByText('Save'))

  const added = getWs().ws.templates.find(t => t.label === 'Photo tip')
  expect(added?.id).toBe('t-photo-tip')
  expect(screen.getByText('Photo tip')).toBeInTheDocument()
})

test('a new template whose slugged id collides with an existing one gets a disambiguated id, not an overwrite', () => {
  const { getWs } = renderSettings()
  const originalGap = getWs().ws.templates.find(t => t.id === 't-gap')
  expect(originalGap).toBeDefined()

  fireEvent.click(screen.getByText('New template'))
  fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Gap' } })
  fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'A second, unrelated gap template.' } })
  fireEvent.click(screen.getByText('Save'))

  const templates = getWs().ws.templates
  const stillOriginal = templates.find(t => t.id === 't-gap')
  const created = templates.find(t => t.label === 'Gap')

  expect(stillOriginal?.body).toBe(originalGap?.body)
  expect(created).toBeDefined()
  expect(created?.id).not.toBe('t-gap')
  expect(templates.filter(t => t.label === 'Numbers gap' || t.label === 'Gap')).toHaveLength(2)
})

test('cancelling the delete Dialog leaves the template in place', () => {
  const { getWs } = renderSettings()
  const row = screen.getByText('Numbers gap').closest('[data-testid="template-row"]') as HTMLElement
  fireEvent.click(within(row).getByText('Delete'))

  fireEvent.click(screen.getByText('Cancel'))
  expect(getWs().ws.templates.some(t => t.id === 't-gap')).toBe(true)
})

test('confirming template delete removes it', () => {
  const { getWs } = renderSettings()
  const row = screen.getByText('Numbers gap').closest('[data-testid="template-row"]') as HTMLElement
  fireEvent.click(within(row).getByText('Delete'))

  const dialog = screen.getByRole('dialog')
  fireEvent.click(within(dialog).getByText('Delete'))

  expect(getWs().ws.templates.some(t => t.id === 't-gap')).toBe(false)
})

test('reset workspace requires confirming the Dialog, then resets state', () => {
  const { getWs } = renderSettings()
  fireEvent.click(screen.getByText('Reset workspace'))

  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getByText('Reset workspace?')).toBeInTheDocument()

  fireEvent.click(within(dialog).getByRole('button', { name: 'Reset' }))
  expect(getWs().ws.templates.map(t => t.id)).toEqual(['t-gap', 't-incomplete', 't-dates'])
})

test('reset workspace round-trips: mutating a case then resetting restores the seed state and rewrites localStorage', () => {
  const { getWs } = renderSettings()

  act(() => {
    getWs().updateNotes('priya-nair', 'A note that should not survive the reset.')
  })
  expect(getWs().ws.cases['priya-nair'].client.notes).toBe('A note that should not survive the reset.')

  fireEvent.click(screen.getByText('Reset workspace'))
  const dialog = screen.getByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Reset' }))

  const seed = seedWorkspace()
  expect(getWs().ws.cases['priya-nair'].client.notes).toBe(seed.cases['priya-nair'].client.notes)
  expect(Object.keys(getWs().ws.cases).sort()).toEqual(Object.keys(seed.cases).sort())

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  expect(stored.cases['priya-nair'].client.notes).toBe(seed.cases['priya-nair'].client.notes)
})

test('saving a new template makes it available in the case detail follow-up composer', () => {
  renderSettingsWithCaseDetail()

  fireEvent.click(screen.getByText('New template'))
  fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Photo tip' } })
  fireEvent.change(screen.getByLabelText('Body'), { target: { value: "Here's a tip for your <item>." } })
  fireEvent.click(screen.getByText('Save'))

  const templateSelect = screen.getByDisplayValue('Choose a template…') as HTMLSelectElement
  expect(within(templateSelect).getByText('Photo tip')).toBeInTheDocument()
})
