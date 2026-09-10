import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TOKEN_DEFS, resetTokens } from '../design/tokens'
import { CaseStoreProvider } from '../store/CaseStore'
import { TokenEditor } from './TokenEditor'

afterEach(() => {
  resetTokens()
})

test('token editor writes css variable through the store when offline', () => {
  render(<MemoryRouter><CaseStoreProvider><TokenEditor /></CaseStoreProvider></MemoryRouter>)
  fireEvent.change(screen.getByLabelText(/^Lime/), { target: { value: '#123456' } })
  expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#123456')
})

test('reset clears the css variable and resyncs the control to the default value', () => {
  render(<MemoryRouter><CaseStoreProvider><TokenEditor /></CaseStoreProvider></MemoryRouter>)

  fireEvent.change(screen.getByLabelText(/^Lime/), { target: { value: '#123456' } })
  expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#123456')

  fireEvent.click(screen.getByText('Back to Taxfix tokens'))

  expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('')
  const primaryDefault = TOKEN_DEFS.find(t => t.cssVar === '--color-primary')!.value
  expect(screen.getByLabelText(/^Lime/)).toHaveValue(primaryDefault)
})
