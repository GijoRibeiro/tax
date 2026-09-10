# Taxfix Native Full Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the consumer surface as a native SwiftUI iOS app covering the full Expert Service journey (onboarding → hand-off → review → filed), live-synced with the existing web advisor dashboard through a Node WebSocket relay that runs the existing TS reducer.

**Architecture:** One reducer (`src/store/state.ts`) is the single source of business logic, executed only by a Node sidecar (`server/relay.mjs`) that holds state and broadcasts snapshots over WebSocket. Clients — the SwiftUI app and the web advisor/hub — send actions and render snapshots. Design tokens stay in `src/styles/tokens.css`; a generator emits `Tokens.swift` + `seed.json` for iOS. Web keeps only `/` (hub) and `/advisor`.

**Tech Stack:** SwiftUI (iOS 18 target, Xcode 26, XcodeGen), Node 24 (native TS type-stripping) + `ws`, existing Vite/React/TS web app, vitest + XCTest.

**Spec:** `docs/superpowers/specs/2026-08-31-taxfix-native-full-journey-design.md` — read it first. Copy rules, personas, and screen intent come from it (and from v1 spec §2/§8 for persona/hub content).

## Global Constraints

- TypeScript `strict: true`; no `any`.
- Web components style via token CSS variables only — raw values live only in `src/styles/tokens.css`. Swift views style only via `Tokens`/`TokenStore` accessors (raw values only in generated `Tokens.swift`).
- All user-facing copy in English; German document names appear only as secondary/explained text.
- Deadline framing is calm ("Deadline 31 July — plenty of time with an expert"), never countdown urgency.
- Commit messages: plain conventional commits, **no co-author trailers**.
- The depth asymmetry is intentional: onboarding views are simple and linear (no branches); the hand-off screens carry full state coverage (needed/uploaded/verified/issue, escape hatch, follow-ups).
- iOS: SF Symbols only, light mode only, English only. WebSocket URL `ws://127.0.0.1:8787` (simulator shares host loopback).
- Every task ends with all web tests green (`npx vitest run`) and, once ios/ exists, the iOS app building (`xcodebuild` command in Task 7).

---

### Task 1: Extend the state machine (phase, draft, loop actions)

**Files:**
- Modify: `src/types.ts`
- Modify: `src/store/state.ts`
- Modify: `src/store/state.test.ts` (add tests)

**Interfaces:**
- Consumes: existing `CaseState`, `reducer`, `seedState`, `advisorCanStart`.
- Produces: `CasePhase` (`'onboarding' | 'sharing' | 'preparing' | 'awaiting_approval' | 'approved' | 'filed'`), `ReturnDraft { income: string; taxPaid: string; deductions: string; refundEstimate: string; note?: string }`, `CaseState` gains `phase: CasePhase; draft?: ReturnDraft; filedAt?: string`, new actions `COMMIT_CASE | START_PREPARING | SEND_DRAFT {draft} | APPROVE_RETURN | MARK_FILED`, selector `caseStatus(s): 'onboarding' | 'waiting_on_client' | 'ready_to_work' | 'preparing' | 'awaiting_approval' | 'approved' | 'filed'`.

- [x] **Step 1: Write the failing tests** — append to `src/store/state.test.ts`:

```ts
import { caseStatus } from './state' // add to existing imports

test('seed starts in onboarding and COMMIT_CASE moves to sharing', () => {
  const s = seedState()
  expect(s.phase).toBe('onboarding')
  expect(caseStatus(s)).toBe('onboarding')
  const committed = reducer(s, { type: 'COMMIT_CASE' })
  expect(committed.phase).toBe('sharing')
  expect(caseStatus(committed)).toBe('waiting_on_client')
})

test('caseStatus derives ready_to_work when all required items are in', () => {
  let s = reducer(seedState(), { type: 'COMMIT_CASE' })
  for (const item of s.items.filter(i => !i.optional && i.status === 'needed')) {
    s = reducer(s, { type: 'UPLOAD_ITEM', itemId: item.id, fileName: 'x.jpg' })
  }
  expect(caseStatus(s)).toBe('ready_to_work')
})

test('preparing → draft → approval → filed round trip', () => {
  let s = reducer(seedState(), { type: 'COMMIT_CASE' })
  s = reducer(s, { type: 'START_PREPARING' })
  expect(s.phase).toBe('preparing')
  const draft = { income: '€54,200', taxPaid: '€11,830', deductions: '€2,410', refundEstimate: '€1,286' }
  s = reducer(s, { type: 'SEND_DRAFT', draft })
  expect(s.phase).toBe('awaiting_approval')
  expect(s.draft).toEqual(draft)
  s = reducer(s, { type: 'APPROVE_RETURN' })
  expect(s.phase).toBe('approved')
  s = reducer(s, { type: 'MARK_FILED' })
  expect(s.phase).toBe('filed')
  expect(typeof s.filedAt).toBe('string')
})

test('RESET returns to onboarding seed', () => {
  const s = reducer(reducer(seedState(), { type: 'COMMIT_CASE' }), { type: 'RESET' })
  expect(s.phase).toBe('onboarding')
  expect(s.draft).toBeUndefined()
})
```

- [x] **Step 2: Run to verify FAIL** — `npx vitest run src/store/state.test.ts` → fails (`phase` undefined, `caseStatus` not exported).

- [x] **Step 3: Implement.** In `src/types.ts` add above `CaseState`:

```ts
export type CasePhase = 'onboarding' | 'sharing' | 'preparing' | 'awaiting_approval' | 'approved' | 'filed'

export interface ReturnDraft {
  income: string
  taxPaid: string
  deductions: string
  refundEstimate: string
  note?: string
}
```

and change `CaseState` to:

```ts
export interface CaseState {
  phase: CasePhase
  items: ChecklistItem[]
  followUps: FollowUp[]
  draft?: ReturnDraft
  filedAt?: string
}
```

In `src/store/state.ts`: add `phase: 'onboarding',` as the first property of the object returned by `seedState()`. Extend the `Action` union with:

```ts
  | { type: 'COMMIT_CASE' }
  | { type: 'START_PREPARING' }
  | { type: 'SEND_DRAFT'; draft: ReturnDraft }
  | { type: 'APPROVE_RETURN' }
  | { type: 'MARK_FILED' }
```

(import `ReturnDraft` type from `../types`). Add cases to the reducer before `RESET`:

```ts
    case 'COMMIT_CASE':
      return { ...state, phase: 'sharing' }
    case 'START_PREPARING':
      return { ...state, phase: 'preparing' }
    case 'SEND_DRAFT':
      return { ...state, phase: 'awaiting_approval', draft: action.draft }
    case 'APPROVE_RETURN':
      return { ...state, phase: 'approved' }
    case 'MARK_FILED':
      return { ...state, phase: 'filed', filedAt: new Date().toISOString() }
```

Add selector at the bottom:

```ts
export type LiveCaseStatus =
  | 'onboarding' | 'waiting_on_client' | 'ready_to_work'
  | 'preparing' | 'awaiting_approval' | 'approved' | 'filed'

export function caseStatus(s: CaseState): LiveCaseStatus {
  if (s.phase === 'sharing') return advisorCanStart(s) ? 'ready_to_work' : 'waiting_on_client'
  return s.phase
}
```

- [x] **Step 4: Run all tests** — `npx vitest run`. Some existing tests may now fail because seed `phase` is `'onboarding'` (e.g. advisor/consumer tests rendering against seed). Fix ONLY by adjusting test setup to commit first where a test exercises post-onboarding UI: in failing test files, replace `seedState()`-based initial renders with a state whose phase is `'sharing'` (dispatch `{ type: 'COMMIT_CASE' }` in the test setup, or render then `fireEvent` if the store is internal). Do not change component code in this task. All green + `npx tsc -b --noEmit` clean.

- [x] **Step 5: Commit** — `feat: extend case state machine with phase, draft and completion-loop actions`

---

### Task 2: WebSocket relay server + demo runner

**Files:**
- Create: `server/relay.mjs`
- Create: `server/relay.test.ts`
- Create: `scripts/demo.mjs`
- Modify: `package.json` (add `ws` dependency, `relay` and `demo` scripts)

**Interfaces:**
- Consumes: `reducer`, `seedState` from `src/store/state.ts` (Node 24 strips types natively; `state.ts` has only type-only imports so extensionless resolution never runs at runtime).
- Produces: `createRelay(port?: number)` → `{ port, close(): Promise<void> }`. Wire protocol — client→server: `{kind:'action', action: Action}`, `{kind:'token', cssVar: string, value: string}`, `{kind:'token-reset'}`; server→client: `{kind:'state', state: CaseState}`, `{kind:'tokens', overrides: Record<string,string>}`. On connect the server sends both current messages. `RESET` also clears token overrides. Default port **8787**.

- [x] **Step 1: Install dep** — `npm i ws && npm i -D @types/ws`

- [x] **Step 2: Write the failing test** — `server/relay.test.ts`:

```ts
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
  relay = await createRelay(0)
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

test('token overrides broadcast and clear on RESET', async () => {
  relay = await createRelay(0)
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
```

- [x] **Step 3: Run to verify FAIL** — `npx vitest run server/relay.test.ts` → module not found.

- [x] **Step 4: Implement `server/relay.mjs`:**

```js
// Sync sidecar: holds the one case state, runs the SAME reducer the web app
// tests, and broadcasts snapshots. No business logic lives here or in Swift.
import { WebSocketServer } from 'ws'
import { pathToFileURL } from 'node:url'
import { reducer, seedState } from '../src/store/state.ts'

export function createRelay(port = 8787) {
  return new Promise(resolve => {
    const wss = new WebSocketServer({ port }, () => {
      resolve({
        port: wss.address().port,
        close: () => new Promise(r => { for (const c of wss.clients) c.terminate(); wss.close(() => r()) }),
      })
    })
    let state = seedState()
    let tokenOverrides = {}
    const send = (ws, msg) => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)) }
    const broadcast = msg => { for (const c of wss.clients) send(c, msg) }

    wss.on('connection', ws => {
      send(ws, { kind: 'state', state })
      send(ws, { kind: 'tokens', overrides: tokenOverrides })
      ws.on('message', data => {
        let msg
        try { msg = JSON.parse(String(data)) } catch { return }
        if (msg?.kind === 'action' && msg.action?.type) {
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
        }
      })
    })
  })
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  createRelay().then(({ port }) => console.log(`[relay] case state live on ws://127.0.0.1:${port}`))
}
```

- [x] **Step 5: Run to verify PASS** — `npx vitest run server/relay.test.ts`.

- [x] **Step 6: Create `scripts/demo.mjs`** (panel-day one-liner):

```js
// One command for panel day: relay + web. The iOS app is step 3 (Xcode ⌘R).
import { spawn } from 'node:child_process'

