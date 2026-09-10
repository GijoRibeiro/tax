import { render, screen, fireEvent, act, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { CaseStoreProvider } from '../../store/CaseStore'
import { WorkspaceProvider, useWorkspace } from '../workspace/WorkspaceStore'
import { seedWorkspace, SEED_TODAY } from '../workspace/seedWorkspace'
import { needsAttention, inboxItems } from '../workspace/selectors'
import { Today } from '../views/Today'
import { CasesTable } from '../views/CasesTable'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { AdvisorApp } from '../AdvisorApp'

type Ws = ReturnType<typeof useWorkspace>

function Probe({ onReady }: { onReady: (ws: Ws) => void }) {
  const ws = useWorkspace()
  onReady(ws)
  return null
}

// Mirrors AdvisorApp's actual nesting. Sidebar/Topbar rendered as siblings
// of an inner <Routes>, both under an outer "/advisor/*" Route, rather than
// mounting them at the MemoryRouter root. Sidebar/Topbar use absolute
// "/advisor/…" links (see Sidebar.tsx), so a root-mounted harness here would
// silently pass while the real app 404s; this shape is what caught that bug.
function AdvisorShellStub() {
  return (
    <>
      <Sidebar />
      <Topbar />
      <Routes>
        <Route index element={<Today today={SEED_TODAY} />} />
        <Route path="cases" element={<CasesTable today={SEED_TODAY} />} />
        <Route path="inbox" element={<p>Inbox stub</p>} />
        <Route path="clients" element={<p>Clients stub</p>} />
        <Route path="settings" element={<p>Settings stub</p>} />
      </Routes>
    </>
  )
}

function renderShell(initialPath: string = '/advisor') {
  let latest!: Ws
  const utils = render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CaseStoreProvider url={null}>
        <WorkspaceProvider>
          <Probe onReady={ws => { latest = ws }} />
          <Routes>
            <Route path="/advisor/*" element={<AdvisorShellStub />} />
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

// --- Sidebar -------------------------------------------------------------

test('sidebar inbox badge matches the needs-reply count', () => {
  renderShell()
  const expected = inboxItems(seedWorkspace()).filter(i => i.group === 'needs-reply').length
  const inboxLink = screen.getByRole('link', { name: /Inbox/ })
  expect(within(inboxLink).getByText(String(expected))).toBeInTheDocument()
})

test('sidebar cases badge matches the needs-attention case count', () => {
  renderShell()
  const expected = new Set(needsAttention(seedWorkspace()).map(i => i.caseId)).size
  const casesLink = screen.getByRole('link', { name: /Cases/ })
  expect(within(casesLink).getByText(String(expected))).toBeInTheDocument()
})

test('sidebar highlights the active route', () => {
  renderShell('/advisor/cases')
  expect(screen.getByRole('link', { name: /Cases/ })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: /^Today/ })).not.toHaveAttribute('aria-current')
})

// Regression: Sidebar links used to be route-relative ("cases", "inbox", …),
// which resolve against whatever the *current* URL is rather than "/advisor"
//, clicking a link from anywhere but Today landed on a dead nested route
// (e.g. "/advisor/cases/inbox" → case-detail's "not found" state).
test('clicking Inbox from the Cases route lands on the inbox, not a dead nested route', () => {
  renderShell('/advisor/cases')
  fireEvent.click(screen.getByRole('link', { name: /Inbox/ }))
  expect(screen.getByText('Inbox stub')).toBeInTheDocument()
})

test("sidebar Anna dot reflects acceptingNewCases", () => {
  const { getWs } = renderShell()
  expect(screen.getByTitle('Accepting new cases')).toBeInTheDocument()

  act(() => {
    getWs().updateSettings({ acceptingNewCases: false })
  })

  expect(screen.getByTitle('Not accepting new cases')).toBeInTheDocument()
})

// --- ConnectionPip ---------------------------------------------------------

test('connection pip shows amber offline state in test env', () => {
  renderShell()
  expect(screen.getByText('Live sync offline, retrying')).toBeInTheDocument()
})

// --- NotificationMenu -------------------------------------------------------

test('bell count matches needsAttention filtered by default (all-on) prefs', () => {
  renderShell()
  const expected = needsAttention(seedWorkspace()).length
  expect(screen.getByTestId('notif-count')).toHaveTextContent(String(expected))
})

