// @vitest-environment node
import { test, expect, afterEach } from 'vitest'
// @ts-expect-error plain-JS module without types
import { createRelay } from './relay.mjs'

let relay: { port: number; close: () => Promise<void> }
afterEach(async () => { await relay?.close() })

function connect(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`)
    ws.addEventListener('open', () => resolve(ws))
    ws.addEventListener('error', reject)
  })
}

function nextMessage(ws: WebSocket, kind: string): Promise<any> {
  return new Promise(resolve => {
    const handler = (e: MessageEvent) => {
      const msg = JSON.parse(String(e.data))
      if (msg.kind === kind) { ws.removeEventListener('message', handler); resolve(msg) }
    }
    ws.addEventListener('message', handler)
  })
}

test('relay seeds new clients and broadcasts reduced state to all clients', async () => {
  relay = await createRelay(0, { persistPath: null })
  const a = await connect(relay.port)
  const seedMsg = await nextMessage(a, 'state')
  expect(seedMsg.state.phase).toBe('onboarding')

  const b = await connect(relay.port)
  await nextMessage(b, 'state')

  const aNext = nextMessage(a, 'state')
  const bNext = nextMessage(b, 'state')
  a.send(JSON.stringify({ kind: 'action', action: { type: 'COMMIT_CASE' } }))
  expect((await aNext).state.phase).toBe('sharing')
  expect((await bNext).state.phase).toBe('sharing')
  a.close(); b.close()
})

test('ADD_ITEM action broadcasts the new item to all clients', async () => {
  relay = await createRelay(0, { persistPath: null })
  const a = await connect(relay.port)
  const seedMsg = await nextMessage(a, 'state')
  const seedItemCount = seedMsg.state.items.length

  const b = await connect(relay.port)
  await nextMessage(b, 'state')

  const aNext = nextMessage(a, 'state')
  const bNext = nextMessage(b, 'state')
  a.send(JSON.stringify({
    kind: 'action',
    action: {
      type: 'ADD_ITEM',
      item: {
        id: 'pendlerpauschale',
        group: 'deductions',
        title: 'Commute distance',
        explainer: 'The distance between your home and workplace.',
        lookLike: 'A note with your address and workplace address.',
        optional: true,
      },
    },
  }))
  const aResult = await aNext
  const bResult = await bNext
  expect(aResult.state.items).toHaveLength(seedItemCount + 1)
  expect(aResult.state.items.at(-1).id).toBe('pendlerpauschale')
  expect(aResult.state.items.at(-1).status).toBe('needed')
  expect(bResult.state.items).toHaveLength(seedItemCount + 1)
  a.close(); b.close()
})

test('token overrides broadcast and clear on RESET', async () => {
  relay = await createRelay(0, { persistPath: null })
  const a = await connect(relay.port)
  await nextMessage(a, 'state')
  const tokens = nextMessage(a, 'tokens')
  a.send(JSON.stringify({ kind: 'token', cssVar: '--color-primary', value: '#123456' }))
  // first tokens message on connect is empty; wait for the override broadcast
  const withOverride = await tokens.then(async m =>
    Object.keys(m.overrides).length ? m : nextMessage(a, 'tokens'))
  expect(withOverride.overrides['--color-primary']).toBe('#123456')

  const cleared = nextMessage(a, 'tokens')
  a.send(JSON.stringify({ kind: 'action', action: { type: 'RESET' } }))
  expect((await cleared).overrides).toEqual({})
  a.close()
})

test('unknown action types are ignored and do not corrupt broadcast state', async () => {
  relay = await createRelay(0, { persistPath: null })
  const a = await connect(relay.port)
  const seedMsg = await nextMessage(a, 'state')
  const seedItemCount = seedMsg.state.items.length

  const next = nextMessage(a, 'state')
  a.send(JSON.stringify({ kind: 'action', action: { type: 'TOTALLY_UNKNOWN' } }))
  a.send(JSON.stringify({ kind: 'action', action: { type: 'COMMIT_CASE' } }))
  const result = await next
  expect(result.state.phase).toBe('sharing')
  expect(Array.isArray(result.state.items)).toBe(true)
  expect(result.state.items).toHaveLength(seedItemCount)
  expect(Array.isArray(result.state.followUps)).toBe(true)
  a.close()
})

test('REPLACE actions from a client are ignored', async () => {
  relay = await createRelay(0, { persistPath: null })
  const a = await connect(relay.port)
  const seedMsg = await nextMessage(a, 'state')
  const seedItemCount = seedMsg.state.items.length

  const next = nextMessage(a, 'state')
  a.send(JSON.stringify({
    kind: 'action',
    action: { type: 'REPLACE', state: { phase: 'filed', items: [], followUps: [] } },
  }))
  a.send(JSON.stringify({ kind: 'action', action: { type: 'COMMIT_CASE' } }))
  const result = await next
  // If REPLACE had taken effect, items/followUps would have been wiped by
  // the injected snapshot (COMMIT_CASE doesn't touch items/followUps, so
  // this only passes if REPLACE never reached the reducer).
  expect(result.state.phase).toBe('sharing')
  expect(result.state.items).toHaveLength(seedItemCount)
  a.close()
})

test('stakeholder actions reduce separately and broadcast to every client', async () => {
  relay = await createRelay(0, { persistPath: null })
  const a = await connect(relay.port)
  const seeded = await nextMessage(a, 'stakeholders')
  expect(Array.isArray(seeded.state.amara)).toBe(true)
  expect(Array.isArray(seeded.state.anna)).toBe(true)
  const seedLen = seeded.state.amara.length

  const b = await connect(relay.port)
  await nextMessage(b, 'stakeholders')

  const aNext = nextMessage(a, 'stakeholders')
  const bNext = nextMessage(b, 'stakeholders')
  a.send(JSON.stringify({ kind: 'action', action: { type: 'ASK_PERSONA', persona: 'amara', text: 'How did you find us?' } }))
  const aRes = await aNext
  const bRes = await bNext
  expect(aRes.state.amara).toHaveLength(seedLen + 1)
  expect(aRes.state.amara.at(-1)).toMatchObject({ role: 'interviewer', text: 'How did you find us?' })
  expect(bRes.state.amara).toHaveLength(seedLen + 1)

  const answered = nextMessage(a, 'stakeholders')
  b.send(JSON.stringify({ kind: 'action', action: { type: 'ANSWER_PERSONA', persona: 'amara', text: 'A colleague told me.' } }))
  expect((await answered).state.amara.at(-1)).toMatchObject({ role: 'persona', text: 'A colleague told me.' })
  a.close(); b.close()
})

test('stakeholder actions never touch the case state', async () => {
  relay = await createRelay(0, { persistPath: null })
  const a = await connect(relay.port)
  // Both welcome frames arrive back-to-back; register both listeners first.
  const seedStateP = nextMessage(a, 'state')
  const seedShP = nextMessage(a, 'stakeholders')
  const seedState = await seedStateP
  await seedShP
  const sh = nextMessage(a, 'stakeholders')
  a.send(JSON.stringify({ kind: 'action', action: { type: 'ASK_PERSONA', persona: 'anna', text: 'Busy?' } }))
  await sh
  const later = nextMessage(a, 'state')
  a.send(JSON.stringify({ kind: 'action', action: { type: 'COMMIT_CASE' } }))
  const res = await later
  expect(res.state.items).toHaveLength(seedState.state.items.length)
  expect(res.state.phase).toBe('sharing')
  a.close()
})
