# Taxfix Expert Service — Native iOS, Full Journey

**Case study:** Senior Product Designer (Builder), Taxfix Germany Expert Service
**Date:** 2026-08-31 (v2 — supersedes `2026-08-31-taxfix-handoff-design.md` for build direction; v1 remains the record of the first iteration)
**Deliverable set:** native SwiftUI consumer app (iPhone simulator) + functional web advisor dashboard + case-study hub, live-synced end-to-end; this spec; presentation-ready decision log.

---

## 1. What changed from v1, and why

v1 shipped the hand-off slice as a web app in a CSS phone frame. Two judgment calls force the rework:

1. **The brief says native.** "Design for a native mobile app" appears twice; "native mobile app execution" is a scored criterion. A web page in a rounded rectangle does not clear that bar for a *builder* role. → The consumer app is rebuilt in **SwiftUI**, running on the iPhone simulator.
2. **The brief's context section describes a loop, not a moment.** "The consumer's job is to get started, share the right information, and respond to follow-ups **so the return is accurate and filed on time**. The advisor's job is to **file an accurate return**." v1 stopped at "documents shared." v2 closes the loop: advisor prepares → consumer reviews and approves → filed — both sides live.

**Focus is preserved by depth asymmetry, not by cutting the journey.** The hand-off remains the deep end (states, edge cases, escape hatches). Onboarding is the runway *into* it — one anxiety answered per screen, no branches. The completion loop is the payoff *out* of it — few screens, high emotional value. This is the presentation argument: breadth where the loop demands it, depth where the drop-off lives.

This rework story is itself case-study material (hub AI-log: "AI built web-first; judgment said the brief means native — we rebuilt").

---

## 2. Architecture

```
ios/                       → SwiftUI app (Xcode project) — Amara's full journey
server/relay.mjs           → Node sidecar: holds case state, runs the TS reducer, WebSocket broadcast
src (web, Vite)            → "/" hub (case-study map) + "/advisor" dashboard. /app and /demo retire.
src/store/state.ts         → THE reducer — single source of business logic, shared by server + web + tests
src/styles/tokens.css      → design tokens; scripts/gen-tokens.mjs emits ios/…/Tokens.swift from the same values
```

**Sync (Approach A — server-held state):** clients send actions (`UPLOAD_ITEM`, `VERIFY_ITEM`, `COMMIT_CASE`, `SEND_DRAFT`, `APPROVE_RETURN`, `MARK_FILED`, …); the sidecar runs the existing tested reducer and broadcasts the full state snapshot to all clients. SwiftUI side is a thin view over server state: `URLSessionWebSocketTask` + `Codable` mirrors of the state types. **No business logic in Swift** — nothing to drift.

- Web advisor swaps `BroadcastChannel` → the same WebSocket. (`localStorage`/`BroadcastChannel` code retires with `/app`.)
- If the socket is down, the iOS app runs standalone on seeded local state (demo-resilience: the phone never shows a broken screen mid-panel).
- **Token push:** the hub's token editor sends token changes over the socket; the native app applies them at runtime → live restyle in the simulator. "One token, three surfaces" survives the platform split.
- `npm run demo` boots relay + web dev server and prints the simulator launch step. One reset action returns everything to the seeded start.

**No backend beyond the sidecar.** Named exception to v1's "no backend" rule; it exists only to let two runtimes share one reducer.

---

## 3. Case state machine (extended)

```
onboarding → committed → waiting_on_client ⇄ (issues / follow-ups) → ready_to_work
          → preparing → awaiting_approval → approved → filed
```

