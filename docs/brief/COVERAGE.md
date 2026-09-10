# Brief coverage — line by line

The brief is `taxfix-case-study-brief.pdf` in this folder (byte-identical copy of the
original, SHA-256 `33b88361…c0429a`). This document walks every requirement in it and
points at where the build answers it. Status legend: **✓** covered and demonstrable ·
**◐** covered, with a risk to manage in the room · **✗** gap (with the fix).

Last audited 2026-09-05 (evening) against `main`: 232/232 web tests, 20/20 iOS tests, after the home redesign and the explicit send step.

## 0. The file itself — what a close read finds

- **Origin:** Google Docs export ("Skia/PDF m154"), language tag `en-DE`, source docx
  titled the same as the file. No JavaScript, no annotations, no embedded files, no
  optional-content layers, no invisible/white/tiny text, no text outside the page box.
  Page 5 is a blank trailing page. Nothing hidden for an AI to trip on.
- **Yellow highlights** (page 2–3). Someone marked, in the original doc, exactly these
  phrases: *Taxfix Germany Expert Service* · *on a native mobile app* · the **entire
  target-user paragraph** (expat, 30s, English UI, back to employment after a short gap,
  first mandatory filing because of unemployment benefits, foreign system, high stakes) ·
  *Expert Service* · *31 July* · *Design for a native mobile app.* · *native mobile app*
  (in the assessment list). Read as the author's priorities: **native**, **this exact
  user**, **Expert Service (not DIY Taxfix)**, **the deadline**. All four are load-bearing
  in the build (rows 1.6, 2.x, 3.3 below).
- **Cover image** (page 1): a real Taxfix screen, *"What was your job status in Germany in
  2023?"* with options Employed / Minijob / Student / Trainee / On parental leave /
  Unemployed. Our liability check opens with the same question shape
  (`OnboardingFlow.swift` q1: *"What was your job status in 2025?"*) — worth saying out
  loud: the runway starts where Taxfix's own product starts.

## 1. The context

| # | Brief says | Where it's answered | Status |
|---|---|---|---|
| 1.1 | Expert Service connects people with qualified advisors who handle the return end-to-end | Welcome: "An expert files your German taxes. In English." with Anna's card; Pricing: "Prepared and filed for you", "A real, certified advisor: Anna does the work herself" | ✓ |
| 1.2 | Consumer's job: get started, share the right information, respond to follow-ups | Welcome → result → price → home with four chapters → document → "Send to Anna". Anna's open question takes over the home's headline and her card, and is answered in the chat (`CaseHomeView`, `ChatView`) | ✓ |
| 1.3 | Advisor's job: file an accurate return | Advisor case detail: verify/flag with reason chips, request document, prepare → draft → file (`PrepareControls.tsx`) | ✓ |
| 1.4 | Simple, transparent, trustworthy for the consumer | Anna named with photo and credential on Welcome and on every home; price before commit and recapped at approval with the liability line; approval as informed consent (D14); filling is not sending, the hand-off is an explicit tap | ✓ |
| 1.5 | Efficient for the advisor | Structured follow-up tasks not chat (D5), templates, one-click flag reasons, Today triage, ≤2-touch economics in Anna's persona | ✓ |
| 1.6 | **Native mobile app** (highlighted, three times) | SwiftUI app on iPhone 17 Pro simulator: NavigationStack, sheets, SF Symbols, UNUserNotificationCenter banners, Dynamic Type. Rebuild from web-in-frame is logged as D10 and as an AI override | ✓ |

## 2. Who you're designing for (the highlighted paragraph)

| # | Brief says | Where it's answered | Status |
|---|---|---|---|
| 2.1 | Expat in their 30s living in Germany | Betina Bugnotto, 33, four years in Berlin (hub Personas, slide 2) | ✓ |
| 2.2 | English-language interface | Whole app in English; German document names appear as artifacts with plain-English explainers + "what it looks like" previews (`DocumentGuidance.swift`) | ✓ |
| 2.3 | Recently back to employment after a short gap | Result screen names "a gap between jobs" as a trigger; Betina re-employed in March after 5 months | ✓ |
| 2.4 | First **mandatory** filing because they received unemployment benefits | Result screen: "unemployment benefit over €410 … makes a German return mandatory … routine, not trouble." ALG-I Leistungsbescheid is a first-class checklist item. The three-question quiz was cut on 2026-09-05: the runway goes Welcome → result, that moment is not the chosen slice | ✓ |
| 2.5 | Navigating a foreign system with high stakes | Every screen answers one anxiety (D13); FAQ; "You don't have to do this alone."; calm deadline framing (D7) | ✓ |
| 2.6 | Would rather an expert handle it than risk getting it wrong | Positioning copy throughout; "Ask Anna" front door; escape hatch "I don't have this" (D6) | ✓ |

