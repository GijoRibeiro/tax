# Interview prep — living list

Things to have ready for the panel beyond what the deck shows. Add to it as they come
up; each item should be sayable in under a minute and point at something real in the
repo where it can.

## 1. What would be different with more time on the challenge

1. **An ops interface for the Expert Service team.** The brief's growth paragraph
   describes a team converting first-time filers "at the moments that matter". Today
   only Anna sees case state; the growth team has no seat. With more time, a small
   back-office alongside the advisor workspace:
   - **Customer list with stage.** Every filer with where they are in the funnel:
     liability check → committed → hand-off (items sent / remaining) → preparing →
     draft sent → approved → filed, plus days-in-stage and days-to-deadline.
   - **Rules, not chat.** Declarative re-engagement rules on that state, e.g. committed
     but no upload in 48h; one item missing for more than 5 days; draft sent and not
     approved in 3 days; arriving fewer than 21 days before 31 July. Each rule names the
     channel (push, email) and a calm copy template. Same principle as the advisor side:
     bounded, templated, no countdown panic.
   - **Scheduled runs (crons) and a run log.** Rules evaluate on a schedule, the log
     shows who was nudged, by which rule, and what happened next, so the growth team
     can see which nudge actually moves a case. This is where the hub's success
     metrics (hand-off completion, time-to-first-upload, deadline cohort) get their
     instrumentation.
   - **Why it fits the architecture.** Rules read the same reducer state the relay
     already broadcasts; the advisor's stalled-case nudge (`nudge.ts`) is the manual
     version of one such rule. Nothing new in Swift.
   - **Why it was not built.** Focus beats breadth; the brief asks for consumer moments
     on a native app, and the ops seat is a third actor the brief never names. Named
     here as the first thing to add, not as a gap in the slice.

2. **Mine the advisor chat history for the most-asked questions.** Every follow-up and
   client question that flows through the advisor workspace is structured data. With
   more time: process that history (per advisor, per document type, per stage), rank
   the questions clients ask most, and act on them in three places:
   - **Upstream into the checklist.** If "which page of the Lohnsteuerbescheinigung?"
     is asked 400 times, the item explainer and "what it looks like" preview answer it
     before it is asked. The question count is the prioritisation for copy work.
   - **Into the FAQ and the liability check.** The app's expat FAQ stops being a
     designer's guess and becomes the real top-N, refreshed from data.
   - **Into Anna's templates.** The most-sent advisor follow-ups become suggested
     templates automatically, ranked by how often they close a case without a second
     touch. That is the ≤2-touch metric feeding the tool that protects it.
   - **Why it fits.** Follow-ups are already typed actions in the one reducer, so the
     history is queryable without a new data model. Privacy: aggregate per question
     shape, never per client, and keep it out of anything client-facing until an
     advisor has approved the wording.

## 2. Assumptions worth saying out loud

1. **Most expats will need to file.** Assumption: the typical expat employee in Germany
   is far more likely than the average resident to hit a Pflichtveranlagung trigger:
   arrived mid-year (income before residency must be declared for the rate), had a
   period on Arbeitslosengeld or Elterngeld (Progressionsvorbehalt over €410), more
   than one employer in a year, tax class combinations after marriage, or foreign
   income. So the "do I even need to file?" moment is, for this audience, almost always
   "yes". Design consequence to try: say it before the questions start, in the welcome
   copy, e.g. "Expat in Germany? You most likely have to file. Three questions and
   we'll confirm it." That turns the liability check from a gate into a confirmation,
   which is calmer for an anxious first-time filer and shorter to get through. Keep
   the check itself, because "most likely" is not "certainly" and the result screen
   is where the specific rule (the €410 line) earns trust. Validate with the fake-door
   or a copy test before shipping the stronger wording.
   **Done 2026-09-05:** the Welcome button now goes straight to the result screen ("Yes,
   you most likely need to file", with the triggers named); the three questions stay in
   code behind the launch hooks in case a curveball asks for them.
