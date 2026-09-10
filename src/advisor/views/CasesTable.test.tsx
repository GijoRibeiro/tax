import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CaseStoreProvider } from '../../store/CaseStore'
import { WorkspaceProvider, useWorkspace } from '../workspace/WorkspaceStore'
import { seedWorkspace, SEED_TODAY } from '../workspace/seedWorkspace'
import { CasesTable, caseBucket } from './CasesTable'

type Ws = ReturnType<typeof useWorkspace>

function Probe({ onReady }: { onReady: (ws: Ws) => void }) {
  const ws = useWorkspace()
  onReady(ws)
  return null
}

function renderTable(today: string = SEED_TODAY, path = '/advisor/cases') {
  let latest!: Ws
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <CaseStoreProvider url={null}>
        <WorkspaceProvider>
          <Probe onReady={ws => { latest = ws }} />
          <CasesTable today={today} />
        </WorkspaceProvider>
      </CaseStoreProvider>
    </MemoryRouter>,
  )
  return { ...utils, getWs: () => latest }
}

beforeEach(() => {
  localStorage.clear()
})

function bucketCount(bucket: ReturnType<typeof caseBucket>) {
  return Object.values(seedWorkspace().cases).filter(c => caseBucket(c) === bucket).length
}

test('filter pills show live counts matching the seed', () => {
  renderTable()
  expect(screen.getByRole('button', { name: `Waiting on client (${bucketCount('waiting')})` })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: `Blocked (${bucketCount('blocked')})` })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: `Ready (${bucketCount('ready')})` })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: `In review (${bucketCount('review')})` })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: `Done (${bucketCount('done')})` })).toBeInTheDocument()
})

test('clicking a filter pill narrows the rows to that bucket', () => {
  renderTable()
  fireEvent.click(screen.getByRole('button', { name: /^Blocked/ }))
  const rows = screen.getAllByTestId('cases-row')
  expect(rows.length).toBe(bucketCount('blocked'))
  expect(screen.getByText('Tobias Wagner')).toBeInTheDocument()
  expect(screen.queryByText('Priya Nair')).not.toBeInTheDocument()
})

test('sorting by name orders rows alphabetically with Betina pinned first', () => {
  renderTable()
  fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'name' } })
  const names = screen.getAllByTestId('cases-name').map(el => el.textContent)
  expect(names[0]).toBe('Betina Bugnotto')
  const rest = names.slice(1)
  const expectedRest = [...rest].sort((a, b) => (a ?? '').localeCompare(b ?? ''))
  expect(rest).toEqual(expectedRest)
})

test('searching "Priya" leaves exactly one row', () => {
  renderTable(SEED_TODAY, '/advisor/cases?q=Priya')
  const rows = screen.getAllByTestId('cases-row')
  expect(rows.length).toBe(1)
  expect(within(rows[0]).getByText('Priya Nair')).toBeInTheDocument()
})

test('row click marks the case read', () => {
  const { getWs } = renderTable()
  expect(getWs().ws.cases['priya-nair'].unread).toBe(true)
  fireEvent.click(screen.getByText('Priya Nair'))
  expect(getWs().ws.cases['priya-nair'].unread).toBe(false)
})

test('Betina is pinned first by default and carries the "Live demo" badge', () => {
  renderTable()
  const names = screen.getAllByTestId('cases-name')
  expect(names[0]).toHaveTextContent('Betina Bugnotto')
  expect(screen.getByText('Live demo')).toBeInTheDocument()
})

test('unread dot renders only for unread cases', () => {
  renderTable()
  const priyaRow = screen.getByText('Priya Nair').closest('tr') as HTMLElement
  const sabineRow = screen.getByText('Sabine Hoffmann').closest('tr') as HTMLElement
  expect(within(priyaRow).getByTestId('unread-dot')).toBeInTheDocument()
  expect(within(sabineRow).queryByTestId('unread-dot')).not.toBeInTheDocument()
})

test('empty filter result shows the calm empty state with a clear-filters action', () => {
  renderTable(SEED_TODAY, '/advisor/cases?q=zzz-no-such-client')
  expect(screen.getByText('No cases here, nice.')).toBeInTheDocument()
  expect(screen.queryAllByTestId('cases-row').length).toBe(0)

  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
  const total = Object.keys(seedWorkspace().cases).length
  expect(screen.getAllByTestId('cases-row').length).toBe(total)
})

test('a filed case reads "Filed" in its deadline cell with no overdue copy; approved and on-hold read calmly too', () => {
  renderTable()

  const filedRow = screen.getByText('Ingrid Sorensen').closest('tr') as HTMLElement
  const filedCell = within(filedRow).getByTestId('deadline-cell')
  expect(filedCell).toHaveTextContent('Filed')
  expect(filedCell.textContent).not.toContain('passed')
  expect(filedCell).toHaveClass('tf-cases-deadline--calm')

  const approvedRow = screen.getByText('Felix Braun').closest('tr') as HTMLElement
  const approvedCell = within(approvedRow).getByTestId('deadline-cell')
  expect(approvedCell).toHaveTextContent('Approved · ready to file')
  expect(approvedCell).toHaveClass('tf-cases-deadline--calm')

  const onHoldRow = screen.getByText('Greta Lindqvist').closest('tr') as HTMLElement
  const onHoldCell = within(onHoldRow).getByTestId('deadline-cell')
  expect(onHoldCell).toHaveTextContent('–')
  expect(onHoldCell).toHaveClass('tf-cases-deadline--calm')
})

test('CasesTable renders "On hold" and "Extension filed" status chips from the seed', () => {
  renderTable()

  const onHoldRow = screen.getByText('Greta Lindqvist').closest('tr') as HTMLElement
  expect(within(onHoldRow).getByText('On hold')).toBeInTheDocument()

  const extensionRow = screen.getByText('Mateo Alvarez').closest('tr') as HTMLElement
  expect(within(extensionRow).getByText('Extension filed')).toBeInTheDocument()
})
