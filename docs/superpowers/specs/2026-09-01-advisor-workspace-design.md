# Advisor Workspace — a real tool, not a prop

**Date:** 2026-09-01
**Builds on:** v1 hand-off spec (2026-08-31) and native full-journey spec (v2). This spec covers the third rework: the advisor surface becomes a realistic multi-view web app.

## 1. Why

The current `/advisor` is one screen: a queue pane with four decorative rows and a detail pane where only Amara's case works. It reads as a presentation prop. A Steuerberaterin running 60 seasonal cases opens a *tool*: a workload dashboard, a caseload table, an inbox, client records, settings she actually changes. This rework makes every pixel of the advisor surface behave like that tool, and turns its edge cases into discussion material on the hub.

**Design stance:** put Anna at 8:45 with coffee in front of the app. Her questions, in order: *What needs me right now? What's blocking each case? Who hasn't answered? What's filed and what's at risk?* The IA answers those questions in that order.

## 2. Information architecture

App shell under `/advisor` with nested routes (react-router):

```
/advisor                → Today (dashboard, landing)
/advisor/cases          → Cases (table)
/advisor/cases/:id      → Case detail (fully workable, any case)
/advisor/inbox          → Inbox (cross-case communication)
/advisor/clients        → Clients directory
/advisor/settings       → Settings + template manager
```

- **Sidebar (left):** product mark ("taxfix · Expert"), nav items with icons + unread/attention badges (Inbox count, Cases needing action count), Anna's profile block at bottom (initials avatar, name, "Steuerberaterin · Leipzig", availability dot bound to the Settings toggle).
- **Topbar:** global search (matches case client names and client directory entries; keyboard `/` focuses it), notification bell with dropdown (derived from the activity/attention selectors), connection status pip for the relay (see §7.1).
- The hub's embedded advisor preview wraps the app in a `MemoryRouter`; nothing in the shell may assume a browser URL.

## 3. Data architecture

### 3.1 Workspace store

New `WorkspaceProvider` (`src/advisor/workspace/`) owning:

```ts
interface ClientMeta {
  id: string; name: string; year: number; language: 'en' | 'de'
  email: string; city: string; joined: string /* ISO */
  notes: string /* advisor-editable, persisted */
}
interface WorkspaceCase {
  client: ClientMeta
  state: CaseState            // THE shared reducer's state — same shape as Amara's
  deadline: string            // ISO; mostly 2026-07-31, some extension/filed variants
  lastActivity: string        // ISO, updated on every dispatch
  unread: boolean             // set when client-side events arrive, cleared on open
  special?: 'on-hold' | 'extension-filed'   // seeded edge markers (see §6)
}
interface WorkspaceState {
  cases: Record<string, WorkspaceCase>      // ~20 entries; 'amara' is the relay-live one
  activity: ActivityEvent[]                 // appended on dispatch; feeds Today + bell
  settings: AdvisorSettings                 // availability, notification prefs
  templates: FollowUpTemplate[]             // editable; composer consumes these
  incomingRequest?: IncomingCaseRequest     // §6.7
}
```

- `dispatchCase(caseId, action)`: `'amara'` → send over the relay socket exactly as today (phone sync untouched); any other id → run the **same shared reducer** locally, append activity, persist.
- Persistence: `localStorage` key `taxfix-advisor-workspace-v1`, shape-validated on hydration with seed fallback (same guard pattern as the consumer store). "Reset workspace" lives in Settings.
- Relay snapshots only ever overwrite `cases['amara'].state`.

### 3.2 Seeded caseload (~20 cases)

Generated in `src/advisor/workspace/seedWorkspace.ts` — deterministic, hand-written (no faker): a believable Berlin/Leipzig client mix (German and expat names), spread across the full lifecycle so every filter, stat, and edge state has real contents:

| Bucket | ~Count | Notes |
|---|---|---|
| Waiting on client | 4 | varied docs missing; one stalled >14 days (§6.2) |
| Blocked — asked client | 3 | open follow-ups; one with a twice-flagged item (§6.3) |
| Ready to work | 3 | all required docs in |
| In preparation | 2 | phase = preparing |
| Sent for review | 2 | draft with refund estimate awaiting client approval |
| Approved / Filed | 4 | two filed in June, one approved, one filed-after-extension (§6.5) |
| Edge markers | 2 | one on-hold/withdrawn (§6.6), one at-risk near deadline |

Refund estimates vary (€240–€3,180); one case is a payment-due (negative) — realistic, and a good discussion row.

### 3.3 Selectors

`workspaceSelectors.ts`: `needsAttention(ws)` (docs to verify + unanswered questions + drafts awaiting, per case), `inboxItems(ws)` (open consumer questions; open advisor follow-ups), `deadlineRisk(ws, today)`, `workloadCounts(ws)`, `searchCases(ws, q)`, `activityFeed(ws, n)`. All pure, all unit-tested.

