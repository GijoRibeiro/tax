# Stakeholder Personas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two interviewable, source-grounded personas (Betina the filer, Anna the advisor) with a live split-chat surface at `/stakeholders`, answered from the presenter's Claude Code session through the existing relay, plus two deck slides and hub portraits.

**Architecture:** A pure `stakeholders` reducer (same pattern as `state.ts`) runs inside the relay next to the case reducer and broadcasts `{kind:'stakeholders'}` frames. The web `CaseStoreProvider` learns that frame and exposes a `useStakeholders()` hook over the same socket. A CLI (`scripts/stakeholders.mjs`) lets the session wait for and answer questions. Persona knowledge is markdown in `docs/personas/`, read by the session when answering; the UI only shows transcripts and sources.

**Tech Stack:** TypeScript, React 18, react-router, Vite, vitest + Testing Library, Node `ws`.

**Spec:** `docs/superpowers/specs/2026-09-05-stakeholder-personas-design.md`

## Global Constraints

- No LLM call from browser or relay; no API key in the web app.
- Personas are composites; the UI shows "Composite persona · sourced" and a disclaimer.
- Reuse the one socket in `CaseStoreProvider`; no second WebSocket.
- Motion reuses the deck's `press-enter` timing: 700–800ms, `cubic-bezier(0.22, 1, 0.36, 1)`, per-object stagger ~70ms, `prefers-reduced-motion` respected.
- Copy in English; German document names kept as artifacts.
- Conventional commits; every task ends green on `npx vitest run` and `npx tsc -b`.

## File structure

- Create `src/store/stakeholders.ts` — types, `reduceStakeholders`, `pendingQuestion`, `seedStakeholders`, `STAKEHOLDER_ACTION_TYPES`.
- Create `src/store/stakeholders.test.ts`.
- Create `server/stakeholders.seed.json` — seeded transcripts (filled by Task 7 interviews; starts with an empty-per-persona shape).
- Modify `server/relay.mjs` — route stakeholder actions, persist runtime file, broadcast frames.
- Modify `server/relay.test.ts` — round-trip test.
- Create `scripts/stakeholders.mjs` — CLI.
- Modify `src/store/CaseStore.tsx` — handle `kind:'stakeholders'`, expose `stakeholders`, `dispatchStakeholder`.
- Create `src/stakeholders/useStakeholders.ts` — hook over the case context.
- Create `src/stakeholders/personas.ts` — display metadata (name, situation, portrait, sources, pull quote) for both personas.
- Create `src/stakeholders/Stakeholders.tsx`, `PersonaColumn.tsx`, `stakeholders.css`, `Stakeholders.test.tsx`.
- Modify `src/main.tsx` — route `/stakeholders`.
- Modify `src/press/slides.tsx`, `Press.tsx`, `press.css`, `Press.test.tsx` — two slides, `parked`, `S` key.
- Modify `src/hub/sections/Personas.tsx`, `hub.css` — portraits + link.
- Create `docs/personas/README.md`, `betina-bugnotto.md`, `anna-weber.md`, `interview-findings.md`.
- Modify `README.md`, `docs/PANEL-RUNBOOK.md`, `CLAUDE.md`, `.gitignore`.

---

### Task 1: Stakeholder reducer

**Files:** Create `src/store/stakeholders.ts`, `src/store/stakeholders.test.ts`, `server/stakeholders.seed.json`.

**Produces:**
```ts
export type PersonaId = 'amara' | 'anna'
export interface StakeholderMessage { id: string; role: 'interviewer' | 'persona'; text: string; at: string }
export type StakeholderState = Record<PersonaId, StakeholderMessage[]>
export type StakeholderAction =
  | { type: 'ASK_PERSONA'; persona: PersonaId; text: string; id?: string; at?: string }
  | { type: 'ANSWER_PERSONA'; persona: PersonaId; text: string; id?: string; at?: string }
  | { type: 'RESET_PERSONA'; persona: PersonaId }
  | { type: 'RESET_STAKEHOLDERS' }
  | { type: 'REPLACE_STAKEHOLDERS'; state: StakeholderState }
export const STAKEHOLDER_ACTION_TYPES: ReadonlySet<string>  // the four client-sendable types (not REPLACE)
export function seedStakeholders(): StakeholderState          // deep copy of the seed json
export function reduceStakeholders(s: StakeholderState, a: StakeholderAction): StakeholderState
export function pendingQuestion(s: StakeholderState, p: PersonaId): StakeholderMessage | null
export function isStakeholderState(v: unknown): v is StakeholderState
```

