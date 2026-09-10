import { describe, expect, test } from 'vitest'
import {
  STAKEHOLDER_ACTION_TYPES,
  isStakeholderState,
  pendingQuestion,
  reduceStakeholders,
  seedStakeholders,
} from './stakeholders'

describe('seed', () => {
  test('has both personas as arrays and returns a fresh copy each time', () => {
    const a = seedStakeholders()
    const b = seedStakeholders()
    expect(Array.isArray(a.amara)).toBe(true)
    expect(Array.isArray(a.anna)).toBe(true)
    expect(a).not.toBe(b)
    expect(a.amara).not.toBe(b.amara)
  })

  test('client-sendable action types exclude REPLACE', () => {
    expect([...STAKEHOLDER_ACTION_TYPES].sort()).toEqual(
      ['ANSWER_PERSONA', 'ASK_PERSONA', 'RESET_PERSONA', 'RESET_STAKEHOLDERS'].sort(),
    )
  })
})

describe('reduceStakeholders', () => {
  const empty = { amara: [], anna: [] }

  test('ASK_PERSONA appends an interviewer message with a generated id and timestamp', () => {
    const next = reduceStakeholders(empty, { type: 'ASK_PERSONA', persona: 'amara', text: 'How did you find us?' })
    expect(next.amara).toHaveLength(1)
    expect(next.amara[0]).toMatchObject({ role: 'interviewer', text: 'How did you find us?' })
    expect(next.amara[0].id).toBeTruthy()
    expect(new Date(next.amara[0].at).toString()).not.toBe('Invalid Date')
    expect(next.anna).toBe(empty.anna)
  })

  test('ASK_PERSONA with blank text is ignored', () => {
    expect(reduceStakeholders(empty, { type: 'ASK_PERSONA', persona: 'anna', text: '   ' })).toBe(empty)
  })

  test('ASK_PERSONA trims and keeps a caller-supplied id/at', () => {
    const next = reduceStakeholders(empty, {
      type: 'ASK_PERSONA', persona: 'anna', text: '  Hi  ', id: 'q1', at: '2026-09-05T10:00:00.000Z',
    })
    expect(next.anna[0]).toEqual({ id: 'q1', role: 'interviewer', text: 'Hi', at: '2026-09-05T10:00:00.000Z' })
  })

  test('ANSWER_PERSONA appends a persona message', () => {
    const asked = reduceStakeholders(empty, { type: 'ASK_PERSONA', persona: 'amara', text: 'Q' })
    const next = reduceStakeholders(asked, { type: 'ANSWER_PERSONA', persona: 'amara', text: 'A' })
    expect(next.amara.map(m => m.role)).toEqual(['interviewer', 'persona'])
    expect(next.amara[1].text).toBe('A')
  })

  test('RESET_PERSONA restores that persona to the seed and leaves the other alone', () => {
    const seed = seedStakeholders()
    let s = reduceStakeholders(seed, { type: 'ASK_PERSONA', persona: 'amara', text: 'extra' })
    s = reduceStakeholders(s, { type: 'ASK_PERSONA', persona: 'anna', text: 'extra' })
    const next = reduceStakeholders(s, { type: 'RESET_PERSONA', persona: 'amara' })
    expect(next.amara).toEqual(seedStakeholders().amara)
    expect(next.anna).toBe(s.anna)
  })

  test('RESET_STAKEHOLDERS restores both', () => {
    let s = reduceStakeholders(seedStakeholders(), { type: 'ASK_PERSONA', persona: 'amara', text: 'x' })
    s = reduceStakeholders(s, { type: 'ASK_PERSONA', persona: 'anna', text: 'y' })
    expect(reduceStakeholders(s, { type: 'RESET_STAKEHOLDERS' })).toEqual(seedStakeholders())
  })

  test('REPLACE_STAKEHOLDERS swaps in the given state', () => {
    const incoming = { amara: [{ id: 'a', role: 'persona' as const, text: 'hey', at: '2026-09-05T10:00:00.000Z' }], anna: [] }
    expect(reduceStakeholders(empty, { type: 'REPLACE_STAKEHOLDERS', state: incoming })).toBe(incoming)
  })

  test('unknown action returns the same reference', () => {
    // @ts-expect-error runtime guard against unknown types coming over the wire
    expect(reduceStakeholders(empty, { type: 'NOPE' })).toBe(empty)
  })
})

describe('pendingQuestion', () => {
  test('is the last message only when the interviewer spoke last', () => {
    let s = reduceStakeholders({ amara: [], anna: [] }, { type: 'ASK_PERSONA', persona: 'amara', text: 'Q' })
    expect(pendingQuestion(s, 'amara')?.text).toBe('Q')
    expect(pendingQuestion(s, 'anna')).toBeNull()
    s = reduceStakeholders(s, { type: 'ANSWER_PERSONA', persona: 'amara', text: 'A' })
    expect(pendingQuestion(s, 'amara')).toBeNull()
  })
})

describe('isStakeholderState', () => {
  test('accepts the seed and rejects other shapes', () => {
    expect(isStakeholderState(seedStakeholders())).toBe(true)
    expect(isStakeholderState({ amara: [] })).toBe(false)
    expect(isStakeholderState(null)).toBe(false)
    expect(isStakeholderState({ amara: 'x', anna: [] })).toBe(false)
  })
})