## 4. The five views

**Today** — greeting with date and season context ("31 July is in 8 weeks" — calm, not a countdown), four stat tiles (open cases / waiting on clients / ready to work / filed this season), **Needs you now** list (each row: client, what's waiting — "2 documents to check", "1 question, 2 days old", "draft awaiting approval" — click jumps into the case at the right section), **deadline strip** (at-risk cases), recent activity feed.

**Cases** — table: client, year, status chip, docs progress (4/6), deadline distance (calm coloring: neutral >30d, warm ≤30d, issue-toned overdue-without-extension), last activity (relative: "2 h ago"), unread dot. Search + filter pills with counts (All / Waiting on client / Blocked / Ready / In review / Done) + sort (deadline, activity, name). Amara pinned first with a "Live demo" badge.

**Case detail** — existing components (checklist verify/flag, follow-up composer, client questions, prepare→draft→file controls, request-document form) refactored from singleton `useCase` to props `(caseState, dispatch)`; a client header (name, year, language chip, email, city, notes affordance); a compact case history (that case's activity slice). Every case fully workable end-to-end: Anna can take any seeded case from "waiting" through "filed" locally.

**Inbox** — two groups: **Needs your reply** (open consumer questions, oldest first, age labels) and **Waiting on client** (open advisor follow-ups with days-out). Rows: client, linked item, excerpt, age. Inline reply + the quick-reply canned answers; answering dispatches to the correct case. Inbox-zero empty state with personality.

**Clients** — directory list with search: avatar initials, name, city, language, active-case status, joined year. Row opens a client sheet: contact block, filing history (previous years, static), the active case link, editable notes (persisted).

**Settings** — Anna's profile (read-mostly), **Accepting new cases** toggle (drives sidebar availability dot + §6.7), notification preferences (checkboxes, persisted, wired to the bell's derivations), **Template manager**: list/add/edit/delete follow-up templates with `<item>` placeholder preview; the composer reads templates from the store (the three current ones become seeds). Reset workspace (confirm dialog) lives here.

## 5. Visual & interaction standards

Existing token system and `.advisor` density wrapper; brand typography as shipped in Phase 2. New shell components (`Sidebar`, `Topbar`, `StatTile`, `DataTable`, `NotificationMenu`, `ClientSheet`, `Dialog`) consume tokens only. Relative-time formatting via one shared `relativeTime()` util (en locale). Every list has an empty state; every destructive action (template delete, reset workspace, decline request) confirms via `Dialog`. Keyboard: `/` focuses search; table rows are real links.

## 6. Edge cases & failure modes — shipped behaviors

Each of these is *demonstrable* in the app, and each gets a row in the hub's new section (§8).

1. **Relay offline (technical failure):** the topbar pip goes amber "Live sync offline — retrying"; Amara's case detail shows a banner and disables her actions (local cases unaffected — they don't need the relay). Auto-reconnect with backoff; pip returns to green, banner clears. (Phone already falls back to seeded state — the two behaviors get told together on the hub.)
2. **Unresponsive client:** a case with no client activity >14 days and missing required docs shows a **Stalled** marker on Today and in the table; case detail offers one-click **Send a nudge** (a reminder template follow-up: calm copy, deadline mention). Rationale: chasing silence is an advisor's most common real task.
3. **Repeat problem document:** flagging the *same item* a second time changes the affordance — the app suggests "Request a different document instead" (routes into the existing request-document form). Rationale: asking a third time for the same broken scan wastes both sides' time.
4. **Unreadable upload:** flag-issue gains preset reasons ("Can't open / password-protected", "Cut off / illegible", "Wrong document") + free note. Preset reasons feed better client-side messaging than free text.
5. **Deadline realities:** one seeded case is **at risk** (missing docs, <10 days); one carries **Extension filed** (deadline passed, extension chip, calm — "with an advisor, extensions exist" ties to the consumer FAQ). Overdue-without-extension renders issue-toned. No countdown-panic anywhere.
6. **Withdrawn client:** one seeded case is **On hold — client withdrew** (read-only, reason note, "reopen" affordance). Real caseloads contain dead cases; a tool that can't represent them lies.
7. **Capacity loop:** when **Accepting new cases** is ON, an **incoming case request** card appears on Today (client, situation summary, estimated effort) with Accept (adds a real waiting-on-client case to the table) / Decline (confirm + it leaves). Toggle OFF and no requests come. Rationale: the marketplace's supply side is a real workflow, not a static roster.
8. **Storage resilience:** corrupt/legacy `localStorage` → shape-guard → clean seed (never a broken screen); same guarantee the consumer store already makes.
9. **Empty/edge UI states:** inbox zero, search with no matches, a filter with zero cases, notes empty state, notification tray empty — all designed, none blank.