const procs = [
  spawn('node', ['server/relay.mjs'], { stdio: 'inherit' }),
  spawn('npx', ['vite', '--port', '5173'], { stdio: 'inherit' }),
]
console.log(`
  Demo checklist:
  1. Hub:      http://localhost:5173/
  2. Advisor:  http://localhost:5173/advisor
  3. iOS app:  open ios/TaxfixExpert.xcodeproj → ⌘R (iPhone 17 Pro simulator)
`)
const stop = () => { for (const p of procs) p.kill() ; process.exit(0) }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
```

Add to `package.json` scripts: `"relay": "node server/relay.mjs"`, `"demo": "node scripts/demo.mjs"`.

- [x] **Step 7: Smoke it** — `node server/relay.mjs &` prints the live line; kill it. `npx vitest run` all green.

- [x] **Step 8: Commit** — `feat: add websocket relay running the shared reducer, plus demo runner`

---

### Task 3: Web store speaks WebSocket (replaces BroadcastChannel/localStorage)

**Files:**
- Modify: `src/store/CaseStore.tsx` (rewrite)
- Modify: `src/design/tokens.ts` (add `applyTokenOverrides`)
- Modify: `src/store/CaseStore.test.tsx` (rewrite sync tests)

**Interfaces:**
- Consumes: relay protocol from Task 2; `reducer`, `seedState`, `Action`.
- Produces: `CaseStoreProvider({ children, url? })` — `url` defaults to `ws://127.0.0.1:8787` except in vitest (`import.meta.env.MODE === 'test'` → `null`, meaning offline/local-reduce). `useCase()` returns `{ state, dispatch, connected, sendToken(cssVar, value), resetTokensLive() }`. Offline `dispatch` reduces locally so all component tests keep working without a server. `applyTokenOverrides(overrides: Record<string, string>)` in `src/design/tokens.ts` clears then applies document-level CSS vars.

- [x] **Step 1: Write the failing tests** — replace the BroadcastChannel tests in `src/store/CaseStore.test.tsx` with:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CaseStoreProvider, useCase } from './CaseStore'

function Probe() {
  const { state, dispatch, connected } = useCase()
  return (
    <div>
      <span data-testid="phase">{state.phase}</span>
      <span data-testid="connected">{String(connected)}</span>
      <button onClick={() => dispatch({ type: 'COMMIT_CASE' })}>commit</button>
    </div>
  )
}

test('offline store reduces locally (test mode has no socket)', () => {
  render(<CaseStoreProvider><Probe /></CaseStoreProvider>)
  expect(screen.getByTestId('phase').textContent).toBe('onboarding')
  expect(screen.getByTestId('connected').textContent).toBe('false')
  fireEvent.click(screen.getByText('commit'))
  expect(screen.getByTestId('phase').textContent).toBe('sharing')
})

test('sendToken falls back to local css var when offline', () => {
  function TokenProbe() {
    const { sendToken } = useCase()
    return <button onClick={() => sendToken('--color-primary', '#123456')}>set</button>
  }
  render(<CaseStoreProvider><TokenProbe /></CaseStoreProvider>)
  fireEvent.click(screen.getByText('set'))
  expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#123456')
})
```

- [x] **Step 2: Run to verify FAIL** — `npx vitest run src/store/CaseStore.test.tsx`.

- [x] **Step 3: Implement.** In `src/design/tokens.ts` add:

```ts
export function applyTokenOverrides(overrides: Record<string, string>) {
  resetTokens()
  for (const [cssVar, value] of Object.entries(overrides)) setToken(cssVar, value)
}
```

Rewrite `src/store/CaseStore.tsx`:

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { reducer, seedState } from './state'
import type { Action } from './state'
import type { CaseState } from '../types'
import { applyTokenOverrides, setToken, resetTokens } from '../design/tokens'

const DEFAULT_URL = import.meta.env.MODE === 'test' ? null : 'ws://127.0.0.1:8787'

interface CaseCtx {
  state: CaseState
  dispatch: (a: Action) => void
  connected: boolean
  sendToken: (cssVar: string, value: string) => void
  resetTokensLive: () => void
}

const Ctx = createContext<CaseCtx | null>(null)

function isCaseState(v: unknown): v is CaseState {
  return !!v && typeof v === 'object' && Array.isArray((v as CaseState).items) && Array.isArray((v as CaseState).followUps)
}

export function CaseStoreProvider({ children, url = DEFAULT_URL }: { children: ReactNode; url?: string | null }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, seedState)
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!url) return
    let closed = false
    let retry: ReturnType<typeof setTimeout>
    let ws: WebSocket
    const connect = () => {
      ws = new WebSocket(url)
      wsRef.current = ws
      ws.onopen = () => setConnected(true)
      ws.onmessage = e => {
        try {
          const msg = JSON.parse(String(e.data))
          if (msg.kind === 'state' && isCaseState(msg.state)) rawDispatch({ type: 'REPLACE', state: msg.state })
          if (msg.kind === 'tokens' && msg.overrides) applyTokenOverrides(msg.overrides)
        } catch { /* malformed frame — ignore */ }
      }
      ws.onclose = () => {
        setConnected(false)
        wsRef.current = null
        if (!closed) retry = setTimeout(connect, 1000)
      }
    }
    connect()
    return () => { closed = true; clearTimeout(retry); ws.close() }
  }, [url])

  const live = useCallback(() => {
    const ws = wsRef.current
    return ws && ws.readyState === WebSocket.OPEN ? ws : null
  }, [])

  const dispatch = useCallback((a: Action) => {
    const ws = live()
    if (ws) ws.send(JSON.stringify({ kind: 'action', action: a }))
    else rawDispatch(a)
  }, [live])

  const sendToken = useCallback((cssVar: string, value: string) => {
    const ws = live()
    if (ws) ws.send(JSON.stringify({ kind: 'token', cssVar, value }))
    else setToken(cssVar, value)
  }, [live])

  const resetTokensLive = useCallback(() => {
    const ws = live()
    if (ws) ws.send(JSON.stringify({ kind: 'token-reset' }))
    else resetTokens()
  }, [live])

  const value = useMemo(
    () => ({ state, dispatch, connected, sendToken, resetTokensLive }),
    [state, dispatch, connected, sendToken, resetTokensLive],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCase() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCase must be used inside CaseStoreProvider')
  return ctx
}
```

- [x] **Step 4: Run all tests** — `npx vitest run`. Fix any test that asserted localStorage/BroadcastChannel behavior by deleting that assertion (the relay test covers sync now). Green + `npx tsc -b --noEmit`.

- [x] **Step 5: Commit** — `feat: web store syncs through relay websocket with offline fallback`

---

### Task 4: Retire /app and /demo; hub survives without the web consumer app

**Files:**
- Delete: `src/app/` (entire dir), `src/demo/` (entire dir), `src/components/PhoneFrame.tsx`
- Modify: `src/main.tsx`, `src/main.test.tsx`, `src/hub/TokenEditor.tsx`, `src/hub/TokenEditor.test.tsx`, `src/hub/sections/DesignSystem.tsx`, `src/components/components.test.tsx`, `index.html` (title stays), `src/hub/Hub.tsx` (remove launch links to `/app`/`/demo`)

**Interfaces:**
- Consumes: `useCase().sendToken/resetTokensLive` from Task 3.
- Produces: routes are exactly `/` and `/advisor`. `TokenEditor` pushes tokens through the store (live to native app + advisor when connected).

- [x] **Step 1: Write/adjust failing tests.** In `src/main.test.tsx`, change route expectations to: `/` renders hub, `/advisor` renders advisor, and `/app` no longer matches (assert its heading is absent). In `src/hub/TokenEditor.test.tsx` replace direct-`setToken` expectations with:

```tsx
test('token editor writes css variable through the store when offline', () => {
  render(<MemoryRouter><CaseStoreProvider><TokenEditor /></CaseStoreProvider></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Primary'), { target: { value: '#123456' } })
  expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#123456')
})
```

- [x] **Step 2: Run to verify FAIL**, then implement:
  - `src/main.tsx`: drop `ConsumerApp`/`Demo` imports and their `<Route>` lines.
  - Delete `src/app/`, `src/demo/`, `src/components/PhoneFrame.tsx`; remove `PhoneFrame` cases from `src/components/components.test.tsx`; remove `/app`-`/demo` buttons from the hub nav in `src/hub/Hub.tsx` and any `ConsumerApp` embed in `src/hub/sections/DesignSystem.tsx` (keep the advisor preview; caption becomes "One token — hub, advisor, and the native app in the simulator. Live.").
  - `TokenEditor.tsx`: replace `setToken`/`resetTokens` imports with `const { sendToken, resetTokensLive } = useCase()`; `onChange` handlers call `sendToken(token.cssVar, …)`; Reset calls `resetTokensLive()` then bumps `editorEpoch`.
- [x] **Step 3: Run all tests + typecheck + build** — `npx vitest run && npx tsc -b --noEmit && npm run build`. Delete now-failing tests that exercised deleted screens (`ConsumerApp.test.tsx` etc. go with their dirs).
- [x] **Step 4: Commit** — `refactor: retire web consumer app and demo route; token editor pushes over relay`

---

### Task 5: Advisor closes the loop (queue chips + prepare/draft/file controls)

**Files:**
- Modify: `src/advisor/status.ts`, `src/advisor/AdvisorQueue.tsx`, `src/advisor/CaseDetail.tsx`, `src/advisor/advisor.css`
- Create: `src/advisor/PrepareControls.tsx`
- Modify: `src/advisor/AdvisorApp.test.tsx`

**Interfaces:**
- Consumes: `caseStatus`, `advisorCanStart` from Task 1; `useCase` from Task 3; existing `Banner`, `Button`, `StatusChip`.
- Produces: `PrepareControls` — renders per `caseStatus(state)`: `ready_to_work` → "Start preparing" button (`START_PREPARING`); `preparing` → draft form with four labeled inputs (labels exactly: `Income`, `Tax paid`, `Deductions found`, `Refund estimate`) prefilled `€54,200 / €11,830 / €2,410 / €1,286` + button "Send to Amara for approval" (`SEND_DRAFT`); `awaiting_approval` → banner "Waiting for Amara to approve."; `approved` → button "Mark as filed" (`MARK_FILED`); `filed` → banner "Filed with Finanzamt Berlin. Done."

