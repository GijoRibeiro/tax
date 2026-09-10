# Advisor Workspace + Press Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/advisor` as a realistic multi-view advisor web app (~20 fully workable cases, Today/Cases/Inbox/Clients/Settings, shipped edge behaviors) plus a `/press` slide deck, with the hub documenting the edge cases.

**Architecture:** A new WorkspaceProvider owns `Record<caseId, WorkspaceCase>`; every non-Amara case runs the SAME shared reducer (`src/store/state.ts`) locally with localStorage persistence; `'amara'` routes through the existing relay `useCase()` so phone sync is untouched. Views are nested react-router routes under `/advisor`. `/press` is a keyboard slide deck fed by one data file.

**Tech Stack:** existing — React 19, TS strict, react-router, vitest + RTL, token CSS. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-01-advisor-workspace-design.md` (read first — content, seed distribution, edge behaviors, slide order all live there and are binding).

## Global Constraints

- TypeScript `strict: true`; no `any` (production code).
- Token-only styling: no raw hex outside `src/styles/tokens.css`; structural px (1px borders, layout column widths, percentages, 0) allowed. Density via the `.advisor` wrapper stays.
- The shared reducer `src/store/state.ts` is the ONLY business logic. Workspace code may not fork or reimplement it. Reducer changes in this plan: NONE.
- Amara's case (`id 'amara'`) must keep relay behavior byte-compatible: her actions go through `useCase().dispatch`, her state comes from `useCase().state`. iOS untouched.
- Calm deadline language everywhere; never countdown-panic. All copy English.
- localStorage key: `taxfix-advisor-workspace-v1`, shape-guarded hydration with seed fallback.
- Commits: plain conventional messages, NO co-author trailers.
- Verification per task: `npx vitest run` green + `npx tsc -p tsconfig.app.json --noEmit` clean before each commit.
- The hub embeds `<AdvisorApp />` in a MemoryRouter — nothing may require a browser URL or window.location.

## File Structure

```
src/advisor/workspace/
  types.ts            ClientMeta, WorkspaceCase, WorkspaceState, ActivityEvent,
                      AdvisorSettings, FollowUpTemplate, IncomingCaseRequest
  seedWorkspace.ts    seedWorkspace(): WorkspaceState  (~20 cases per spec §3.2)
  WorkspaceStore.tsx  WorkspaceProvider + useWorkspace(); dispatchCase routing; persistence
  selectors.ts        needsAttention, inboxItems, deadlineRisk, workloadCounts,
                      searchCases, activityFeed, isStalled, flagCountFor
src/advisor/shell/    Sidebar.tsx, Topbar.tsx, NotificationMenu.tsx, ConnectionPip.tsx
src/advisor/views/    Today.tsx, CasesTable.tsx, CaseDetailView.tsx, InboxView.tsx,
                      ClientsView.tsx, SettingsView.tsx
src/advisor/AdvisorApp.tsx          becomes shell + <Routes>
src/advisor/{CaseDetail,FollowUpComposer,ClientQuestions,PrepareControls,
  RequestDocumentForm}.tsx           refactored to (state, dispatch) props
