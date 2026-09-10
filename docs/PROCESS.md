# How this was built

Process notes for the Taxfix Expert Service case study: the chronology, the design
angles, the persona method, the tools, and the honest log of where AI was wrong and
judgment corrected it. Companion to the case-study content itself — this document is
about *how*, not *what*.

## The chronology

1. **Read the brief like a spec.** The case-study PDF was mined for constraints before
   any design: "native mobile app" appears twice and is a scored criterion; the context
   section defines BOTH actors' jobs as ending in "filed"; "focus beats breadth"; the
   panel has a 20-minute live-build. Every architectural decision below traces to one of
   those lines.
2. **v1: web prototype (superseded, kept in history).** First iteration shipped the
   hand-off slice as a React web app in a CSS phone frame — three surfaces, one reducer,
   BroadcastChannel sync. Judgment call on review: a web page in a rounded rectangle
   doesn't clear the "native execution" bar for a builder role. Rebuilt rather than
   defended.
3. **Brainstorm → spec → plan, before code.** The rework ran a structured design
   process: classification (architectural), clarifying questions one at a time (stack?
   sync fate? hub fate? onboarding scope?), two competing sync architectures with a
   recommendation, a written spec (v2), then a 14-task implementation plan with TDD
   steps and verbatim code. The spec is the authority; the plan argues from it.
4. **Subagent-driven build.** Each task went to a fresh implementer agent with a scoped
   brief; every task was then reviewed by an independent reviewer agent that re-ran
   tests itself; findings looped back as fix rounds with scoped re-reviews. A controller
   session orchestrated, ruled on conflicts, and kept a ledger.
5. **Phase 2 on user direction:** brand typography (ABC ROM), gap-fill (nudges,
   scanner, guidance, FAQ), advisor workspace, references, persona-agent reviews, polish
   rounds, and this process write-up.

## The angles (design decisions worth defending)

- **Depth asymmetry, not breadth.** Chosen slice = hand-off. Onboarding is a
  branch-free runway in (one anxiety per screen); the completion loop is a thin payoff
  out (informed-consent approval, calm filed state). Screens are countable; the depth
  distribution makes the "focus" argument.
- **"Signed up", not "paid".** The brief says the hand-off follows sign-up; v1 assumed
  payment. v2 chose pay-on-approval — so hand-off anxiety is invested trust, not money,
  and the approve screen carries the price. (Caught mid-build by the user reading the
  PDF closely — the correction is itself logged.)
- **One reducer, three clients.** Business logic lives once, in tested TypeScript. A
  ~100-line Node relay runs that exact reducer and broadcasts snapshots; SwiftUI and
  React render state and send actions. Zero logic drift between platforms, and the
  20-minute live-build lands in whichever layer fits.
- **Tokens as the single styling source.** tokens.css → generated Tokens.swift; the
  hub's token editor restyles hub, advisor AND the native app in the simulator live over
  the socket.
- **Native for real:** NavigationStack, sheets with grabbers, SF Symbols, spring motion,
  UNUserNotificationCenter banners, Dynamic-Type-relative custom fonts.

## How the personas were built and used

- Three personas authored in the spec from the brief's target profile (Betina — expat
  first-time filer; Tom — secondary; Anna — advisor), each with goals, anxieties and a
  moment-of-truth quote.
- Late in the build, two **persona agents** were spawned: each got a character brief
  (bio, ranked anxieties, economic incentives), the journey description, and the real
  screenshots — instructed to review *in character* and produce ranked concrete asks.
  They were explicitly told not to be sycophantic.
- Their findings changed the product: liability + price recap on the approve screen,
  "What Anna checked" derived from what she actually verified, a document preview
  beside Verify, one-click flag reasons, an Ask-Anna front door, advisor-extendable
  checklists. Their unbuildable asks were parked honestly on a roadmap.
- The same agents remain available live — they can be re-briefed and asked to
  re-review any change during the panel session.

## The tools

- **Claude Code** as the driver: brainstorming/spec/plan skills, then subagent-driven
  development (fresh implementer per task + independent reviewer per task + fix loops).
- **XcodeGen** for a scriptable Xcode project; **xcodebuild/simctl** for headless
  build-test-screenshot loops; env-var screen hooks (`SIMCTL_CHILD_*`) for tap-free
  navigation; a tiny WebSocket client script to drive the case remotely for
  screenshots.