- [x] **Step 1: Write the failing tests** — append to `src/advisor/AdvisorApp.test.tsx` (follow the file's existing render helper; ensure setup dispatches `COMMIT_CASE` and uploads+verifies all required items to reach `ready_to_work` where needed):

```tsx
test('advisor can start preparing once ready, send draft, and file after approval', () => {
  renderAdvisorAtReadyToWork() // helper: commit + upload all required items via dispatch
  fireEvent.click(screen.getByText('Start preparing'))
  expect(screen.getByLabelText('Refund estimate')).toHaveValue('€1,286')
  fireEvent.click(screen.getByText('Send to Amara for approval'))
  expect(screen.getByText(/Waiting for Amara to approve/)).toBeInTheDocument()
})

test('queue chip reflects the extended lifecycle', () => {
  renderAdvisorAtPhase('preparing')
  expect(screen.getByText('Preparing')).toBeInTheDocument()
})

test('case is absent from queue while consumer is onboarding', () => {
  renderAdvisorSeed() // no COMMIT_CASE
  expect(screen.queryByText('Amara Okafor · Return 2025')).not.toBeInTheDocument()
  expect(screen.getByText(/No live case yet/)).toBeInTheDocument()
})
```

- [x] **Step 2: Run to verify FAIL.**
- [x] **Step 3: Implement.**
  - `status.ts` — extend `deriveLiveCaseStatus` via `caseStatus`:

```ts
import type { CaseState } from '../types'
import { caseStatus } from '../store/state'
import type { ChipTone } from './StatusChip'

const LABELS: Record<ReturnType<typeof caseStatus>, { label: string; tone: ChipTone }> = {
  onboarding: { label: 'Signing up', tone: 'neutral' },
  waiting_on_client: { label: 'Waiting on client', tone: 'neutral' },
  ready_to_work: { label: 'Ready to work', tone: 'success' },
  preparing: { label: 'Preparing', tone: 'success' },
  awaiting_approval: { label: 'Awaiting approval', tone: 'warning' },
  approved: { label: 'Approved — file it', tone: 'success' },
  filed: { label: 'Filed', tone: 'success' },
}

export function deriveLiveCaseStatus(state: CaseState): { label: string; tone: ChipTone } {
  if (caseStatus(state) === 'waiting_on_client' && state.followUps.some(f => f.from === 'advisor' && f.status === 'open')) {
    return { label: 'Blocked — asked client', tone: 'warning' }
  }
  return LABELS[caseStatus(state)]
}
```

  - `AdvisorQueue.tsx` — when `caseStatus(state) === 'onboarding'`, render in place of the live row: `<div className="tf-advisor-queue__row tf-advisor-queue__row--empty">No live case yet — Amara is signing up.</div>`; otherwise the existing live row.
  - `PrepareControls.tsx` (new, full component):

```tsx
import { useState } from 'react'
import { useCase } from '../store/CaseStore'
import { caseStatus } from '../store/state'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'

const DRAFT_FIELDS = [
  { key: 'income', label: 'Income', seed: '€54,200' },
  { key: 'taxPaid', label: 'Tax paid', seed: '€11,830' },
  { key: 'deductions', label: 'Deductions found', seed: '€2,410' },
  { key: 'refundEstimate', label: 'Refund estimate', seed: '€1,286' },
] as const

export function PrepareControls() {
  const { state, dispatch } = useCase()
  const [draft, setDraft] = useState<Record<string, string>>(
    Object.fromEntries(DRAFT_FIELDS.map(f => [f.key, f.seed])),
  )
  const status = caseStatus(state)

  if (status === 'ready_to_work')
    return <Button variant="primary" onClick={() => dispatch({ type: 'START_PREPARING' })}>Start preparing</Button>
  if (status === 'preparing')
    return (
      <div className="tf-advisor-draft">
        {DRAFT_FIELDS.map(f => (
          <label key={f.key} className="tf-advisor-draft__field">
            {f.label}
            <input value={draft[f.key]} onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))} />
          </label>
        ))}
        <Button
          variant="primary"
          onClick={() => dispatch({
            type: 'SEND_DRAFT',
            draft: {
              income: draft.income, taxPaid: draft.taxPaid,
              deductions: draft.deductions, refundEstimate: draft.refundEstimate,
            },
          })}
        >
          Send to Amara for approval
        </Button>
      </div>
    )
  if (status === 'awaiting_approval') return <Banner tone="info">Waiting for Amara to approve.</Banner>
  if (status === 'approved')
    return <Button variant="primary" onClick={() => dispatch({ type: 'MARK_FILED' })}>Mark as filed</Button>
  if (status === 'filed') return <Banner tone="success">Filed with Finanzamt Berlin. Done.</Banner>
  return null
}
```

  - `CaseDetail.tsx` — render `<PrepareControls />` between the table and `<FollowUpComposer />`. Add a reset button in the advisor header (`Button` ghost, "Reset demo" → `dispatch({ type: 'RESET' })`) if not already present from v1's demo page.
  - `advisor.css` — `.tf-advisor-draft` grid + `.tf-advisor-draft__field` stacked label styles using existing space/radius vars only.
- [x] **Step 4: Run all tests → PASS. Typecheck clean. Commit** — `feat: advisor prepares, drafts, and files — full loop controls and lifecycle chips`

---

### Task 6: iOS codegen — Tokens.swift + seed.json from the web sources of truth

**Files:**
- Create: `scripts/gen-ios.mjs`
- Create: `scripts/gen-ios.test.ts`
- Modify: `package.json` (script `"gen:ios": "node scripts/gen-ios.mjs"`)
- Generated (committed): `ios/Sources/Generated/Tokens.swift`, `ios/Resources/seed.json`

**Interfaces:**
- Consumes: `src/styles/tokens.css` custom properties; `seedState()` from `src/store/state.ts`.
- Produces: `generate()` (exported, pure) → `{ tokensSwift: string, seedJson: string }`. `Tokens.swift` contains `enum Tokens { static let defaults: [String: String] = ["--color-primary": "#32c850", …] }` with every `--var` from tokens.css. `seed.json` is `JSON.stringify(seedState(), null, 2)`.

- [x] **Step 1: Write the failing test** — `scripts/gen-ios.test.ts`:

```ts
import { test, expect } from 'vitest'
// @ts-expect-error plain-JS module without types
import { generate } from './gen-ios.mjs'

test('generate emits every css token and the seed case', () => {
  const { tokensSwift, seedJson } = generate()
  expect(tokensSwift).toContain('"--color-primary": "#32c850"')
  expect(tokensSwift).toContain('"--radius-card": "16px"')
  const seed = JSON.parse(seedJson)
  expect(seed.phase).toBe('onboarding')
  expect(seed.items.length).toBeGreaterThanOrEqual(6)
})
```

- [x] **Step 2: Run to verify FAIL.**
- [x] **Step 3: Implement `scripts/gen-ios.mjs`:**

```js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { seedState } from '../src/store/state.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export function generate() {
  const css = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8')
  const vars = [...css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)]
    .map(([, name, value]) => [name, value.trim()])
  const entries = vars.map(([n, v]) => `        "${n}": "${v}",`).join('\n')
  const tokensSwift = `// GENERATED by scripts/gen-ios.mjs — do not edit. Source: src/styles/tokens.css
enum Tokens {
    static let defaults: [String: String] = [
${entries}
    ]
}
`
  return { tokensSwift, seedJson: JSON.stringify(seedState(), null, 2) }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { tokensSwift, seedJson } = generate()
  mkdirSync(join(root, 'ios/Sources/Generated'), { recursive: true })
  mkdirSync(join(root, 'ios/Resources'), { recursive: true })
  writeFileSync(join(root, 'ios/Sources/Generated/Tokens.swift'), tokensSwift)
  writeFileSync(join(root, 'ios/Resources/seed.json'), seedJson)
  console.log('[gen-ios] wrote Tokens.swift and seed.json')
}
```

Note: `--font-sans` contains quotes — escape double quotes in values: use `v.replaceAll('"', '\\"')` when emitting `entries`.
- [x] **Step 4: Run test → PASS.** Then `npm run gen:ios` and commit generated files too.
- [x] **Step 5: Commit** — `feat: generate ios tokens and seed fixture from web sources of truth`

---

### Task 7: iOS project scaffold (XcodeGen) that builds and launches

**Files:**
- Create: `ios/project.yml`, `ios/Sources/TaxfixApp.swift`, `ios/Sources/RootView.swift`, `ios/Info.plist` (via project.yml `info:`), `ios/.gitignore` (`*.xcodeproj` is COMMITTED — do not ignore it; ignore `xcuserdata/`)
- Modify: `README.md` later (Task 14); `.gitignore` root: add `ios/**/xcuserdata/`

**Interfaces:**
- Produces: `ios/TaxfixExpert.xcodeproj`, app target `TaxfixExpert` (iOS 18.0, iPhone), test target `TaxfixExpertTests`. Build command used from here on:
  `cd ios && xcodebuild -project TaxfixExpert.xcodeproj -scheme TaxfixExpert -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build`

- [x] **Step 1: Install XcodeGen** — `brew install xcodegen` (if brew missing, `mint install yonaskolb/xcodegen` fallback; if both unavailable STOP and report).
- [x] **Step 2: Write `ios/project.yml`:**

```yaml
name: TaxfixExpert
options:
  bundleIdPrefix: co.cloover
  deploymentTarget:
    iOS: "18.0"
targets:
  TaxfixExpert:
    type: application
    platform: iOS
    sources: [Sources]
    resources: [Resources]
    info:
      path: Info.plist
      properties:
        UILaunchScreen: {}
        NSAppTransportSecurity:
          NSAllowsLocalNetworking: true
    settings:
      base:
        TARGETED_DEVICE_FAMILY: "1"
        SWIFT_VERSION: "5.10"
  TaxfixExpertTests:
    type: bundle.unit-test
    platform: iOS
    sources: [Tests]
    dependencies:
      - target: TaxfixExpert
```

- [x] **Step 3: Minimal app** — `ios/Sources/TaxfixApp.swift`:

```swift
import SwiftUI

@main
struct TaxfixApp: App {
    var body: some Scene {
        WindowGroup { RootView() }
    }
}
```

`ios/Sources/RootView.swift` (placeholder until Task 10):

```swift
import SwiftUI

struct RootView: View {
    var body: some View {
        Text("Taxfix Expert Service")
            .font(.largeTitle.bold())
    }
}
```

Create `ios/Tests/PlaceholderTests.swift`:

```swift
import XCTest

final class PlaceholderTests: XCTestCase {
    func testTruth() { XCTAssertTrue(true) }
}
```

- [x] **Step 4: Generate + build** — `cd ios && xcodegen generate && xcodebuild -project TaxfixExpert.xcodeproj -scheme TaxfixExpert -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build` → BUILD SUCCEEDED. Launch check: `xcrun simctl boot "iPhone 17 Pro" || true && xcrun simctl install booted $(find ~/Library/Developer/Xcode/DerivedData -name 'TaxfixExpert.app' -path '*iphonesimulator*' | head -1) && xcrun simctl launch booted co.cloover.TaxfixExpert`.
- [x] **Step 5: Commit** (include the generated `.xcodeproj`) — `feat: scaffold native ios app with xcodegen, builds on iphone simulator`

---

### Task 8: Swift models mirror the TS state (decode the seed fixture)

**Files:**
- Create: `ios/Sources/Models.swift`
- Create: `ios/Tests/ModelsTests.swift`
- Modify: `ios/project.yml` — none needed (`Sources`/`Tests` glob). Add `ios/Resources/seed.json` to the TEST target too: under `TaxfixExpertTests` add `resources: [Resources]`? No — instead reference via `Bundle(for:)` after adding `sources: [Tests]` plus `resources: ["Resources/seed.json"]` to the test target. Then `xcodegen generate` again.

**Interfaces:**
- Consumes: `seed.json` from Task 6; TS type shapes from Task 1.
- Produces (exact Swift API used by all later tasks):

```swift
enum ItemStatus: String, Codable { case needed, uploaded, verified, issue }
enum ItemGroup: String, Codable { case identity, employment, benefits, deductions }
enum CasePhase: String, Codable {
    case onboarding, sharing, preparing, approved, filed
    case awaitingApproval = "awaiting_approval"
}
enum Sender: String, Codable { case advisor, consumer }
struct ChecklistItem: Codable, Identifiable, Equatable { let id: String; let group: ItemGroup; let title: String; let germanName: String?; let explainer: String; let lookLike: String; let optional: Bool; var status: ItemStatus; var issueNote: String?; var uploadedFileName: String?; var uploadedAt: String? }
struct FollowUp: Codable, Identifiable, Equatable { let id: String; let itemId: String?; let from: Sender; let message: String; let createdAt: String; var status: FollowUpStatus; var reply: String? }
enum FollowUpStatus: String, Codable { case open, answered }
struct ReturnDraft: Codable, Equatable { let income: String; let taxPaid: String; let deductions: String; let refundEstimate: String; let note: String? }
struct CaseState: Codable, Equatable {
    var phase: CasePhase
    var items: [ChecklistItem]
    var followUps: [FollowUp]
    var draft: ReturnDraft?
    var filedAt: String?
    static func seed() -> CaseState   // loads seed.json from bundle; falls back to empty sharing state
    var requiredItems: [ChecklistItem] { get }
    var sharedCount: Int { get }      // required items uploaded or verified
    var allRequiredIn: Bool { get }   // mirrors advisorCanStart — display-only duplicate, noted
}
struct Advisor { static let name = "Anna Weber"; static let title = "Steuerberaterin"; static let responsePromise = "Replies within 1 business day"; static let initials = "AW" }
```

- [x] **Step 1: Write the failing test** — `ios/Tests/ModelsTests.swift`:

```swift
import XCTest
@testable import TaxfixExpert

final class ModelsTests: XCTestCase {
    func testSeedFixtureDecodes() throws {
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "seed", withExtension: "json"))
        let state = try JSONDecoder().decode(CaseState.self, from: Data(contentsOf: url))
        XCTAssertEqual(state.phase, .onboarding)
        XCTAssertGreaterThanOrEqual(state.items.count, 6)
        XCTAssertEqual(state.items.first?.status, .verified)
        XCTAssertEqual(state.sharedCount, 2)
        XCTAssertFalse(state.allRequiredIn)
    }

    func testPhaseRawValues() {
        XCTAssertEqual(CasePhase.awaitingApproval.rawValue, "awaiting_approval")
    }
}
```

- [x] **Step 2: Add seed.json to the test target** in `project.yml` (`TaxfixExpertTests` gains `resources: ["Resources/seed.json"]`), `xcodegen generate`, run tests → FAIL (no Models).
- [x] **Step 3: Implement `ios/Sources/Models.swift`** exactly per the Produces block; computed helpers:

```swift
extension CaseState {
    var requiredItems: [ChecklistItem] { items.filter { !$0.optional } }
    var sharedCount: Int { requiredItems.filter { $0.status == .uploaded || $0.status == .verified }.count }
    var allRequiredIn: Bool { requiredItems.allSatisfy { $0.status == .uploaded || $0.status == .verified } }

    static func seed() -> CaseState {
        if let url = Bundle.main.url(forResource: "seed", withExtension: "json"),
           let state = try? JSONDecoder().decode(CaseState.self, from: Data(contentsOf: url)) {
            return state
        }
        return CaseState(phase: .sharing, items: [], followUps: [], draft: nil, filedAt: nil)
    }
}
```

- [x] **Step 4: Run** — `cd ios && xcodebuild -project TaxfixExpert.xcodeproj -scheme TaxfixExpert -destination 'platform=iOS Simulator,name=iPhone 17 Pro' test` → PASS.
- [x] **Step 5: Commit** — `feat: swift models decode the shared case state fixture`

---

### Task 9: Swift CaseStore — WebSocket client, actions, token store

**Files:**
- Create: `ios/Sources/CaseStore.swift`, `ios/Sources/CaseAction.swift`, `ios/Sources/TokenStore.swift`
- Create: `ios/Tests/StoreTests.swift`
- Modify: `ios/Sources/TaxfixApp.swift` (inject store)

**Interfaces:**
- Consumes: Models (Task 8), `Tokens.defaults` (Task 6), relay protocol (Task 2).
- Produces:

```swift
enum CaseAction {
    case uploadItem(itemId: String, fileName: String)
    case askAdvisor(itemId: String, question: String)
    case answerFollowUp(followUpId: String, reply: String)
    case commitCase, approveReturn, reset
    var json: [String: Any] { get }  // e.g. ["type": "UPLOAD_ITEM", "itemId": …, "fileName": …]
}

@Observable final class TokenStore {
    var overrides: [String: String]
    func color(_ name: String) -> Color      // overrides → Tokens.defaults → .primary; parses #rrggbb
    func size(_ name: String) -> CGFloat     // parses "16px" → 16
}

@Observable final class CaseStore {
    var state: CaseState
    var connected: Bool
    let tokens: TokenStore
    var metAnna: Bool                        // one-time Meet-Anna intro sheet flag
    init(connect: Bool = true)               // connect:false for tests/previews
    func send(_ action: CaseAction)          // socket when connected, else applyLocally
    func applyLocally(_ action: CaseAction)  // demo fallback ONLY — minimal optimistic switch
}
```

- [x] **Step 1: Write the failing tests** — `ios/Tests/StoreTests.swift`:

```swift
import XCTest
import SwiftUI
@testable import TaxfixExpert

final class StoreTests: XCTestCase {
    func testActionEncodesToReducerShape() throws {
        let json = CaseAction.uploadItem(itemId: "lohnsteuer", fileName: "scan.jpg").json
        XCTAssertEqual(json["type"] as? String, "UPLOAD_ITEM")
        XCTAssertEqual(json["itemId"] as? String, "lohnsteuer")
        XCTAssertEqual(json["fileName"] as? String, "scan.jpg")
    }

    func testTokenStoreParsesColorAndSize() {
        let tokens = TokenStore()
        XCTAssertEqual(tokens.size("--radius-card"), 16)
        tokens.overrides["--radius-card"] = "24px"
        XCTAssertEqual(tokens.size("--radius-card"), 24)
        XCTAssertNotNil(tokens.color("--color-primary"))
    }

    func testOfflineStoreAppliesUploadLocally() {
        let store = CaseStore(connect: false)
        store.send(.commitCase)
        XCTAssertEqual(store.state.phase, .sharing)
        store.send(.uploadItem(itemId: "lohnsteuer", fileName: "scan.jpg"))
        XCTAssertEqual(store.state.items.first { $0.id == "lohnsteuer" }?.status, .uploaded)
    }
}
```

- [x] **Step 2: Run to verify FAIL** (xcodebuild test).
- [x] **Step 3: Implement.** `CaseAction.swift`:

```swift
enum CaseAction {
    case uploadItem(itemId: String, fileName: String)
    case askAdvisor(itemId: String, question: String)
    case answerFollowUp(followUpId: String, reply: String)
    case commitCase, approveReturn, reset

    var json: [String: Any] {
        switch self {
        case let .uploadItem(itemId, fileName):
            ["type": "UPLOAD_ITEM", "itemId": itemId, "fileName": fileName]
        case let .askAdvisor(itemId, question):
            ["type": "ASK_ADVISOR", "itemId": itemId, "question": question]
        case let .answerFollowUp(followUpId, reply):
            ["type": "ANSWER_FOLLOW_UP", "followUpId": followUpId, "reply": reply]
        case .commitCase: ["type": "COMMIT_CASE"]
        case .approveReturn: ["type": "APPROVE_RETURN"]
        case .reset: ["type": "RESET"]
        }
    }
}
```

`TokenStore.swift`:

```swift
import SwiftUI

@Observable final class TokenStore {
    var overrides: [String: String] = [:]

    private func raw(_ name: String) -> String? { overrides[name] ?? Tokens.defaults[name] }

    func color(_ name: String) -> Color {
        guard let hex = raw(name), hex.hasPrefix("#"), hex.count == 7,
              let v = UInt64(hex.dropFirst(), radix: 16) else { return .primary }
        return Color(
            red: Double((v >> 16) & 0xFF) / 255,
            green: Double((v >> 8) & 0xFF) / 255,
            blue: Double(v & 0xFF) / 255)
    }

    func size(_ name: String) -> CGFloat {
        guard let px = raw(name)?.replacingOccurrences(of: "px", with: ""),
              let value = Double(px) else { return 0 }
        return CGFloat(value)
    }
}
```

`CaseStore.swift`:

```swift
import Foundation
import Observation

@Observable final class CaseStore {
    var state: CaseState = .seed()
    var connected = false
    var metAnna = false
    let tokens = TokenStore()

    private var task: URLSessionWebSocketTask?
    private let url = URL(string: "ws://127.0.0.1:8787")!
    private var shouldConnect: Bool

    init(connect: Bool = true) {
        shouldConnect = connect
        if connect { open() }
    }

    private func open() {
        let task = URLSession.shared.webSocketTask(with: url)
        self.task = task
        task.resume()
        receive(on: task)
    }

    private func receive(on task: URLSessionWebSocketTask) {
        task.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let message):
                if case .string(let text) = message { Task { @MainActor in self.handle(text) } }
                self.receive(on: task)
            case .failure:
                Task { @MainActor in
                    self.connected = false
                    try? await Task.sleep(for: .seconds(1))
                    if self.shouldConnect { self.open() }
                }
            }
        }
    }

    private struct Envelope: Decodable {
        let kind: String
        let state: CaseState?
        let overrides: [String: String]?
    }

    @MainActor private func handle(_ text: String) {
        guard let env = try? JSONDecoder().decode(Envelope.self, from: Data(text.utf8)) else { return }
        connected = true
        if env.kind == "state", let s = env.state { state = s }
        if env.kind == "tokens", let o = env.overrides { tokens.overrides = o }
    }

    func send(_ action: CaseAction) {
        guard connected, let task,
              let data = try? JSONSerialization.data(withJSONObject: ["kind": "action", "action": action.json]),
              let text = String(data: data, encoding: .utf8) else {
            applyLocally(action)
            return
        }
        task.send(.string(text)) { [weak self] error in
            if error != nil { Task { @MainActor in self?.applyLocally(action) } }
        }
    }

    // Demo fallback ONLY: the reducer of record runs on the relay. This keeps the
    // phone usable if the socket is down mid-panel — it is not business logic.
    func applyLocally(_ action: CaseAction) {
        switch action {
        case let .uploadItem(itemId, fileName):
            if let i = state.items.firstIndex(where: { $0.id == itemId }) {
                state.items[i].status = .uploaded
                state.items[i].uploadedFileName = fileName
                state.items[i].issueNote = nil
            }
        case let .askAdvisor(itemId, question):
            state.followUps.append(FollowUp(id: UUID().uuidString, itemId: itemId, from: .consumer,
                                            message: question, createdAt: "", status: .open, reply: nil))
        case let .answerFollowUp(followUpId, reply):
            if let i = state.followUps.firstIndex(where: { $0.id == followUpId }) {
                state.followUps[i].status = .answered
                state.followUps[i].reply = reply
            }
        case .commitCase: state.phase = .sharing
        case .approveReturn: state.phase = .approved
        case .reset: state = .seed(); metAnna = false
        }
    }
}
```

`TaxfixApp.swift` becomes:

```swift
import SwiftUI

@main
struct TaxfixApp: App {
    @State private var store = CaseStore()
    var body: some Scene {
        WindowGroup { RootView().environment(store) }
    }
}
```

- [x] **Step 4: Run tests → PASS** (xcodebuild test). Manual: with `npm run relay` running, launch app, confirm Xcode console shows no decode errors.
- [x] **Step 5: Commit** — `feat: swift case store with websocket sync, action encoding and live tokens`

---

### Task 10: Onboarding runway (W1–C2) — linear, one anxiety per screen

**Files:**
- Create: `ios/Sources/Views/Onboarding/OnboardingFlow.swift`, `WelcomeView.swift`, `LiabilityQuestionView.swift`, `LiabilityResultView.swift`, `HowItWorksView.swift`, `PricingView.swift`
- Create: `ios/Sources/Views/Components/PrimaryButton.swift`, `AdvisorBadge.swift`
- Modify: `ios/Sources/RootView.swift`

**Interfaces:**
- Consumes: `CaseStore` (`send(.commitCase)`), `TokenStore` colors.
- Produces: `RootView` routes: `phase == .onboarding` → `OnboardingFlow()`; else `CaseRootView()` (stub in this task: `Text("Case")`, replaced in Task 11). `OnboardingStep` enum: `welcome, q1, q2, q3, result, howItWorks, pricing`. `PrimaryButton(title:action:)` — full-width capsule, `tokens.color("--color-primary")` background. `AdvisorBadge` — circle with `Advisor.initials` + name + title line, reused by Tasks 11–12.

- [x] **Step 1: Implement components.** `PrimaryButton.swift`:

```swift
import SwiftUI

struct PrimaryButton: View {
    @Environment(CaseStore.self) private var store
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.body.weight(.semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(store.tokens.color("--color-primary"), in: Capsule())
                .foregroundStyle(.white)
        }
        .buttonStyle(.plain)
    }
}
```

`AdvisorBadge.swift`:

```swift
import SwiftUI

struct AdvisorBadge: View {
    @Environment(CaseStore.self) private var store
    var showPromise = true

    var body: some View {
        HStack(spacing: 12) {
            Text(Advisor.initials)
                .font(.headline)
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(store.tokens.color("--color-primary"), in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(Advisor.name).font(.headline)
                Text(Advisor.title).font(.subheadline).foregroundStyle(.secondary)
                if showPromise {
                    Text(Advisor.responsePromise).font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer()
        }
    }
}
```

- [x] **Step 2: Implement the flow.** `OnboardingFlow.swift` — data-driven questions, spring transitions:

```swift
import SwiftUI

enum OnboardingStep: Int, CaseIterable { case welcome, q1, q2, q3, result, howItWorks, pricing }

struct LiabilityQuestion {
    let title: String
    let subtitle: String
    let options: [String]
}

let LIABILITY_QUESTIONS: [OnboardingStep: LiabilityQuestion] = [
    .q1: LiabilityQuestion(
        title: "What was your job status in 2025?",
        subtitle: "This tells us which rules apply to you.",
        options: ["Employed all year", "Employed, with a gap", "Self-employed", "Student"]),
    .q2: LiabilityQuestion(
        title: "Did you receive unemployment benefits?",
        subtitle: "Arbeitslosengeld I — the payments from the Agentur für Arbeit between jobs.",
        options: ["Yes, for a few months", "Yes, all year", "No"]),
    .q3: LiabilityQuestion(
        title: "Anything else in 2025?",
        subtitle: "Last one — just so nothing surprises you later.",
        options: ["More than one employer", "Some freelance income", "None of these"]),
]

struct OnboardingFlow: View {
    @Environment(CaseStore.self) private var store
    @State private var step: OnboardingStep = .welcome

    var body: some View {
        VStack(spacing: 0) {
            if step != .welcome { progressDots }
            Group {
                switch step {
                case .welcome: WelcomeView { advance(.q1) }
                case .q1, .q2, .q3:
                    LiabilityQuestionView(question: LIABILITY_QUESTIONS[step]!) {
                        advance(step == .q3 ? .result : OnboardingStep(rawValue: step.rawValue + 1)!)
                    }
                case .result: LiabilityResultView { advance(.howItWorks) }
                case .howItWorks: HowItWorksView { advance(.pricing) }
                case .pricing: PricingView { store.send(.commitCase) }
                }
            }
            .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity),
                                    removal: .move(edge: .leading).combined(with: .opacity)))
        }
        .animation(.spring(duration: 0.35), value: step)
    }

    private func advance(_ to: OnboardingStep) { step = to }

    private var progressDots: some View {
        HStack(spacing: 6) {
            ForEach(OnboardingStep.allCases.dropFirst(), id: \.rawValue) { s in
                Circle()
                    .fill(s.rawValue <= step.rawValue ? store.tokens.color("--color-primary") : Color(.systemGray4))
                    .frame(width: 7, height: 7)
            }
        }
        .padding(.top, 12)
        .accessibilityHidden(true)
    }
}
```

`WelcomeView.swift`:

```swift
import SwiftUI

struct WelcomeView: View {
    @Environment(CaseStore.self) private var store
    let next: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 64))
                .foregroundStyle(store.tokens.color("--color-primary"))
            Text("An expert files your German taxes.\nIn English.")
                .font(.largeTitle.bold())
                .multilineTextAlignment(.center)
            Text("First mandatory filing? A qualified Steuerberater handles everything — you just share a few documents.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Spacer()
            PrimaryButton(title: "Do I need to file?", action: next)
        }
        .padding(24)
    }
}
```

`LiabilityQuestionView.swift` — one question per screen, big tappable options:

```swift
import SwiftUI

struct LiabilityQuestionView: View {
    @Environment(CaseStore.self) private var store
    let question: LiabilityQuestion
    let next: () -> Void
    @State private var selected: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(question.title).font(.title.bold()).padding(.top, 24)
            Text(question.subtitle).font(.subheadline).foregroundStyle(.secondary)
            ForEach(question.options, id: \.self) { option in
                Button {
                    selected = option
                    Task { try? await Task.sleep(for: .milliseconds(250)); next() }
                } label: {
                    HStack {
                        Text(option).font(.body)
                        Spacer()
                        Image(systemName: selected == option ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(store.tokens.color("--color-primary"))
                    }
                    .padding(16)
                    .background(Color(.secondarySystemBackground),
                                in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-control")))
                }
                .buttonStyle(.plain)
            }
            Spacer()
        }
        .padding(24)
    }
}
```

`LiabilityResultView.swift` (calm result, the pivot to assisted service):

```swift
import SwiftUI

struct LiabilityResultView: View {
    @Environment(CaseStore.self) private var store
    let next: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Spacer()
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 48))
                .foregroundStyle(store.tokens.color("--color-primary"))
            Text("Yes — filing is required for you.")
                .font(.title.bold())
            Text("Unemployment benefits over €410 make a tax return mandatory. That's the rule — and it's routine, not trouble.")
                .foregroundStyle(.secondary)
            Label("Deadline 31 July — plenty of time with an expert", systemImage: "calendar")
                .font(.subheadline.weight(.medium))
                .padding(10)
                .background(Color(.secondarySystemBackground), in: Capsule())
            Text("You don't have to do this alone.")
                .font(.headline)
            Spacer()
            PrimaryButton(title: "See how it works", action: next)
        }
        .padding(24)
    }
}
```

`HowItWorksView.swift` — three steps, advisor already visible:

```swift
import SwiftUI

struct HowItWorksView: View {
    @Environment(CaseStore.self) private var store
    let next: () -> Void

    private let steps: [(icon: String, title: String, detail: String)] = [
        ("tray.and.arrow.up", "You share a short checklist", "Photos of a few documents — about 15 minutes."),
        ("person.text.rectangle", "Anna prepares and files", "A qualified Steuerberaterin does the tax work."),
        ("checkmark.circle", "You review and approve", "Nothing is filed until you've seen it."),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("How it works").font(.largeTitle.bold()).padding(.top, 24)
            ForEach(steps, id: \.title) { step in
                HStack(alignment: .top, spacing: 16) {
                    Image(systemName: step.icon)
                        .font(.title3)
                        .foregroundStyle(store.tokens.color("--color-primary"))
                        .frame(width: 32)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(step.title).font(.headline)
                        Text(step.detail).font(.subheadline).foregroundStyle(.secondary)
                    }
                }
            }
            Divider()
            AdvisorBadge()
            Spacer()
            PrimaryButton(title: "What does it cost?", action: next)
        }
        .padding(24)
    }
}
```

`PricingView.swift` — one price, pay-on-approval, the commit CTA:

```swift
import SwiftUI

struct PricingView: View {
    @Environment(CaseStore.self) private var store
    let commit: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("One flat price").font(.largeTitle.bold()).padding(.top, 24)
            Text("€119.99").font(.system(size: 44, weight: .bold))
                .foregroundStyle(store.tokens.color("--color-primary"))
            VStack(alignment: .leading, spacing: 12) {
                Label("Your full 2025 return, prepared and filed", systemImage: "checkmark")
                Label("A named Steuerberaterin — not a chatbot", systemImage: "checkmark")
                Label("Pay only when you approve the return", systemImage: "checkmark")
            }
            .font(.body)
            Spacer()
            PrimaryButton(title: "Start with Anna", action: commit)
            Text("No payment now. Cancel any time before you approve.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity)
        }
        .padding(24)
    }
}
```

`RootView.swift`:

```swift
import SwiftUI

struct RootView: View {
    @Environment(CaseStore.self) private var store

    var body: some View {
        if store.state.phase == .onboarding {
            OnboardingFlow()
        } else {
            CaseRootView()
        }
    }
}

// Replaced with the real case UI in Task 11.
struct CaseRootView: View {
    var body: some View { Text("Case") }
}
```

- [x] **Step 3: Build + run in simulator.** Walk W1→pricing; tap "Start with Anna" with the relay running and the advisor open in a browser → **the case appears in Anna's queue live**. This is the marketplace beat — verify it.
- [x] **Step 4: xcodebuild test still green. Commit** — `feat: onboarding runway — welcome, liability check, result, how it works, pricing`

---

### Task 11: Hand-off surface (S1–S5) — the deep slice

**Files:**
- Create: `ios/Sources/Views/Case/CaseRootView.swift` (replaces stub in `RootView.swift` — DELETE the stub), `CaseHomeView.swift`, `ChecklistView.swift`, `ItemDetailView.swift`, `FollowUpsView.swift`, `MomentumView.swift`, `MeetAnnaSheet.swift`
- Create: `ios/Sources/Views/Components/StatusPillView.swift`, `TimelineView.swift`

**Interfaces:**
- Consumes: everything above.
- Produces: `CaseRootView` — switches on phase: `.sharing` → `NavigationStack` (CaseHome → Checklist → ItemDetail; FollowUps reachable from home); `.preparing/.awaitingApproval/.approved/.filed` → completion views (Task 12 — stub `PreparingView()` as `Text("Preparing")` here, replaced next task). Presents `MeetAnnaSheet` once (`store.metAnna`). `StatusPillView(status: ItemStatus)` and `TimelineView(phase: CasePhase, allIn: Bool)` are shared with Task 12.

- [x] **Step 1: Components.** `StatusPillView.swift`:

```swift
import SwiftUI

struct StatusPillView: View {
    @Environment(CaseStore.self) private var store
    let status: ItemStatus

    private var config: (label: String, color: Color) {
        switch status {
        case .needed: ("To share", Color(.systemGray))
        case .uploaded: ("Sent", store.tokens.color("--color-primary"))
        case .verified: ("Checked ✓", store.tokens.color("--color-success"))
        case .issue: ("Needs attention", store.tokens.color("--color-issue"))
        }
    }

    var body: some View {
        Text(config.label)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 10).padding(.vertical, 4)
            .background(config.color.opacity(0.15), in: Capsule())
            .foregroundStyle(config.color)
    }
}
```

`TimelineView.swift` — the visible state machine (5 consumer-facing stages):

```swift
import SwiftUI

struct TimelineView: View {
    @Environment(CaseStore.self) private var store
    let phase: CasePhase
    let allIn: Bool

    private var currentIndex: Int {
        switch phase {
        case .onboarding: 0
        case .sharing: 1
        case .preparing: 2
        case .awaitingApproval, .approved: 3
        case .filed: 4
        }
    }

    private let stages = ["Committed", "Share your info", "Anna prepares", "You review", "Filed"]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(Array(stages.enumerated()), id: \.offset) { index, stage in
                HStack(spacing: 10) {
                    Circle()
                        .fill(index < currentIndex ? store.tokens.color("--color-success")
                              : index == currentIndex ? store.tokens.color("--color-primary")
                              : Color(.systemGray4))
                        .frame(width: 10, height: 10)
                    Text(stage)
                        .font(index == currentIndex ? .subheadline.weight(.semibold) : .subheadline)
                        .foregroundStyle(index <= currentIndex ? .primary : .secondary)
                }
            }
        }
    }
}
```

- [x] **Step 2: Case root + home.** `CaseRootView.swift`:

```swift
import SwiftUI

struct CaseRootView: View {
    @Environment(CaseStore.self) private var store

    var body: some View {
        Group {
            switch store.state.phase {
            case .onboarding: EmptyView() // RootView never routes here in onboarding
            case .sharing:
                NavigationStack { CaseHomeView() }
            case .preparing: PreparingView()
            case .awaitingApproval: ReviewView()
            case .approved: ApprovedView()
            case .filed: FiledView()
            }
        }
        .sheet(isPresented: metAnnaBinding) { MeetAnnaSheet() }
    }

    private var metAnnaBinding: Binding<Bool> {
        Binding(get: { !store.metAnna && store.state.phase == .sharing },
                set: { if !$0 { store.metAnna = true } })
    }
}
```

`MeetAnnaSheet.swift` (H1 — one-time intro over the case):

```swift
import SwiftUI

struct MeetAnnaSheet: View {
    @Environment(CaseStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 20) {
            Capsule().fill(Color(.systemGray4)).frame(width: 36, height: 5).padding(.top, 8)
            Spacer()
            Text(Advisor.initials)
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 96, height: 96)
                .background(store.tokens.color("--color-primary"), in: Circle())
            Text("Meet \(Advisor.name)").font(.title.bold())
            Text("\(Advisor.title) · 11 years of German returns\n\(Advisor.responsePromise)")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
            Text("Your checklist is ready — most people finish it in 15 minutes.")
                .font(.headline)
                .multilineTextAlignment(.center)
            Spacer()
            PrimaryButton(title: "See what Anna needs") { store.metAnna = true; dismiss() }
        }
        .padding(24)
        .presentationDetents([.large])
    }
}
```

`CaseHomeView.swift` (S1 — timeline, advisor card, progress, calm deadline, banners):

```swift
import SwiftUI

struct CaseHomeView: View {
    @Environment(CaseStore.self) private var store

    private var issues: [ChecklistItem] { store.state.items.filter { $0.status == .issue } }
    private var openFollowUps: [FollowUp] { store.state.followUps.filter { $0.from == .advisor && $0.status == .open } }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if let issue = issues.first {
                    NavigationLink(value: issue.id) {
                        Label("Anna needs a new version of “\(issue.title)”", systemImage: "exclamationmark.circle.fill")
                            .font(.subheadline.weight(.medium))
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(store.tokens.color("--color-issue").opacity(0.12),
                                        in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-control")))
                            .foregroundStyle(store.tokens.color("--color-issue"))
                    }
                }
                if !openFollowUps.isEmpty {
                    NavigationLink {
                        FollowUpsView()
                    } label: {
                        Label("\(openFollowUps.count) question\(openFollowUps.count == 1 ? "" : "s") from Anna",
                              systemImage: "bubble.left.fill")
                            .font(.subheadline.weight(.medium))
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(.secondarySystemBackground),
                                        in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-control")))
                    }
                }

                GroupBox { TimelineView(phase: store.state.phase, allIn: store.state.allRequiredIn) }
                GroupBox { AdvisorBadge() }

                VStack(alignment: .leading, spacing: 8) {
                    ProgressView(value: Double(store.state.sharedCount), total: Double(store.state.requiredItems.count))
                        .tint(store.tokens.color("--color-primary"))
                    Text("\(store.state.sharedCount) of \(store.state.requiredItems.count) shared")
                        .font(.caption).foregroundStyle(.secondary)
                }

                Label("Deadline 31 July — on track", systemImage: "calendar")
                    .font(.subheadline.weight(.medium))
                    .padding(10)
                    .background(Color(.secondarySystemBackground), in: Capsule())

                if store.state.allRequiredIn {
                    MomentumView()
                } else {
                    NavigationLink { ChecklistView() } label: { EmptyView() }
                        .opacity(0)
                    NavigationLink(destination: ChecklistView()) {
                        Text("Continue sharing info")
                            .font(.body.weight(.semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(store.tokens.color("--color-primary"), in: Capsule())
                            .foregroundStyle(.white)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(20)
        }
        .navigationTitle("Your tax return 2025")
        .navigationDestination(for: String.self) { itemId in
            if let item = store.state.items.first(where: { $0.id == itemId }) {
                ItemDetailView(item: item)
            }
        }
    }
}
```

- [x] **Step 3: Checklist + item detail.** `ChecklistView.swift` (S2 — grouped, plain-English first, German second):

```swift
import SwiftUI

struct ChecklistView: View {
    @Environment(CaseStore.self) private var store

    private let groups: [(ItemGroup, String)] = [
        (.identity, "Identity & basics"),
        (.employment, "Employment income"),
        (.benefits, "Unemployment benefits"),
        (.deductions, "Deductions — optional, can raise your refund"),
    ]

    var body: some View {
        List {
            ForEach(groups, id: \.0) { group, title in
                let items = store.state.items.filter { $0.group == group }
                if !items.isEmpty {
                    Section(title) {
                        ForEach(items) { item in
                            NavigationLink(value: item.id) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(item.title).font(.body)
                                        if let german = item.germanName {
                                            Text(german).font(.caption).foregroundStyle(.secondary)
                                        }
                                    }
                                    Spacer()
                                    StatusPillView(status: item.status)
                                }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("What Anna needs")
        .navigationBarTitleDisplayMode(.large)
    }
}
```

`ItemDetailView.swift` (S3 — explainer, capture, receipt, escape hatch; the deepest screen in the app):

```swift
import SwiftUI
import PhotosUI

struct ItemDetailView: View {
    @Environment(CaseStore.self) private var store
    let item: ChecklistItem
    @State private var showEscapeHatch = false
    @State private var photoItem: PhotosPickerItem?

    private var live: ChecklistItem { store.state.items.first { $0.id == item.id } ?? item }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack { StatusPillView(status: live.status); Spacer() }

                if live.status == .issue, let note = live.issueNote {
                    Label(note, systemImage: "exclamationmark.circle.fill")
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(store.tokens.color("--color-issue").opacity(0.12),
                                    in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-control")))
                        .foregroundStyle(store.tokens.color("--color-issue"))
                }

                if let german = live.germanName {
                    Text(german).font(.subheadline).foregroundStyle(.secondary)
                }
                Text(live.explainer).font(.body)

                GroupBox {
                    Label(live.lookLike, systemImage: "doc.text")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                } label: {
                    Text("What it looks like").font(.caption).foregroundStyle(.secondary)
                }

                if live.status == .uploaded || live.status == .verified {
                    Label(live.status == .verified ? "Checked by Anna ✓" : "Sent to Anna — she'll check it",
                          systemImage: live.status == .verified ? "checkmark.seal.fill" : "paperplane.fill")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(store.tokens.color("--color-success"))
                }

                Spacer(minLength: 12)

                if live.status == .needed || live.status == .issue {
                    PrimaryButton(title: "Take a photo") { upload(named: "photo-\(live.id).jpg") }
                    PhotosPicker(selection: $photoItem, matching: .images) {
                        Text("Choose from library")
                            .font(.body.weight(.medium))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(.secondarySystemBackground), in: Capsule())
                    }
                    .onChange(of: photoItem) { _, newValue in
                        if newValue != nil { upload(named: "library-\(live.id).jpg") }
                    }
                    Button("I don't have this") { showEscapeHatch = true }
                        .font(.subheadline)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(20)
        }
        .navigationTitle(live.title)
        .navigationBarTitleDisplayMode(.large)
        .sheet(isPresented: $showEscapeHatch) { EscapeHatchSheet(item: live) }
    }

    private func upload(named fileName: String) {
        store.send(.uploadItem(itemId: live.id, fileName: fileName))
    }
}

// The #1 stall — "I don't have this" — gets a forward path, never a dead-end.
struct EscapeHatchSheet: View {
    @Environment(CaseStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let item: ChecklistItem
    @State private var sent = false

    var body: some View {
        NavigationStack {
            List {
                Section("No problem — here's the way forward") {
                    Label {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("How to get it").font(.headline)
                            Text(sourcingTip).font(.subheadline).foregroundStyle(.secondary)
                        }
                    } icon: { Image(systemName: "lightbulb") }

                    Button {
                        store.send(.askAdvisor(itemId: item.id,
                                               question: "I don't have my \(item.title) — what should I do?"))
                        sent = true
                    } label: {
                        Label {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(sent ? "Asked Anna ✓" : "Ask Anna").font(.headline)
                                Text(sent ? "She replies within 1 business day."
                                          : "She's seen every version of this.")
                                    .font(.subheadline).foregroundStyle(.secondary)
                            }
                        } icon: { Image(systemName: sent ? "checkmark.circle.fill" : "bubble.left") }
                    }
                    .disabled(sent)

                    Button {
                        store.send(.askAdvisor(itemId: item.id,
                                               question: "Not sure the \(item.title) applies to me — does it?"))
                        sent = true
                    } label: {
                        Label {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Not sure this applies to me").font(.headline)
                                Text("Anna will confirm either way.").font(.subheadline).foregroundStyle(.secondary)
                            }
                        } icon: { Image(systemName: "questionmark.circle") }
                    }
                    .disabled(sent)
                }
            }
            .navigationTitle("I don't have this")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private var sourcingTip: String {
        switch item.group {
        case .employment: "Your employer's HR portal has it, or email payroll — they must provide it."
        case .benefits: "Log in to arbeitsagentur.de → Postfach. The Bescheid is under your messages."
        default: "Check the letter pile — it arrived by post. Anna can also request a copy."
        }
    }
}
```

- [x] **Step 4: Follow-ups + momentum.** `FollowUpsView.swift` (S4 — bounded tasks with reasons, inline answer):

```swift
import SwiftUI

struct FollowUpsView: View {
    @Environment(CaseStore.self) private var store
    @State private var replies: [String: String] = [:]

    var body: some View {
        List {
            let advisorAsks = store.state.followUps.filter { $0.from == .advisor }
            if advisorAsks.isEmpty {
                ContentUnavailableView("No requests from Anna",
                                       systemImage: "tray",
                                       description: Text("When Anna needs something, it lands here as a small task — not a chat."))
            }
            ForEach(advisorAsks) { followUp in
                Section {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack(spacing: 8) {
                            Text(Advisor.initials)
                                .font(.caption.bold()).foregroundStyle(.white)
                                .frame(width: 24, height: 24)
                                .background(store.tokens.color("--color-primary"), in: Circle())
                            Text(Advisor.name).font(.caption).foregroundStyle(.secondary)
                        }
                        Text(followUp.message).font(.body)
                        if followUp.status == .answered, let reply = followUp.reply {
                            Label(reply, systemImage: "checkmark.circle.fill")
                                .font(.subheadline)
                                .foregroundStyle(store.tokens.color("--color-success"))
                        } else {
                            HStack {
                                TextField("Reply to Anna…", text: binding(for: followUp.id))
                                    .textFieldStyle(.roundedBorder)
                                Button("Send") {
                                    let reply = replies[followUp.id, default: ""].trimmingCharacters(in: .whitespaces)
                                    guard !reply.isEmpty else { return }
                                    store.send(.answerFollowUp(followUpId: followUp.id, reply: reply))
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(store.tokens.color("--color-primary"))
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .navigationTitle("Follow-ups")
    }

    private func binding(for id: String) -> Binding<String> {
        Binding(get: { replies[id, default: ""] }, set: { replies[id] = $0 })
    }
}
```

`MomentumView.swift` (S5 — inline card on CaseHome when everything required is in):

```swift
import SwiftUI

struct MomentumView: View {
    @Environment(CaseStore.self) private var store

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 44))
                .foregroundStyle(store.tokens.color("--color-success"))
            Text("That's everything Anna needs to start.")
                .font(.title3.bold())
                .multilineTextAlignment(.center)
            Text("The ball is in her court now — next update by Tuesday.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(store.tokens.color("--color-success").opacity(0.08),
                    in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-card")))
    }
}
```

Also create stubs so the target compiles (replaced in Task 12): `PreparingView`, `ReviewView`, `ApprovedView`, `FiledView` each as `Text("…")` in one temporary file `ios/Sources/Views/Case/CompletionStubs.swift`.
Remove `struct CaseRootView` stub from `RootView.swift`.

- [x] **Step 5: Build, run, verify against the relay + advisor browser:** upload flips advisor row to "Sent" live; advisor Flag issue → phone shows issue banner + "Needs attention" pill; advisor follow-up → lands in Follow-ups; all required in → Momentum card. `xcodebuild test` green.
- [x] **Step 6: Commit** — `feat: native hand-off surface — case home, checklist, upload, escape hatch, follow-ups, momentum`

---

### Task 12: Completion loop (S6–S8) — preparing, review & approve, filed

**Files:**
- Create: `ios/Sources/Views/Case/PreparingView.swift`, `ReviewView.swift`, `FiledView.swift`
- Delete: `ios/Sources/Views/Case/CompletionStubs.swift`

**Interfaces:**
- Consumes: `store.state.draft`, `store.state.filedAt`, `send(.approveReturn)`, `TimelineView`, `AdvisorBadge`, `PrimaryButton`.
- Produces: `ApprovedView` lives inside `FiledView.swift` file? No — put `ApprovedView` in `PreparingView.swift`'s file? No. Each view gets its own file; `ApprovedView` goes in `ReviewView.swift` beneath `ReviewView` (they share the summary row helper `SummaryRow`).

- [x] **Step 1: `PreparingView.swift`** (S6 — quiet reassurance, no action demanded):

```swift
import SwiftUI

struct PreparingView: View {
    @Environment(CaseStore.self) private var store

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            ProgressView().controlSize(.large)
            Text("Anna is preparing your return.")
                .font(.title2.bold())
            Text("Nothing needed from you right now. You'll review everything before it's filed.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            GroupBox { TimelineView(phase: .preparing, allIn: true) }
            Spacer()
            AdvisorBadge()
        }
        .padding(24)
    }
}
```

- [x] **Step 2: `ReviewView.swift`** (S7 — informed consent, refund as hero, ask-a-question path):

```swift
import SwiftUI

struct SummaryRow: View {
    let label: String
    let value: String
    var body: some View {
        HStack { Text(label).foregroundStyle(.secondary); Spacer(); Text(value).fontWeight(.medium) }
            .font(.body)
    }
}

struct ReviewView: View {
    @Environment(CaseStore.self) private var store
    @State private var askingQuestion = false
    @State private var question = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Your return is ready to review")
                    .font(.largeTitle.bold()).padding(.top, 24)

                if let draft = store.state.draft {
                    VStack(spacing: 6) {
                        Text("Estimated refund").font(.subheadline).foregroundStyle(.secondary)
                        Text(draft.refundEstimate)
                            .font(.system(size: 44, weight: .bold))
                            .foregroundStyle(store.tokens.color("--color-success"))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(20)
                    .background(store.tokens.color("--color-success").opacity(0.08),
                                in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-card")))

                    GroupBox {
                        VStack(spacing: 10) {
                            SummaryRow(label: "Income", value: draft.income)
                            SummaryRow(label: "Tax already paid", value: draft.taxPaid)
                            SummaryRow(label: "Deductions Anna found", value: draft.deductions)
                        }
                    } label: { Text("The numbers").font(.caption).foregroundStyle(.secondary) }
                }

                GroupBox {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Your income statement against employer records", systemImage: "checkmark")
                        Label("Unemployment benefits declared correctly", systemImage: "checkmark")
                        Label("Every deduction you're entitled to", systemImage: "checkmark")
                    }
                    .font(.subheadline)
                } label: { Text("What Anna checked").font(.caption).foregroundStyle(.secondary) }

                Text("Nothing is filed until you approve. Take your time.")
                    .font(.caption).foregroundStyle(.secondary)

                PrimaryButton(title: "Approve return") { store.send(.approveReturn) }
                Button("Ask a question first") { askingQuestion = true }
                    .font(.subheadline)
                    .frame(maxWidth: .infinity)
            }
            .padding(24)
        }
        .sheet(isPresented: $askingQuestion) {
            NavigationStack {
                Form {
                    TextField("What would you like to know?", text: $question, axis: .vertical)
                    Button("Send to Anna") {
                        let q = question.trimmingCharacters(in: .whitespaces)
                        guard !q.isEmpty else { return }
                        store.send(.askAdvisor(itemId: "review", question: q))
                        askingQuestion = false
                    }
                }
                .navigationTitle("Ask Anna")
                .navigationBarTitleDisplayMode(.inline)
            }
            .presentationDetents([.medium])
        }
    }
}

struct ApprovedView: View {
    @Environment(CaseStore.self) private var store

    var body: some View {
        VStack(spacing: 20) {
            Spacer()
            Image(systemName: "signature")
                .font(.system(size: 48))
                .foregroundStyle(store.tokens.color("--color-primary"))
            Text("Approved.").font(.title.bold())
            Text("Anna is filing your return with the Finanzamt now.")
                .foregroundStyle(.secondary).multilineTextAlignment(.center)
            GroupBox { TimelineView(phase: .approved, allIn: true) }
            Spacer()
        }
        .padding(24)
    }
}
```

- [x] **Step 3: `FiledView.swift`** (S8 — calm celebration + what happens next):

```swift
import SwiftUI

struct FiledView: View {
    @Environment(CaseStore.self) private var store

    private var filedDate: String {
        guard let iso = store.state.filedAt,
              let date = ISO8601DateFormatter().date(from: iso) else { return "today" }
        return date.formatted(date: .long, time: .omitted)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 72))
                    .foregroundStyle(store.tokens.color("--color-success"))
                    .padding(.top, 60)
                Text("Filed.").font(.system(size: 40, weight: .bold))
                Text("Your 2025 return went to Finanzamt Berlin on \(filedDate).")
                    .foregroundStyle(.secondary).multilineTextAlignment(.center)

                if let refund = store.state.draft?.refundEstimate {
                    Text("Expected refund: \(refund)")
                        .font(.headline)
                        .padding(12)
                        .background(store.tokens.color("--color-success").opacity(0.1), in: Capsule())
                }

                GroupBox {
                    VStack(alignment: .leading, spacing: 12) {
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("The Bescheid arrives by post").font(.subheadline.weight(.medium))
                                Text("The Finanzamt's official answer — usually 4–8 weeks. Anna checks it for you.")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                        } icon: { Image(systemName: "envelope") }
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Refund lands after that").font(.subheadline.weight(.medium))
                                Text("Straight to the IBAN you shared.").font(.caption).foregroundStyle(.secondary)
                            }
                        } icon: { Image(systemName: "eurosign.circle") }
                    }
                } label: { Text("What happens next").font(.caption).foregroundStyle(.secondary) }

                AdvisorBadge(showPromise: false)
            }
            .padding(24)
        }
    }
}
```

- [x] **Step 4: Delete `CompletionStubs.swift`. Build + full-loop run:** with relay + advisor, drive: uploads → verify all → advisor "Start preparing" (phone flips to Preparing live) → "Send to Amara for approval" (phone shows Review with €1,286) → approve on phone (advisor chip flips to "Approved — file it") → "Mark as filed" (phone shows Filed). `xcodebuild test` green.
- [x] **Step 5: Commit** — `feat: completion loop — preparing, review and approve, filed`

---

### Task 13: Hub catches up (architecture section, flow map, copy)

**Files:**
- Create: `src/hub/sections/Architecture.tsx`
- Modify: `src/hub/Hub.tsx` (register section), `src/hub/sections/FlowMap.tsx` (node data), `src/hub/sections/AiLog.tsx`, `src/hub/sections/Framing.tsx` (decision log additions), `src/hub/Hub.test.tsx`

**Interfaces:**
- Consumes: existing hub section pattern (`hub-section` classes, nav registration in `Hub.tsx`).
- Produces: nav order per spec §7; flow map covers three phase groups.

- [x] **Step 1: Failing test** — in `src/hub/Hub.test.tsx` add:

```tsx
test('hub explains the one-reducer architecture and the native flow map phases', () => {
  renderHub()
  expect(screen.getByText(/One reducer, three clients/)).toBeInTheDocument()
  expect(screen.getByText('Onboarding runway')).toBeInTheDocument()
  expect(screen.getByText('The hand-off (the deep slice)')).toBeInTheDocument()
  expect(screen.getByText('Completion loop')).toBeInTheDocument()
})
```

- [x] **Step 2: Run → FAIL. Implement:**
  - `Architecture.tsx` — new section titled "One reducer, three clients": short prose (from spec §2) + a `<pre>` ASCII diagram:

```
       SwiftUI app (simulator)          advisor + hub (browser)
              │  actions ▲ snapshots        │  actions ▲ snapshots
              └──────────┼──────────────────┘
                         ▼
              relay (node) — runs src/store/state.ts
              the SAME tested reducer, one source of truth
```

  - `FlowMap.tsx` — regroup nodes under three `<h3>` headings: **"Onboarding runway"** (w1-welcome, w2-liability, w5-result, c2-pricing), **"The hand-off (the deep slice)"** (s1-home, s2-checklist, s3-item, s3-escape, s4-followups, s5-momentum — keep existing annotations), **"Completion loop"** (s7-review, s8-filed). New node screenshots point at `/screenshots/<id>.png`; reuse existing images where ids match, new ids reference files captured in Task 14 (broken img alt text is acceptable until then).
  - `AiLog.tsx` — add to the "Judgment overrode AI" list: `"v1 shipped the consumer app as a web page in a CSS phone frame. The brief says native twice. We rebuilt it in SwiftUI — and kept the reducer in TypeScript so the tested business logic moved server-side instead of being rewritten."`
  - `Framing.tsx` decision log — add entries 1–6 from spec §11. Also fix the v1 payment-assumption copy (spec §11.6): in `Framing.tsx:78` change `"I paid, now what?"` to `"I've signed up and handed my taxes to a stranger — now what?"`; in `Personas.tsx:32` change Amara's quote to `"I signed up three days ago and I still don't know what they actually need from me."`
  - `Hub.tsx` — add Architecture to nav between Flow map and Design system; nav launch buttons: keep "Open advisor", remove stale ones (done in Task 4; verify).
- [x] **Step 3: Run all web tests + build → green. Commit** — `feat: hub tells the native rework story — architecture section and phased flow map`

---

### Task 14: Screenshots, README, end-to-end verification

**Files:**
- Modify: `README.md` (rewrite), `public/screenshots/*` (recapture), `scripts/capture.mjs` (delete — superseded), `docs/superpowers/plans/2026-08-31-taxfix-native-full-journey.md` (tick boxes)

- [x] **Step 1: Capture simulator screenshots.** Boot `iPhone 17 Pro`, run relay, drive the app to each screen and capture:

```bash
xcrun simctl io booted screenshot public/screenshots/w1-welcome.png
# repeat for: w2-liability, w5-result, c2-pricing, s1-home, s2-checklist,
# s3-item, s3-escape, s4-followups, s5-momentum, s7-review, s8-filed
```

Advisor screenshot via browser (any tool): `public/screenshots/a2-case.png` refresh. Delete `scripts/capture.mjs` and the puppeteer-core devDependency.
- [x] **Step 2: Rewrite `README.md`:** what it is (three surfaces, one reducer), architecture diagram, run instructions (`npm i`, `npm run demo`, Xcode ⌘R), test commands (`npx vitest run`, the xcodebuild test line), regenerating iOS codegen (`npm run gen:ios`), spec/plan pointers (v2 spec + this plan), and the demo script per spec §8 (all 5 beats + token finale + reset).
- [x] **Step 3: Full verification:**
  - `npx vitest run` — all green
  - `npx tsc -b --noEmit` — clean
  - `npm run build` — succeeds
  - `npm run lint` — no new warnings
  - `cd ios && xcodebuild -project TaxfixExpert.xcodeproj -scheme TaxfixExpert -destination 'platform=iOS Simulator,name=iPhone 17 Pro' test` — green
  - Manual: full demo script end-to-end per spec §8 including token-editor → simulator restyle and Reset.
- [x] **Step 4: Commit** — `chore: simulator screenshots, readme rewrite and end-to-end verification`

---

## Self-review (done at planning time)

- **Spec coverage:** §1→Task 13 (story) + depth asymmetry encoded in Tasks 10 vs 11; §2→Tasks 1–3 + 6 (codegen) + 7; §3→Task 1; §4 W1–C2→Task 10, H1→Task 11 (MeetAnnaSheet), S1–S5→Task 11, S6–S8→Task 12; §5→Task 5; §6→Tasks 6, 9 (TokenStore); §7→Task 13; §8→Task 2 (demo.mjs) + Task 14 (README demo script); §9→tests in Tasks 1, 2, 3, 5, 6, 8, 9 + manual passes; §10 assumptions surface in copy (€119.99 in Task 10 PricingView, seeded draft numbers in Task 5); §11→Task 13. No gaps.
- **Placeholder scan:** all copy, Swift views, protocol shapes and commands are literal. The only deferred artifacts are screenshots (Task 14 captures them; Task 13 names the files).
- **Type consistency:** `CasePhase` string values match TS (`awaiting_approval` mapped explicitly); action `type` strings in `CaseAction.json` match the TS `Action` union; `caseStatus` labels in Task 5 consumed exactly; `PrimaryButton`/`AdvisorBadge`/`StatusPillView`/`TimelineView` signatures consistent across Tasks 10–12; relay message kinds (`action`/`token`/`token-reset`/`state`/`tokens`) identical in Tasks 2, 3, 9.
