import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from './main'
import { CaseStoreProvider } from './store/CaseStore'

test('/ renders the landing page with the four doors', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <CaseStoreProvider>
        <AppRoutes />
      </CaseStoreProvider>
    </MemoryRouter>
  )
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('@Gijo Ribeiro')
  for (const door of ['Presentation', 'iOS native app', 'Advisor dashboard', 'Specs']) {
    expect(screen.getByText(door)).toBeInTheDocument()
  }
})

test('/hub renders the hub', () => {
  render(
    <MemoryRouter initialEntries={['/hub']}>
      <CaseStoreProvider>
        <AppRoutes />
      </CaseStoreProvider>
    </MemoryRouter>
  )
  expect(screen.getByText('The Hand-off Moment')).toBeInTheDocument()
})

test('/advisor renders the advisor app', () => {
  render(
    <MemoryRouter initialEntries={['/advisor']}>
      <CaseStoreProvider>
        <AppRoutes />
      </CaseStoreProvider>
    </MemoryRouter>
  )
  expect(screen.getByText(/^Good (morning|afternoon|evening), Anna$/)).toBeInTheDocument()
})

test('/app no longer matches a route', () => {
  render(
    <MemoryRouter initialEntries={['/app']}>
      <CaseStoreProvider>
        <AppRoutes />
      </CaseStoreProvider>
    </MemoryRouter>
  )
  expect(screen.queryByText('Your tax return 2025')).not.toBeInTheDocument()
})