- [ ] Write tests: ASK appends interviewer message with generated id/at; blank text ignored; ANSWER appends persona message; RESET_PERSONA restores seed for that persona only; RESET_STAKEHOLDERS restores both; unknown action returns same reference; pendingQuestion returns last message only when interviewer; seed shape has both keys as arrays.
- [ ] Run, see fail. Implement. Run, see pass. `tsc -b`. Commit `feat: stakeholder chat reducer and seed`.

### Task 2: Relay routes stakeholder actions

**Files:** Modify `server/relay.mjs`, `server/relay.test.ts`, `.gitignore` (add `server/.stakeholders.runtime.json`).

- [ ] Test: connect, expect a `stakeholders` frame on connect; send `{kind:'action', action:{type:'ASK_PERSONA', persona:'amara', text:'Hi'}}`; expect next `stakeholders` frame with `state.amara` last message text `Hi`, role interviewer; a second client also receives it. Case `state` frames unaffected.
- [ ] Implement: import `reduceStakeholders, seedStakeholders, STAKEHOLDER_ACTION_TYPES` from `../src/store/stakeholders.ts`; `let stakeholders = loadRuntime() ?? seedStakeholders()`; on connect send `{kind:'stakeholders', state: stakeholders}`; in the action branch, if `STAKEHOLDER_ACTION_TYPES.has(type)` reduce + broadcast + `persist()` and return before the case reducer. `createRelay(port, { persistPath })` option; tests pass `persistPath: null` to skip disk.
- [ ] Green, commit `feat: relay carries stakeholder chats`.

### Task 3: CLI

**Files:** Create `scripts/stakeholders.mjs`.

- [ ] Implement with `ws`: `wait [persona]` connects, on first `stakeholders` frame and each later one checks `pendingQuestion`; prints `[<persona>] <text>` and exits 0 (prints all pending if no persona filter). `reply <persona> <text|--file path>` sends ANSWER_PERSONA then exits after the echo frame. `ask`, `show [persona]` (pretty transcript), `reset [persona]`. `--url` override, default `ws://127.0.0.1:8787`. Usage on no args, exit 2.
- [ ] Manual check against the running relay: `ask amara "test"` → `wait amara` returns immediately → `reply amara "ok"` → `show amara` shows both → `reset amara`.
- [ ] Commit `feat: stakeholders CLI for the presenter session`.

### Task 4: Web store + hook

**Files:** Modify `src/store/CaseStore.tsx`; create `src/stakeholders/useStakeholders.ts`; extend `src/store/CaseStore.test.tsx`.

- [ ] Test: provider exposes `stakeholders` seeded when offline; `dispatchStakeholder({type:'ASK_PERSONA',…})` offline reduces locally; a mocked `kind:'stakeholders'` frame replaces state.
- [ ] Implement: second `useReducer(reduceStakeholders, undefined, seedStakeholders)`; in `onmessage` handle `msg.kind === 'stakeholders' && isStakeholderState(msg.state)` → `REPLACE_STAKEHOLDERS`; `dispatchStakeholder` sends over socket when live else local. Hook: `useStakeholders()` returns `{ state, pending(persona), ask(persona, text), reset(persona), online }`.
- [ ] Green, commit `feat: stakeholder state over the shared socket`.

### Task 5: `/stakeholders` surface

**Files:** Create `src/stakeholders/personas.ts`, `Stakeholders.tsx`, `PersonaColumn.tsx`, `stakeholders.css`, `Stakeholders.test.tsx`; modify `src/main.tsx`.

**personas.ts:** `PERSONAS: Record<PersonaId, { name; situation; portrait; pill: 'Composite persona · sourced'; quote; sources: {label; url}[] }>`. Sources are the links from the persona markdown files (Task 6) — keep the two in sync.

