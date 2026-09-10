# Taxfix Hand-off Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a three-surface prototype — consumer native-style app, functional advisor dashboard, case-study hub — sharing one design-token system and one live-synced case state.

**Architecture:** Single Vite + React + TypeScript SPA with four routes (`/` hub, `/app` consumer phone-frame, `/advisor` dashboard, `/demo` side-by-side). Case state lives in a context+reducer store persisted to `localStorage` and synced across tabs via `BroadcastChannel`. All styling flows from CSS-variable design tokens; components never use raw values.

**Tech Stack:** Vite 5, React 18, TypeScript (strict), react-router-dom 7, vitest + @testing-library/react + jsdom. No UI/CSS libraries.

**Spec:** `docs/superpowers/specs/2026-08-31-taxfix-handoff-design.md` — read it first; hub prose, persona content, and copy rules come from it verbatim.

## Global Constraints

- TypeScript `strict: true`; no `any`.
- Components style via token CSS variables only — **no raw hex/px-magic in component files** (raw values live only in `src/styles/tokens.css`).
- All user-facing copy in English; German document names appear only as secondary/explained text (spec §1.5).
- Deadline framing is calm ("Deadline 31 July — on track"), never countdown urgency (spec D7).
- Commit messages: plain conventional commits, **no co-author trailers**.
- `localStorage` key: `taxfix-handoff-state-v1`. `BroadcastChannel` name: `taxfix-handoff`.
- Node 20+, npm. Tests run with `npx vitest run`.

## File Structure

```
src/
  main.tsx                     # router: / /app /advisor /demo
  styles/tokens.css            # ALL raw design values (CSS variables)
  styles/global.css            # reset + base element styles (token-consuming)
  types.ts                     # ItemStatus, ChecklistItem, FollowUp, CaseState, ADVISOR
  store/state.ts               # seedState(), reducer, actions, selectors
  store/CaseStore.tsx          # provider: context + localStorage + BroadcastChannel
  components/*.tsx             # Button, StatusPill, ProgressBar, TimelineStep, AdvisorCard,
                               # ChecklistItemRow, Sheet, Banner, EmptyState, PhoneFrame
  app/ConsumerApp.tsx          # phone shell + internal screen navigation
  app/screens/*.tsx            # CaseHome, Checklist, ItemDetail, FollowUps, Momentum
  advisor/AdvisorApp.tsx       # queue + case detail
  hub/Hub.tsx                  # section layout + nav
  hub/sections/*.tsx           # Framing, Personas, FlowMap, DesignSystem, Validation, Metrics, AiLog, Assumptions
  hub/TokenEditor.tsx          # live token controls + embedded previews
  demo/Demo.tsx                # phone + advisor side-by-side, reset control
public/screenshots/            # captured from the real build (Task 10)
```

---

### Task 1: Scaffold + test harness

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/test/setup.ts`, `.gitignore`

**Interfaces:**
- Produces: running dev server; `npx vitest run` green; router shell rendering placeholder text per route.

- [ ] **Step 1: Scaffold**

```bash
cd /Users/gijo/Documents/Code/TB/taxfix-handoff
npm create vite@latest . -- --template react-ts
npm i react-router-dom
npm i -D vitest @testing-library/react @testing-library/user-event jsdom @testing-library/jest-dom
```

Remove template cruft (`src/App.tsx`, `src/App.css`, `src/index.css`, `src/assets`).

- [ ] **Step 2: Configure vitest**

`vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', globals: true },
})
```

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
beforeEach(() => localStorage.clear())
```

- [ ] **Step 3: Write failing router smoke test** — `src/main.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from './main'

test('routes render placeholders', () => {
  render(<MemoryRouter initialEntries={['/app']}><AppRoutes /></MemoryRouter>)
  expect(screen.getByText(/consumer app/i)).toBeInTheDocument()
})
```

- [ ] **Step 4: Run to verify FAIL** — `npx vitest run` → fails (AppRoutes not defined).

- [ ] **Step 5: Implement `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<div>Hub</div>} />
      <Route path="/app" element={<div>Consumer app</div>} />
      <Route path="/advisor" element={<div>Advisor</div>} />
      <Route path="/demo" element={<div>Demo</div>} />
    </Routes>
  )
}

const root = document.getElementById('root')
if (root) ReactDOM.createRoot(root).render(
  <React.StrictMode><BrowserRouter><AppRoutes /></BrowserRouter></React.StrictMode>,
)
```

