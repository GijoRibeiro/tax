import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { CaseStoreProvider } from '../../store/CaseStore'
import { WorkspaceProvider, useWorkspace, STORAGE_KEY } from '../workspace/WorkspaceStore'
import { SEED_TODAY } from '../workspace/seedWorkspace'
import { NUDGE_MESSAGE } from '../nudge'
import { CaseDetailView } from './CaseDetailView'

type Ws = ReturnType<typeof useWorkspace>

function Probe({ onReady }: { onReady: (ws: Ws) => void }) {
  const ws = useWorkspace()
  onReady(ws)
  return null
}

function renderView(initialPath: string) {
  let latest!: Ws
  const utils = render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CaseStoreProvider url={null}>
        <WorkspaceProvider>
          <Probe onReady={ws => { latest = ws }} />
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

test('verify flow works end-to-end on a non-amara case', () => {
  // sabine-hoffmann keeps the default seeded 'tax-id' status of 'uploaded'.
  renderView('/cases/sabine-hoffmann')
  fireEvent.click(screen.getByText('Verify ✓'))
  expect(screen.getAllByText('Checked ✓').length).toBeGreaterThanOrEqual(1)
})

test('client header shows initials avatar, name, year, language chip, email, city', () => {
  renderView('/cases/priya-nair')
  expect(screen.getByText('PN')).toBeInTheDocument()
  expect(screen.getByText('Priya Nair')).toBeInTheDocument()
  expect(screen.getByText(/Return 2025/)).toBeInTheDocument()
  expect(screen.getByText('EN')).toBeInTheDocument()
  expect(screen.getByText(/priya\.nair@example\.com/)).toBeInTheDocument()
  expect(screen.getByText(/Berlin/)).toBeInTheDocument()
})

test('notes textarea saves to localStorage on blur', () => {
  renderView('/cases/priya-nair')
  const textarea = screen.getByLabelText('Notes')
  fireEvent.change(textarea, { target: { value: 'Called client, waiting on Steuer-ID copy.' } })
  fireEvent.blur(textarea)

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  expect(stored.cases['priya-nair'].client.notes).toBe('Called client, waiting on Steuer-ID copy.')
})

test('unknown id shows a not-found empty state with a back link', () => {
  renderView('/cases/does-not-exist')
  expect(screen.getByText('Case not found')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /back to cases/i })).toBeInTheDocument()
})

test('landing directly on an unread case marks it read', () => {
  // priya-nair is seeded unread: true, landing on its URL directly (no click
  // through the cases table) should still clear the flag via a mount effect.
  const { getWs } = renderView('/cases/priya-nair')
  expect(getWs().ws.cases['priya-nair'].unread).toBe(false)
})

test('case history panel lists that case\'s activity, newest first', () => {
  renderView('/cases/chen-wei')
  const rows = screen.getAllByTestId('case-history-row')
  expect(rows.length).toBe(2)
  // act-4 (2 days ago) is newer than act-3 (6 days ago) in the seed.
  expect(rows[0]).toHaveTextContent('Flagged Annual income statement again. Chen Wei')
  expect(rows[1]).toHaveTextContent('Flagged Annual income statement. Chen Wei')
})

test('on-hold case shows the banner with the reason and hides action components; Reopen clears it', () => {
  const { getWs } = renderView('/cases/greta-lindqvist')

  const banner = screen.getByRole('status')
  expect(within(banner).getByText('On hold, client withdrew')).toBeInTheDocument()
  expect(within(banner).getByText(/Paused filing after a job change abroad/)).toBeInTheDocument()
  expect(screen.queryByText('Verify ✓')).not.toBeInTheDocument()
  expect(screen.queryByText('Send follow-up')).not.toBeInTheDocument()
  expect(screen.queryByText('Start preparing')).not.toBeInTheDocument()

  fireEvent.click(screen.getByText('Reopen case'))

  expect(screen.queryByText('On hold, client withdrew')).not.toBeInTheDocument()
  expect(getWs().ws.cases['greta-lindqvist'].special).toBeUndefined()
  expect(getWs().ws.activity[0].caseId).toBe('greta-lindqvist')
  expect(getWs().ws.activity[0].text).toBe('Reopened case')
})

// --- Task 8: relay-offline behavior, flag presets, escalation, nudge -------

