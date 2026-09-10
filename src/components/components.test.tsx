import { render, screen } from '@testing-library/react'
import { StatusPill } from './StatusPill'
import { ChecklistItemRow } from './ChecklistItemRow'
import { ProgressBar } from './ProgressBar'
import { StatTile } from './StatTile'
import { seedState } from '../store/state'

test('status pill copy per status', () => {
  render(<><StatusPill status="needed" /><StatusPill status="verified" /><StatusPill status="issue" /></>)
  expect(screen.getByText('To share')).toBeInTheDocument()
  expect(screen.getByText('Checked ✓')).toBeInTheDocument()
  expect(screen.getByText('Needs attention')).toBeInTheDocument()
})

test('checklist row shows plain-English title with german name as caption', () => {
  const item = seedState().items.find(i => i.id === 'lohnsteuer')!
  render(<ChecklistItemRow item={item} onClick={() => {}} />)
  expect(screen.getByText('Annual income statement')).toBeInTheDocument()
  expect(screen.getByText(/Lohnsteuerbescheinigung/)).toBeInTheDocument()
})

test('progress bar announces progress', () => {
  render(<ProgressBar value={2} max={5} />)
  expect(screen.getByText('2 of 5 shared')).toBeInTheDocument()
})

test('stat tile shows label and value, tone as a class', () => {
  render(<StatTile label="Open cases" value={12} tone="warning" />)
  expect(screen.getByText('12')).toBeInTheDocument()
  expect(screen.getByText('Open cases')).toBeInTheDocument()
  expect(screen.getByText('12').closest('.tf-stat-tile')).toHaveClass('tf-stat-tile--warning')
})

test('stat tile defaults to the default tone and accepts string values', () => {
  render(<StatTile label="Filed this season" value="–" />)
  expect(screen.getByText('–').closest('.tf-stat-tile')).toHaveClass('tf-stat-tile--default')
})
