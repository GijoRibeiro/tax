import { seedWorkspace, SEED_TODAY } from './seedWorkspace'
import {
  needsAttention,
  inboxItems,
  deadlineRisk,
  workloadCounts,
  searchCases,
  activityFeed,
  isStalled,
  flagCountFor,
} from './selectors'

test('needsAttention surfaces verify/question/draft items and excludes on-hold and amara', () => {
  vi.setSystemTime(new Date(`${SEED_TODAY}T12:00:00.000Z`))
  const ws = seedWorkspace()
  const items = needsAttention(ws)

  expect(items.some(i => i.caseId === 'amara')).toBe(false)
  expect(items.some(i => i.caseId === 'greta-lindqvist')).toBe(false) // on-hold

  const verify = items.find(i => i.caseId === 'sabine-hoffmann' && i.kind === 'verify')
  expect(verify).toBeDefined()
  expect(verify?.text).toContain('to check')

  const question = items.find(i => i.caseId === 'elif-yildiz' && i.kind === 'question')
  expect(question).toBeDefined()
  expect(question?.text).toContain('day')

  const draft = items.find(i => i.caseId === 'bjorn-larsen' && i.kind === 'draft')
  expect(draft).toBeDefined()
  expect(draft?.text).toBe('ready to draft')

  expect(items.some(i => i.caseId === 'marco-rossi')).toBe(false) // awaiting_approval, not advisor work

  vi.useRealTimers()
})

test('inboxItems groups needs-reply (oldest first) vs waiting', () => {
  const ws = seedWorkspace()
  const items = inboxItems(ws)

  const needsReply = items.filter(i => i.group === 'needs-reply')
  const waiting = items.filter(i => i.group === 'waiting')
  expect(needsReply.length).toBeGreaterThanOrEqual(2)
  expect(waiting.length).toBeGreaterThanOrEqual(1)

  // elif-yildiz's question is older than jonas-brandt's, oldest first.
  const elifIdx = needsReply.findIndex(i => i.caseId === 'elif-yildiz')
  const jonasIdx = needsReply.findIndex(i => i.caseId === 'jonas-brandt')
  expect(elifIdx).toBeGreaterThanOrEqual(0)
  expect(jonasIdx).toBeGreaterThan(elifIdx)

  for (let i = 1; i < needsReply.length; i++) {
    expect(Date.parse(needsReply[i].followUp.createdAt)).toBeGreaterThanOrEqual(
      Date.parse(needsReply[i - 1].followUp.createdAt),
    )
  }
})

test('deadlineRisk returns at-risk cases sorted soonest first', () => {
  const ws = seedWorkspace()
  const risk = deadlineRisk(ws, SEED_TODAY)

  expect(risk.length).toBeGreaterThan(0)
  expect(risk.some(c => c.state.phase === 'filed')).toBe(false)
  expect(risk.some(c => c.special === 'on-hold')).toBe(false)
  // mateo-alvarez has a passed deadline but is filed under extension, excluded either way.
  expect(risk.some(c => c.client.id === 'mateo-alvarez')).toBe(false)

  for (let i = 1; i < risk.length; i++) {
    expect(Date.parse(risk[i].deadline)).toBeGreaterThanOrEqual(Date.parse(risk[i - 1].deadline))
  }
})

test('workloadCounts matches the ruled bucket semantics against the seed (buckets overlap, not a partition)', () => {
  const ws = seedWorkspace()
  const counts = workloadCounts(ws)

  // Seed has 21 cases: 3 filed (ingrid-sorensen, youssef-amin, mateo-alvarez), 1 on-hold
  // (greta-lindqvist, itself status waiting_on_client), 3 ready_to_work (jonas-brandt,
  // elif-yildiz, hannah-fischer), 2 preparing (bjorn-larsen, aisha-diallo, deliberately
  // excluded from `ready`), and 9 total waiting_on_client (including the on-hold one).
  expect(counts.filed).toBe(3)
  expect(counts.ready).toBe(3) // ready_to_work only, preparing is excluded
  expect(counts.waiting).toBe(9) // waiting_on_client status, on-hold included
  expect(counts.open).toBe(17) // not filed, not on-hold: 21 - 3 filed - 1 on-hold
})

test('searchCases matches by case-insensitive name substring; empty query returns all', () => {
  const ws = seedWorkspace()
  expect(searchCases(ws, '').length).toBe(Object.keys(ws.cases).length)

  const results = searchCases(ws, 'brandt')
  expect(results).toHaveLength(1)
  expect(results[0].client.name).toBe('Jonas Brandt')

  expect(searchCases(ws, 'JONAS')).toHaveLength(1)
  expect(searchCases(ws, 'no-such-client')).toHaveLength(0)
})

test('activityFeed returns the newest n events first', () => {
  const ws = seedWorkspace()
  const feed = activityFeed(ws, 3)

  expect(feed).toHaveLength(3)
  for (let i = 1; i < feed.length; i++) {
    expect(Date.parse(feed[i].at)).toBeLessThanOrEqual(Date.parse(feed[i - 1].at))
  }
  expect(Date.parse(feed[0].at)).toBe(Math.max(...ws.activity.map(e => Date.parse(e.at))))
})

test('isStalled is true for the seeded stalled case and false for an active one', () => {
  const ws = seedWorkspace()
  expect(isStalled(ws.cases['sabine-hoffmann'], SEED_TODAY)).toBe(true)
  expect(isStalled(ws.cases['jonas-brandt'], SEED_TODAY)).toBe(false)
  // on-hold, idle for 45 days, but explicitly excluded regardless of idle time.
  expect(isStalled(ws.cases['greta-lindqvist'], SEED_TODAY)).toBe(false)
})

test('flagCountFor counts FLAG_ISSUE activity events for a specific item', () => {
  const ws = seedWorkspace()
  expect(flagCountFor(ws, 'chen-wei', 'lohnsteuer')).toBe(2)
  expect(flagCountFor(ws, 'nadia-petrova', 'bank')).toBe(1)
  expect(flagCountFor(ws, 'chen-wei', 'bank')).toBe(0)
})