(Guard on `root` so importing `main.tsx` in tests without `#root` doesn't throw.)

- [ ] **Step 6: Run tests → PASS**; `npm run dev` and load `/app` to confirm.

- [ ] **Step 7: Commit** — `chore: scaffold vite react-ts app with router and vitest`

---

### Task 2: Design tokens

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/design/tokens.ts`, `src/design/tokens.test.ts`
- Modify: `src/main.tsx` (import both css files)

**Interfaces:**
- Produces: CSS variables on `:root`; `TOKEN_DEFS: TokenDef[]` (`{ cssVar, label, kind: 'color'|'size', value }`), `setToken(cssVar, value)`, `resetTokens()` — consumed by Hub TokenEditor (Task 11).

- [ ] **Step 1: Write failing test** — `src/design/tokens.test.ts`

```ts
import { TOKEN_DEFS, setToken, resetTokens } from './tokens'

test('setToken writes css variable to document root', () => {
  setToken('--color-primary', '#ff0000')
  expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#ff0000')
  resetTokens()
  expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('')
})

test('token defs include core semantic tokens', () => {
  const vars = TOKEN_DEFS.map(t => t.cssVar)
  for (const v of ['--color-primary', '--color-issue', '--radius-card', '--space-4'])
    expect(vars).toContain(v)
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement.** `src/styles/tokens.css` (the ONLY file with raw values):

```css
:root {
  /* color */
  --color-primary: #32c850;        /* Taxfix-family green */
  --color-primary-ink: #0b2e13;
  --color-ink: #17211b;
  --color-ink-soft: #5c6b61;
  --color-surface: #ffffff;
  --color-surface-sunken: #f2f6f2;
  --color-line: #e2e9e3;
  --color-success: #1e9e46;
  --color-warning: #c98a00;
  --color-issue: #d64545;
  --color-info-bg: #eef7ef;
  /* type */
  --font-sans: -apple-system, 'SF Pro Text', 'Inter', system-ui, sans-serif;
  --text-display: 28px; --text-title: 20px; --text-body: 16px; --text-caption: 13px;
  /* space (4pt grid) */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-6: 24px; --space-8: 32px;
  /* radius / elevation / motion */
  --radius-card: 16px; --radius-pill: 999px; --radius-control: 12px;
  --shadow-card: 0 2px 10px rgba(23, 33, 27, 0.08);
  --motion-fast: 150ms; --motion-base: 250ms;
}
```

`src/styles/global.css`: minimal reset; `body { font-family: var(--font-sans); color: var(--color-ink); background: var(--color-surface-sunken); margin: 0; }`; `button { font: inherit; }`.

`src/design/tokens.ts`:

```ts
export interface TokenDef { cssVar: string; label: string; kind: 'color' | 'size'; value: string }

export const TOKEN_DEFS: TokenDef[] = [
  { cssVar: '--color-primary', label: 'Primary', kind: 'color', value: '#32c850' },
  { cssVar: '--color-ink', label: 'Ink', kind: 'color', value: '#17211b' },
  { cssVar: '--color-issue', label: 'Issue', kind: 'color', value: '#d64545' },
  { cssVar: '--color-success', label: 'Success', kind: 'color', value: '#1e9e46' },
  { cssVar: '--radius-card', label: 'Card radius', kind: 'size', value: '16px' },
  { cssVar: '--radius-control', label: 'Control radius', kind: 'size', value: '12px' },
  { cssVar: '--space-4', label: 'Base spacing', kind: 'size', value: '16px' },
  { cssVar: '--text-body', label: 'Body size', kind: 'size', value: '16px' },
]

export function setToken(cssVar: string, value: string) {
  document.documentElement.style.setProperty(cssVar, value)
}
export function resetTokens() {
  for (const t of TOKEN_DEFS) document.documentElement.style.removeProperty(t.cssVar)
}
```

Import both css files at the top of `src/main.tsx`.

- [ ] **Step 4: Run tests → PASS.**
- [ ] **Step 5: Commit** — `feat: add design token system (css variables + typed map)`

---

### Task 3: Types, seed data, reducer, selectors

**Files:**
- Create: `src/types.ts`, `src/store/state.ts`, `src/store/state.test.ts`

**Interfaces:**
- Produces (exact — later tasks depend on these):

```ts
// types.ts
export type ItemStatus = 'needed' | 'uploaded' | 'verified' | 'issue'
export type ItemGroup = 'identity' | 'employment' | 'benefits' | 'deductions'
export interface ChecklistItem {
  id: string; group: ItemGroup; title: string; germanName?: string
  explainer: string; lookLike: string; optional: boolean
  status: ItemStatus; issueNote?: string; uploadedFileName?: string; uploadedAt?: string
}
export interface FollowUp {
  id: string; itemId?: string; from: 'advisor' | 'consumer'
  message: string; createdAt: string; status: 'open' | 'answered'; reply?: string
}
export interface CaseState { items: ChecklistItem[]; followUps: FollowUp[] }
export const ADVISOR = {
  name: 'Anna Weber', title: 'Steuerberaterin', location: 'Leipzig',
  responsePromise: 'Replies within 1 business day', initials: 'AW',
} as const

// state.ts
export function seedState(): CaseState
export type Action =
  | { type: 'UPLOAD_ITEM'; itemId: string; fileName: string }
  | { type: 'VERIFY_ITEM'; itemId: string }
  | { type: 'FLAG_ISSUE'; itemId: string; note: string }
  | { type: 'SEND_FOLLOW_UP'; itemId?: string; message: string }
  | { type: 'ASK_ADVISOR'; itemId: string; question: string }
  | { type: 'ANSWER_FOLLOW_UP'; followUpId: string; reply: string }
  | { type: 'RESET' }
  | { type: 'REPLACE'; state: CaseState }   // used by cross-tab sync
export function reducer(state: CaseState, action: Action): CaseState
export function requiredItems(s: CaseState): ChecklistItem[]
export function sharedCount(s: CaseState): number          // required items uploaded|verified
export function advisorCanStart(s: CaseState): boolean     // all required uploaded|verified
export function openFollowUpsFor(s: CaseState, from: 'advisor' | 'consumer'): FollowUp[]
```

- [ ] **Step 1: Write failing tests** — `src/store/state.test.ts`

```ts
import { seedState, reducer, requiredItems, sharedCount, advisorCanStart } from './state'

test('seed has 6 items, 5 required, 2 already shared', () => {
  const s = seedState()
  expect(s.items).toHaveLength(6)
  expect(requiredItems(s)).toHaveLength(5)
  expect(sharedCount(s)).toBe(2)
  expect(advisorCanStart(s)).toBe(false)
})

test('upload moves item to uploaded and stores file name', () => {
  const s = reducer(seedState(), { type: 'UPLOAD_ITEM', itemId: 'lohnsteuer', fileName: 'scan.jpg' })
  const item = s.items.find(i => i.id === 'lohnsteuer')!
  expect(item.status).toBe('uploaded')
  expect(item.uploadedFileName).toBe('scan.jpg')
})

test('flag issue sets status + note; upload clears them', () => {
  let s = reducer(seedState(), { type: 'FLAG_ISSUE', itemId: 'id-doc', note: 'Photo is blurry' })
  expect(s.items.find(i => i.id === 'id-doc')!.status).toBe('issue')
  s = reducer(s, { type: 'UPLOAD_ITEM', itemId: 'id-doc', fileName: 'retake.jpg' })
  const item = s.items.find(i => i.id === 'id-doc')!
  expect(item.status).toBe('uploaded')
  expect(item.issueNote).toBeUndefined()
})

test('advisor can start once all required items shared', () => {
  let s = seedState()
  for (const i of requiredItems(s).filter(i => i.status === 'needed'))
    s = reducer(s, { type: 'UPLOAD_ITEM', itemId: i.id, fileName: 'f.pdf' })
  expect(advisorCanStart(s)).toBe(true)
})

test('follow-up lifecycle: send then answer', () => {
  let s = reducer(seedState(), { type: 'SEND_FOLLOW_UP', itemId: 'lohnsteuer', message: 'Need January payslip' })
  const fu = s.followUps.find(f => f.from === 'advisor')!
  expect(fu.status).toBe('open')
  s = reducer(s, { type: 'ANSWER_FOLLOW_UP', followUpId: fu.id, reply: 'Attached' })
  expect(s.followUps.find(f => f.id === fu.id)!.status).toBe('answered')
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement.** Seed data is the case's content model — copy exactly:

| id | group | title | germanName | optional | seed status |
|---|---|---|---|---|---|
| `id-doc` | identity | Photo ID | — | no | `verified` |
| `tax-id` | identity | Your tax ID | Steuer-ID | no | `uploaded` |
| `lohnsteuer` | employment | Annual income statement | Lohnsteuerbescheinigung | no | `needed` |
| `alg-bescheid` | benefits | Unemployment benefits statement | ALG‑I Leistungsbescheid | no | `needed` |
| `bank` | identity | Bank details for your refund | — | no | `needed` |
| `deductions` | deductions | Receipts that could raise your refund | — | yes | `needed` |

Explainers (`explainer` / `lookLike`), verbatim:
- `id-doc`: "A passport or national ID — Anna needs to confirm it's really you." / "The photo page of your passport."
- `tax-id`: "Your 11-digit Steuer-ID. Everyone in Germany gets one by post." / "A letter from the Bundeszentralamt für Steuern."
- `lohnsteuer`: "Your employer sent this in February — it summarises your salary and the tax you already paid." / "One page, a grid of numbered boxes."
- `alg-bescheid`: "The letter from the Agentur für Arbeit confirming your unemployment benefits. It's the reason your filing is required." / "A letter titled 'Bewilligungsbescheid'."
- `bank`: "Where your refund should land. IBAN is enough." / "Your IBAN, from your banking app."
- `deductions`: "Work equipment, relocation costs, courses — optional, but often worth real money." / "Any receipts or invoices you kept."

Reducer notes: pure, immutable updates; `UPLOAD_ITEM` sets `status:'uploaded'`, `uploadedFileName`, `uploadedAt: new Date().toISOString()` and deletes `issueNote`; `ASK_ADVISOR` appends `{ from:'consumer', status:'open' }` follow-up; ids via `crypto.randomUUID()`; `RESET` returns `seedState()`; `REPLACE` returns `action.state`.

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `feat: add case types, seed data, reducer and selectors`

---

### Task 4: CaseStore provider (persistence + cross-tab sync)

**Files:**
- Create: `src/store/CaseStore.tsx`, `src/store/CaseStore.test.tsx`

**Interfaces:**
- Consumes: `reducer`, `seedState`, `Action`, `CaseState` from Task 3.
- Produces: `<CaseStoreProvider>` and `useCase(): { state: CaseState; dispatch: (a: Action) => void }`. Every dispatch persists to `localStorage` and broadcasts `{ kind: 'sync', state }` on channel `taxfix-handoff`; incoming messages apply via `REPLACE`.

- [ ] **Step 1: Write failing tests** — `src/store/CaseStore.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CaseStoreProvider, useCase } from './CaseStore'
import { sharedCount } from './state'

function Probe() {
  const { state, dispatch } = useCase()
  return (
    <button onClick={() => dispatch({ type: 'UPLOAD_ITEM', itemId: 'bank', fileName: 'iban.txt' })}>
      shared:{sharedCount(state)}
    </button>
  )
}

test('dispatch updates state and persists to localStorage', () => {
  render(<CaseStoreProvider><Probe /></CaseStoreProvider>)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByRole('button')).toHaveTextContent('shared:3')
  const stored = JSON.parse(localStorage.getItem('taxfix-handoff-state-v1')!)
  expect(stored.items.find((i: { id: string }) => i.id === 'bank').status).toBe('uploaded')
})

test('hydrates from localStorage when present', () => {
  localStorage.setItem('taxfix-handoff-state-v1', JSON.stringify({ items: [], followUps: [] }))
  render(<CaseStoreProvider><Probe /></CaseStoreProvider>)
  expect(screen.getByRole('button')).toHaveTextContent('shared:0')
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `src/store/CaseStore.tsx`**

```tsx
import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import type { ReactNode } from 'react'
import { reducer, seedState } from './state'
import type { Action, CaseState } from '../types'

const KEY = 'taxfix-handoff-state-v1'
const CHANNEL = 'taxfix-handoff'

const Ctx = createContext<{ state: CaseState; dispatch: (a: Action) => void } | null>(null)

function init(): CaseState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as CaseState
  } catch { /* corrupted or unavailable storage falls back to seed */ }
  return seedState()
}

export function CaseStoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, init)
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const ch = new BroadcastChannel(CHANNEL)
    channelRef.current = ch
    ch.onmessage = (e) => {
      if (e.data?.kind === 'sync') rawDispatch({ type: 'REPLACE', state: e.data.state })
    }
    return () => ch.close()
  }, [])

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo(() => ({
    state,
    dispatch: (a: Action) => {
      rawDispatch(a)
      if (a.type !== 'REPLACE') {
        // broadcast the *next* state: recompute so other tabs converge
        channelRef.current?.postMessage({ kind: 'sync', state: reducer(state, a) })
      }
    },
  }), [state])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCase() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCase must be used inside CaseStoreProvider')
  return ctx
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Wrap routes** — in `src/main.tsx`, wrap `<AppRoutes />` in `<CaseStoreProvider>`.
- [ ] **Step 6: Run all tests → PASS. Commit** — `feat: add shared case store with persistence and cross-tab sync`

---

### Task 5: Component library

**Files:**
- Create: `src/components/{Button,StatusPill,ProgressBar,TimelineStep,AdvisorCard,ChecklistItemRow,Sheet,Banner,EmptyState,PhoneFrame}.tsx`, `src/components/components.css`, `src/components/components.test.tsx`

**Interfaces (exact props — screens depend on these):**

```tsx
Button:    { children, onClick?, variant?: 'primary'|'secondary'|'ghost', full?: boolean, disabled?: boolean }
StatusPill:{ status: ItemStatus }             // renders: To share / Sent / Checked ✓ / Needs attention
ProgressBar:{ value: number, max: number }    // + caption "value of max shared"
TimelineStep:{ label: string, state: 'done'|'current'|'todo' }
AdvisorCard:{ compact?: boolean }             // uses ADVISOR const; shows initials avatar, name, title, responsePromise
ChecklistItemRow:{ item: ChecklistItem, onClick: () => void }  // title, germanName as caption, StatusPill; issueNote line when status==='issue'
Sheet:     { open: boolean, onClose: () => void, title: string, children }
Banner:    { tone: 'info'|'success'|'issue', children }
EmptyState:{ icon: string, title: string, body: string }
PhoneFrame:{ children }                       // 390×760 rounded frame w/ status bar, used by /app, /demo, hub previews
```

All styles in `components.css` using tokens only. StatusPill copy is fixed: `needed→"To share"`, `uploaded→"Sent"`, `verified→"Checked ✓"`, `issue→"Needs attention"`.

- [ ] **Step 1: Write failing tests** — `src/components/components.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { StatusPill } from './StatusPill'
import { ChecklistItemRow } from './ChecklistItemRow'
import { ProgressBar } from './ProgressBar'
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
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement all ten components + css.** Keep each file < 60 lines; every color/space/radius via `var(--…)`. PhoneFrame: fixed 390px width, `--radius-card`×2 corners, fake status bar (time "9:41", battery glyph), scrollable content area 760px tall, subtle shadow.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `feat: add token-driven component library`

---

### Task 6: Consumer app — shell, Case home (S1), Checklist (S2)

**Files:**
- Create: `src/app/ConsumerApp.tsx`, `src/app/screens/CaseHome.tsx`, `src/app/screens/Checklist.tsx`, `src/app/app.css`, `src/app/ConsumerApp.test.tsx`
- Modify: `src/main.tsx` (route `/app` → `<ConsumerApp />`)

**Interfaces:**
- Consumes: store (Task 4), components (Task 5), selectors (Task 3).
- Produces: `ConsumerApp` with internal nav state `type Screen = { name: 'home' } | { name: 'checklist' } | { name: 'item'; itemId: string } | { name: 'followups' } | { name: 'momentum' }`; exports `ConsumerApp` only. Screens receive `{ go: (s: Screen) => void }`.

Screen content (exact copy):
- **CaseHome**: large title "Your tax return 2025". Timeline (TimelineStep×5): Committed=done, Share your info=current, Anna prepares=todo, You review=todo, Filed=todo. AdvisorCard. ProgressBar (sharedCount/required). Deadline chip: "Deadline 31 July — on track". Banner (tone=issue) visible only when an item has `status==='issue'` or an open advisor follow-up exists: "Anna needs something from you". Primary Button "Continue sharing info" → checklist. When `advisorCanStart`, timeline current moves to "Anna prepares" and CTA becomes ghost "View your shared info".
- **Checklist**: back nav "‹ Your return". Group headers: "Identity & basics", "Employment income", "Unemployment benefits", "Could raise your refund (optional)". Rows via ChecklistItemRow → item detail. Footer caption: "Anna can start once the required items are in."

- [ ] **Step 1: Write failing tests** — `src/app/ConsumerApp.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CaseStoreProvider } from '../store/CaseStore'
import { ConsumerApp } from './ConsumerApp'

function renderApp() {
  return render(<CaseStoreProvider><ConsumerApp /></CaseStoreProvider>)
}

test('home shows advisor, progress and calm deadline', () => {
  renderApp()
  expect(screen.getByText('Anna Weber')).toBeInTheDocument()
  expect(screen.getByText('2 of 5 shared')).toBeInTheDocument()
  expect(screen.getByText(/Deadline 31 July — on track/)).toBeInTheDocument()
})

test('continue navigates to grouped checklist', () => {
  renderApp()
  fireEvent.click(screen.getByText('Continue sharing info'))
  expect(screen.getByText('Unemployment benefits')).toBeInTheDocument()
  expect(screen.getByText('Annual income statement')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** shell (PhoneFrame + screen switch + slide transition using `--motion-base`), CaseHome, Checklist per copy above.
- [ ] **Step 4: Run → PASS.** Load `/app` in dev, verify visually against spec §4.
- [ ] **Step 5: Commit** — `feat: add consumer shell, case home and checklist screens`

---

### Task 7: Consumer app — Item detail + upload (S3), Follow-ups (S4), Momentum (S5)

**Files:**
- Create: `src/app/screens/ItemDetail.tsx`, `src/app/screens/FollowUps.tsx`, `src/app/screens/Momentum.tsx`, `src/app/screens/screens.test.tsx`
- Modify: `src/app/ConsumerApp.tsx` (wire screens; after an upload that makes `advisorCanStart` flip true, `go({name:'momentum'})`)

**Interfaces:**
- Consumes: Task 6 nav contract, store actions `UPLOAD_ITEM`, `ASK_ADVISOR`, `ANSWER_FOLLOW_UP`.

Screen content (exact copy):
- **ItemDetail**: title = item.title; germanName caption; explainer paragraph; "What it looks like:" + lookLike line in an info Banner. If `status==='issue'`: issue Banner with `issueNote` and heading "Anna flagged this". Upload controls: Button "Take a photo" and secondary "Choose a file" — both simulate capture by dispatching `UPLOAD_ITEM` with a generated file name (`photo-<itemId>.jpg` / hidden `<input type="file">` name). Post-upload receipt state: success Banner "Sent to Anna — she'll check it and mark it done." Escape hatch (ghost button): **"I don't have this"** → Sheet titled "No problem — pick what fits" with three options: "Tell me how to get it" (shows sourcing tip paragraph per group: employment → "Ask your employer's HR for a copy — they must provide it."; benefits → "Download it from the Agentur für Arbeit portal, or ask Anna to request it."; identity → "Any government-issued photo ID works — check your email for scans."; deductions → "Skip it — it's optional."), "Ask Anna" (textarea + send → `ASK_ADVISOR`), "I don't think this applies to me" (pre-filled `ASK_ADVISOR` question: "I don't think '<title>' applies to me — can you confirm?").
- **FollowUps**: list of advisor follow-ups as task cards ("Anna asked:" + message + linked item chip); open ones have reply textarea + "Send reply" (`ANSWER_FOLLOW_UP`) and, when `itemId` set, an "Upload instead" button (`UPLOAD_ITEM`). Consumer questions render as "You asked Anna" cards. EmptyState when none: icon "✓", title "Nothing waiting on you", body "If Anna needs anything, it lands here."
- **Momentum**: full-screen; big check; title "That's everything Anna needs to start."; body "She's preparing your return now. Next update within 1 business day."; ghost Button "Back to your return" → home.

- [ ] **Step 1: Write failing tests** — `src/app/screens/screens.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CaseStoreProvider } from '../../store/CaseStore'
import { ConsumerApp } from '../ConsumerApp'

function openItem(title: string) {
  render(<CaseStoreProvider><ConsumerApp /></CaseStoreProvider>)
  fireEvent.click(screen.getByText('Continue sharing info'))
  fireEvent.click(screen.getByText(title))
}

test('upload shows receipt acknowledgment', () => {
  openItem('Annual income statement')
  fireEvent.click(screen.getByText('Take a photo'))
  expect(screen.getByText(/Sent to Anna/)).toBeInTheDocument()
})

test('escape hatch offers forward paths, never a dead-end', () => {
  openItem('Unemployment benefits statement')
  fireEvent.click(screen.getByText("I don't have this"))
  expect(screen.getByText('Tell me how to get it')).toBeInTheDocument()
  expect(screen.getByText('Ask Anna')).toBeInTheDocument()
})

test('completing final required item lands on momentum screen', () => {
  render(<CaseStoreProvider><ConsumerApp /></CaseStoreProvider>)
  fireEvent.click(screen.getByText('Continue sharing info'))
  for (const t of ['Annual income statement', 'Unemployment benefits statement', 'Bank details for your refund']) {
    fireEvent.click(screen.getByText(t))
    fireEvent.click(screen.getByText('Take a photo'))
    fireEvent.click(screen.getByText(/‹/))
  }
  expect(screen.getByText(/everything Anna needs to start/)).toBeInTheDocument()
})
```

(Adjust the back-nav interaction in the last test to match the implemented shell — the assertion is the contract.)

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement the three screens + wiring.**
- [ ] **Step 4: Run all tests → PASS. Visual check in dev.**
- [ ] **Step 5: Commit** — `feat: add item upload, escape hatch, follow-ups and momentum screens`

---

### Task 8: Advisor dashboard

**Files:**
- Create: `src/advisor/AdvisorApp.tsx`, `src/advisor/advisor.css`, `src/advisor/AdvisorApp.test.tsx`
- Modify: `src/main.tsx` (route `/advisor`)

**Interfaces:**
- Consumes: store, selectors, StatusPill/Button/Banner components.
- Produces: `AdvisorApp` — two-pane web layout (no PhoneFrame): left = case queue, right = case detail.

Content (exact copy):
- **Queue**: header "Your cases — July". Amara's live case pinned top: "Amara Okafor · Return 2025" + status chip derived: `advisorCanStart` → "Ready to work" (success) else open advisor follow-ups → "Blocked — asked client" (warning) else "Waiting on client" (neutral). Below, 3 static seeded rows for texture: "Jonas Brandt · Ready to work", "Priya Nair · Waiting on client", "Marco Rossi · Blocked — asked client" (non-interactive, `aria-disabled`).
- **Case detail**: blocking summary Banner: when not ready — "You can start once: <comma-list of missing required titles>"; when ready — success "All required items in — you can start this return." Checklist table: each item row shows title, StatusPill, uploadedFileName; actions per `uploaded` item: Button "Verify ✓" (`VERIFY_ITEM`), ghost "Flag issue" → inline note input + confirm (`FLAG_ISSUE`). **Follow-up composer**: select of items + template select with exactly these three templates (text fills the message input, editable):
  1. "I need your <item> — the numbers on your Lohnsteuerbescheinigung show a gap."
  2. "The <item> you sent is incomplete — I need all pages."
  3. "Quick question about your <item> — can you confirm the dates?"
  Send → `SEND_FOLLOW_UP`. Open consumer questions listed under "Client questions" with reply → answered via `ANSWER_FOLLOW_UP`.

- [ ] **Step 1: Write failing tests** — `src/advisor/AdvisorApp.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CaseStoreProvider } from '../store/CaseStore'
import { AdvisorApp } from './AdvisorApp'

test('blocking summary lists missing required items', () => {
  render(<CaseStoreProvider><AdvisorApp /></CaseStoreProvider>)
  expect(screen.getByText(/You can start once:/)).toHaveTextContent('Annual income statement')
})

test('verify moves an uploaded item to verified', () => {
  render(<CaseStoreProvider><AdvisorApp /></CaseStoreProvider>)
  fireEvent.click(screen.getByText('Verify ✓'))   // tax-id is seeded 'uploaded'
  expect(screen.getAllByText('Checked ✓').length).toBeGreaterThanOrEqual(2)
})

test('sending a templated follow-up creates an open advisor task', () => {
  render(<CaseStoreProvider><AdvisorApp /></CaseStoreProvider>)
  fireEvent.click(screen.getByText('Send follow-up'))
  expect(screen.getByText(/Blocked — asked client/)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement.** Dense layout: smaller type scale via a `.advisor` wrapper overriding `--text-body` locally (tokens still the mechanism).
- [ ] **Step 4: Run → PASS. Manual two-tab check**: `/app` + `/advisor` open together — upload on phone ticks advisor row live; follow-up lands on phone live.
- [ ] **Step 5: Commit** — `feat: add functional advisor dashboard with verify, flag and follow-ups`

---

### Task 9: Demo mode + reset

**Files:**
- Create: `src/demo/Demo.tsx`
- Modify: `src/main.tsx` (route `/demo`)

**Interfaces:** Consumes ConsumerApp, AdvisorApp, store.

- [ ] **Step 1: Implement** side-by-side grid: PhoneFrame'd ConsumerApp left, AdvisorApp right, top bar with "Reset demo" Button (`dispatch({type:'RESET'})`) and caption "Two seats, one case — actions on either side land on the other instantly." (No new logic → no new unit test; covered by existing store tests. Verify by loading `/demo`.)
- [ ] **Step 2: Run all tests → still PASS. Commit** — `feat: add side-by-side demo mode with reset`

---

### Task 10: Screenshot capture

**Files:**
- Create: `public/screenshots/{s1-home,s2-checklist,s3-item,s3-escape,s4-followups,s5-momentum,a2-case}.png`

- [ ] **Step 1:** `npm run dev`, then via Chrome automation (Claude-in-Chrome): navigate `/app`, walk each state (fresh seed; then with an issue flagged from `/advisor` for the issue state), screenshot each of the 6 consumer screens + advisor case detail, cropped to frame.
- [ ] **Step 2:** Save into `public/screenshots/` with the exact names above (FlowMap in Task 11 references them).
- [ ] **Step 3: Commit** — `docs: capture real app screenshots for hub flow map`

---

### Task 11: Hub

**Files:**
- Create: `src/hub/Hub.tsx`, `src/hub/hub.css`, `src/hub/TokenEditor.tsx`, `src/hub/sections/{Framing,Personas,FlowMap,DesignSystem,Validation,Metrics,AiLog,Assumptions}.tsx`, `src/hub/Hub.test.tsx`
- Modify: `src/main.tsx` (route `/`)

**Interfaces:**
- Consumes: `TOKEN_DEFS`, `setToken`, `resetTokens` (Task 2); `ConsumerApp`, `AdvisorApp` for live previews; screenshots (Task 10).
- Content source: **spec sections verbatim** — Framing ←§1 (incl. "deliberately not designed"), Personas ←§2 (three persona cards: name, age/context line, goal, anxieties/pain, quote), Validation ←§9, Metrics ←§10 (with benchmark citations from §8), AiLog ←§11, Assumptions ←§12, decision log table ←§13 rendered inside Framing.

Structure:
- **Hub shell**: sticky side nav (section links + launch buttons "Open app" `/app`, "Open advisor" `/advisor`, "Demo mode" `/demo`), scrollable sections.
- **FlowMap**: horizontal-scroll flowchart of 6 nodes: S1→S2→S3(+escape branch)→S4→S5, advisor A2 rail underneath. Each node = screenshot `<img>` + usability annotation + "Anna sees" chip. Node data array (id, screenshot path, title, annotation, advisorMirror):
  1. s1-home / "Case home" / "Answers: 'is anyone actually there?' — named advisor, response promise, visible state machine." / "Anna sees: Waiting on client"
  2. s2-checklist / "Checklist" / "Answers: 'what exactly do you need?' — grouped, plain-English, optional marked optional." / "Anna sees: 3 required items missing"
  3. s3-item / "Item + upload" / "Answers: 'what if I get it wrong?' — explains the doc, shows what it looks like, instant receipt." / "Anna sees: document arrives for review"
  4. s3-escape / "'I don't have this'" / "The #1 stall gets a forward path: sourcing tip, ask Anna, or 'does this apply to me?'" / "Anna sees: client question, answerable in one click"
  5. s4-followups / "Follow-ups" / "Advisor asks arrive as bounded tasks with a reason — not open chat." / "Anna sees: templated composer, ≤2-touch goal"
  6. s5-momentum / "Momentum" / "'The ball is out of your court' — explicit, dated, calm." / "Anna sees: Ready to work"
- **DesignSystem section**: renders component gallery (each component with its name) + **TokenEditor**: for each `TOKEN_DEFS` entry render `<input type="color">` (kind=color) or range slider 0–32px (kind=size) → `setToken` on change; "Reset" → `resetTokens()`. Beside the controls: live `<ConsumerApp/>` in a scaled PhoneFrame and a scaled `<AdvisorApp/>` preview — same document, so token edits restyle them instantly. Caption: "One token, three surfaces — this is the live app, not a picture."

- [ ] **Step 1: Write failing tests** — `src/hub/Hub.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CaseStoreProvider } from '../store/CaseStore'
import { Hub } from './Hub'

function renderHub() {
  render(<MemoryRouter><CaseStoreProvider><Hub /></CaseStoreProvider></MemoryRouter>)
}

test('hub renders personas and flow map nodes', () => {
  renderHub()
  expect(screen.getByText('Amara Okafor')).toBeInTheDocument()
  expect(screen.getByText('Anna Weber, 41')).toBeInTheDocument()
  expect(screen.getByText(/is anyone actually there/)).toBeInTheDocument()
})

test('token editor changes a css variable live', () => {
  renderHub()
  fireEvent.change(screen.getByLabelText('Primary'), { target: { value: '#123456' } })
  expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#123456')
})
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement shell + sections + TokenEditor.**
- [ ] **Step 4: Run → PASS. Full visual pass in dev against spec §7 order.**
- [ ] **Step 5: Commit** — `feat: add case-study hub with flow map, personas and live token editor`

---

### Task 12: Polish + final verification

**Files:**
- Modify: as needed (css, copy); Create: `README.md`

- [ ] **Step 1:** Motion pass (screen slide-in `--motion-base`, pill transitions `--motion-fast`), focus-visible states, `/app` empty/blocked states eyeballed via advisor flag round-trip.
- [ ] **Step 2:** `README.md`: what it is, routes, `npm run dev`, test command, spec/plan pointers, demo script for the panel (2-tab sync walkthrough + token editor beat + reset).
- [ ] **Step 3:** Verify everything: `npx vitest run` (all green), `npx tsc --noEmit` (clean), `npm run build` (succeeds), manual route walk `/`, `/app`, `/advisor`, `/demo`.
- [ ] **Step 4: Commit** — `chore: polish pass, readme and final verification`

---

## Self-review (done at planning time)

- **Spec coverage:** §1→Task 11 Framing; §2→Task 11 Personas; §3→Tasks 1,4; §4→Tasks 6,7; §5→Task 8; §6→Tasks 2,5,11; §7→Tasks 10,11; §9–§13→Task 11 sections; §14 order preserved. No gaps.
- **Placeholder scan:** all copy, templates, seed data, and token values are literal; no TBDs.
- **Type consistency:** `ItemStatus`/`ChecklistItem`/`FollowUp`/`Action` defined once in Task 3 and consumed by name in Tasks 4–11; selector names (`sharedCount`, `advisorCanStart`, `requiredItems`, `openFollowUpsFor`) used consistently.
