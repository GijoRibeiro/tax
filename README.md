# Tax, the hand-off moment

A prototype of the moment a tax return moves from the person filing it into an advisor's
queue, and the loop back out (advisor prepares → filer reviews and approves → filed). It
ships three surfaces on one shared source of business logic, plus a deck:

- **A native SwiftUI consumer app** (`ios/`): Betina's full journey, onboarding through
  filed, running on the iPhone simulator.
- **A web advisor workspace** (`/advisor`): Anna's full seat, not just a single case:
  Today (queue triage), Cases (search/filter/sort table), Case detail (checklist
  verify/flag, follow-ups, prepare → draft → file), Inbox, Clients, and Settings, seeded
  with ~21 workable cases across every status. Only `amara` is relay-backed and live-synced
  with the iOS app; the rest run entirely on local state, so the whole workspace works
  standalone.
- **A case-study hub** (`/`): problem framing, personas, a flow map built from real
  simulator screenshots, the architecture story, edge cases & failure modes, and a live
  design-token editor.
- **A press deck** (`/press`): a 14-slide, keyboard-driven talk track for presenting the
  work live, with presenter notes and a parked "Ask them" slide that embeds the
  interviews below. Static and presentational, it doesn't touch the case reducer.
- **Two stakeholders you can talk to** (`/stakeholders`): Betina (filer) and Anna
  (advisor) as composite personas grounded in public sources, side by side as chats. The
  answers come from the presenter's Claude Code session through the relay, not from an
  API key in the browser. Knowledge lives in `docs/personas/`.

The first three stay in sync through one Node WebSocket relay running one reducer, so an
action taken on one side (uploading a document, verifying an item, sending a follow-up)
shows up on the others instantly.

## Architecture

```
ios/                       SwiftUI app (Xcode project, XcodeGen): Betina's full journey
server/relay.mjs           Node sidecar: holds case state, runs the TS reducer, WebSocket broadcast
src/ (web, Vite)            "/" hub + "/advisor" workspace + "/press" deck + "/stakeholders" interviews
src/store/state.ts         THE reducer, single source of business logic, shared by server + web + tests
src/store/stakeholders.ts  stakeholder-chat reducer (same pattern), run by the relay and the web app
scripts/stakeholders.mjs   presenter CLI: wait / reply / ask / show / reset against the relay
docs/personas/             who Betina and Anna are, what they know (sourced), what they told us
src/advisor/workspace/     Advisor's own state: seeded 21-case workspace, selectors, localStorage persistence
src/styles/tokens.css      design tokens; scripts/gen-ios.mjs emits Tokens.swift + seed.json for iOS
```

## Routes

| Route | Surface | What's there |
| --- | --- | --- |
| `/` | Hub | Problem framing, personas, flow map, architecture, design system, edge cases & failure modes, validation, metrics, the case-study narrative. |
| `/advisor` | Advisor workspace | Today, greeting, stat tiles, incoming case request, needs-you-now, at-risk strip, recent activity. |
| `/advisor/cases` | Advisor workspace | Cases table, search, status filters, sort by deadline; Betina's row carries the "Live demo" pin. |
| `/advisor/cases/:id` | Advisor workspace | Case detail, checklist verify/flag, request-document form, follow-up composer, client questions, history. Every one of the ~21 seeded cases is fully workable here, not just Betina's. |
| `/advisor/inbox` | Advisor workspace | Needs-your-reply and waiting-on-client queues, answerable inline. |
| `/advisor/clients` | Advisor workspace | Client directory + a detail sheet (filing history, notes, jump to case). |
| `/advisor/settings` | Advisor workspace | Profile, availability toggle, notification prefs, follow-up templates, workspace reset. |
| `/press` | Press deck | Eleven keyboard-driven slides plus parked ones reachable from the grid (see keys below). |
| `/stakeholders` | Stakeholder interviews | Betina and Anna side by side; ask either anything, Claude Code answers in character. `?embed=1` for the deck's iframe. |

**One reducer, three clients.** `src/store/state.ts` is the only place business logic
lives. `server/relay.mjs` is a thin Node sidecar that holds the one case state, runs that
same reducer against actions it receives (`UPLOAD_ITEM`, `VERIFY_ITEM`, `FLAG_ISSUE`,
`COMMIT_CASE`, `START_PREPARING`, `SEND_DRAFT`, `APPROVE_RETURN`, `MARK_FILED`, …), and
broadcasts the full state snapshot to every connected client over WebSocket
(`ws://127.0.0.1:8787`). The web advisor and the SwiftUI app are both thin views over
that server state, nothing to drift, no logic duplicated in Swift.