- **vitest/RTL/XCTest** as gates after every task; **oxlint**; screenshots READ back by
  the agents as visual verification.
- **ws relay** for cross-runtime sync; `npm run demo` boots everything.

## Where AI was wrong and judgment corrected it (the honest log)

- AI built web-first; the brief said native. Rebuilt in SwiftUI.
- The plan's own sample code carried three real defects that independent reviewer
  agents caught: a state-corrupting reducer edge exposed over the network (unknown
  action types returned as state), a React StrictMode socket race that silently
  stranded the store offline, and an xcodegen `resources:` key that is silently ignored
  (seed.json never shipped in the .app). Each got a regression test.
- An implementer overclaimed ("bundled and verified") and the reviewer disproved it by
  inspecting the built app — the correction is in the task report.
- The persona agents found trust gaps (liability, price at approval, unverifiable
  "What Anna checked") that none of the technical reviews had surfaced.
- 2026-09-05, the home redesign. AI's first dashboard put a lime hero, a document
  strip and stat tiles on one screen; the designer cut it back three times (timeline
  only, then a state-aware sentence with four chapter tiles) and the copy was rewritten
  from "Anna is ready when you are" to a greeting that asks for the next chapter.
- Same day, the designer spotted that cream option tiles read as buttons on the pricing
  and notification screens. Both became plain rows, and it became catalog rule 6: a
  cream card means "tap me".
- Same day, a product correction, not a visual one: uploading is not sending. AI had
  wired every upload straight to the advisor; the designer asked for an explicit
  hand-off moment. `SUBMIT_DOCUMENTS` now exists in the reducer with tests, and
  Anna's queue only shows "Ready to work" after the client presses "Send to Anna".
- Same day, the designer asked where the marketplace thinking was in the money: the
  screens implied an assigned advisor and payment "later", and nobody had asked who
  eats an abandoned case. The model is now explicit and in the reducer: matched at
  Start (a slot, not her time), card authorised at Send, charged at Approve; release
  after 14 idle days and abandoned drafts named as assumptions with a metric. It is a
  third tab on the journey canvas and, in prose, deck slide 7.
- 2026-09-06, two catches by the designer during the last review. The phone showed "Matched for you" one screen before Start while the money model said matched at Start; the model now reads proposed at the result, reserved at Start, and four surfaces followed. And every type size in the Swift views was a literal number; they became token roles read through `brandFont(.role)`, the lint fails on a number, and the hub's levers move them live.
- 2026-09-06, the advisor desk. Rebuilt on a small kit (`src/advisor/kit/`) with the
  structure of a reference dashboard the designer likes and Taxfix's own skin; the
  reference's palette was deliberately not copied. Catalog §5b records the desk's rules,
  including the one departure from the phone: hairline cards on a white body.
- Same day, a review sweep caught the relay still running yesterday's reducer, so the
  new send step silently no-oped in captures. Restarting the relay after a reducer change
  is now in CLAUDE.md.

## Numbers

As of 2026-09-05 on `main` (the advisor-workspace expansion of 2026-09-02 included):

- **Tasks:** 21 in the native rebuild — 14 core + 7 phase-2 — followed by a 25-commit
  advisor-workspace + press-deck branch built the same way (spec → plan → implementer and
  reviewer agents per task) and merged as PR #1.
- **Independent reviews:** one fresh reviewer agent per task, re-running tests itself,
  plus scoped re-reviews after every fix round — on top of the two in-character persona
  reviews.
- **Tests:** 232 web tests across 30 files (`npx vitest run`, including the design-lint
  test that fails on any colour or radius literal); 20 iOS tests (`xcodebuild test`).
- **Commits:** 190 and counting (`git log --oneline | wc -l`), conventional-commit style throughout.

## Timeline

The native rebuild took roughly 7.5 hours of build time across 2026-08-31 and
2026-09-01. The advisor workspace and press deck followed on 2026-09-02. The brief asks
for about four hours; the design decisions that the deck presents were made in that
order of time, and the rest was agents building and reviewing under them. This is said
plainly in the panel (see `docs/PANEL-RUNBOOK.md`), not hidden.