## 7. Edge cases — documented but deliberately NOT built (hub table, production column)

GDPR retention & deletion flows; virus/malware scanning on upload; identity fraud signals; multi-advisor reassignment and vacation handover; ELSTER submission failure/retry; partial-year cross-border income; advisor SLA breach escalation; push-notification delivery failure. Each gets one hub row: scenario → what production would need → why it's out of prototype scope. That's the "we thought past the demo" story.

## 8. Hub additions

- New section **"Edge cases & failure modes"** after the references section: two tables (shipped behaviors §6 with how-to-trigger notes; production concerns §7), each row: scenario / behavior / rationale.
- Architecture section gains a paragraph on the workspace store (multi-case local reducer + one relay-live case) with a small diagram update.
- Flow map's advisor rail screenshot recaptured from the new workspace.
- AI-log entry documenting this rework's notable overrides (to be filled during build, per established practice).

## 9. Testing

- **Workspace store:** per-case dispatch isolation (acting on case A never touches case B), Amara routing to relay vs local reducing, hydration shape-guard, activity append, template CRUD, settings persistence.
- **Selectors:** needsAttention / inboxItems / deadlineRisk / workloadCounts / search against the real seed.
- **Views (RTL):** table filter/sort/search; inbox reply dispatches to the correct case; second-flag escalation affordance appears; nudge dispatch; accept/decline request mutates the caseload; template edit shows up in composer; relay-offline banner renders on socket-down (socket stubbed).
- **Press:** deck renders all slides from the data file; arrow-key navigation advances; overview grid lists every slide title.
- **Existing suites stay green**; relay tests untouched.

## 10. Success criteria (for the panel discussion)

- An advisor persona walking the app can answer "what needs me right now?" within one screen and act on it within two clicks.
- Every visible row, chip, and count is backed by real case state — no decorative data anywhere.
- Every edge behavior in §6 can be triggered live during Q&A, and §7 gives a ready answer to "what about production?".

## 11. `/press` — the panel presentation

A new route `/press`: a **keyboard-driven slide deck** (←/→, page dots, `Esc` to overview grid) built from the same tokens/typography, designed against the case-study PDF's exact asks — the 15-minute presentation shape and the discussion the panel wants to have.

**Slide order (≈12 slides, one idea each, presenter-note line under each in small text):**
1. **Title** — "The Hand-off Moment · Taxfix Expert Service" + Gijo, role, date.
2. **The brief, compressed** — two-sided marketplace, anxious first-time expat filer, native mobile, pick ONE drop-off. (PDF ask: problem framing.)
3. **The user** — Amara in one slide: mandatory filing because ALG-I, English UI, fear of getting it wrong. What that meant for decisions (three bullets).
4. **The slice & what I cut** — hand-off moment; deliberately-not-designed list. "Focus beats breadth" said back to them.
5. **Why users drop** — the five-question drop-off model → each mapped to a screen.
6. **The solution** — flow strip of real app screenshots (hand-off journey), one line per screen.
7. **Marketplace thinking** — consumer phone ↔ advisor workspace mirror; "consumer friction removed = advisor margin"; one advisor-workspace screenshot.
8. **Architecture in one picture** — one reducer, three clients, relay; why that's a design decision, not an engineering flex (design system governance = same idea).
9. **AI in my process** — accelerated vs overridden, 3 concrete overrides with the sync-bug story. (PDF ask, verbatim assessment criterion.)
10. **Validation & success** — the validation plan in four rows; primary metric + benchmarks. (PDF asks.)
11. **Edge cases & what production needs** — teaser of the §6/§7 tables: "built these, deliberately deferred those — happy to go deep."
12. **Discussion starters** — the questions I'd ask us to discuss: pricing-before-liability trade-off, advisor capacity economics, German-first advisor UI, where AI belongs in the advisor loop. Ends on "let's build — what's the constraint?" (live-session handoff).

Content is authored in one data file (`src/press/slides.tsx`) so the live session can edit a slide in seconds; deck chrome is ~150 lines. Linked from the hub sidebar ("Present"). Slides reuse hub content by reference, not copy-paste, where practical (screenshots, decision-log rows, metric numbers).

## 12. Assumptions & scope cuts

English UI (panel audience) though Anna is German — a real product ships German-first for advisors; noted on hub. No auth, calendar, earnings/reports, real-time multi-advisor presence. Seeded clients are fictional; refund figures illustrative. The iOS app is untouched by this rework except that Amara's relay behavior must remain byte-compatible.
