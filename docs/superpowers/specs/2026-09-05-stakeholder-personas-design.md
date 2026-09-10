# Stakeholder personas — two people you can talk to

Date: 2026-09-05. Status: approved in conversation, building.

## 1. Why

The brief scores "user & problem understanding" and "marketplace thinking". The case
study already has personas on paper. This turns the two that matter, Betina (filer) and
Anna (advisor), into people who can be interviewed: grounded in what real filers and
real advisors complain about, answerable live, and traceable from complaint to design
decision. In the panel the line is: "I talked to the stakeholders. Here is what they told
me, here is what I did about it, and you can ask them yourself."

The answers come from Claude Code in the presenter's terminal session, not from an API
key in the browser. The UI is the stage surface; the knowledge is in the repo; the work
is visible.

## 2. Non-goals

- No LLM call from the browser or the relay. No API key anywhere in the web app.
- No real, named person is impersonated. Both personas are composites built from public
  sources, and the UI says so.
- Not a general chat product. Two fixed personas, one interviewer.
- iOS untouched.

## 3. The people (knowledge)

`docs/personas/betina-bugnotto.md` and `docs/personas/anna-weber.md`. Same section order in
both so a reader (human or agent) can answer in character quickly:

1. **Identity card.** Name, age, city, role, one-paragraph situation. Marked composite.
2. **A real week.** Concrete recent events in their life drawn from sourced complaints,
   written as memory, not as citations. Betina: a previous expert service that promised a
   reply "within 2 days" and went silent for three weeks; found out about a 20%-of-refund
   fee late; got a Leistungsnachweis letter she couldn't read; a colleague told her she
   "has to file now" and she isn't sure if she is already late. Anna: her practice can't
   hire; a July where her own return (due 31 July) collides with client work (due 1 March
   next year); clients sending sideways WhatsApp photos; a client who thought "you had
   everything"; a €99.99 platform case that only pays if it closes in two touches.
3. **Facts they know, with sources.** Bullet list, each with a link. Betina's list: the
   €410 rule, Progressionsvorbehalt with the €1,060 example, ELStAM auto-transmission of
   benefit data, deductible job-search costs, deadlines 31 Jul 2026 / 1 Mar 2027 with an
   advisor, the real Expert Service terms (20% of refund, €99.99 minimum, due after the
   assessment), Trustpilot themes. Anna's list: StBVV middle fee on a €50k return
   (~€456) vs the platform price, 72.7% of firms unable to hire, >10,000 open positions,
   overload → error rate → waiting times, the advisor deadline split, DATEV/ELSTER
   reality, the Taxfix partner model (independent, referred through the platform).
4. **Voice.** Sentence length, register, tics, what makes them warm, what makes them
   sharp. Betina: quick, dry, PM vocabulary, a little Denglisch, angry at vagueness.
   Anna: brief, exact, unsentimental, allergic to chat, warm once trust is earned.
5. **What they don't know.** Betina: tax law, what documents are called, what the advisor
   does. Anna: Taxfix internals, the consumer app, marketing numbers.
6. **Honesty rule.** If asked whether something is real, they say which parts are
   sourced and which are synthesised. They never invent a source.
7. **Problems the design answers / doesn't.** Two tables: complaint → decision (D-number
   from the hub's decision log) or → named scope cut.

`docs/personas/README.md`: the method (how a persona is briefed, how an interview is run,
how a finding becomes a decision), the disclaimer, and the portrait credits.

`docs/personas/interview-findings.md`: written after the discovery interviews. One row
per finding: quote, who, what it changed (decision id) or what it confirmed.

## 4. Discovery interviews

First real use of the personas, run by Claude Code in this session after the knowledge
files exist. Six to eight questions each, covering: how they arrived, what they feared,
what went wrong last time, what "good" looks like, what they would pay / accept, what
would make them quit. Answers are written in character from the persona file, saved as
the seeded transcript, and distilled into `interview-findings.md`. Pull quotes for the
slide come from here.

## 5. The surface

### 5.1 Route `/stakeholders`

- Split 50/50 on desktop, stacked under 900px. Left Betina, right Anna.
- Column header: round portrait (56px), name, one-line situation, a pill "Composite
  persona · sourced", a "Sources" toggle, a reset button.
- Transcript: bubbles. Persona on the left in `--color-surface-sunken`, interviewer on
  the right in `--color-info-bg`. Each message enters with the deck's fade-in.
- Composer at the bottom: input with placeholder "Ask Betina…" / "Ask Anna…", Enter sends.
- Pending state: while the last message is an unanswered question, a typing indicator
  with the text "Betina is typing…" under the last message.
- Sources drawer: slides over the column; lists the persona's sources as links, the
  disclaimer, and the portrait credit.
- Offline: composer disabled with the amber "Live sync offline — retrying" line reused
  from the advisor's connection pip.
- Query param `?embed=1` hides the page chrome (no page title, tighter padding) so the
  deck can iframe it.