- [ ] Tests: renders both names and situations; typing in "Ask Betina…" + Enter calls ask and clears; when last message is interviewer, shows "Betina is typing…"; "Sources" button opens a drawer listing at least one link and the disclaimer text "Composite persona"; offline (test env) shows "Live sync offline — retrying" and composer disabled; `?embed=1` hides the page header (`.sh-page__header` absent).
- [ ] Implement layout per spec §5.1. Message bubbles animate with `press-enter`-equivalent keyframes defined in `stakeholders.css` (`sh-enter`). Reset button dispatches RESET_PERSONA. Auto-scroll transcript to bottom on new message.
- [ ] Route in `main.tsx`: `<Route path="/stakeholders" element={<Stakeholders />} />`.
- [ ] Green, screenshot with headless Chrome, commit `feat: /stakeholders split interview surface`.

### Task 6: Persona knowledge files

**Files:** Create `docs/personas/README.md`, `betina-bugnotto.md`, `anna-weber.md`. Modify `CLAUDE.md` (rule: consult personas for design questions; log interviews).

- [ ] Write both files in the spec §3 section order with source links (Taxfix Expert Service pages, Taxfix support cost article, Trustpilot page 8 themes, Taxfix ratgeber Arbeitslosigkeit, tax-talents/ifo staffing numbers, TABAK StBVV example, onlinebilanz deadline, arbeitsagentur ELStAM notice, finmatics). Complaint→decision tables reference D1–D15 from `src/hub/sections/Framing.tsx`.
- [ ] README: method, disclaimer, portrait credit (pravatar.cc, images 16 and 23, free to use).
- [ ] Commit `docs: persona knowledge files and method`.

### Task 7: Discovery interviews + seed

**Files:** Modify `server/stakeholders.seed.json`; create `docs/personas/interview-findings.md`.

- [ ] Run 7 questions per persona (arrival, fear, last time it went wrong, what good looks like, price/acceptance, what makes them quit, one thing to change) — answers written in character from the files, 2–5 sentences each, with a concrete number or document name where the file supports it.
- [ ] Save as seeded transcripts (ids `seed-<persona>-<n>`, `at` ISO on 2026-09-05). `interview-findings.md`: table quote → who → decision id / scope cut / new (parked in INTERVIEW-PREP).
- [ ] Update `personas.ts` pull quotes from the transcripts. Restart relay so the seed is live. Commit `feat: discovery interviews seeded into the stakeholder chats`.

### Task 8: Deck slides + hub

**Files:** Modify `src/press/slides.tsx`, `Press.tsx`, `press.css`, `Press.test.tsx`, `src/hub/sections/Personas.tsx`, `src/hub/hub.css`, `src/hub/Hub.test.tsx` if it counts sections.

- [ ] `Slide` gets `parked?: boolean`. `RUN_ORDER = SLIDES.filter(s => !s.parked)`; arrows/dots iterate `RUN_ORDER`; overview lists all with a "parked" tag; `S` key `window.open('/stakeholders', '_blank')`.
- [ ] Slide `stakeholders` after `user`: two `.press-person` cards (portrait 96px, name, situation, quote) + method line; talk notes with three finding→decision examples; budget 1:30. Slide `stakeholders-live` (parked): iframe `/stakeholders?embed=1`, `title="Stakeholder interviews"`, budget 2:00.
- [ ] Tests: run order length 13, overview 14, `S` calls window.open, parked slide not reachable by ArrowRight from the last run-order slide.
- [ ] Hub Personas: `<img src="/personas/betina.jpg">` etc. + link. Green, screenshot both slides, commit `feat: stakeholder slides, S shortcut, hub portraits`.

### Task 9: Docs + runbook + verification

- [ ] README: route table row, keys (`N`, `S`), stage flow (spec §6.5), portrait credit. Runbook: slide table (13 + parked), pre-flight adds `node scripts/stakeholders.mjs show`, live-flow box. COVERAGE.md row 7.1 mentions the interviews. Hub AiLog "How this was built" gains the persona-interview stage if missing.
- [ ] Full `npx vitest run`, `npx tsc -b`, headless screenshots of `/stakeholders` and both slides, CLI round-trip once more. Commit `docs: stakeholder personas in readme, runbook and coverage`.

## Self-review

Spec coverage: §3→T6, §4→T7, §5.1→T5, §5.2→T8, §5.3→T8, §5.4→done (portraits fetched) + T6 credit, §6.1→T1, §6.2→T2, §6.3→T3, §6.4→T4, §6.5→T9, §7→T1/T2/T5/T8. Type names consistent across tasks (`PersonaId`, `StakeholderState`, `dispatchStakeholder`, `useStakeholders`). No placeholders.
