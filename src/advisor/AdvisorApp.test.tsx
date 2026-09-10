import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { CaseStoreProvider } from '../store/CaseStore'
import { AdvisorApp } from './AdvisorApp'

// In production AdvisorApp is mounted under an outer "/advisor/*" Route
// (see main.tsx). Sidebar/Topbar's links are absolute "/advisor/…" paths
// precisely because they're siblings of AdvisorApp's own inner <Routes>, one
// level below this outer one. Mirroring that outer route here (rather than
// rendering AdvisorApp straight at the MemoryRouter root) is what makes
// clicking those links behave the same as it does in the real app.
function renderRoute(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries.map(e => `/advisor${e}`)}>
      <CaseStoreProvider>
        <Routes>
          <Route path="/advisor/*" element={<AdvisorApp />} />
        </Routes>
      </CaseStoreProvider>
    </MemoryRouter>,
  )
}

function renderCaseDetail() {
  return renderRoute(['/cases/amara'])
}

// Several tests below now drive non-amara cases (amara's checklist is
// relay-backed and never touches localStorage), clear between tests so one
// test's WorkspaceState mutations can't bleed into the next.
beforeEach(() => {
  localStorage.clear()
})

test('blocking summary lists missing required items', () => {
  renderCaseDetail()
  expect(screen.getByText(/You can start once:/)).toHaveTextContent('Annual income statement')
})

test('verify moves an uploaded item to verified', () => {
  // sabine-hoffmann isn't relay-backed, so it's never offline-disabled.
  // her tax-id item is seeded 'uploaded' just like amara's was.
  renderRoute(['/cases/sabine-hoffmann'])
  fireEvent.click(screen.getByText('Verify ✓'))
  expect(screen.getAllByText('Checked ✓').length).toBeGreaterThanOrEqual(2)
})

test('sending a follow-up shows a recently sent hint', () => {
  // sabine-hoffmann is already past onboarding (seeded phase 'sharing').
  renderRoute(['/cases/sabine-hoffmann'])
  const templateSelect = screen.getByDisplayValue('Choose a template…')
  fireEvent.change(templateSelect, { target: { value: '0' } })
  fireEvent.click(screen.getByText('Send follow-up'))
  expect(screen.getByText(/Recently sent/)).toBeInTheDocument()
})

test('index route renders the Today dashboard', () => {
  renderRoute(['/'])
  expect(screen.getByText(/^Good (morning|afternoon|evening), Anna$/)).toBeInTheDocument()
})

test('inbox route renders the InboxView', () => {
  renderRoute(['/inbox'])
  expect(screen.getByText('Needs your reply')).toBeInTheDocument()
})

test('clients route renders the ClientsView', () => {
  renderRoute(['/clients'])
  expect(screen.getByRole('heading', { name: 'Clients' })).toBeInTheDocument()
})

test('settings route renders the SettingsView', () => {
  renderRoute(['/settings'])
  expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
})

// --- Restored from the pre-refactor AdvisorApp.test.tsx (fix round 1) ---
// These six exercised behavior that still ships but was dropped when the
// old AdvisorQueue/StaticCaseDetail-based test harness was replaced. They're
// re-targeted at the new /cases/:id route instead of the deleted queue, with
// assertions kept equivalent in meaning to the originals.

test('connection indicator shows offline label when the relay is not connected (test env)', () => {
  renderRoute(['/'])
  expect(screen.getByText('Live sync offline, retrying')).toBeInTheDocument()
})

test('advisor can start preparing once ready, send draft, and file after approval', () => {
  // jonas-brandt is seeded phase 'sharing' with every required item verified,
  // so caseStatus resolves to 'ready_to_work' without needing to fast-forward
  // a live case through UPLOAD_ITEM actions the way the old test did.
  renderRoute(['/cases/jonas-brandt'])
  fireEvent.click(screen.getByText('Start preparing'))
  expect(screen.getByLabelText('Refund estimate')).toHaveValue('€1,286')
  fireEvent.click(screen.getByText('Send to Betina for approval'))
  expect(screen.getByText(/Waiting for Betina to approve/)).toBeInTheDocument()
})

