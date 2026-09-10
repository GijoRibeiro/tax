import { seedWorkspace, SEED_TODAY } from './seedWorkspace'
import { caseStatus } from '../../store/state'

test('seed has ~20 cases with full lifecycle coverage', () => {
  const ws = seedWorkspace()
  const cases = Object.values(ws.cases)
  expect(cases.length).toBeGreaterThanOrEqual(18)
  expect(ws.cases['amara']).toBeDefined()
  const phases = new Set(cases.map(c => c.state.phase))
  for (const p of ['sharing', 'preparing', 'awaiting_approval', 'approved', 'filed']) expect(phases).toContain(p)
  expect(cases.some(c => c.special === 'on-hold')).toBe(true)
  expect(cases.some(c => c.special === 'extension-filed')).toBe(true)
  expect(cases.some(c => c.state.draft?.refundEstimate.includes('−') || c.state.draft?.refundEstimate.includes('-'))).toBe(true)
})

test('every non-special case state is reducer-compatible', () => {
  const ws = seedWorkspace()
  for (const c of Object.values(ws.cases)) expect(() => caseStatus(c.state)).not.toThrow()
})

test('seed contains a stalled case (>14d idle with missing docs)', () => {
  const ws = seedWorkspace()
  const stale = Object.values(ws.cases).filter(c =>
    (Date.parse(SEED_TODAY) - Date.parse(c.lastActivity)) / 86400000 > 14 &&
    c.state.items.some(i => !i.optional && i.status === 'needed'))
  expect(stale.length).toBeGreaterThanOrEqual(1)
})

test('templates seed matches the three composer templates', () => {
  const ws = seedWorkspace()
  expect(ws.templates.map(t => t.id)).toEqual(['t-gap', 't-incomplete', 't-dates'])
  for (const t of ws.templates) expect(t.body).toContain('<item>')
})