- If the socket is down, the iOS app falls back to seeded local state so the phone never
  shows a broken screen mid-demo (`CaseStore.applyLocally`, clearly commented as a demo
  fallback, not business logic).
- **Token push:** the hub's live token editor sends design-token overrides over the same
  socket; the native app applies them at runtime for an instant simulator restyle. One
  token, three surfaces.
- `npm run demo` boots the relay + the web dev server and prints the remaining step
  (open the Xcode project and run).

## Run

```
npm i
npm run demo
```

Then:
1. Landing (the deliverable link): http://localhost:5173/ · Hub: http://localhost:5173/hub (or whatever port Vite prints, if 5173 is taken)
2. Advisor: http://localhost:5173/advisor
3. Press deck: http://localhost:5173/press, → / Space advances, ← goes back, Esc
   toggles an overview grid of every slide (click one to jump straight to it, parked
   slides included), N toggles presenter mode (notes for the current slide, a running
   clock, the slide's time budget, and what's next), S opens the stakeholder interviews
   in a new tab.
4. Stakeholders: http://localhost:5173/stakeholders, type a question in either column.
   In the presenter's Claude Code session, `node scripts/stakeholders.mjs wait` blocks
   until a question is pending and `node scripts/stakeholders.mjs reply <amara|anna> "…"`
   posts the answer, which appears in the chat live. `show` prints the transcripts,
   `reset` returns to the seeded discovery interviews. Personas, sources and the
   interview method: `docs/personas/`. Portraits were supplied by the
   author.
5. iOS app: open `ios/TaxfixExpert.xcodeproj` in Xcode and hit **⌘R** on the
   **iPhone 17 Pro** simulator.

Or build and launch the simulator app from the command line instead of Xcode:

```
cd ios
xcodebuild -project TaxfixExpert.xcodeproj -scheme TaxfixExpert \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -derivedDataPath build build
xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/TaxfixExpert.app
xcrun simctl launch booted co.cloover.TaxfixExpert
```

## Test

```
npx vitest run
```

```
cd ios && xcodebuild -project TaxfixExpert.xcodeproj -scheme TaxfixExpert \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -derivedDataPath build test
```

## Regenerate iOS codegen

`src/styles/tokens.css` is the single source of raw design values. Regenerate the
generated Swift/JSON from it after changing tokens or the seed case state:

```
npm run gen:ios
```

Writes `ios/Sources/Generated/Tokens.swift` (colors, spacing, radii, from `tokens.css`)
and `ios/Resources/seed.json` (the seeded case state, from `src/store/state.ts`'s
`seedState()`). Both are committed; regenerate and commit again after a source change.

## Brand font

The brand's typeface is ABC ROM. The trial OTFs are committed (this is a private
demo repo; don't redistribute them or deploy `dist/` publicly): a fresh clone renders
the brand font with no extra steps. Every consumer (web `@font-face`, iOS `Font.custom`)
still falls back to a comparable system font if the files ever go missing, so the app
builds and looks correct either way.

How it's wired:

1. `fonts/` is the source of truth for the four weights (`Book`, `Medium`, `Bold`,
   `Black`).
2. `npm run sync:fonts` refreshes the consumer copies in `public/fonts/` (web) and
   `ios/Resources/Fonts/` (iOS): only needed if you swap the files in `fonts/`.
3. Web: `src/styles/fonts.css` declares `@font-face` for all four weights under the
   family `'ABC ROM Trial'`, which `tokens.css`'s `--font-sans` lists first (before the
   `-apple-system` fallback stack): no rebuild step needed beyond the normal `npm run
   build`/`npm run dev`.
4. iOS: regenerate the Xcode project (`cd ios && xcodegen generate`) and rebuild. A
   run-script build phase copies any OTFs found in `ios/Resources/Fonts/` into the app
   bundle at build time (skipped silently if the folder is empty), `Info.plist`'s
   `UIAppFonts` registers them at launch, and `TaxfixApp.init` also registers any bundled
   OTFs directly via `CTFontManagerRegisterFontsForURL` as a second safety net.
   `ios/Sources/BrandFont.swift` exposes `brandFont(size:weight:relativeTo:)`, which
   resolves to the real ABC ROM PostScript name when `UIFont(name:)` finds it, and
   otherwise falls back to the closest `.system` weight at the same size and Dynamic
   Type text style.