test('quick-reply click answers a client question', () => {
  // jonas-brandt is seeded with an open consumer question already, no need
  // to drive the store directly to set one up.
  renderRoute(['/cases/jonas-brandt'])
  expect(screen.getByText('Can I still add a receipt I forgot about?')).toBeInTheDocument()
  fireEvent.click(screen.getByText(/Yes, this applies to you/))
  expect(screen.queryByText('Can I still add a receipt I forgot about?')).not.toBeInTheDocument()
})

test('requesting another document adds a row to the checklist table', () => {
  renderRoute(['/cases/sabine-hoffmann'])
  fireEvent.change(screen.getByLabelText('Document title'), {
    target: { value: 'Health insurance certificate' },
  })
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'deductions' } })
  fireEvent.change(screen.getByLabelText('One-line explainer'), {
    target: { value: 'Confirms your private health insurance contributions.' },
  })
  fireEvent.click(screen.getByText('Request document'))
  const table = screen.getByRole('table')
  expect(within(table).getByText('Health insurance certificate')).toBeInTheDocument()
})

test('flag preset chip + Confirm flags an item with the preset as its note', () => {
  renderRoute(['/cases/sabine-hoffmann']) // tax-id is the only seeded 'uploaded' item
  fireEvent.click(screen.getByText('Flag issue'))
  fireEvent.click(screen.getByText('Wrong document'))
  fireEvent.click(screen.getByText('Confirm'))
  expect(screen.getByText('Needs attention')).toBeInTheDocument()
  expect(screen.getByText('Flagged: Wrong document')).toBeInTheDocument()
})

test('case notes textarea carries the calm empty-notes placeholder', () => {
  renderRoute(['/cases/sabine-hoffmann'])
  expect(
    screen.getByPlaceholderText('No notes yet, anything worth remembering about this client?'),
  ).toBeInTheDocument()
})

test('accepting the incoming request adds a workable case: it shows in the cases table, and its checklist renders "To share" items', () => {
  renderRoute(['/'])
  fireEvent.click(screen.getByText('Accept'))

  fireEvent.click(screen.getByRole('link', { name: /Cases/ }))
  expect(screen.getByText('Lena Fischer')).toBeInTheDocument()

  fireEvent.click(screen.getByText('Lena Fischer'))
  expect(screen.getAllByText('To share').length).toBeGreaterThan(0)
})

// Route-relative navigation bug (same class fixed in CasesTable's row-open
// navigate call): InboxView is mounted at route path "inbox", a sibling of
// "cases/:id", a bare `to="cases/id"` Link route-relative-resolves against
// the matched "/inbox" base, landing on the dead route "/inbox/cases/id".
// This drives the click from the real /inbox route (not an isolated render)
// so the bug, and the fix, are actually exercised.
test('clicking "Open case" from the live inbox route opens the right case detail', () => {
  renderRoute(['/inbox'])
  // tobias-wagner is the oldest "waiting on client" entry in the seed, so its
  // row (and "Open case" link) sorts first.
  const tobiasRow = screen.getByText('Tobias Wagner').closest('li') as HTMLElement
  fireEvent.click(within(tobiasRow).getByRole('link', { name: /open case/i }))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tobias Wagner')
})

// Same route-relative bug class, found while auditing: ClientsView is
// mounted at route path "clients", so its "Open case" Sheet link had the
// same "cases/id" (rather than "../cases/id") mistake.
test('clicking "Open case" from a client\'s detail sheet on the live clients route opens the right case detail', () => {
  renderRoute(['/clients'])
  fireEvent.click(screen.getByText('Priya Nair'))
  fireEvent.click(screen.getByRole('link', { name: /open case/i }))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Priya Nair')
})

test('document preview opens and Verify from the modal works', () => {
  // sabine-hoffmann's tax-id item is seeded 'uploaded' with a filename already.
  renderRoute(['/cases/sabine-hoffmann'])
  fireEvent.click(screen.getByRole('button', { name: 'Preview Your tax ID' }))
  const sheet = document.querySelector('.tf-sheet') as HTMLElement
  expect(within(sheet).getByText('steuer-id-letter.jpg')).toBeInTheDocument()
  fireEvent.click(within(sheet).getByText('Verify ✓'))
  const table = screen.getByRole('table')
  const row = within(table).getByText('Your tax ID').closest('tr') as HTMLElement
  expect(within(row).getByText('Checked ✓')).toBeInTheDocument()
})
