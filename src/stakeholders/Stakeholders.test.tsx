import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CaseStoreProvider } from '../store/CaseStore'
import { Stakeholders } from './Stakeholders'

function renderAt(path = '/stakeholders') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CaseStoreProvider>
        <Stakeholders />
      </CaseStoreProvider>
    </MemoryRouter>,
  )
}

test('renders both personas with name and situation', () => {
  renderAt()
  expect(screen.getByRole('heading', { name: 'Betina Bugnotto' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Anna Weber' })).toBeInTheDocument()
  expect(screen.getByText('Tax advisor · 41 · Leipzig')).toBeInTheDocument()
  expect(screen.getByText('Filer · 33 · Berlin')).toBeInTheDocument()
})

test('offline (test env): composer is disabled and the amber status shows', () => {
  renderAt()
  expect(screen.getByLabelText('Ask Betina')).toBeDisabled()
  expect(screen.getAllByText(/Server is offline/)).toHaveLength(2) // one status line per column; the composer placeholder no longer repeats it
})

test('Sources opens a drawer with the disclaimer and at least one link', () => {
  renderAt()
  const amara = screen.getByLabelText('Betina Bugnotto interview')
  fireEvent.click(within(amara).getByRole('button', { name: 'Sources' }))
  const drawer = screen.getByLabelText('Betina Bugnotto sources')
  expect(drawer).toHaveTextContent('Composite persona')
  expect(within(drawer).getAllByRole('link').length).toBeGreaterThan(0)
})

test('?embed=1 hides the page header', () => {
  renderAt('/stakeholders?embed=1')
  expect(screen.queryByText('Talking to both sides')).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Betina Bugnotto' })).toBeInTheDocument()
})