## 3. The challenge

| # | Brief says | Where it's answered | Status |
|---|---|---|---|
| 3.1 | Team focus is growth: right people in, converted at the moments that matter | Slice = hand-off = the stated activation drop-off; primary metric is hand-off completion | ✓ |
| 3.2 | First-time filers: anxious, unsure they need to file, skeptical, late | Liability check settles "do I need to file"; named credentialed human settles skepticism; deadline chip + FAQ settle lateness without panic | ✓ |
| 3.3 | Often arriving close to the **31 July** deadline (highlighted) | Result screen deadline row; every home's eyebrow reads "Tax return 2025 · Due 31 July"; the timeline's last step "Filed by 31 July"; FAQ on missing it (advisor extension is a real German rule); deadline-cohort metric | ✓ |
| 3.4 | Pick **one** real drop-off | Hand-off chosen; the other two argued against in a table (hub §1.2) | ✓ |
| 3.5 | Focus beats breadth; you don't need to cover the full journey | Depth is at the hand-off (chapters, document with tip, escape hatch, Anna's question on the home, the send moment). The runway in and the loop out are deliberately thin (D11, D13). **Risk:** the repo now also carries a full advisor workspace and 21 seeded cases — in the room, present the slice and let the rest be Q&A material, not the story. See runbook | ◐ |
| 3.6 | Design for a native mobile app | Row 1.6 | ✓ |

## 4. What to deliver

| # | Brief says | Where it's answered | Status |
|---|---|---|---|
| 4.1 | Problem framing: the slice, why, and what you deliberately did **not** design | Hub §1.1–1.4 (the slice, why, and the scope cuts named in §1.4), slide 5 "The hand-off moment" for the slice and why; the cuts slide is parked, the hub carries them | ✓ |
| 4.2 | Your solution: key screens or flows | Hub flow map built from real simulator screenshots; slide 6, the journey canvas; slide 9, each pain with the screens that answer it; live app | ✓ |
| 4.3 | AI in your process: where it accelerated, where judgment corrected it | Slides 11 and 12 (the persona agents, the three things the agents built, overrides in the notes), hub §10 honest log, `docs/PROCESS.md` | ✓ |
| 4.4 | Validation before launch | Hub §8: comprehension test, fake-door on the escape hatch, advisor interviews, copy stress test, plus the send-is-not-paying test; slide 8 | ✓ |
| 4.5 | Success criteria | Hub §9: primary hand-off completion rate vs cited benchmarks, momentum proxy, follow-up rounds, guardrail, loop metrics; slide 10 | ✓ |
| 4.6 | Something we can move through; the closer to directly editable, the better | Working code, one command (`npm run demo`), one reducer, tests as a safety net for live edits | ✓ |

## 5. Time and format

| # | Brief says | Where it's answered | Status |
|---|---|---|---|
| 5.1 | **Aim for ~4 hours. "We mean the 4 hours."** | Not addressed anywhere in hub, deck, or docs. `PROCESS.md` records ~7.5h of build for the core, and the advisor workspace came later. This *will* come up. Fix: own it in one sentence, prepared in `docs/PANEL-RUNBOOK.md` ("Q&A: the four-hour question"); do not hide the number | ✗ → fixed in runbook |
| 5.2 | Panel 1h15: ~15 min presenting, be succinct | 13-slide deck with presenter notes (N) and per-slide budgets in the runbook | ✓ |
| 5.3 | Bring working files and AI tools open and ready | Pre-flight checklist in the runbook (relay, Vite, simulator, Claude Code with this repo loaded) | ✓ (new) |

## 6. Tools

| # | Brief says | Where it's answered | Status |
|---|---|---|---|
| 6.1 | Use whatever gets you there; AI directed by taste and judgment, not a shortcut | Claude Code as driver; subagent implementer/reviewer loops; persona agents; all logged | ✓ |
| 6.2 | If AI generated something you refined or rejected, talk about it | Override log: static-mock → functional two-sided; countdown urgency rejected; free-thread follow-ups on the advisor side rejected; web-in-frame → SwiftUI; reviewer-caught defects; data-bending test fix overruled | ✓ |

