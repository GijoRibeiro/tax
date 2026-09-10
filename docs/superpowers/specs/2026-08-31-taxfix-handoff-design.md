# Taxfix Expert Service — The Hand-off Moment

**Case study:** Senior Product Designer (Builder), Taxfix Germany Expert Service
**Date:** 2026-08-31
**Deliverable set:** working prototype (consumer app + advisor dashboard + case-study hub), this spec, and a presentation-ready decision log.

---

## 1. Problem framing

### 1.1 The slice we chose

**The hand-off moment.** The user has already decided to file, understood the price, and committed. The return now cannot move until the advisor receives the right documents and answers. This is a known activation drop-off: the brief calls it "a common activation drop-off," and it is the moment where the product's two-sided promise is most fragile — the consumer thinks "I paid, now what?", the advisor thinks "I can't start."

### 1.2 Why this slice (and not the others)

| Candidate slice | Why not chosen |
|---|---|
| "Do I even need to file?" | Strong empathy story, but the advisor is invisible — weak on the marketplace criterion. Mostly a content/funnel problem. |
| Commitment moment | Trust + pricing clarity matters, but the design output is landing-page-like: least native-app-specific of the three. |
| **Hand-off moment (chosen)** | The only slice where **both marketplace actors are live**. Native-app strengths (camera capture, push-style follow-ups, glanceable status) genuinely earn their place. Activation is the growth team's stated focus. |

### 1.3 Why users drop at hand-off (problem model)

Each screen in the solution answers one of these directly:

1. **"What exactly do you need from me?"** — the request feels unbounded; German document names (*Lohnsteuerbescheinigung*) are opaque to an English-speaking expat.
2. **"Is anyone actually there?"** — after paying, silence. No visible human, no response promise → trust decays.
3. **"What if I get it wrong?"** — first-time filers fear uploading the wrong thing; fear → procrastination.
4. **"Am I making progress?"** — no visible state machine between "signed up" and "filed."
5. **"I don't have this document."** — the most common dead-end; without a path forward, this single item stalls the entire case.

### 1.4 Deliberately not designed (scope cuts, named)

- Liability check ("do I need to file?") and the commitment/pricing flow — different drop-offs, different half.
- Payment, identity/KYC verification mechanics.
- Return review, approval and filing stages (they appear in the status timeline as future steps, but are not designed).
- Advisor onboarding, capacity management, multi-advisor routing.
- Push notification opt-in flows (represented, not built).
- German-language interface (target user explicitly uses English UI; German doc names appear *as artifacts to be explained*, not as UI language).

### 1.5 Target user (from brief) and design consequences

An expat in their 30s, English UI, recently re-employed after a gap, first **mandatory** filing (they received unemployment benefits), navigating a foreign system with high stakes, arriving near the 31 July deadline.

Consequences baked into the design:
- Every German document gets a plain-English explainer + "what it looks like" preview.
- Unemployment benefits (*Arbeitslosengeld*) are a first-class checklist category, not an edge case — it's *why they must file*.
- Deadline is ambient but calm: a date chip and "on track" framing, never a countdown-panic pattern (anxious users freeze; see §8 principles).
- The advisor is a named, credentialed human from the first screen — the product's core reassurance is "an expert has this."

---

## 2. Personas

Three personas, all built from the brief's target profile plus marketplace logic. They live on the hub with photos, goals, anxieties, and "moment of truth" quotes.

### 2.1 Amara Okafor — primary consumer persona
- 33, Nigerian-British product manager in Berlin, 4 years in Germany, English UI user.
- Re-employed in March after 5 months on *Arbeitslosengeld I* → **first mandatory filing**.
- **Goal:** be done with this safely; expert handles it; no German-bureaucracy spelunking.
- **Anxieties:** "Did I already miss something?", fear of official-looking German mail, fear of uploading the wrong document.
- **Behavior:** mobile-first, does admin in the evening on the sofa, abandons anything that feels like it needs a desk and a scanner.
- **Moment of truth:** *"I paid three days ago and I still don't know what they actually need from me."*

### 2.2 Tom Keller — secondary consumer persona
- 38, US-German dual national, freelanced briefly, back in employment; filed once before via a Steuerberater by email — hated the black box.
- Arrives **12 days before the 31 July deadline**, panicked, checks status obsessively.
- **Goal:** speed and certainty — "tell me the minimum I must do and confirm you have it."
- **Stress test the persona provides:** the flow must work when someone uploads everything in one frantic session and then needs *reassurance that the ball is no longer in their court*.

