import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CaseStoreProvider } from '../store/CaseStore'
import { Hub } from './Hub'

function renderHub() {
  render(<MemoryRouter><CaseStoreProvider><Hub /></CaseStoreProvider></MemoryRouter>)
}

test('hub renders personas and flow map nodes', () => {
  renderHub()
  expect(screen.getByText('Betina Bugnotto')).toBeInTheDocument()
  expect(screen.getByText('Anna Weber, 41')).toBeInTheDocument()
  expect(screen.getAllByText(/is anyone actually there/).length).toBeGreaterThan(0)
})

test('token editor changes a css variable live', () => {
  renderHub()
  fireEvent.change(screen.getByLabelText(/^Lime/), { target: { value: '#123456' } })
  expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#123456')
})

test('hub explains the one-reducer architecture and the native flow map phases', () => {
  renderHub()
  expect(screen.getByRole('heading', { level: 2, name: 'How it is built' })).toBeInTheDocument()
  expect(screen.getByText('Onboarding runway')).toBeInTheDocument()
  expect(screen.getByText('The hand-off (the deep slice)')).toBeInTheDocument()
  expect(screen.getByText('Completion loop')).toBeInTheDocument()
})

test('hub has a references section documenting patterns borrowed and rejected', () => {
  renderHub()
  expect(screen.getByRole('heading', { level: 2, name: 'References' })).toBeInTheDocument()
  expect(screen.getByText(/refund-as-hero|Refund as the hero/i)).toBeInTheDocument()
})

test('references section visually flags the rejected TurboTax pattern', () => {
  renderHub()
  const rejectedTags = screen.getAllByText('Rejected')
  expect(rejectedTags.length).toBeGreaterThan(0)
  expect(screen.getByText(/upsell interstitials/i)).toBeInTheDocument()
})

test('ai log documents the persona-agent review method and findings', () => {
  renderHub()
  expect(screen.getByText('Persona-agent reviews')).toBeInTheDocument()
  expect(screen.getByText(/Warmth is not the same thing as trust/)).toBeInTheDocument()
})

test('ai log summarizes how the build process worked and points to docs/PROCESS.md', () => {
  renderHub()
  expect(screen.getByText('How this was built')).toBeInTheDocument()
  expect(screen.getByText(/docs\/PROCESS\.md/)).toBeInTheDocument()
})

test('hub has an edge cases section with the shipped-behaviors table and a nav link', () => {
  renderHub()
  expect(screen.getByRole('heading', { level: 2, name: 'Edge cases' })).toBeInTheDocument()
  expect(screen.getByText('Relay offline (technical failure)')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Edge cases' })).toBeInTheDocument()
})


// Regression for the nav-embed bug: AdvisorAppPreview renders the whole
// AdvisorApp inline under the hub's own route tree, and AdvisorApp's
// Sidebar uses absolute paths like "/advisor/cases". Without its own nested
// MemoryRouter, clicking that link navigated the entire page away from the
// hub instead of just switching the embedded preview's view.
