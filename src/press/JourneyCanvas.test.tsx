import { render, screen, fireEvent } from '@testing-library/react'
import { JourneyCanvas } from './JourneyCanvas'
import { JOURNEYS, JOURNEY_TABS } from './journey'

test('every edge points at a known node and ids are unique per flow', () => {
  for (const tab of JOURNEY_TABS) {
    const flow = JOURNEYS[tab]
    const ids = flow.nodes.map(n => n.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const e of flow.edges) {
      expect(ids).toContain(e.from)
      expect(ids).toContain(e.to)
    }
  }
})

test('renders the customer journey by default with a card per step', () => {
  render(<JourneyCanvas />)
  expect(screen.getByRole('tab', { name: "Betina's journey" })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('button', { name: /^Welcome: open step/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^Filed: open step/ })).toBeInTheDocument()
})

test('switching tabs shows the advisor workspace', () => {
  render(<JourneyCanvas />)
  fireEvent.click(screen.getByRole('tab', { name: "Anna's workspace" }))
  expect(screen.getByRole('button', { name: /^Today: open step/ })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /^Welcome: open step/ })).not.toBeInTheDocument()
})

test('clicking a step opens the preview with what the other side sees, Esc closes it', () => {
  render(<JourneyCanvas />)
  fireEvent.click(screen.getByRole('button', { name: /^Case home: open step/ }))
  const panel = screen.getByLabelText('Case home step')
  expect(panel).toHaveTextContent('Meanwhile, Anna')
  expect(panel).toHaveTextContent(/waiting on client/)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(screen.queryByLabelText('Case home step')).not.toBeInTheDocument()
})