### 2.3 Anna Weber — advisor persona
- 41, independent *Steuerberaterin* in Leipzig partnered with Taxfix Expert Service; ~60 open cases in season.
- Works at a **desk, on the web**, alongside DATEV/ELSTER tooling. (Assumption, flagged: advisors will not review payslips on a phone — the marketplace is asymmetric: consumer=mobile, advisor=web.)
- **Goal:** minimize rounds of follow-up per case; a case is profitable when it moves in ≤2 touches.
- **Pain:** vague client messages, wrong/blurry documents, cases stalled for weeks on one missing item.
- **What she needs from *our* side of the design:** structured intake (not free-text chat), clear "what's blocking me" state per case, one-click templated follow-ups.

**Marketplace insight the personas encode:** every consumer-side friction we remove is advisor margin — fewer follow-up rounds, faster filing. The design serves the *relationship*, and the hub's flow map shows both seats at every step.

---

## 3. Solution architecture

One Vite + React + TypeScript app, three surfaces, one design system, one shared case state.

```
/            → Hub: case-study map (personas, flow map w/ screenshots, design system, validation, metrics)
/app         → Consumer native-style app in an iPhone frame
/advisor     → Advisor web dashboard (functional)
/demo        → Phone + advisor dashboard side by side (panel mode)
```

- **Design tokens** (CSS variables + typed TS map) are the single styling source for all surfaces. Changing a token restyles hub, app, and advisor at once — demonstrated live via the hub's token editor.
- **Shared state**: one store (React context + reducer), persisted to `localStorage`, synced across tabs with `BroadcastChannel`. Consumer upload → advisor checklist updates live; advisor follow-up → lands in consumer app live.
- **No backend.** Seeded demo data + a reset control. This is a deliberate scope decision: the panel needs an editable prototype, not infrastructure.

---

## 4. Consumer app — flow and screens

Native iOS design language (large-title nav, sheets, SF-Symbols-style icons, spring transitions), rendered web-side in a phone frame.

### 4.1 Screen inventory

**S1. Case home** — the "is anyone there?" answer.
- Status timeline: Committed ✓ → **Share your info (you are here)** → Advisor prepares → You review → Filed.
- Advisor card: photo, name ("Anna Weber, Steuerberaterin"), credential line, response promise ("replies within 1 business day").
- Progress: "2 of 6 items shared." Deadline chip: "Deadline 31 July — on track."
- Primary CTA: "Continue sharing info."

**S2. Checklist** — the "what exactly do you need?" answer.
- Items grouped: *Identity & basics*, *Employment income*, *Unemployment benefits*, *Deductions (optional — can increase your refund)*.
- Each row: plain-English title + German doc name as secondary text, status pill.
- Item states: `needed` → `uploaded` → `verified` (advisor checked ✓) → or `issue` (advisor flagged, with note).
- Optional items visibly optional — respects the "every extra field costs conversion" standard (§8).

**S3. Item detail + upload** — the "what if I get it wrong?" answer.
- Explains the document like a friend would: "Your employer sent this in February. It's one page and looks like this →" (example thumbnail).
- Capture: camera / photo library / files.
- **First-class escape hatch: "I don't have this"** → guided options (how to get it, "ask Anna", "not sure this applies to me") — never a dead-end.
- Post-upload: instant receipt state ("Sent to Anna — she'll check it"), not silent success.

**S4. Follow-ups (structured requests)** — the advisor's voice in the app.
- Advisor requests arrive as **tasks with a reason** ("I need your January payslip — your Lohnsteuerbescheinigung shows a gap"), answerable inline with upload or short reply. Not open chat: structure keeps advisor effort low and consumer expectations clear.

**S5. Momentum moment** — the "am I making progress?" answer.
- When required items are in: full-screen confirmation — "That's everything Anna needs to start. Next update from her by Tuesday." The ball-out-of-your-court state Tom needs.

### 4.2 State coverage
Every screen designed in: empty (nothing shared), in-progress, blocked-on-user (issue/follow-up), blocked-on-advisor (all sent, waiting), done. Edge cases handled by design: wrong document (advisor flags → issue state with note), missing document (escape hatch), everything-at-once uploader (Tom).

---

## 5. Advisor dashboard — flow and screens

Functional web app, information-dense, keyboard-friendly. Deliberately *not* phone-framed.

