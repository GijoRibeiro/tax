import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CaseStoreProvider } from '../../store/CaseStore'
import { WorkspaceProvider, useWorkspace, STORAGE_KEY } from '../workspace/WorkspaceStore'
import { ClientsView } from './ClientsView'

type Ws = ReturnType<typeof useWorkspace>

function Probe({ onReady }: { onReady: (ws: Ws) => void }) {
  const ws = useWorkspace()
  onReady(ws)
  return null
}

function renderClients(path = '/advisor/clients') {
  let latest!: Ws
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <CaseStoreProvider url={null}>
        <WorkspaceProvider>
          <Probe onReady={ws => { latest = ws }} />
          <ClientsView />
        </WorkspaceProvider>
      </CaseStoreProvider>
    </MemoryRouter>,
  )
  return { ...utils, getWs: () => latest }
}

beforeEach(() => {
  localStorage.clear()
})

test('lists clients with name, city, language and joined year', () => {
  renderClients()
  const row = screen.getByText('Priya Nair').closest('[data-testid="clients-row"]') as HTMLElement
  expect(within(row).getByText(/Berlin/)).toBeInTheDocument()
  expect(within(row).getByText(/EN/)).toBeInTheDocument()
})

test('searching narrows the client list', () => {
  renderClients('/advisor/clients?q=Priya')
  const rows = screen.getAllByTestId('clients-row')
  expect(rows.length).toBe(1)
  expect(within(rows[0]).getByText('Priya Nair')).toBeInTheDocument()
})

test('clicking a client opens a detail panel with contact info and an Open case link', () => {
  renderClients()
  fireEvent.click(screen.getByText('Jonas Brandt'))
  expect(screen.getByText(/jonas\.brandt@example\.com/)).toBeInTheDocument()
  const link = screen.getByRole('link', { name: /open case/i })
  expect(link.getAttribute('href')).toContain('jonas-brandt')
})

test('filing history renders seeded lines for a returning client', () => {
  renderClients()
  fireEvent.click(screen.getByText('Jonas Brandt'))
  expect(screen.getByText('2024 · Filed · €890 refunded')).toBeInTheDocument()
})

test('first-time filer shows an empty filing history message', () => {
  renderClients()
  fireEvent.click(screen.getByText('Priya Nair'))
  expect(screen.getByText(/first-time filer/i)).toBeInTheDocument()
})

test('notes textarea carries the calm empty-notes placeholder', () => {
  renderClients()
  fireEvent.click(screen.getByText('Priya Nair'))
  expect(
    screen.getByPlaceholderText('No notes yet, anything worth remembering about this client?'),
  ).toBeInTheDocument()
})

test('searching for a client with no matches shows a calm no-results message', () => {
  renderClients('/advisor/clients?q=zzz-no-such-client')
  expect(screen.getByText('No clients match “zzz-no-such-client”.')).toBeInTheDocument()
  expect(screen.queryAllByTestId('clients-row').length).toBe(0)
})

test('editing notes and blurring saves via updateNotes', () => {
  renderClients()
  fireEvent.click(screen.getByText('Priya Nair'))
  const textarea = screen.getByLabelText('Notes')
  fireEvent.change(textarea, { target: { value: 'Called about missing Steuer-ID.' } })
  fireEvent.blur(textarea)

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  expect(stored.cases['priya-nair'].client.notes).toBe('Called about missing Steuer-ID.')
})
