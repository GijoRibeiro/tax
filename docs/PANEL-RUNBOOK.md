# Panel runbook

The brief's "Time and format" and "The live session" sections, turned into a checklist.
Read `docs/brief/COVERAGE.md` for what each part of the brief maps to; this file is only
about the 75 minutes in the room.

## T-30 min, pre-flight (the brief says "no setup time")

```
cd ~/Documents/Code/TB
git status                      # clean, on main
lsof -i :5173 -i :8787          # both free (another project sometimes squats 5173; then use
npm run demo                    #   node server/relay.mjs + npx vite --port 5175 --strictPort)
# Landing at /, deck at /press, desk at /advisor, hub at /hub, interviews at /stakeholders.
# Reducer changed during the session? Restart the relay, it loads state.ts once.
```

- Simulator: iPhone 17 Pro booted, app installed and launched at Welcome. After Welcome a
  placeholder says where Taxfix's own questions would run; say "a questionnaire lives here"
  and tap Skip (or Answer them, the three real questions still work)
  (`xcodebuild … build` + `simctl install` + `simctl launch co.cloover.TaxfixExpert`,
  commands in README → Run). Keep Xcode open on the project as well, for ⌘R.
- Browser, four tabs in this order: `/press` (fullscreen), `/stakeholders`, `/advisor`,
  `/` hub. `node scripts/stakeholders.mjs show` once, to confirm the seeded interviews
  are what the chats display.
- Claude Code open in this repo, this file and `CLAUDE.md` already read, so the first
  prompt of the live session is the curveball, not orientation.
- `npm run stakeholders:agent` in its own terminal tab and leave it running. It answers
  every question typed into `/stakeholders` in character, through Claude Code on Opus 5,
  in about ten to twenty seconds. Without it the chat shows "typing…" forever.
- `npm run reset:first-run` once: case back to the seed, app reinstalled so iOS asks for
  notifications again, relaunched at Welcome. Confirm the phone shows the first screen.
  Mid-demo, tap the invisible top-right corner of the phone: the demo menu jumps every
  surface to any stage (or back to first access) through the real actions.
- Second window layout for the walkthrough: simulator left, `/advisor` right.
- Charger in. Notifications off. Font check: hub renders ABC ROM, not the system fallback.

## 0:00–0:15, presentation (`/press`, → advances, Esc = grid, N = presenter notes, S = interviews)

Thirteen slides in the running order plus four parked on the Esc grid, plus whatever
`src/press/slides.local.tsx` adds after Thank you (gitignored, never deployed, this machine only) ("Ask them", the live
interviews, among them). The cue column is
the presenter note for that slide; the full notes are on screen with N. Budget:

| Slide | Title | Cue | Time |
|---|---|---|---|
| 1 | A study of the hand-off moment | Three moments from the brief, hand-off marked. The why is in the presenter notes (N). | 0:45 |
| 2 | Meet Betina | Betina, 33, Berlin: what's true, what she expects. Every screen answers one of these. | 1:15 |
| 3 | Meet the Expert | The other side of the marketplace: can't hire, July collision, a case pays in two touches. | 1:00 |
| 4 | Talking to both sides | Two composites from public sources, interviewed in character; three findings that changed the design. S to talk to them. | 1:30 |
| 5 | The hand-off moment | The moment, then five reasons people stop here and what answers each. Say where the model comes from. | 2:00 |
| 6 | The journey | Three tabs: Betina's screens, Anna's workspace, and When money moves (the flowchart). Pan and zoom, click a step for the full screen. Walk the main path, then go live in the app. | 2:30 |
| 7 | Three moments, one commitment each | The proposal in prose: start (attention; Anna carries a little, the platform keeps it small), send (a saved card, Anna starts), approve (the charge). One shared case state underneath, said in the notes. | 1:30 |
| 8 | How I would validate it | A beta with a control group first, the persona agents connected to real usage, then five moves, one per open question: comprehension, the send-is-not-paying test, the escape-hatch data, advisors' real follow-ups, a tax advisor reading the copy. | 1:15 |
| 9 | The five pains, answered | The slide-5 list again; hover a question and the two screens that answer it appear. Touch two, leave the rest for questions. | 1:00 |
| 10 | How I would know it works | One number: starts that reach "Send to Anna" in seven days, beta against control, then the 25 to 65 percent band. Five signals, two of them the business, and one guardrail around it. | 1:15 |
| 11 | AI in my process | The two persona agents first (source and testers), then the three things the agents built: the native app, the design system, the advisor web app. Say the hours plainly. | 1:30 |
| 12 | Betina (AI) actually used it | The AI slide's proof: the persona's walkthrough of today's build, seven screens in green, five to fix in amber, none fixed. Own it. | 1:15 |
| 13 | Thank you | The one link and its four doors. | 0:30 |
| parked | Edge cases & what production needs | Kept in the hub (§6); on the grid if they go deep on edges. | 0:45 |
| parked | What I deliberately did not design | Kept in the hub (§1.4); on the grid if a panelist asks for the cuts. | 0:45 |
| parked | Marketplace thinking | The money flowchart alone, full screen; the journey's third tab shows the same. | 1:30 |
| parked | Ask them | Live interviews embedded. Type a question; answer it from the terminal. | 2:00 |

Total ≈ 17:15 with the live round-trip inside slide 6, so slides 1, 4 and 6 need to be brisk. If running long, slides 9 and 12 are the ones to cut; it is Q&A material anyway. Do the live round-trip (upload on phone → row flips on advisor) during
slide 6, not as a separate segment. Say "focus beats breadth" back to them on
slide 4 and mean it: the story is the hand-off, the rest is supporting evidence.

