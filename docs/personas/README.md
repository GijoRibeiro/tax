# Personas you can talk to

Two composite people, Betina Bugnotto (filer) and Anna Weber (advisor), written down well
enough that an agent can answer *as* them, consistently, from real ground. They exist so
the design can be interrogated by the two sides of the marketplace it serves, and so the
panel can watch that happen.

## What they are, and are not

- **Composites, not real people.** Every fact they cite is sourced (see each file's
  "What I know" section). The biography that holds the facts together is invented for
  coherence, and each file says which parts. No real advisor or filer is impersonated;
  the portraits are free-use placeholder photos.
- **Grounded in complaints.** Their memories are the recurring things real filers and
  real advisors say in public: Trustpilot reviews of the Expert Service, Taxfix's own
  guidance pages, the German advisor profession's staffing data, the fee schedule, and
  advisor-side accounts of client behaviour.
- **Honest under questioning.** If asked "is that real?", they say which part is sourced
  and which is synthesised. They never invent a source.

## How an interview is run

1. Read the persona file top to bottom. Voice and "what I don't know" matter as much as
   the facts.
2. Ask one question at a time. Answer in first person, 2–5 sentences, in the persona's
   register. Use a concrete number, document name, or date when the file supports it;
   otherwise stay vague the way a real person would.
3. Don't flatter the product. Both personas were briefed to be exacting.
4. Log it. Live questions arrive through `/stakeholders` (or are put to Claude Code
   directly); answers go back with `node scripts/stakeholders.mjs reply <persona> "…"`.
   Findings that change a decision go into `interview-findings.md` with the quote and
   the decision id.

```
node scripts/stakeholders.mjs wait            # block until either persona is asked something
node scripts/stakeholders.mjs reply anna "…"  # answer in character
node scripts/stakeholders.mjs show            # read both transcripts
node scripts/stakeholders.mjs reset           # back to the seeded discovery interviews
```

## How a finding becomes a decision

A finding is only worth keeping if it changes or confirms something specific. The
hub's decision log (`src/hub/sections/Framing.tsx`, D1–D15) and named scope cuts are the
targets. `interview-findings.md` maps quote → decision. Anything the personas ask for
that the slice does not cover goes to `docs/INTERVIEW-PREP.md` as "with more time".

## Naming

The filer persona was called **Amara Okafor** until 2026-09-05 and is now **Betina
Bugnotto**. The internal id stayed `amara` everywhere (persona id, relay-backed case id,
`/advisor/cases/amara`, seed keys, CLI argument) to avoid churn; older specs, plans and
persona reviews under `docs/superpowers/` still use the old name.

## Files

- `betina-bugnotto.md`, the filer.
- `anna-weber.md`, the advisor.
- `interview-findings.md`, what the discovery interviews changed.
- `../../server/stakeholders.seed.json`, the seeded transcripts shown in `/stakeholders`.

## Credits

Both portraits were supplied by the author (`public/personas/betina.jpg`,
`public/personas/anna.jpg`). Replace the files to swap them.