### 5.2 Deck

- New slide `stakeholders`, title "Talking to the stakeholders", inserted after "The
  user". Body: two portrait cards (portrait, name, situation, one pull quote from the
  interviews) and a one-line method note. Presenter notes: the method and three
  finding→decision examples. Budget 1:30.
- Second new slide `stakeholders-live`, title "Ask them", body: an iframe of
  `/stakeholders?embed=1` filling the slide. Not placed in the running order yet: it
  sits at the end of `SLIDES` behind a `parked: true` flag so it is reachable from the
  overview grid and by its dot, but the presenter decides where it goes. Budget 2:00.
- `S` key on the deck opens `/stakeholders` in a new tab.
- Runbook and README updated: keys, slide table (now 14 slides incl. parked), and the
  stage flow for answering.

### 5.3 Hub

Personas section: portraits added to Betina's and Anna's cards, and a "Talk to them →
/stakeholders" link in the callout.

### 5.4 Portraits

`public/personas/betina.jpg`, `public/personas/anna.jpg`, fetched from a free-use portrait
set, credited in `docs/personas/README.md` and README. Swappable by replacing the files.

## 6. Mechanics

### 6.1 State

`src/store/stakeholders.ts` — pure module, tested:

```ts
type PersonaId = 'amara' | 'anna'
interface StakeholderMessage { id: string; role: 'interviewer' | 'persona'; text: string; at: string }
interface StakeholderState { amara: StakeholderMessage[]; anna: StakeholderMessage[] }
type StakeholderAction =
  | { type: 'ASK_PERSONA'; persona: PersonaId; text: string; id?: string; at?: string }
  | { type: 'ANSWER_PERSONA'; persona: PersonaId; text: string; id?: string; at?: string }
  | { type: 'RESET_PERSONA'; persona: PersonaId }
  | { type: 'RESET_STAKEHOLDERS' }
reduceStakeholders(state, action): StakeholderState   // unknown action → same state
pendingQuestion(state, persona): StakeholderMessage | null   // last message if interviewer
seedStakeholders(): StakeholderState   // from server/stakeholders.seed.json
```

Rules: `ASK_PERSONA` with empty/whitespace text is ignored. `ANSWER_PERSONA` when no
question is pending still appends (the persona may volunteer) — kept simple. `RESET_PERSONA`
restores that persona's seeded transcript, not an empty one.

### 6.2 Relay

`server/relay.mjs` holds `stakeholders` next to the case state. Incoming WS messages
whose `type` starts with `ASK_PERSONA | ANSWER_PERSONA | RESET_PERSONA | RESET_STAKEHOLDERS`
go to `reduceStakeholders`; everything else keeps going to the case reducer. After each
stakeholder action the relay broadcasts `{ kind: 'stakeholders', state }` to all clients
and writes `server/.stakeholders.runtime.json` (gitignored). On boot it loads the runtime
file if present, else the seed. New clients receive both snapshots on connect.

### 6.3 CLI

`scripts/stakeholders.mjs`:

```
node scripts/stakeholders.mjs wait [amara|anna]          # blocks until a question is pending; prints it; exit 0
node scripts/stakeholders.mjs reply <persona> "<text>"    # or --file path
node scripts/stakeholders.mjs ask <persona> "<text>"
node scripts/stakeholders.mjs show [persona]              # prints transcript
node scripts/stakeholders.mjs reset [persona]
```

`wait` exits immediately if a question is already pending, so it is safe to run late.

### 6.4 Web client

`src/store/StakeholderStore.tsx`: context + hook over the existing socket, listening for
`kind: 'stakeholders'`, exposing `state`, `pending(persona)`, `ask`, `reset`, `online`.
Reuses the socket module the case store uses; no second connection.

### 6.5 Stage flow

1. `npm run demo` (or relay + Vite on a free port).
2. Presenter types a question in `/stakeholders`, or says it out loud to Claude Code.
3. Claude Code runs `wait`, reads the persona file, replies with `reply`.
4. The answer appears in the column with the fade-in; the typing indicator goes away.

## 7. Testing

- `stakeholders.test.ts`: reducer rules above, seed shape, pending detection.
- `Stakeholders.test.tsx`: two columns render with names; typing + Enter dispatches
  `ASK_PERSONA`; pending indicator text appears; Sources drawer opens; offline disables
  the composer; `?embed=1` hides chrome.
- `Press.test.tsx`: 14 slides total, parked slide excluded from the running order but
  present in the overview; `S` opens a new tab (window.open spy).
- Relay: extend the existing relay test if one exists; otherwise a smoke test that an
  `ASK_PERSONA` round-trips to a `stakeholders` broadcast.

## 8. Assumptions

- Portrait set is free for this use; credited; swappable.
- Sources are public web pages read on 2026-09-05; some may change. Links are kept in
  the persona files, not hard-coded in UI copy beyond the drawer.
- Some persona detail is synthesised for coherence and is labelled as such in the files
  and the UI disclaimer.