Without the OTFs, the pbxproj never references missing files (the font glob is excluded
from `project.yml`'s `sources`), so a fresh clone still builds and runs correctly, it
just renders in the system font instead of ABC ROM.

**Warning:** if the trial OTFs are present locally, `npm run build` copies them from
`public/fonts/` into `dist/` along with everything else, don't deploy `dist/` publicly
without stripping those font files first, or you'll redistribute a TRIAL-licensed font.

## Regenerating screenshots

The hub's flow map (`src/hub/sections/FlowMap.tsx`) reads `public/screenshots/<id>.png`.
Every screenshot in that set is captured live from the running iPhone 17 Pro simulator,
**except the four `a*.png` advisor shots** (`a1-today`, `a2-case`, `a3-cases`,
`a4-inbox`), which are live captures of the advisor workspace itself, driven from a
real browser against `/advisor`'s real routes with `scripts/capture-advisor.mjs` (start
the dev server first, then `npm run capture:advisor`), at the same crop the other
screenshots use.

The rest are driven from outside the app (the harness can't tap the simulator), using
two mechanisms:

1. **Relay actions** for anything that's *case state*, `COMMIT_CASE`, `UPLOAD_ITEM`,
   `FLAG_ISSUE`, `SEND_FOLLOW_UP`, `ANSWER_FOLLOW_UP`, `START_PREPARING`, `SEND_DRAFT`,
   `SUBMIT_DOCUMENTS`, `APPROVE_RETURN`, `MARK_FILED`, `RESET`: sent to `ws://127.0.0.1:8787` from any small
   WebSocket client. The running app updates live, no app restart needed.
2. **Screenshot/demo hooks** (below) for anything that's *navigation state*, which
   onboarding screen, or which sub-screen inside the sharing phase, since that can't be
   reached remotely.

Then, for each shot:

```
xcrun simctl terminate booted co.cloover.TaxfixExpert
env SIMCTL_CHILD_ONBOARDING_STEP=result xcrun simctl launch booted co.cloover.TaxfixExpert
xcrun simctl io booted screenshot public/screenshots/w5-result.png
```

### Screenshot/demo hooks

Two environment variables, read once at launch, exist **only** for driving the simulator
to a specific screen from outside, for screenshots, and equally useful for jumping
straight to a screen mid-demo. Both fall back to normal behavior on an unset or
unrecognized value; neither is reachable from within the app's own UI.

- `ONBOARDING_STEP`: `welcome | questions | q1 | q2 | q3 | result | howItWorks | pricing`. Sets the
  onboarding flow's initial screen (`OnboardingFlow.swift`).
- `GALLERY`: `<name>` shows one catalog component on a plain canvas (`ComponentGalleryView`); `npm run specimens` renders all of them for the hub.
- `OFFLINE`: `1` runs the app on the bundled seed without the relay, so onboarding screens can be captured while the relay is in a later state.
- `CASE_SCREEN`: `checklist | chapter:<identity|employment|benefits|deductions> | item:<itemId> | item-escape:<itemId> | item-scan:<itemId> | chat | faq`.
  Auto-navigates the sharing-phase `NavigationStack` to that screen on launch, and skips
  the one-time notification explainer so the target screen is visible immediately
  (`CaseRootView.swift`, `CaseStore.swift`). Item ids are the ones in
  `ios/Resources/seed.json`, e.g. `lohnsteuer`.

Set via `simctl`'s `SIMCTL_CHILD_` prefix, e.g.:

```
xcrun simctl terminate booted co.cloover.TaxfixExpert
env SIMCTL_CHILD_CASE_SCREEN=item:lohnsteuer xcrun simctl launch booted co.cloover.TaxfixExpert
```

## Spec & plan

- **Brief coverage:** `docs/brief/COVERAGE.md`, a line-by-line map of asks to answers.
- **Presenting runbook**: pre-flight, slide timings, live-session playbook, prepared Q&A:
  `docs/PANEL-RUNBOOK.md`
- Spec (v2, current build direction): `docs/superpowers/specs/2026-08-31-taxfix-native-full-journey-design.md`
- Plan: `docs/superpowers/plans/2026-08-31-taxfix-native-full-journey.md`
- v1 spec (record of the first iteration, superseded for build direction):
  `docs/superpowers/specs/2026-08-31-taxfix-handoff-design.md`
- Process narrative, how this was built, the angles, the persona method, the tools,
  the honest log: `docs/PROCESS.md`

## Demo script

Per spec §8:

1. `npm run demo`: starts the relay + web dev server, prints the next step.
2. Xcode **⌘R**: app launches on the iPhone 17 Pro simulator, seeded at Welcome.
3. Browser: `/` hub for the presentation narrative; `/advisor` open beside the simulator
   for the live walkthrough.
4. Walkthrough beats:
   - **Liability check** → **result** → **"Start for free"**: `COMMIT_CASE` fires;
     the case lands in Anna's queue live, on the advisor screen, no reload.
   - **Upload** a document on the phone → the matching row on the advisor side flips
     "To share" → "Sent" live.
   - **Verify / flag round-trip**: Anna verifies one item and flags another with a note;
     the phone's checklist row and home banner update live.
   - **Follow-up**: Anna sends a templated follow-up; it lands on the phone under
     Follow-ups, answerable inline.
   - **Momentum**: once every required item is in, the phone auto-navigates to "That's
     everything Anna needs to start."
   - **Draft → review → approve → filed**: Anna starts preparing, sends a draft
     (income, deductions, refund estimate); the phone gets a review screen with the
     estimated refund as informed consent, not a rubber stamp; Betina approves; Anna
     marks it filed; the phone gets the calm closing screen.
   - **Token-editor restyle finale**: on the hub, change the Primary color swatch in the
     design-token editor; the live advisor preview *and* the native app in the simulator
     restyle instantly, since both read overrides pushed over the same socket.
5. **Reset** (advisor header + hub) → `RESET` action → every surface, including the
   simulator, returns to the seeded start, including the one-time notification
   explainer. The only thing it cannot undo is iOS's own notification
   permission dialog, which the system shows once per install and which simctl cannot
   reset; `npm run reset:first-run` does the full thing in one go (relay reset, app
   reinstalled from the last build, relaunched at Welcome), a few seconds, no Xcode.
   On the phone itself, an invisible 44pt target in the top-right corner of every
   screen opens the presenter's demo menu: jump to any stage (first access, sending
   with any chapters already filled, all filled but not sent, sent to Anna, preparing,
   review, approved, filed). Jumps land in place; only "First access" restarts at Welcome. It replays the
   real actions through the relay, so every surface follows. `SIMCTL_CHILD_DEMO_MENU=1`
   opens it at launch. The same menu switches the home between the four-chapter grid
   the horizontal steps carousel and the plain timeline
   (`SIMCTL_CHILD_HOME_LAYOUT=grid|carousel|timeline` overrides it for a launch).