- `onboarding`: local to the phone; the case does not exist for the advisor yet.
- **`committed`**: fires when Amara taps "Start with Anna" — the case appears in Anna's queue live. The panel watches the marketplace connect.
- `waiting_on_client` / `ready_to_work`: v1 logic, unchanged (uploads, verify, flag, follow-ups).
- `preparing`: Anna clicks "Start preparing" — Amara's timeline advances live.
- `awaiting_approval`: Anna sends the draft return (summary + refund estimate) — lands on the phone as a review task.
- `approved`: Amara approves in-app (this is the consumer's *other* job from the context section: respond so it can be **filed on time**).
- `filed`: Anna files — the phone gets the closing moment (calm celebration, "what happens next": Bescheid explainer, expected refund timing).

New reducer actions: `COMMIT_CASE`, `START_PREPARING`, `SEND_DRAFT {draft}`, `APPROVE_RETURN`, `MARK_FILED`. All in `state.ts`, all tested.

---

## 4. Consumer app — screen inventory (SwiftUI)

Native iOS design language for real: `NavigationStack` push, large titles that collapse on scroll, sheets with grabbers, SF Symbols, spring motion, haptics, Dynamic Type-safe layout. Taxfix green as tint. English UI; German document names appear only as explained artifacts (v1 rule, kept).

### Phase 0–2 — Onboarding runway (one anxiety per screen, no branches)

| # | Screen | Answers |
|---|---|---|
| W1 | **Welcome** — brand moment; "An expert files your German taxes. In English." CTA: "Do I need to file?" | foreign-system anxiety |
| W2–W4 | **Liability check** — 3 questions, one per screen, big tappable options, progress dots: job status 2025 · unemployment benefits (Arbeitslosengeld I, with plain-English aside) · extras (multiple employers, freelance, none) | "do I even need to file?" |
| W5 | **Result** — "Yes — filing is required for you." *Why* in one sentence (benefits over €410 make filing mandatory). Calm deadline chip ("Deadline 31 July — plenty of time with an expert"). Pivot: "You don't have to do this alone." | "am I in trouble?" |
| C1 | **How it works** — 3 steps with a named human: you share → Anna prepares & files → you approve. Vertical timeline, advisor face visible already. | "who actually handles this?" |
| C2 | **Price & commitment** — one price (assumption: €119.99 flat, named in §10), three included-bullets, "pay only when you approve the return." CTA: **"Start with Anna"** → `COMMIT_CASE` fires; case lands in Anna's queue live. | "what does it cost / what am I committing to?" |
| H1 | **Meet Anna** — photo, "Steuerberaterin, 11 years", response promise ("replies within 1 business day"), "Your checklist is ready — most people finish in 15 minutes." CTA: "See what Anna needs." | "is anyone actually there?" |

Liability answers personalize the checklist framing (the benefits item carries "this is why you're filing").

### Phase 3 — Hand-off (the deep slice; v1 screens, rebuilt native and improved)

- **S1 Case home** — status timeline (now 7 states), advisor card, progress ("2 of 6 shared"), calm deadline chip, contextual primary CTA. Issue/follow-up banners when blocked-on-user.
- **S2 Checklist** — grouped (Identity & basics / Employment income / Unemployment benefits / Deductions — optional, marked optional); each row: plain-English title, German name secondary, status pill (`needed → uploaded → verified / issue`).
- **S3 Item detail + upload** — friend-voice explainer ("Your employer sent this in February — one page, looks like this →" with example thumbnail), capture via camera/photo library (`PhotosPicker`; simulator uses bundled sample documents), instant receipt state ("Sent to Anna — she'll check it"). **Escape hatch: "I don't have this"** → sheet: how to get it / ask Anna (→ client question on advisor side) / "not sure this applies to me". Never a dead-end.
- **S4 Follow-ups** — advisor asks arrive as bounded tasks with a reason, answerable inline (upload or short reply). Not open chat.
- **S5 Momentum** — "That's everything Anna needs to start. Next update by Tuesday." Ball-out-of-your-court, explicit and dated.

### Phase 4 — Completion loop (the payoff; few screens, high trust value)

- **S6 Preparing** — timeline advances; quiet reassurance state ("Anna is preparing your return"), no action demanded.
- **S7 Review & approve** — the return as a human-readable summary: income, deductions found, **estimated refund** (hero number), "what Anna checked" list; CTA "Approve return", secondary "Ask a question" (→ follow-up thread). Approval is the consumer's filing-critical action — designed as informed consent, not a dark-pattern rubber stamp.
- **S8 Filed** — calm celebration, "Filed with Finanzamt Berlin on ‹date›", what-happens-next explainer (Bescheid arrives in 4–8 weeks, refund timing), rate-your-experience stub.

### State coverage
Every screen keeps v1's discipline: empty / in-progress / blocked-on-user / blocked-on-advisor / done, plus socket-down standalone mode. Edge cases by design: wrong document (flag → issue), missing document (escape hatch), everything-at-once uploader.

---

## 5. Advisor dashboard (web — extended to close the loop)

v1 surfaces kept: queue with status chips, case detail with per-item **Verify ✓ / Flag issue (+note)**, templated follow-up composer, client questions. New:

- Queue chips now include `preparing / awaiting approval / approved / filed`. New cases appear on `COMMIT_CASE` (the live marketplace beat).
- **Case detail gains the loop controls:** "Start preparing" (enabled when `ready_to_work`) → draft composer: income + deductions + refund estimate (seeded editable numbers) → "Send to client for approval" → on client approval, "Mark as filed."
- Blocking summary mirrors the consumer's momentum logic both directions ("You can start once: January payslip ✓" / "Waiting on client approval").

Deliberately not phone-framed; information-dense, keyboard-friendly. Advisor efficiency = the ≤2-touches templates + one-click verify, unchanged.

---

## 6. Design system

- `tokens.css` remains the single source of raw values. `scripts/gen-tokens.mjs` generates `Tokens.swift` (colors, spacing, radii, type ramp mapped to iOS text styles) — committed, regenerated on change.
- iOS type uses the native ramp (Large Title 34 / Title 20 / Body 17 / Caption 13) via Dynamic Type text styles; web keeps its ramp.
- Runtime token overrides: the iOS app holds tokens as observable state, seeded from `Tokens.swift`, overridable by socket messages from the hub token editor. Reset restores generated values.
- SF Symbols only; no custom icon set. Taxfix green tint, light mode only (dark mode named as a cut, §10).

---

## 7. Hub updates

Hub stays the presentation surface at `/`. Changes:
- **Flow map** re-captured from the simulator: onboarding runway (W1→H1), hand-off (S1→S5 + escape), completion (S6→S8), advisor rail underneath. ~13 nodes, grouped by phase.
- **Architecture section** (new, small): the one-reducer/three-clients diagram — this is builder-craft evidence.
- **Token editor**: controls now push over the socket; caption becomes "One token — hub, advisor, and the native app in the simulator. Live."
- **AI log / decision log**: add the rework entries (web-first → native; slice → full loop with depth asymmetry).
- Framing/personas/validation/metrics sections keep v1 content; success criteria gain completion-loop metrics (approval rate, time-to-filed, filed-before-deadline share).

---

## 8. Demo orchestration (panel day)

1. `npm run demo` — starts relay + web dev server, prints next step.
2. Xcode ⌘R — app on iPhone 17 simulator, seeded at Welcome.
3. Browser: `/` hub for the 15-min presentation; `/advisor` beside the simulator for the live walkthrough.
4. Walkthrough beats: liability check → **"Start with Anna" → case lands in queue live** → upload → verify/flag round-trip → follow-up → momentum → **draft → review → approve → filed** → token-editor restyle finale.
5. Reset button (advisor header + hub) → `RESET` action → both apps return to start.

The 20-min live-build constraint lands in whichever layer fits: copy/flow changes in Swift views (simulator hot-ish via previews), logic in `state.ts` (one reducer, tests), advisor in React. Named in the presentation as an architecture-for-adaptability decision.

---

## 9. Testing

- **Reducer (TS, vitest):** existing tests + new actions/transitions (commit, prepare, draft, approve, file) — these tests now guarantee server behavior too.
- **Relay integration (vitest):** two fake WS clients; action from one → snapshot to both; reset restores seed.
- **Swift (XCTest, small):** snapshot decoding of state JSON fixtures; status→screen mapping; token override apply/reset.
- **Web (vitest, kept):** advisor + hub component tests updated for WS store; `/app`, `/demo` tests removed with the routes.
- Visual QA: manual simulator pass per screen state; hub walk.

---

## 10. Assumptions (named)

- Price: €119.99 flat, pay-on-approval — invented for the prototype; real pricing may differ by refund size.
- Refund estimate figures are seeded demo data; no tax math is real.
- One advisor, one case; routing/capacity out of scope (v1 cut, kept).
- Payment processing, KYC, real document OCR, push-notification plumbing: out of scope (represented in UI where they'd appear).
- German-language UI out of scope (target user uses English UI).
- Liability check is a design artifact of ~3 questions, not a legally complete Pflichtveranlagung decision tree.
- Dark mode: cut for scope; tokens make it a follow-up, not a rework.
- Simulator camera: uploads use bundled sample images via photo picker.

---

## 11. Decision log additions (for the panel)

1. Web-in-frame → SwiftUI: the brief says native twice; a builder role gets judged on taking that literally.
2. Slice → full loop: the context section defines both actors' jobs ending in "filed"; we kept depth at the drop-off and made the loop thin where anxiety is low.
3. One reducer, three clients: business logic stays in tested TS; Swift renders state. Chosen for demo-day adaptability and zero logic drift.
4. Onboarding has no branches: every screen answers exactly one anxiety; skippable friction is deleted, not designed.
5. Approval screen is informed consent, not a conversion pattern: the consumer's filing-critical action must feel considered — that *is* the trust signal.
6. "Signed up", not "paid": the brief's hand-off wording is "once they've signed up" — v1's "I paid, now what?" framing was an unlabeled assumption. v2 chooses **pay-on-approval**, so at hand-off the user has invested trust, not money ("I handed my taxes to a stranger — now what?"). Hub/persona copy says "signed up"; payment anxiety belongs to C2, resolved by "pay only when you approve."
