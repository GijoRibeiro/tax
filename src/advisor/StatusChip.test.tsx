import { render, screen } from '@testing-library/react'
import { seedWorkspace } from './workspace/seedWorkspace'
import { StatusChip } from './StatusChip'

function caseFor(id: string) {
  const c = seedWorkspace().cases[id]
  if (!c) throw new Error(`no seeded case ${id}`)
  return c
}

test('on-hold special always renders "On hold" regardless of underlying status', () => {
  render(<StatusChip c={caseFor('greta-lindqvist')} />)
  expect(screen.getByText('On hold')).toHaveClass('tf-advisor-chip--neutral')
})

test('extension-filed special renders a warning chip even though the case is filed', () => {
  render(<StatusChip c={caseFor('mateo-alvarez')} />)
  expect(screen.getByText('Extension filed')).toHaveClass('tf-advisor-chip--warning')
})

test('filed renders a success chip', () => {
  render(<StatusChip c={caseFor('ingrid-sorensen')} />)
  expect(screen.getByText('Filed')).toHaveClass('tf-advisor-chip--success')
})

test('approved renders a success chip', () => {
  render(<StatusChip c={caseFor('felix-braun')} />)
  expect(screen.getByText('Approved')).toHaveClass('tf-advisor-chip--success')
})

test('awaiting_approval renders "In review"', () => {
  render(<StatusChip c={caseFor('marco-rossi')} />)
  expect(screen.getByText('In review')).toHaveClass('tf-advisor-chip--neutral')
})

test('preparing renders a neutral "Preparing" chip', () => {
  render(<StatusChip c={caseFor('bjorn-larsen')} />)
  expect(screen.getByText('Preparing')).toHaveClass('tf-advisor-chip--neutral')
})

test('ready_to_work renders a success chip', () => {
  render(<StatusChip c={caseFor('jonas-brandt')} />)
  expect(screen.getByText('Ready to work')).toHaveClass('tf-advisor-chip--success')
})

test('waiting_on_client with an open advisor follow-up renders "Blocked, asked client"', () => {
  render(<StatusChip c={caseFor('tobias-wagner')} />)
  expect(screen.getByText('Blocked, asked client')).toHaveClass('tf-advisor-chip--warning')
})

test('waiting_on_client with no open advisor follow-up renders "Waiting on client"', () => {
  render(<StatusChip c={caseFor('priya-nair')} />)
  expect(screen.getByText('Waiting on client')).toHaveClass('tf-advisor-chip--neutral')
})

test('everything filled but not yet sent renders "Filled, not sent yet"', () => {
  const c = caseFor('jonas-brandt')
  render(<StatusChip c={{ ...c, state: { ...c.state, submittedAt: undefined } }} />)
  expect(screen.getByText('Filled, not sent yet')).toHaveClass('tf-advisor-chip--neutral')
})