**A1. Case queue** — cases with status chips: `waiting on client` / `ready to work` / `blocked`, sortable by deadline proximity. Demo case (Amara) pinned.

**A2. Case detail** — the same checklist, advisor's seat:
- Received documents preview; per item: **Verify ✓** or **Flag issue** (+ note → becomes the consumer's `issue` state).
- **Templated follow-up composer**: pick item + reason template, one click → structured task in consumer app. Templates encode Anna's "≤2 touches" goal.
- Blocking summary: "You can start once: January payslip ✓" — mirrors the consumer's momentum logic from the other side.

---

## 6. Design system

### 6.1 Tokens (single source of truth)
- **Color:** Taxfix-family green primary + warm neutrals; semantic tokens (`--color-success`, `--color-warning`, `--color-issue`, `--color-surface`, `--color-ink`) — components never touch raw hex.
- **Type scale** (display / title / body / caption), **spacing** (4-pt grid), **radius**, **elevation**, **motion durations**.
- Declared once as CSS variables on `:root`, mirrored in a typed TS map for logic-side use.

### 6.2 Components (token-consuming, shared by all three surfaces)
Button, Card, ListItem, StatusPill, ProgressBar, TimelineStep, Avatar/AdvisorCard, Sheet, Banner, ChecklistItem, Input, EmptyState.

### 6.3 The "change once, everywhere" proof
Hub → Design System page renders the live component library **and a token editor**: adjust primary color / radius / spacing density and watch embedded live previews of the consumer app and advisor dashboard restyle instantly. This is the system's governance story made tangible — and a planned beat in the live panel session.

---

## 7. The Hub (case-study map)

The presentation *is* the product's front door. Sections, in presentation order:

1. **Problem framing** — the slice, the drop-off model (§1), the scope cuts.
2. **Personas** — Amara, Tom, Anna (§2).
3. **Flow map** — a flowchart of the hand-off journey; each node shows a **real screenshot of the built app**, a usability annotation ("answers: 'what if I get it wrong?'"), and an **"Anna sees" mirror** chip showing the advisor-side state at that step. Both marketplace seats visible at every step.
4. **Design system** — tokens, live components, token editor (§6.3).
5. **Validation plan** (§9) and **Success metrics** (§10) with industry benchmarks.
6. **AI in the process** (§11) — honest log of where AI accelerated and where judgment overrode it.
7. **Assumptions** (§12).
8. Launch buttons: `/app`, `/advisor`, `/demo`.

Screenshots are captured from the running app via browser automation and embedded as static images — they are *of the real build*, not mockups.

---

## 8. Industry standards applied (researched, cited on the hub)

- **Progressive disclosure & field economy:** every additional form field costs ~1–2% conversion (Baymard, via [Zigment](https://zigment.ai/blog/7-ways-to-reduce-fintech-onboarding-drop-off-in-2026)); we chunk the checklist by group, mark deductions optional, and ask only for what moves the return.
- **Document-upload UX:** offer capture fallbacks (camera or file), save-and-return, inline microcopy at every non-obvious point, and **explicit receipt acknowledgment** ([Eleken](https://www.eleken.co/blog-posts/fintech-onboarding-simplification), [Userpilot](https://userpilot.com/blog/fintech-onboarding/)) — all present in S3.
- **Trust at drop-off points:** visible humans, credentials, and response-time promises counter onboarding abandonment in fintech ([INSART](https://insart.com/anatomy-of-trust-fintech-ux-onboarding-dropoff/)) — the advisor card is on the first screen for this reason.
- **Benchmarks for targets:** fintech onboarding-checklist completion averages ~24.5%, with verification-heavy apps reaching 50–65% ([Userpilot benchmark report](https://userpilot.com/blog/onboarding-checklist-completion-rate-benchmarks/), [Digia](https://www.digia.tech/post/app-onboarding-rates-statistics/)); 2026 median fintech activation ~44% ([Perspective AI](https://getperspective.ai/blog/2026-customer-onboarding-benchmark-activation-rates-by-industry)). These anchor the success criteria in §10.

---

## 9. Validation plan (pre-launch)

1. **Comprehension test (5 users, moderated, remote):** English-speaking expats in Germany who haven't filed. Task: "share what your advisor needs." Measure: can they name what's left to do and who acts next, at every step? (The two questions whose ambiguity kills activation.)
2. **"I don't have this" fake-door analysis:** instrument the escape hatch in a beta cohort; classify reasons. This tells us which documents need better sourcing guidance vs. which shouldn't be required at all.
3. **Advisor-side interviews (3–5 advisors):** validate follow-up templates against real follow-up emails; count how many of their last 20 follow-ups the templates could have expressed.
4. **Copy stress test:** the German-document explainers reviewed by a tax advisor for correctness — friendly must never become wrong.

## 10. Success criteria (if shipped)

- **Primary — hand-off completion rate:** % of committed users whose required checklist reaches "advisor can start" within 7 days of signup. Target: beat the verification-heavy-app band (50–65%, §8) and improve baseline by a stated relative lift.
- **Time-to-first-upload** after commitment (momentum proxy; target: median < 24h).
- **Follow-up rounds per case** (advisor efficiency; target: ≤2 — Anna's profitability line).
- **Checklist-screen drop-off** and escape-hatch usage rate per item (diagnostic).
- **Deadline-cohort activation:** hand-off completion for users arriving < 21 days before 31 July (Tom's cohort) — the growth team's hardest segment.
- Guardrail: advisor-reported document-quality issues per case must not rise (speed must not degrade accuracy).

## 11. AI in the process (honest log — maintained during the build)

Documented on the hub as it happens; seeded with decisions already made:
- **Accelerated:** case-study analysis and drop-off modeling; industry benchmark research; scaffolding tokens/components; generating checklist copy variants.
- **Judgment overrode AI (examples to date):**
  - The generic recommendation was a *static* advisor mock; we chose a functional two-sided prototype because the marketplace criterion is the case study's center of gravity.
  - Rejected countdown-timer urgency patterns (a common AI/growth suggestion) for the deadline: anxiety is the drop-off *cause* here, not a lever.
  - Chat-style advisor messaging rejected in favor of structured follow-up tasks: chat feels warm but destroys advisor efficiency at 60 cases.
- Every future correction gets logged in this section as the build proceeds.

## 12. Assumptions (named, as the brief requests)

1. Advisors work web-side at a desk; consumer is mobile-first. (Marketplace asymmetry.)
2. The six checklist items for Amara's situation (ID, tax ID, Lohnsteuerbescheinigung, ALG-I *Leistungsbescheid*, bank details, optional deductions) approximate the real intake; a real build would source this from the advisor workflow.
3. Response promise ("1 business day") is operationally viable — treated as a design requirement on operations, not a given.
4. Prototype persistence is local-only; no real backend, auth, or document storage.
5. Taxfix-style visual language is approximated from public brand material, not extracted assets.

## 13. Decision log (for the presentation — the "why" behind every call)

| # | Decision | Alternatives considered | Why |
|---|---|---|---|
| D1 | Slice = hand-off moment | liability check; commitment | Only slice with both marketplace actors live; stated activation drop-off; most native-app-shaped (§1.2) |
| D2 | Consumer = native-styled React web in phone frame | Expo/React Native; Expo web | Panel needs 20-min live editability + instant deploy; "native" is a design language requirement, medium is explicitly free |
| D3 | Advisor side fully functional | static mock; personas-only | Marketplace criterion is the center of gravity; live two-tab sync is the strongest possible demonstration |
| D4 | One app, three routes, shared tokens/state | monorepo packages; iframes of separate deploys | One editable surface for the live session; "change once, everywhere" only provable with true sharing |
| D5 | Structured follow-up tasks, not chat | open chat thread | Anna's ≤2-touch economics; consumer gets bounded, answerable asks |
| D6 | "I don't have this" as first-class path | support link; hide it | The #1 stall reason must have a forward path; dead-ends are the drop-off |
| D7 | Calm deadline framing | countdown urgency | Target user is anxious; panic patterns freeze first-time filers |
| D8 | Token editor on the hub | static style guide page | Proves the design-system governance claim live instead of asserting it |
| D9 | Screenshots of the real build in the flow map | illustrative mockups | "Craft judgment — not just generated": the map documents the actual artifact |

## 14. Build plan (high level — detailed plan follows via writing-plans)

1. Scaffold Vite + React + TS; tokens + component library.
2. Consumer app screens S1–S5 with seeded state.
3. Advisor dashboard A1–A2; BroadcastChannel/localStorage sync; `/demo`.
4. Screenshot capture of real screens.
5. Hub: personas, flow map with screenshots + advisor mirrors, design-system page with token editor, validation/metrics/AI-log sections.
6. Polish pass: motion, empty states, reset-demo control.