## 0:15–0:45, the live session

**Their format:** a new constraint on the spot, 20 minutes to adapt, 10 to discuss.
Scope out loud first. Output must be tangible: a running screen, not a Figma edit.

**First two minutes, out loud, every time:**

1. Repeat the constraint in one sentence. Ask one clarifying question at most.
2. Name which actor it touches (Betina, Anna, both) and which layer that means:
   - copy or flow on the phone → a Swift view in `ios/Sources/Views/…` (⌘R to see it)
   - a rule or state change → `src/store/state.ts`, the one reducer; a vitest case first
   - advisor-side → React under `src/advisor/` (Vite hot-reloads)
3. Say the smallest buildable version and the thing you are explicitly not doing.
4. Open Claude Code and dictate that scope as the first prompt. Reach for AI before the
   editor; they are scoring exactly that.

**Playbook by constraint type (the three the brief names):**

| They hand you… | Reach for | Smallest tangible output |
|---|---|---|
| A shifted user context (e.g. German-speaking, a freelancer, a couple filing jointly, over 60) | Onboarding runway + checklist seed. `LIABILITY_QUESTIONS` in `OnboardingFlow.swift`, checklist items in `state.ts` `seedState()`, then `npm run gen:ios` | One changed question or one new checklist item visible on the phone and on Anna's side |
| A business requirement (e.g. price by refund size, pay-upfront, a second advisor tier, a 48h SLA) | `state.ts` for the rule + a test; `PricingView.swift` / `CaseHomeView.swift` for the consumer face; advisor `PrepareControls.tsx` if Anna needs a control | The rule enforced in the reducer with a passing test, and one screen that shows it |
| An edge case you didn't handle (e.g. document rejected three times, advisor goes on leave, deadline missed, upload fails) | `state.ts` action + `EdgeCases.tsx` row; the advisor already has flag escalation, stalled nudges, offline pip to build on | One new state the advisor can trigger and the phone reacts to live |

**Answering the stakeholders live:** the agent from pre-flight does it. If it is not
running, the manual path still works:

```
node scripts/stakeholders.mjs wait            # prints "[anna] <question>" and exits
node scripts/stakeholders.mjs reply anna "…"  # appears in the chat with the fade-in
```

Say what you are doing while you do it: "she answers from her file; the sources are in
the drawer." If the panel asks something the file can't ground, the persona says so.

**Narration prompts while building:** "I'm choosing the reducer because it's tested and
both surfaces get it for free." · "That suggestion is close but wrong because …, fixing
it." · "Cutting X; it's not what makes this decision visible." · "Run the tests" (out
loud, then actually run them).

**If it goes wrong:** the relay dies → advisor pip turns amber, the phone keeps working
on local state; restart `npm run demo`. The simulator wedges → `simctl terminate` and
launch again with a `SIMCTL_CHILD_CASE_SCREEN` hook to land straight on the screen you
were editing (values in README). Vite port stolen → `npx vite --port 5175`.

**What they are scoring, and the move for each**

- *Reach for AI immediately?* First action after scoping is a Claude Code prompt.
- *Scope down in the first couple of minutes?* The four-step script above, spoken.
- *Catch close-but-wrong AI output?* Read the diff before running it; say what you reject.
- *A real design decision, not least resistance?* Tie the change to one of the five
  drop-off questions or to Anna's ≤2-touch economics before you build it.

## 0:45–1:15, intros, Q&A, discussion

Prepared answers for the questions most likely to come:

- **The four-hour question.** The brief says "aim for ~4 hours, we mean it." Answer it
  straight: the design decisions (slice, drop-off model, the five screens, the no-branch
  runway, structured follow-ups over chat) were made in roughly that window and are what
  the deck shows. The rest was letting agents build and review under those decisions, and
  a deliberate rebuild from web-in-frame to SwiftUI once the "native" line was taken
  literally. That trade was judgment, and the honest log has it. Do not claim four hours.
- **"Why so much advisor UI for a focus brief?"** The marketplace criterion needs a real
  advisor seat, and the curveball most plausibly lands there. Depth is still the hand-off.
- **"31 July has passed, it's September."** In-scenario for tax year 2025. A late user is
  covered honestly: with a Steuerberater the deadline legally extends, the FAQ says so.
- **"Is the liability check legally complete?"** No, named as an assumption; three
  questions as a design artifact, not a Pflichtveranlagung decision tree.
- **"Where would AI sit in the product itself?"** Drafting follow-ups and flag reasons for
  Anna, never in client-facing tax claims without her verifying. The hub's AI log has the starter.
- **"What would you validate first?"** The comprehension test: can users name what is
  left and who acts next at every step. That ambiguity is the drop-off.

### If they ask: "When does the client pay, and when is the advisor assigned?"

Three moments, one commitment each. The advisor is proposed on the result screen and
reserved at Start; Betina sees a real name before committing, Anna sees a waiting case. Before the send Anna carries a
little (the queue place, early questions) and the platform keeps it small: released after 14
idle days, FAQ and support before Anna. At Send, the hand-off, Betina saves a card that is
checked but not charged, so Anna never spends time on a client who cannot pay. At Approve
the card is charged and Anna files. An abandoned draft is rare and Taxfix pays Anna for it
anyway, watched through time-to-approve. Both are named assumptions. The journey canvas's third tab is this as a flowchart, slide 7 says it in prose; the reducer enforces it with tests.

## After

- Commit whatever was built live on a branch named for the constraint, so the Q&A
  discussion can point at a diff.
- Don't push `dist/` anywhere public; it carries trial fonts.