6. **Edge-case demo beats** (if there's time, or a question calls for one, spec §6, hub
   `/` → "Edge cases & failure modes" has the full table):
   - **Nudge**: Today → the At risk strip's "Stalled" row has a one-click
     "Send a nudge" button right there (also on that case's detail page).
   - **Offline pip**: stop the relay (`Ctrl-C` the `npm run demo` process, or kill
     `server/relay.mjs` on its own) while the advisor is open; the topbar pip flips to
     amber "Live sync offline, retrying" immediately, and Betina's case detail shows a
     banner with her controls disabled, every other (non-relay) case is unaffected.
   - **Repeat-flag escalation**: open Chen Wei's case (`/advisor/cases/chen-wei`): her
     income statement is seeded already flagged twice, so "Asked twice already, request
     a different document instead?" shows immediately, no extra flagging needed.
   - **Capacity accept/decline**: Settings → toggle "Accepting new cases" off, then back
     on: the "New case request" card disappears from, then reappears on, Today. Accept
     adds the case to the Cases table; Decline opens a confirm dialog first.
   - **Reset (workspace-scoped)**: Settings → "Reset workspace" re-seeds all ~21 advisor
     cases, activity, and templates back to the seed, independent of the global `RESET`
     in step 5 above, which only touches Betina's relay-backed case and the iOS app.

The 20-minute live-build constraint lands in whichever layer fits: copy/flow changes in
Swift views, logic changes in `state.ts` (one reducer, tested), advisor changes in React, an architecture-for-adaptability decision, not an afterthought.

## Deploying (the public link)

The web half deploys to Vercel as a static Vite build: `vercel.json` rewrites every path to
`index.html`, and `/` is the landing page with four doors (deck, iOS app on GitHub, advisor
desk, hub at `/hub`). The deployed copy never opens the relay socket (a public page reaching for 127.0.0.1
makes Chrome ask visitors for permission); add `?relay=local` to a URL to force it when
presenting from the deployment with the relay running. Anything that needs it degrades on
purpose: the advisor's live case shows "Live sync offline", the interview chats show
"Server is offline" and keep their seeded transcripts. In the room everything runs
locally with the relay on. The brand fonts are gitignored, so the deployment renders in
the fallback face; the local demo has the real one.

```
npx vercel --prod          # from the repo root, after `npx vercel login`
```
