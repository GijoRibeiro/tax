import { relativeTime } from './relativeTime'

const NOW = '2026-09-01T12:00:00.000Z'

test('under a minute reads "just now"', () => {
  expect(relativeTime('2026-09-01T11:59:30.000Z', NOW)).toBe('just now')
})

test('minutes ago', () => {
  expect(relativeTime('2026-09-01T11:45:00.000Z', NOW)).toBe('15 min ago')
})

test('hours ago', () => {
  expect(relativeTime('2026-09-01T09:00:00.000Z', NOW)).toBe('3 h ago')
})

test('days ago, within a week', () => {
  expect(relativeTime('2026-08-29T12:00:00.000Z', NOW)).toBe('3 d ago')
})

test('exactly 7 days ago still reads as days', () => {
  expect(relativeTime('2026-08-25T12:00:00.000Z', NOW)).toBe('7 d ago')
})

test('beyond 7 days falls back to a local date', () => {
  expect(relativeTime('2026-08-12T12:00:00.000Z', NOW)).toBe('12 Aug')
})

test('handles a date-only ISO string (no time component) gracefully', () => {
  // ws.cases['amara'].lastActivity is date-only ('2026-09-01') while others are full ISO.
  expect(relativeTime('2026-09-01', '2026-09-01T12:00:00.000Z')).toBe('12 h ago')
})

test('defaults `now` to the current time when omitted', () => {
  expect(relativeTime(new Date().toISOString())).toBe('just now')
})