test('notification dropdown lists rows linking to cases, empty when filtered to zero', () => {
  const { getWs } = renderShell()
  fireEvent.click(screen.getByRole('button', { name: /Notifications/ }))
  const menu = screen.getByRole('menu')
  const first = needsAttention(seedWorkspace())[0]
  expect(within(menu).getByText(first.client)).toBeInTheDocument()

  act(() => {
    getWs().updateSettings({ notifyClientUploads: false, notifyQuestions: false, notifyApprovals: false })
  })

  expect(screen.queryByTestId('notif-count')).not.toBeInTheDocument()
  expect(within(screen.getByRole('menu')).getByText('Nothing new.')).toBeInTheDocument()
})

test('clicking outside the notification dropdown closes it', () => {
  renderShell()
  fireEvent.click(screen.getByRole('button', { name: /Notifications/ }))
  expect(screen.getByRole('menu')).toBeInTheDocument()

  fireEvent.mouseDown(document.body)

  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('Escape closes the notification dropdown and returns focus to the bell', () => {
  renderShell()
  const bell = screen.getByRole('button', { name: /Notifications/ })
  fireEvent.click(bell)
  expect(screen.getByRole('menu')).toBeInTheDocument()

  fireEvent.keyDown(document, { key: 'Escape' })

  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(document.activeElement).toBe(bell)
})

// Regression: the bell dropdown's row Link used to be route-relative
// ("cases/:id"), which resolves against whatever the *current* URL is rather
// than "/advisor", opening a notification from anywhere but Today landed on
// a dead nested route. Drives this through the real AdvisorApp route tree
// (mirroring AdvisorApp.test.tsx's renderRoute pattern) rather than the
// AdvisorShellStub above, since the stub has no "cases/:id" route to land on.
test('clicking a notification row from a non-Today route navigates to that case detail', () => {
  render(
    <MemoryRouter initialEntries={['/advisor/inbox']}>
      <CaseStoreProvider url={null}>
        <Routes>
          <Route path="/advisor/*" element={<AdvisorApp />} />
        </Routes>
      </CaseStoreProvider>
    </MemoryRouter>,
  )

  const first = needsAttention(seedWorkspace())[0]
  fireEvent.click(screen.getByRole('button', { name: /Notifications/ }))
  const menu = screen.getByRole('menu')
  const row = within(menu).getByText(first.client).closest('a') as HTMLElement
  fireEvent.click(row)

  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(first.client)
})

test('toggling notifyQuestions off drops question-kind items from the bell count', () => {
  const { getWs } = renderShell()
  const all = needsAttention(seedWorkspace())
  const withoutQuestions = all.filter(i => i.kind !== 'question')
  expect(all.length).not.toBe(withoutQuestions.length) // sanity: seed has at least one question item

  act(() => {
    getWs().updateSettings({ notifyQuestions: false })
  })

  expect(screen.getByTestId('notif-count')).toHaveTextContent(String(withoutQuestions.length))
})

// --- Global search ("/" focus + Enter navigate) -----------------------------

test('"/" focuses the topbar search input', () => {
  renderShell()
  fireEvent.keyDown(document, { key: '/' })
  expect(document.activeElement).toBe(screen.getByLabelText('Search clients'))
})

test('"/" is ignored while typing in another input', () => {
  renderShell('/advisor/inbox')
  const search = screen.getByLabelText('Search clients') as HTMLInputElement
  // Give focus to some other element first.
  search.blur()
  const decoy = document.createElement('input')
  document.body.appendChild(decoy)
  decoy.focus()

  fireEvent.keyDown(decoy, { key: '/' })
  expect(document.activeElement).toBe(decoy)
  document.body.removeChild(decoy)
})

test('Enter in the search box navigates to cases with the query', () => {
  renderShell()
  const search = screen.getByLabelText('Search clients')
  fireEvent.change(search, { target: { value: 'Jonas' } })
  fireEvent.keyDown(search, { key: 'Enter' })

  expect(screen.getByRole('heading', { name: 'Cases' })).toBeInTheDocument()
  expect(screen.getByLabelText('Search clients')).toHaveValue('Jonas')
})

// Regression: Topbar's navigate() call used to be route-relative ("cases?q=…"),
// which resolves against whatever the *current* URL is rather than "/advisor".
// searching from anywhere other than Today landed on a dead nested route (e.g.
// "/advisor/inbox/cases?q=…"). Drives the search from a non-Today route to
// exercise that.
test('Enter in the search box navigates to cases with the query from a non-Today route', () => {
  renderShell('/advisor/inbox')
  const search = screen.getByLabelText('Search clients')
  fireEvent.change(search, { target: { value: 'Jonas' } })
  fireEvent.keyDown(search, { key: 'Enter' })

  expect(screen.getByRole('heading', { name: 'Cases' })).toBeInTheDocument()
  expect(screen.getByLabelText('Search clients')).toHaveValue('Jonas')
})
