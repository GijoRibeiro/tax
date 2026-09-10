# Interview findings, discovery round, 2026-09-05

Seven questions to each persona, answered in character from `betina-bugnotto.md` and
`anna-weber.md`. Transcripts are seeded into `/stakeholders`
(`server/stakeholders.seed.json`). Decision ids (D-numbers) refer to the decision log in
`docs/superpowers/specs/`; "PR fix" means a change that came out of the earlier
persona-agent review round.

## What changed or was confirmed

| # | Quote | Who | What it did |
|---|---|---|---|
| 1 | "Am I already late? Is there a letter about me somewhere?" | Betina | Confirms D13 (no-branch runway) and the result-screen copy "routine, not trouble". New: the welcome copy could say up front that most expats have to file (parked in INTERVIEW-PREP §2). |
| 2 | "They have the numbers and I don't." (ELStAM transmission) | Betina | Confirms the ALG-I Leistungsnachweis as a first-class checklist item with an explainer; the letter she can't read *is* the document we ask for. |
| 3 | "Three weeks later, nothing… I couldn't tell what the expert had done." | Betina | D3 (advisor side real and live), PR fix "What Anna checked" derived from verified items, response promise on the first case screen. |
| 4 | "If the app had just shown me a picture of it I'd have been done in ten minutes." | Betina | Confirms "what it looks like" previews on every document (consequences list). |
| 5 | "A countdown… I will freeze and do it this weekend, which means never." | Betina | D7 calm deadline framing, restated in her words. |
| 6 | "If I don't have a document and the only option is to upload it, I'm stuck." | Betina | D6 escape hatch. |
| 7 | "Tell me the price before I start, tell me again before I approve, charge me after." | Betina | D15 pay-on-approval and the PR fix adding the price recap to the approve screen. Also names why the real 20%-of-refund model reads as a trick to a first-time filer: the number is invisible until the end. |
| 8 | "€456 at the middle rate… a platform case only works in two touches." | Anna | Grounds the ≤2-touch metric in the fee schedule instead of asserting it. Feeds the success criterion "follow-up rounds per case ≤ 2". |
| 9 | "No way to tell, without opening each one, which of them I can actually work on." | Anna | Today view: needs-you-now, at-risk strip, workable-vs-waiting state (advisor workspace spec). |
| 10 | "They think I have everything. Nobody told them what everything is." | Anna | D4 shared state on both sides; momentum screen "the ball is out of your court" is the client-side answer to this exact sentence. |
| 11 | "If I flag a document I want one click, a reason the client understands, and the client fixing it on their own. That is one touch." | Anna | D5 structured follow-ups with reasons and templates; one-click flag reasons. |
| 12 | "A Verify button next to a document the tool never shows me… is the product asking me to carry a legal risk." | Anna | PR fix: document preview beside Verify. |
| 13 | "Six weeks is what silence looks like from the outside." | Anna | Stalled marker + one-click nudge (capacity loop); explains the Trustpilot "incompetent partner firm" reviews as a state-visibility failure, not a people failure. Talk-track line. |
| 14 | "Any queue that does not sort by deadline in July." | Anna | Cases table sorts by deadline; deadline strip on Today. |

## Not solved, said honestly

- Betina's Progressionsvorbehalt bill: the prototype does no tax math. She will still
  meet a Nachzahlung she couldn't size; the app can only make sure it isn't a surprise
  in *process* terms (draft shown before approval).
- Anna's capacity: one advisor in the demo. Routing and hiring are the profession's
  problem, not this slice's.
- The €99.99 economics: the design protects the two touches; it cannot change the price.

## Pull quotes used on the slide

- Betina: "I googled 'Lohnsteuerbescheinigung' at eleven at night, got four different
  answers, and gave up." → now she can see what she is looking for (document previews
  and plain-English explainers).
- Anna: "Most of my week isn't tax work. It's chasing page two of something." → now both
  of them can see what is missing (one checklist, both sides, live; flag reasons).


# Betina's walkthrough of the build, 2026-09-06

Asked in character to use the app as it stands, screen by screen, and say what she thought,
money and feelings included. Shown on deck slide 12, "Betina (AI) actually used it", worked in green and to fix in amber. None is done.

| # | What she said | Status |
|---|---|---|
| W1 | "It told me I have to file, why, and that it is routine. I stopped bracing." | Confirms the result screen. |
| W2 | "Four chapters instead of a form. I did About you on the U-Bahn." | Confirms D18. |
| W3 | "It showed me what the Lohnsteuerbescheinigung looks like and where it is." | Confirms the Tip block. |
| W4 | "The card is only held when I send, charged when I approve. I believed it." | Confirms D16, D17. |
| W5 | "Anna is a face with a name, and her question landed on my home." | Confirms the home takeover. |
| F1 | "You matched me with Anna before I told you anything but that I was unemployed. How?" | Open. The match copy on the result screen should say what it is based on, or move later. |
| F2 | "The camera sent my document without showing me the photo." | Open. Prototype camera; a real build previews before sending. |
| F3 | "Anna asked for page 2. I answered in the chat. Where do I attach page 2?" | Open, real gap: no attachment from the thread. Next to build. |
| F4 | "I cannot replace a document after it is sent." | Open, noted in the walkthrough notes, not on the slide: no replace on a sent document. |
| F5 | "Optional receipts that could raise my refund. By how much?" | Open. Needs an example number on the Extras chapter. |
| F6 | "Nobody warned me the benefit can turn my refund into a bill." | Open, known: no tax math in the prototype; Progressionsvorbehalt needs a line at the result and review screens. |
| F7 | "After Filed I wait four to eight weeks with no screen for that wait." | Open. A waiting state after Filed, and the Steuerbescheid step. |

## Open point raised while preparing, 2026-09-06

- Between Start and Send the client can message Anna, so a little advisor time can be
  spent before a card is held. Today her quick replies make that one tap; a real build
  routes pre-send questions to the FAQ and support first and brings Anna in at the send.
  Named on slide 7, moment one. To decide with data: messages per unsent case.
