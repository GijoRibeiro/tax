# Start here

Taxfix Senior Product Designer (Builder) case study. A native iOS + web prototype of the
Expert Service **hand-off moment**, presented to a panel with a 20-minute live-build
curveball after the talk. Read in this order, it takes ten minutes:

1. `docs/brief/taxfix-case-study-brief.pdf`: the actual brief. It is the spec.
   `docs/brief/COVERAGE.md` walks it line by line and says where each ask is answered.
2. `README.md`: what ships, architecture, how to run and test, demo script.
3. `docs/PANEL-RUNBOOK.md`: the 75 minutes in the room: pre-flight, slide timings,
   live-session playbook, prepared Q&A.
4. `docs/PROCESS.md`: how it was built, the design angles, the honest AI log.
5. `docs/superpowers/specs/2026-08-31-taxfix-native-full-journey-design.md` (v2 spec,
   current build direction) and `…/2026-09-01-advisor-workspace-design.md`.

## Shape of the repo

- `ios/` SwiftUI app (XcodeGen, iPhone 17 Pro simulator, bundle `co.cloover.TaxfixExpert`).
  Betina's journey: liability check → pricing → hand-off checklist → review → filed.
- `src/store/state.ts` the ONE reducer. Business logic lives here and nowhere else.
- `server/relay.mjs` Node WebSocket sidecar on `ws://127.0.0.1:8787` running that reducer
  and broadcasting snapshots to phone, advisor, and hub.
- `src/advisor/` Anna's workspace (React), built on the desk kit in `src/advisor/kit/`
  (catalog §5b). Only case `amara` is relay-backed; the other ~20 seeded cases run on
  local state in `src/advisor/workspace/`.
- `src/hub/` the case-study narrative at `/`. `src/press/` the 13-slide deck at `/press` (plus parked slides on the Esc grid).
- `src/styles/tokens.css` design tokens; `npm run gen:ios` regenerates `Tokens.swift`
  and `ios/Resources/seed.json`.

## Commands

```
npm run demo        # relay + Vite on 5173 (strict port; another project sometimes takes it,
                    # then: node server/relay.mjs + npx vite --port 5175 --strictPort)
npx vitest run      # 232 web tests, incl. the design lint
cd ios && xcodebuild -project TaxfixExpert.xcodeproj -scheme TaxfixExpert \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -derivedDataPath build build
xcrun simctl install booted ios/build/Build/Products/Debug-iphonesimulator/TaxfixExpert.app
xcrun simctl launch booted co.cloover.TaxfixExpert
```

Jump the simulator to a screen without tapping: `SIMCTL_CHILD_ONBOARDING_STEP` and
`SIMCTL_CHILD_CASE_SCREEN` (values in README → Screenshot/demo hooks).

## Design system rules (enforced by scripts/design-lint.test.mjs)

- `docs/design/CATALOG.md` is the catalog. Read it before styling anything. It is
  derived from the real Taxfix app; when in doubt, match the reference screenshots in
  `docs/design/reference/`.
- Colours and radii come from tokens only: `src/styles/tokens.css` on the web,
  `store.tokens.color(...)` / `store.tokens.size(...)` in Swift. No hex, rgb, system
  greys, `.secondary`, or numeric `cornerRadius` in views. The lint test fails otherwise.
- Reuse components before writing markup: web `src/components/`, iOS
  `ios/Sources/Views/Components/` (PrimaryButton / PrimaryButtonLabel / PrimaryIconButton /
  SecondaryButtonLabel, FlatCard, CardRow, Chip, FactRow, ResultBlock, StepTimeline,
  ScreenTitle, AdvisorBadge, `.ink(token)`). A second hand-rolled
  button or card is a bug.
- New token or component? Add it to the catalog in the same change, with the screen it
  came from.
- Flat surfaces: no borders (except the selected-card rule and hairline dividers), no
  shadows. Tones separate surfaces.
- A cream card means "tap me". Reasons, benefits and facts never sit in a card; they are
  `FactRow`s on the plain page. Before shipping a screen, ask of every cream shape what
  happens on tap. (Catalog rule 6.)

## Writing rules for anything the panel reads (slides, hub, chat UI)

- Plain English a stranger understands in one read. No shorthand from the persona
  files or the decision log. If a bullet needs the notes to make sense, rewrite it.
- One idea per bullet, a full thought, roughly 8 to 16 words. Numbers only when they
  change what the reader thinks, and say what the number means.
- Explain any German term or legal rule the first time, in the same sentence.
- The notes (N) can go deeper; the slide cannot.

## Rules that are not obvious from the code

- The brief says *native* three times and highlights the target user. Do not drift back
  to web-in-a-phone-frame, and do not generalise the persona.
- Focus beats breadth. The story is the hand-off slice; everything else is supporting
  evidence. Don't add surface area that isn't defending a decision.
- Logic changes go in `state.ts` with a vitest case, never duplicated in Swift. After a
  reducer change, restart the relay (`node server/relay.mjs`); it loads the reducer once.
- Fonts in `fonts/`, `public/fonts/`, `ios/Resources/Fonts/` are TRIAL-licensed ABC ROM
  and gitignored. Never deploy `dist/` publicly.
- Two interviewable personas live in `docs/personas/` (Betina Bugnotto the filer, Anna
  Weber the advisor). Betina's internal id is still `amara` (persona id, case id, seeds,
  CLI); she was renamed on 2026-09-05 and older docs use the old name. For any design question about either side, ask them first: answer in
  character from their file, and log findings that change a decision in
  `docs/personas/interview-findings.md`. Live questions arrive via `/stakeholders`;
  answer with `node scripts/stakeholders.mjs reply <persona> "…"`.
- Every AI correction worth telling gets a line in the hub's AI log
  (`src/hub/sections/AiLog.tsx`) and in `docs/PROCESS.md`. The panel scores this.
- Commit style: conventional (`feat:`, `fix:`, `docs:`, `chore:`), short body.