src/components/{Dialog.tsx, StatTile.tsx}   new shared components
src/lib/relativeTime.ts             shared "2 h ago" formatter
src/press/{Press.tsx, slides.tsx, press.css}
src/hub/sections/EdgeCases.tsx      new hub section
```

`staticCases.ts` and `StaticCaseDetail.tsx` are RETIRED (deleted) once the workspace lands.

---

### Task 1: Workspace types + seed

**Files:**
- Create: `src/advisor/workspace/types.ts`, `src/advisor/workspace/seedWorkspace.ts`
- Test: `src/advisor/workspace/seedWorkspace.test.ts`

**Interfaces — Produces (verbatim; every later task imports these):**

```ts
// types.ts
import type { CaseState } from '../../types'
export interface ClientMeta {
  id: string; name: string; year: number; language: 'en' | 'de'
  email: string; city: string; joined: string; notes: string
}
export interface WorkspaceCase {
  client: ClientMeta; state: CaseState
  deadline: string; lastActivity: string; unread: boolean
  special?: 'on-hold' | 'extension-filed'
}
export interface ActivityEvent {
  id: string; caseId: string; at: string; text: string   // e.g. "Verified Photo ID — Jonas Brandt"
}
export interface AdvisorSettings {
  acceptingNewCases: boolean
  notifyClientUploads: boolean; notifyQuestions: boolean; notifyApprovals: boolean
}
export interface FollowUpTemplate { id: string; label: string; body: string }  // body contains "<item>"
export interface IncomingCaseRequest {
  id: string; name: string; city: string; summary: string; effort: string  // e.g. "Straightforward — employee, one employer"
}
export interface WorkspaceState {
  cases: Record<string, WorkspaceCase>
  activity: ActivityEvent[]
  settings: AdvisorSettings
  templates: FollowUpTemplate[]
  incomingRequest?: IncomingCaseRequest
}
```

`seedWorkspace(): WorkspaceState` builds ~20 cases per spec §3.2's distribution table (buckets derived from `caseStatus()`/phase, not stored): 4 waiting-on-client (one with `lastActivity` 16 days before today and ≥1 required item `needed` → stalled), 3 blocked-with-open-follow-up (one where item has been flagged twice — encode by seeding `issueNote` and an activity history entry; flag-count tracking is Task 8's `flagCountFor` reading activity), 3 ready-to-work, 2 preparing, 2 awaiting_approval with drafts (varied refund figures, one negative "−€412 to pay"), 4 approved/filed (two `filedAt` in June, one approved, one filed with `special: 'extension-filed'` and deadline `2026-07-31` passed), 1 `special: 'on-hold'`, 1 at-risk (deadline 2026-07-31, several needed items, lastActivity recent). Case `'amara'` present with `client` meta (Amara Okafor, Berlin, en, year 2025) and `state: seedState()` — its `state` is a placeholder the provider replaces with relay state. Client names: believable German/expat mix (e.g. Jonas Brandt, Priya Nair, Marco Rossi kept for continuity, plus ~16 new). Seed templates = the three existing composer templates as `FollowUpTemplate`s (ids `t-gap`, `t-incomplete`, `t-dates`). Seed settings: all true. Dates computed relative to a fixed `SEED_TODAY = '2026-09-01'` exported for deterministic tests.

- [ ] **Step 1: failing tests**

```ts
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
```

- [ ] **Step 2:** run → FAIL. **Step 3:** implement. **Step 4:** run → PASS + tsc clean. **Step 5:** commit `feat: advisor workspace types and seeded caseload`

---

### Task 2: WorkspaceStore provider + selectors

**Files:**
- Create: `src/advisor/workspace/WorkspaceStore.tsx`, `src/advisor/workspace/selectors.ts`
- Test: `src/advisor/workspace/WorkspaceStore.test.tsx`, `src/advisor/workspace/selectors.test.ts`

**Interfaces — Produces:**

```ts
// WorkspaceStore.tsx
export function WorkspaceProvider({ children }: { children: ReactNode }): JSX.Element
export function useWorkspace(): {
  ws: WorkspaceState
  dispatchCase: (caseId: string, action: Action) => void
  markRead: (caseId: string) => void
  updateNotes: (clientId: string, notes: string) => void
  updateSettings: (patch: Partial<AdvisorSettings>) => void
  saveTemplate: (t: FollowUpTemplate) => void      // upsert by id
  deleteTemplate: (id: string) => void
  acceptRequest: () => void                        // adds request as waiting-on-client case, clears it
  declineRequest: () => void
  resetWorkspace: () => void
  liveConnected: boolean                           // pass-through of useCase().connected
}
```

Behavior:
- Must render INSIDE `CaseStoreProvider` (it calls `useCase()`). `ws.cases['amara'].state` is always substituted from `useCase().state` in the value memo; `dispatchCase('amara', a)` calls `useCase().dispatch(a)` and does NOT touch local state (relay snapshot round-trips it). All other ids: `reducer(state, action)` locally, set `lastActivity` to now, append an ActivityEvent (text per action type: UPLOAD "Client uploaded <item title>", VERIFY_ITEM "Verified <title>", FLAG_ISSUE "Flagged <title>", SEND_FOLLOW_UP "Asked <client first name> a question", ANSWER_FOLLOW_UP "Replied", START_PREPARING "Started preparing", SEND_DRAFT "Sent draft for review", MARK_FILED "Filed", others: humanized type), persist.
- Persistence: whole WorkspaceState JSON minus the amara state substitution; hydrate with shape guard (`cases` object && `activity`/`templates` arrays) else `seedWorkspace()`.
- `acceptRequest()`: converts `incomingRequest` into a new case (client meta from request fields, `state: seedState()` with phase 'sharing', deadline 2026-07-31) and clears `incomingRequest`. `declineRequest()` just clears it. Seed puts one request in place; it only RENDERS when `settings.acceptingNewCases` (render gate is the view's job, Task 9).

```ts
// selectors.ts — all pure (ws, today?: string) where relevant
export interface AttentionItem { caseId: string; client: string; text: string; kind: 'verify' | 'question' | 'draft' }
export function needsAttention(ws: WorkspaceState): AttentionItem[]
  // per case: uploaded-not-verified count → "N documents to check";
  // open consumer questions (with age in days) → "1 question, 2 days old";
  // phase 'awaiting_approval' → "draft awaiting client approval" is NOT advisor work — exclude;
  // phase 'preparing' with all verified → "ready to draft". Excludes on-hold cases and 'amara'-connection state noise.
