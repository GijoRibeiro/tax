// Sync sidecar: holds the one case state, runs the SAME reducer the web app
// tests, and broadcasts snapshots. No business logic lives here or in Swift.
import { WebSocketServer } from 'ws'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { reducer, seedState } from '../src/store/state.ts'
import {
  reduceStakeholders,
  seedStakeholders,
  isStakeholderState,
  STAKEHOLDER_ACTION_TYPES,
} from '../src/store/stakeholders.ts'

// Stakeholder interview transcripts (Betina / Anna) survive a relay restart via
// this runtime file, so a mid-demo restart doesn't wipe the conversation. It is
// gitignored; the committed seed lives in stakeholders.seed.json.
const DEFAULT_STAKEHOLDER_PERSIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '.stakeholders.runtime.json')

// The hub's "tap a component to open its code" affordance. Local only: the relay runs on
// the presenter's machine, and only files under ios/Sources may be opened. EDITOR_APP
// picks the app (default Xcode, where ⌘R shows the change on the simulator).
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OPENABLE_ROOT = path.join(REPO_ROOT, 'ios', 'Sources')
export function resolveOpenable(file) {
  const abs = path.resolve(REPO_ROOT, file)
  if (!abs.startsWith(OPENABLE_ROOT + path.sep) || !abs.endsWith('.swift') || !existsSync(abs)) return null
  return abs
}
function openSourceFile(file) {
  const abs = resolveOpenable(file)
  if (!abs) return
  const app = process.env.EDITOR_APP || 'Xcode'
  try { spawn('open', ['-a', app, abs], { stdio: 'ignore', detached: true }).unref() } catch { /* best effort */ }
}

function loadStakeholders(persistPath) {
  if (!persistPath) return seedStakeholders()
  try {
    const parsed = JSON.parse(readFileSync(persistPath, 'utf8'))
    if (isStakeholderState(parsed)) return parsed
  } catch { /* no runtime file yet, or unreadable — fall back to the seed */ }
  return seedStakeholders()
}

// Every reducer action type EXCEPT 'REPLACE' — clients must never push a
// whole state snapshot into a server-held store, and any type not on this
// list (typos, unknown/future actions) must be dropped before it ever
// reaches the reducer: the reducer's `default: never` branch is only a
// compile-time exhaustiveness check, not a runtime guard — at runtime an
// unrecognized action.type falls through `switch` untouched and, per this
// reducer's shape, the action's own fields land in `state` unchanged.
const ALLOWED_ACTION_TYPES = new Set([
  'UPLOAD_ITEM',
  'VERIFY_ITEM',
  'FLAG_ISSUE',
  'SEND_FOLLOW_UP',
  'ASK_ADVISOR',
  'ANSWER_FOLLOW_UP',
  'ADD_ITEM',
  'RESET',
  'COMMIT_CASE',
  'SUBMIT_DOCUMENTS',
  'START_PREPARING',
  'SEND_DRAFT',
  'APPROVE_RETURN',
  'MARK_FILED',
])

export function createRelay(port = 8787, { persistPath = DEFAULT_STAKEHOLDER_PERSIST } = {}) {
  return new Promise((resolve, reject) => {
    const wss = new WebSocketServer({ port }, () => {
      resolve({
        port: wss.address().port,
        close: () => new Promise(r => { for (const c of wss.clients) c.terminate(); wss.close(() => r()) }),
      })
    })
    wss.on('error', err => {
      if (err?.code === 'EADDRINUSE') {
        console.error(`[relay] Port ${port} is already in use — is another relay running?`)
      } else {
        console.error(`[relay] Failed to start: ${err?.message ?? err}`)
      }
      reject(err)
    })
    let state = seedState()
    let tokenOverrides = {}
    let stakeholders = loadStakeholders(persistPath)
    const persistStakeholders = () => {
      if (!persistPath) return
      try { writeFileSync(persistPath, JSON.stringify(stakeholders, null, 2)) } catch { /* best effort */ }
    }
    const send = (ws, msg) => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)) }
    const broadcast = msg => { for (const c of wss.clients) send(c, msg) }

    wss.on('connection', ws => {
      send(ws, { kind: 'state', state })
      send(ws, { kind: 'tokens', overrides: tokenOverrides })
      send(ws, { kind: 'stakeholders', state: stakeholders })
      ws.on('message', data => {
        let msg
        try { msg = JSON.parse(String(data)) } catch { return }
        if (msg?.kind === 'action' && msg.action?.type) {
          if (STAKEHOLDER_ACTION_TYPES.has(msg.action.type)) {
            try { stakeholders = reduceStakeholders(stakeholders, msg.action) } catch { return }
            broadcast({ kind: 'stakeholders', state: stakeholders })
            persistStakeholders()
            return
          }
          if (!ALLOWED_ACTION_TYPES.has(msg.action.type)) return
          try { state = reducer(state, msg.action) } catch { return }
          broadcast({ kind: 'state', state })
          if (msg.action.type === 'RESET') {
            tokenOverrides = {}
            broadcast({ kind: 'tokens', overrides: tokenOverrides })
          }
        } else if (msg?.kind === 'token' && typeof msg.cssVar === 'string' && typeof msg.value === 'string') {
          tokenOverrides = { ...tokenOverrides, [msg.cssVar]: msg.value }
          broadcast({ kind: 'tokens', overrides: tokenOverrides })
        } else if (msg?.kind === 'token-reset') {
          tokenOverrides = {}
          broadcast({ kind: 'tokens', overrides: tokenOverrides })
        } else if (msg?.kind === 'open' && typeof msg.file === 'string') {
          openSourceFile(msg.file)
        }
      })
    })
  })
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  createRelay()
    .then(({ port }) => console.log(`[relay] case state live on ws://127.0.0.1:${port}`))
    .catch(() => process.exit(1))
}