## 7. How we assess it

| # | Criterion | Where it's answered | Status |
|---|---|---|---|
| 7.1 | User & problem understanding | Persona → consequences list (hub §1.5); drop-off model → screen mapping (slide 5); two interviewable composite personas grounded in public complaints, with findings mapped to decisions (`docs/personas/interview-findings.md`, slide 4, `/stakeholders`) | ✓ |
| 7.2 | Solution quality & interaction design: **native** execution, clarity, trust signals | Row 1.6; plain-English explainers; a named advisor matched with reasons before commitment; "Start for free", card saved only at the send, charged only at approval; informed-consent approval | ✓ |
| 7.3 | AI as a force multiplier, knowing when to override | Rows 4.3, 6.2 | ✓ |
| 7.4 | Craft judgment: trustworthy and considered, not just generated | Persona-agent reviews changed the product (liability + price recap, a derived "What Anna checked" (since cut from the review screen), doc preview beside Verify); real screenshots, not mockups (D9) | ✓ |
| 7.5 | Marketplace thinking: consumer ↔ advisor | Both seats live and synced; every consumer friction removed = advisor margin; and the money model (slide 7 in prose, the journey canvas's third tab as a flowchart): advisor proposed at the result and reserved at Start, card saved at Send, charged at Approve, release after 14 idle days. Anna never starts unbacked, Betina never pays unseen | ✓ |
| 7.6 | Business outcomes | Row 4.5: the success slide carries the business pair, starts that reach Approve (the charge) and filed returns per advisor per week (capacity), next to the hand-off number | ✓ |
| 7.7 | Reasoning from the user's problem, not a template | The five drop-off questions drive the five screens (slide 5) | ✓ |

## 8. What we don't expect

| # | Brief says | Where it's answered | Status |
|---|---|---|---|
| 8.1 | Not a complete product or every edge case | Edge cases are split "shipped & demonstrable" vs "deliberately deferred" in the hub (the deck slide is parked). Keep it framed as judgment about *which* edges, not completeness | ◐ |
| 8.2 | Validation and metrics: how you think, not a finished plan | Four validation moves, each tied to a specific uncertainty | ✓ |
| 8.3 | Work with assumptions freely, but **name** them | Hub §11, twelve named assumptions incl. pricing, liability-check depth, advisor-web asymmetry | ✓ |

## 9. The live session

| # | Brief says | Where it's answered | Status |
|---|---|---|---|
| 9.1 | 20 min build + 10 min discussion; a new constraint on the spot: shifted user context, business requirement, or an edge case | Playbook per constraint type in `docs/PANEL-RUNBOOK.md`; edit paths: Swift views (copy/flow), `state.ts` (logic, tested), React (advisor) | ✓ (new) |
| 9.2 | Scope out loud first, then build; tangible output, not a Figma edit | Runbook: first-two-minutes script; output is a running screen in the simulator or browser | ✓ (new) |
| 9.3 | No setup time; laptop, AI tools open, files loaded | Pre-flight checklist | ✓ (new) |
| 9.4 | Narrate as you go, including changes of direction | Runbook narration prompts | ✓ (new) |
| 9.5 | Watching for: AI reached for immediately; scoped down fast; wrong AI output caught; a real design decision | Runbook "what they're scoring" with a concrete move for each | ✓ (new) |

## Things a panelist might poke at (pre-answered)

- **"It's September, 31 July has passed."** The app is frozen in-scenario for tax year
  2025 (deadline 31 July 2026) as the brief describes. With a Steuerberater the deadline
  legally extends, which the FAQ already says; that is also the honest answer for a
  late-arriving user.
- **"Why is there a whole advisor workspace if focus beats breadth?"** Because the
  marketplace criterion needs the advisor real, and because the live-build curveball is
  most likely to land on the advisor side. The *depth* is still at the hand-off.
- **"Four hours?"** See runbook. Don't flinch.
- **"Is the liability check legally complete?"** No, and it's named as assumption #10:
  one screen stating the common triggers, not a Pflichtveranlagung decision tree. The quiz exists in code behind the q1..q3 launch hooks if a curveball wants it back.