export interface InboxEntry { caseId: string; client: string; followUp: FollowUp; group: 'needs-reply' | 'waiting' }
export function inboxItems(ws: WorkspaceState): InboxEntry[]  // needs-reply: open consumer questions, oldest first; waiting: open advisor follow-ups
export function deadlineRisk(ws: WorkspaceState, today: string): WorkspaceCase[]
  // not filed/approved/on-hold, deadline within 30d (or passed without extension-filed), has needed required items; sorted soonest first
export function workloadCounts(ws: WorkspaceState): { open: number; waiting: number; ready: number; filed: number }
export function searchCases(ws: WorkspaceState, q: string): WorkspaceCase[]   // name substring, case-insensitive; empty q → all
export function activityFeed(ws: WorkspaceState, n: number): ActivityEvent[]  // newest first
export function isStalled(c: WorkspaceCase, today: string): boolean           // >14d idle + required 'needed' + not on-hold/filed
export function flagCountFor(ws: WorkspaceState, caseId: string, itemId: string): number  // count of activity events matching FLAG of that item
```

(Precise event-matching: ActivityEvent gains optional `itemId?: string; type?: string` fields — add them to types.ts in this task — so `flagCountFor` filters `type === 'FLAG_ISSUE' && itemId === itemId` rather than parsing text.)

- [ ] **Step 1: failing tests** (WorkspaceStore.test.tsx wraps probe components in `<CaseStoreProvider url={null}><WorkspaceProvider>` — `url=null` skips the socket, existing prop):

```tsx
test('dispatching to one case never mutates another', () => { /* dispatch VERIFY_ITEM on case A (an uploaded item from seed); assert case B's state JSON unchanged, A's item verified, activity[0] mentions it */ })
test('amara dispatch routes to relay dispatch, not local state', () => { /* with url=null CaseStoreProvider, dispatch UPLOAD_ITEM via dispatchCase('amara',...); assert ws.cases.amara.state reflects useCase state (which with url=null applies locally) and localStorage workspace payload does NOT contain amara items mutated */ })
test('workspace persists and hydrates; corrupt storage falls back to seed', () => { /* set key to '{"garbage":1}', mount, expect seed count */ })
test('template upsert and delete', () => { /* saveTemplate({id:'t-new',...}) → appears; deleteTemplate('t-gap') → gone */ })
test('acceptRequest adds a workable case; declineRequest clears', () => {})
```

selectors.test.ts: one test per selector against `seedWorkspace()` with `SEED_TODAY` (counts > 0 where seed guarantees, ordering asserted for inbox oldest-first and deadlineRisk soonest-first, isStalled true for the seeded stalled case, flagCountFor 2 for the seeded twice-flagged item — seed writes those two FLAG_ISSUE activity events in Task 1; extend seed if missing).

- [ ] **Step 2:** run → FAIL. **Step 3:** implement. **Step 4:** run → PASS + tsc. **Step 5:** commit `feat: workspace store with per-case dispatch, persistence and selectors`

---

### Task 3: Component refactor — (state, dispatch) props + shell skeleton with routes

**Files:**
- Modify: `src/advisor/CaseDetail.tsx`, `FollowUpComposer.tsx`, `ClientQuestions.tsx`, `PrepareControls.tsx`, `RequestDocumentForm.tsx` — each top-level prop contract becomes `{ state: CaseState; dispatch: (a: Action) => void }` (+ existing props they keep); delete every internal `useCase()` call. `FollowUpComposer` additionally takes `templates: FollowUpTemplate[]` (callers pass `ws.templates`).
- Modify: `src/advisor/AdvisorApp.tsx` → shell: `<WorkspaceProvider>` + sidebar/topbar placeholders + `<Routes>` with `index → Today`, `cases`, `cases/:id`, `inbox`, `clients`, `settings` (each view a stub `<section>` with its name for now; Tasks 4-7 fill them). Uses relative `Routes` (`path="cases/:id"` etc.) so it works under both `/advisor/*` (main.tsx route becomes `path="/advisor/*"`) and hub MemoryRouter (hub preview updated to `<MemoryRouter><AdvisorApp/></MemoryRouter>` if not already).
- Delete: `src/advisor/StaticCaseDetail.tsx`, `src/advisor/staticCases.ts`, `src/advisor/AdvisorQueue.tsx` (replaced by CasesTable in Task 5; delete now, stub the cases route).
- Modify: `src/advisor/AdvisorApp.test.tsx` — the three legacy tests re-target case detail via the new route (`MemoryRouter initialEntries={['/cases/amara']}`); assertions unchanged in meaning (blocking summary text, Verify ✓ flow, follow-up send flow).
- Test: updated AdvisorApp.test.tsx + a smoke test that `/` (Today stub), `/inbox`, `/clients`, `/settings` routes render their section names.

**Interfaces — Produces:** the exact prop contracts above; `AdvisorApp` requiring only a Router ancestor + CaseStoreProvider.

- [ ] Steps: failing tests → FAIL → implement → PASS + tsc → commit `refactor: advisor components take case props; shell routes skeleton`

---

### Task 4: Today dashboard

**Files:** Create `src/advisor/views/Today.tsx`, `src/components/StatTile.tsx`, `src/lib/relativeTime.ts`; extend `src/advisor/advisor.css`. Test: `src/advisor/views/Today.test.tsx`.

**Interfaces:** Consumes `useWorkspace`, selectors, `relativeTime(iso: string, now?: string): string` (produces "just now", "2 h ago", "3 d ago", date beyond 7d).

Content (exact copy where quoted): greeting "Good morning, Anna" (time-of-day aware: morning/afternoon/evening), sub-line "31 July is in N weeks" computed from deadline vs today (past → "Deadline season is done — extensions only"). Four StatTiles: Open cases / Waiting on clients / Ready to work / Filed this season (from `workloadCounts`). "Needs you now" list from `needsAttention` (each row a link to `cases/:id`); empty state "All clear — nothing needs you right now." Deadline strip from `deadlineRisk` ("At risk" heading) with stalled badge rows where `isStalled`. Incoming request card renders only when `settings.acceptingNewCases && ws.incomingRequest` (buttons wired in Task 9 — render Accept/Decline now, call accept/declineRequest directly; Task 9 adds the confirm dialog for decline). Activity feed (`activityFeed(ws, 8)`) with relative times.

Tests: stat numbers match `workloadCounts(seedWorkspace())`; a needs-attention row navigates (link href contains `/cases/`); request card hidden when `acceptingNewCases` false (flip via updateSettings probe or seed override); activity renders 8 rows max.

- [ ] Steps: fail → implement → pass + tsc → commit `feat: today dashboard — stats, needs-you-now, deadline strip, activity`

---

### Task 5: Cases table

**Files:** Create `src/advisor/views/CasesTable.tsx`; css. Test: `src/advisor/views/CasesTable.test.tsx`.

Columns: Client (name + year caption), Status (`StatusChip` from `caseStatus(c.state)` extended: on-hold → neutral "On hold", extension-filed → warning "Extension filed", filed → success "Filed", awaiting_approval → "In review"), Docs (`sharedCount`/`requiredItems.length` as "4/6"), Deadline (relative distance; calm coloring: token `--color-ink-soft` >30d, `--color-warning` ≤30d, `--color-issue` past && !extension-filed), Last activity (`relativeTime`), unread dot. Search input (topbar's global search navigates here with the query; local input also filters), filter pills with counts (All / Waiting on client / Blocked / Ready / In review / Done), sort select (Deadline / Activity / Name). Amara pinned first with "Live demo" badge regardless of sort. Row = link to `cases/:id`; opening calls `markRead`. Empty filter result: "No cases here — nice." with a clear-filter link.

Tests: filter pill narrows rows and counts match seed; sort by name orders alphabetically (amara still first); search "Priya" leaves one row; row click marks unread cleared (probe ws.unread via re-render).

- [ ] Steps: fail → implement → pass + tsc → commit `feat: cases table — search, filters, sort, live-demo pin`

---

### Task 6: Case detail view + client header + history

**Files:** Create `src/advisor/views/CaseDetailView.tsx`; css. Test: `src/advisor/views/CaseDetailView.test.tsx`.

Reads `:id` via `useParams`, pulls `ws.cases[id]` (unknown id → EmptyState "Case not found" + back link). Composes: client header (initials avatar, name, year, language chip 'EN'/'DE', email, city, "Notes" inline-editable textarea saving via `updateNotes` on blur); the refactored `CaseDetail` + `FollowUpComposer` (with `ws.templates`) + `ClientQuestions` + `PrepareControls` + `RequestDocumentForm` wired to `(c.state, a => dispatchCase(id, a))`; case history panel = that case's activity slice (newest first, `relativeTime`). On-hold case: banner "On hold — client withdrew" + note + "Reopen case" button (dispatch nothing to reducer — clears `special` via a new store method `reopenCase(caseId)`; ADD this method to WorkspaceStore in this task, one-line state patch + activity event "Reopened case"). All actions verified working on a NON-amara case.

Tests: verify flow works on seeded non-amara case (click Verify ✓ → "Checked ✓"); notes edit persists (blur → localStorage payload contains text); unknown id shows not-found; on-hold shows banner and Reopen clears it.

- [ ] Steps: fail → implement → pass + tsc → commit `feat: case detail view — any case fully workable, client header, history`

---

### Task 7: Inbox, Clients, Settings + template manager

**Files:** Create `src/advisor/views/InboxView.tsx`, `ClientsView.tsx`, `SettingsView.tsx`, `src/components/Dialog.tsx`; css. Tests: one test file per view.

- **Inbox:** groups per `inboxItems`: "Needs your reply" (rows: client, item chip if `followUp.itemId`, excerpt, age "2 d"; inline textarea reply → `dispatchCase(caseId, {type:'ANSWER_FOLLOW_UP', followUpId, reply})`; quick-reply buttons reuse Phase-2 canned answers) and "Waiting on client" (read rows, days-out, link to case). Empty: EmptyState icon "📭" title "Inbox zero" body "Every question answered. Enjoy it while it lasts."
- **Clients:** searchable list (avatar, name, city, language, case status chip, joined year) → client sheet (Dialog or side panel): contact block, filing history (static line "2024 · Filed · refunded €" + per-seed variety authored in seed notes — add `history: string[]` to ClientMeta in types.ts + seed, this task), link "Open case", notes textarea (updateNotes).
- **Settings:** profile card (ADVISOR const + email/city), "Accepting new cases" toggle → `updateSettings`; notification checkboxes (three prefs); **Templates**: list rows (label + body preview) with Edit (inline form: label + body inputs, `<item>` placeholder hint, Save → saveTemplate) / Delete (Dialog confirm) / "New template" (id `t-<slug>`), and note "Templates appear in every case's follow-up composer."; "Reset workspace" (Dialog confirm → resetWorkspace).
- **Dialog** (shared): `{ open, title, children, confirmLabel, onConfirm, onClose, tone?: 'default' | 'danger' }`, real `<dialog>`-like overlay with focus on confirm button, Esc/backdrop close.

Tests: inbox reply dispatches to the CORRECT case (two seeded questions from different cases; reply to one, assert only that case's followUp answered); clients search narrows; template edit then open a case detail composer → new label appears in template select; delete template requires confirm; toggle flips sidebar availability dot (assert via WorkspaceStore state probe; visual dot asserted in Task 8's shell test).

- [ ] Steps: fail → implement → pass + tsc → commit `feat: inbox, clients directory, settings with template manager`

---

### Task 8: Shell for real + edge behaviors wave 1

**Files:** Create `src/advisor/shell/{Sidebar,Topbar,NotificationMenu,ConnectionPip}.tsx`; modify `AdvisorApp.tsx`, `CaseDetail.tsx` (flag presets + second-flag escalation), `Today.tsx` (nudge button on stalled rows); css. Tests: `src/advisor/shell/shell.test.tsx` + additions to CaseDetailView.test.tsx.

- **Sidebar:** nav items with badges — Inbox badge = needs-reply count; Cases badge = needsAttention case count. Active route highlight. Anna block with availability dot (green when acceptingNewCases, gray otherwise, title text "Accepting new cases"/"Not accepting new cases").
- **Topbar:** global search input (`/` keydown on document focuses it; typing + Enter navigates to `cases` with query via `useNavigate` + search param read by CasesTable); NotificationMenu (bell + unread count = attention items filtered by notification prefs; dropdown rows link to cases; empty "Nothing new."); ConnectionPip: green "Live sync" when `liveConnected`, amber "Live sync offline — retrying" otherwise.
- **Relay-offline behavior:** in CaseDetailView, when `id === 'amara' && !liveConnected`: warning Banner "Live sync offline — Amara's phone can't see changes right now. Reconnecting…" and action buttons disabled (`disabled` prop pass-down; CaseDetail/PrepareControls/FollowUpComposer accept optional `disabled?: boolean`).
- **Flag presets (edge §6.4):** flag-issue flow becomes preset select — "Can't open / password-protected", "Cut off / illegible", "Wrong document", "Something else" + note input (note optional unless Something else).
- **Second-flag escalation (edge §6.3):** when `flagCountFor(ws, caseId, itemId) >= 1` and advisor opens flag UI again, show inline suggestion "Asked twice already — request a different document instead?" with button routing to RequestDocumentForm prefilled.
- **Nudge (edge §6.2):** stalled rows (Today deadline strip + CasesTable stalled badge) expose "Send a nudge" → `dispatchCase(id, {type:'SEND_FOLLOW_UP', message: 'Just a gentle nudge — your return can move as soon as the remaining documents are in. The 31 July deadline is comfortable if we keep going now.'})` + activity event via normal dispatch path.

Tests: pip amber when `liveConnected` false (CaseStoreProvider url=null → connected false — assert); amara detail disables Verify when offline; flag preset dispatches FLAG_ISSUE with preset text as note prefix; second flag shows escalation suggestion; nudge dispatches the exact message; `/` focuses search; bell count matches selector.

- [ ] Steps: fail → implement → pass + tsc → commit `feat: app shell, notifications, offline handling, flag escalation, nudges`

---

### Task 9: Edge behaviors wave 2 + empty-state sweep

**Files:** Modify `Today.tsx` (request card Accept/Decline with Dialog on decline), `CasesTable.tsx` (verify all chips incl. On hold/Extension filed render from seed), seed tweaks if a state can't be reached; css. Tests: additions.

- Accept adds row to CasesTable (navigate + assert new client name present) and the new case is workable (open it, Verify nothing — but assert checklist renders 'To share' items).
- Decline: Dialog confirm ("Decline this case? Taxfix will route it to another advisor." — confirm label "Decline"), then card gone.
- Toggle OFF acceptingNewCases hides the card even with a pending request.
- Empty-state sweep: notification tray, inbox groups (each group heading hidden when its list is empty, whole-inbox EmptyState when both empty), search no-results, notes placeholder "No notes yet — anything worth remembering about this client?", activity feed empty after reset (reset → feed shows "No activity yet today.").
- Reset workspace round-trip test: mutate → reset via Settings dialog → seed state back, localStorage rewritten.

- [ ] Steps: fail → implement → pass + tsc → commit `feat: capacity loop, edge chips and empty-state sweep`

---

### Task 10: /press deck

**Files:** Create `src/press/{Press.tsx, slides.tsx, press.css}`; modify `src/main.tsx` (route `/press`), `src/hub/Hub.tsx` (sidebar "Present" link → `/press`). Test: `src/press/Press.test.tsx`.

`slides.tsx` exports `SLIDES: Slide[]` where `interface Slide { id: string; title: string; body: ReactNode; note?: string }` — the 12 slides EXACTLY per spec §11 (order, content directions, presenter notes as one-liners). Screenshots referenced from `/screenshots/`; metric numbers and decision-log rows copied from hub sections' source (import the same data constants where they exist; otherwise restate verbatim). `Press.tsx`: full-viewport deck; ←/→ and Space advance; `Esc` toggles overview grid (all slide titles, click to jump); slide counter "4 / 12"; presenter note in small text bottom-left; token styling, works in light hub context (self-contained background token). No router dependency beyond being routed.

Tests: renders slide 1 title; ArrowRight advances to slide 2 (assert its title); Escape shows overview grid with all 12 titles; counter shows "1 / 12".

- [ ] Steps: fail → implement → pass + tsc → commit `feat: press deck — 12 keyboard-driven slides with presenter notes`

---

### Task 11: Hub edge-cases section + architecture note + AI-log + screenshots

**Files:** Create `src/hub/sections/EdgeCases.tsx`; modify `src/hub/Hub.tsx` (nav + section after References), `src/hub/sections/Framing.tsx`-adjacent architecture section (add workspace paragraph), `src/hub/sections/AiLog.tsx` (this rework's overrides — written from the build ledger at execution time; at minimum: the flag-count-via-activity design choice and any fix-loop findings), FlowMap advisor rail screenshot. Test: `src/hub/Hub.test.tsx` addition.

EdgeCases content: two tables from spec §6 (nine rows: scenario / what the app does / how to trigger in the demo / rationale) and §7 (eight rows: scenario / what production needs / why deferred). Copy the spec rows faithfully — they are already written for presentation.

Screenshot recapture: extend/reuse `scripts/capture.mjs` (or a new `scripts/capture-advisor.mjs` if simpler) to capture: advisor Today, Cases table, case detail, Inbox — save `public/screenshots/{a1-today,a2-case,a3-cases,a4-inbox}.png` (keep `a2-case.png` name for existing hub references; update FlowMap advisor rail to use the new richer shot set where it fits). Verify PNGs visually (Read) before committing.

Tests: hub renders "Edge cases & failure modes" heading and one known row ("Relay offline"); nav link list includes it.

- [ ] Steps: fail → implement → pass + tsc → capture + verify → commit `feat: hub edge-cases section, workspace architecture note, fresh advisor screenshots`

---

### Task 12: Final verification + README + polish pass

**Files:** Modify `README.md` (routes table + advisor workspace description + /press + demo script step for edge-case beats), css touch-ups only.

- Full gates: `npx vitest run`, `npx tsc -p tsconfig.app.json --noEmit`, `npm run build`, route walk `/`, `/advisor` (+ each advisor view), `/press` via dev server — HTTP 200, zero console errors.
- Visual pass on every advisor view + press deck via headless capture; fix the worst spacing/hierarchy findings (≤5, no feature changes).
- README: update routes, add "Edge-case demo beats" list (nudge, offline pip, second-flag escalation, capacity accept — one line each on how to trigger), /press keys.
- Commit `chore: readme, visual polish and final verification for advisor workspace`

---

## Self-review (run at planning time)

- **Spec coverage:** §2 IA→T3/T8; §3.1 store→T1/T2; §3.2 seed→T1; §3.3 selectors→T2; §4 five views→T4-T7 (+detail T6); §5 standards→T7 Dialog/T4 relativeTime/css throughout; §6.1→T8, §6.2→T8, §6.3→T8, §6.4→T8, §6.5→T1+T5, §6.6→T1+T6, §6.7→T2+T4+T9, §6.8→T2, §6.9→T7/T9; §7+§8 hub→T11; §9 testing→each task + T10 press tests; §11 press→T10; §12 cuts respected (no auth/calendar/reports). No gaps.
- **Placeholder scan:** clean — every task carries concrete content, copy, or exact test intent; view tests described by behavior + assertion target (pattern established in Phase 1/2 plans).
- **Type consistency:** WorkspaceState/useWorkspace signatures defined once (T1/T2) and consumed by name in T3-T11; `reopenCase` added in T6 and not referenced earlier; `history: string[]` on ClientMeta added in T7 and not referenced earlier; ActivityEvent optional fields added in T2 before first use in T8's flagCountFor.