test('amara detail shows the offline banner and disables Verify while the relay is not connected', () => {
  // CaseStoreProvider url={null} in this test harness never opens a socket,
  // so liveConnected is always false, amara reads as offline here.
  renderView('/cases/amara')
  expect(
    screen.getByText(/Live sync offline. Betina's phone can't see changes right now\. Reconnecting…/),
  ).toBeInTheDocument()
  // A true first access: nothing is uploaded yet, so there is nothing to verify, and
  // every mutating control on this case is disabled while the relay is down.
  expect(screen.queryByText('Verify ✓')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Request document' })).toBeDisabled()
})

test('flag preset + note dispatches FLAG_ISSUE with the preset as a note prefix', () => {
  const { getWs } = renderView('/cases/sabine-hoffmann') // tax-id is seeded 'uploaded'
  fireEvent.click(screen.getByText('Flag issue'))
  fireEvent.click(screen.getByText("Cut off / illegible"))
  fireEvent.change(screen.getByPlaceholderText('Add a note (optional)'), {
    target: { value: 'bottom third is missing' },
  })
  fireEvent.click(screen.getByText('Confirm'))

  const item = getWs().ws.cases['sabine-hoffmann'].state.items.find(i => i.id === 'tax-id')
  expect(item?.status).toBe('issue')
  expect(item?.issueNote).toBe('Cut off / illegible, bottom third is missing')
})

test('"Something else" preset requires a note before Confirm is enabled', () => {
  renderView('/cases/sabine-hoffmann')
  fireEvent.click(screen.getByText('Flag issue'))
  fireEvent.click(screen.getByText('Something else'))
  expect(screen.getByText('Confirm')).toBeDisabled()

  fireEvent.change(screen.getByPlaceholderText("What's wrong with this? (required)"), {
    target: { value: 'client sent the wrong file entirely' },
  })
  expect(screen.getByText('Confirm')).not.toBeDisabled()
})

test('second flag on the same item shows the escalation suggestion and prefills RequestDocumentForm', () => {
  // chen-wei's lohnsteuer already has two FLAG_ISSUE activity events in the
  // seed; bring the item back to 'uploaded' (as if the client re-sent it) so
  // Flag issue is available to open again.
  const { getWs } = renderView('/cases/chen-wei')
  act(() => {
    getWs().dispatchCase('chen-wei', { type: 'UPLOAD_ITEM', itemId: 'lohnsteuer', fileName: 'lohnsteuer-v2.jpg' })
  })

  fireEvent.click(screen.getByText('Flag issue'))
  expect(screen.getByText('Asked twice already, request a different document instead?')).toBeInTheDocument()

  fireEvent.click(screen.getByText('Request different document'))
  expect(screen.getByLabelText('Document title')).toHaveValue('Annual income statement')
  // The flag panel closes once the advisor is routed to RequestDocumentForm.
  expect(screen.queryByText('Asked twice already, request a different document instead?')).not.toBeInTheDocument()
})

test('a once-flagged item re-flagged shows count-aware "came back once" copy, not "twice already"', () => {
  // nadia-petrova's bank item has exactly one prior FLAG_ISSUE activity event
  // in the seed (act-5); bring it back to 'uploaded' (as if the client
  // re-sent it) so Flag issue is available to open again.
  const { getWs } = renderView('/cases/nadia-petrova')
  act(() => {
    getWs().dispatchCase('nadia-petrova', { type: 'UPLOAD_ITEM', itemId: 'bank', fileName: 'iban-v2.jpg' })
  })

  fireEvent.click(screen.getByText('Flag issue'))
  expect(screen.getByText('This item came back once already, request a different document instead?')).toBeInTheDocument()
  expect(screen.queryByText('Asked twice already, request a different document instead?')).not.toBeInTheDocument()
})

test('chen-wei\'s twice-flagged item shows the escalation suggestion on its row with no re-flag needed, and its button prefills RequestDocumentForm', () => {
  // chen-wei's lohnsteuer is seeded already at status 'issue' with two prior
  // FLAG_ISSUE activity events, the client hasn't re-sent yet, so there is
  // no 'uploaded' item and no "Flag issue" button to click. The escalation
  // suggestion must be visible on the row as-is (edge §6.3 living demo).
  renderView('/cases/chen-wei')

  expect(screen.queryByText('Flag issue')).not.toBeInTheDocument()
  expect(screen.getByText('Asked twice already, request a different document instead?')).toBeInTheDocument()

  fireEvent.click(screen.getByText('Request different document'))
  expect(screen.getByLabelText('Document title')).toHaveValue('Annual income statement')
})

test('stalled case shows a Stalled badge with Send a nudge, which dispatches the exact nudge message', () => {
  // sabine-hoffmann's lastActivity is 16 days before SEED_TODAY with a
  // required item still 'needed', isStalled(c, SEED_TODAY) is true.
  const { getWs } = renderView('/cases/sabine-hoffmann')
  expect(screen.getByText('Stalled')).toBeInTheDocument()

  fireEvent.click(screen.getByText('Send a nudge'))

  const followUps = getWs().ws.cases['sabine-hoffmann'].state.followUps
  expect(followUps.some(fu => fu.from === 'advisor' && fu.message === NUDGE_MESSAGE)).toBe(true)
})
