import { render, screen, act, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CaseStoreProvider } from '../../store/CaseStore'
import { WorkspaceProvider, useWorkspace, STORAGE_KEY } from '../workspace/WorkspaceStore'
import { seedWorkspace, SEED_TODAY } from '../workspace/seedWorkspace'
import { workloadCounts } from '../workspace/selectors'
import { NUDGE_MESSAGE } from '../nudge'
import { Today } from './Today'

type Ws = ReturnType<typeof useWorkspace>

function Probe({ onReady }: { onReady: (ws: Ws) => void }) {
  const ws = useWorkspace()
  onReady(ws)
  return null
}

function renderToday(today: string = SEED_TODAY) {
  let latest!: Ws
  const utils = render(
    <MemoryRouter>
      <CaseStoreProvider url={null}>
        <WorkspaceProvider>
          <Probe onReady={ws => { latest = ws }} />
          <Today today={today} />
        </WorkspaceProvider>
      </CaseStoreProvider>
    </MemoryRouter>,
  )
  return { ...utils, getWs: () => latest }
}

beforeEach(() => {
  localStorage.clear()
})

test('stat tiles match workloadCounts(seedWorkspace())', () => {
  renderToday()
  const counts = workloadCounts(seedWorkspace())
  expect(screen.getByText('Open cases').previousSibling).toHaveTextContent(String(counts.open))
  expect(screen.getByText('Waiting on clients').previousSibling).toHaveTextContent(String(counts.waiting))
  expect(screen.getByText('Ready to work').previousSibling).toHaveTextContent(String(counts.ready))
  expect(screen.getByText('Filed this season').previousSibling).toHaveTextContent(String(counts.filed))
})

test('a needs-attention row links to its case', () => {
  renderToday()
  const links = screen.getAllByRole('link')
  const caseLinks = links.filter(l => (l.getAttribute('href') ?? '').includes('/cases/'))
  expect(caseLinks.length).toBeGreaterThan(0)
})

test('needs-attention rows count matches the selector', async () => {
  const { needsAttention } = await import('../workspace/selectors')
  renderToday()
  const expected = needsAttention(seedWorkspace())
  const links = screen.getAllByRole('link').filter(l => (l.getAttribute('href') ?? '').includes('/cases/'))
  expect(links.length).toBe(expected.length)
})

test('incoming request card renders when accepting new cases and there is a request', () => {
  renderToday()
  expect(screen.getByText('Accept')).toBeInTheDocument()
  expect(screen.getByText('Decline')).toBeInTheDocument()
})

test('incoming request card is hidden once acceptingNewCases is turned off', () => {
  const { getWs } = renderToday()
  expect(screen.getByText('Accept')).toBeInTheDocument()
  act(() => {
    getWs().updateSettings({ acceptingNewCases: false })
  })
  expect(screen.queryByText('Accept')).not.toBeInTheDocument()
})

test('accepting the incoming request calls acceptRequest and removes the card', () => {
  const { getWs } = renderToday()
  act(() => {
    getWs().acceptRequest()
  })
  expect(screen.queryByText('Accept')).not.toBeInTheDocument()
})

test('declining opens a confirm Dialog; cancelling leaves the request card in place', () => {
  const { getWs } = renderToday()
  fireEvent.click(screen.getByText('Decline'))

  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getByText('Decline this case?')).toBeInTheDocument()
  expect(within(dialog).getByText('Taxfix will route it to another advisor.')).toBeInTheDocument()

  fireEvent.click(screen.getByText('Cancel'))
  expect(screen.getByText('Accept')).toBeInTheDocument()
  expect(getWs().ws.incomingRequest).toBeDefined()
})

test('confirming the decline Dialog calls declineRequest and removes the card', () => {
  const { getWs } = renderToday()
  fireEvent.click(screen.getByText('Decline'))

  const dialog = screen.getByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Decline' }))

  expect(screen.queryByText('Accept')).not.toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(getWs().ws.incomingRequest).toBeUndefined()
})

test('recent activity shows "No activity yet today." when the workspace has no activity', () => {
  const empty = { ...seedWorkspace(), activity: [] }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(empty))

  renderToday()
  expect(screen.getByText('No activity yet today.')).toBeInTheDocument()
  expect(screen.queryAllByTestId('today-activity-row').length).toBe(0)
})

test('activity feed renders 8 rows max', () => {
  renderToday()
  const rows = screen.getAllByTestId('today-activity-row')
  expect(rows.length).toBe(8)
})

test('deadline strip shows an "At risk" heading', () => {
  renderToday()
  expect(screen.getByText('At risk')).toBeInTheDocument()
})

test('greeting is time-of-day aware', () => {
  const { unmount } = renderToday('2026-09-01T08:00:00.000Z')
  expect(screen.getByText('Good morning, Anna')).toBeInTheDocument()
  unmount()

  renderToday('2026-09-01T15:00:00.000Z')
  expect(screen.getByText('Good afternoon, Anna')).toBeInTheDocument()
})

test('sub-line reports the deadline has passed once 31 July is behind today', () => {
  renderToday(SEED_TODAY) // 2026-09-01, well after 31 July
  expect(screen.getByText('31 July has passed; advised returns run to 30 April 2027')).toBeInTheDocument()
})

test('sub-line counts down in weeks before the deadline', () => {
  renderToday('2026-07-01T12:00:00.000Z')
  expect(screen.getByText(/31 July is in \d+ weeks?/)).toBeInTheDocument()
})

test('a stalled row in "At risk" shows Send a nudge, which dispatches the exact nudge message', () => {
  // sabine-hoffmann is stalled at SEED_TODAY (see workspace/selectors + seed comments).
  const { getWs } = renderToday()
  const stalledRow = screen.getByText('Stalled').closest('li') as HTMLElement
  fireEvent.click(within(stalledRow).getByText('Send a nudge'))

  const followUps = getWs().ws.cases['sabine-hoffmann'].state.followUps
  expect(followUps.some(fu => fu.from === 'advisor' && fu.message === NUDGE_MESSAGE)).toBe(true)
})
