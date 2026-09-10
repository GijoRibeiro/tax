import { test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Every action the reducer understands must be on the relay's allow-list, or the relay
// drops it silently and a new feature "works" only offline. SUBMIT_DOCUMENTS was missed
// once; this keeps the two lists from drifting again.
test('relay allow-list covers every reducer action type', () => {
  const stateSrc = readFileSync(resolve(process.cwd(), 'src/store/state.ts'), 'utf8')
  const relaySrc = readFileSync(resolve(process.cwd(), 'server/relay.mjs'), 'utf8')
  const union = stateSrc.slice(stateSrc.indexOf('export type Action'), stateSrc.indexOf('export function reducer'))
  const reducerTypes = [...union.matchAll(/type: '([A-Z_]+)'/g)].map(m => m[1]).filter(t => t !== 'REPLACE')
  const listStart = relaySrc.indexOf('ALLOWED_ACTION_TYPES = new Set([')
  const allowed = new Set([...relaySrc.slice(listStart, relaySrc.indexOf('])', listStart)).matchAll(/'([A-Z_]+)'/g)].map(m => m[1]))
  expect(reducerTypes.length).toBeGreaterThan(5)
  for (const t of reducerTypes) expect(allowed.has(t), `${t} missing from relay allow-list`).toBe(true)
})
