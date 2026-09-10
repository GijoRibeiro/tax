const ACCELERATED = [
  'Case-study analysis and drop-off modeling.',
  'Industry benchmark research.',
  'Scaffolding tokens/components.',
  'Generating checklist copy variants.',
]

const OVERRIDES = [
  '2026-09-06, a consistency catch by the designer, not the agent: the phone showed "Matched for you" one screen before Start while the money model said matched at Start. The model now says proposed at the result, reserved at Start; the result screen, pricing step, welcome quote, slide 7 and the flowchart were brought into line. Same day: every type size in the Swift views was a number; they are now token roles (brandFont(.body)), the lint fails on a number, and the hub can move them live.',
  'The generic recommendation was a static advisor mock; we chose a functional two-sided prototype because the marketplace criterion is the case study\'s center of gravity.',
  'Rejected countdown-timer urgency patterns (a common AI/growth suggestion) for the deadline: anxiety is the drop-off cause here, not a lever.',
  'The first follow-up design was a free thread on both sides. On Anna\'s side it became structured tasks with templates and reason chips, so 60 cases stay tractable. On Betina\'s side they land in one thread tagged with the document, with a Reply chip, so it still feels like a person.',
  'v1 shipped the consumer app as a web page in a CSS phone frame. The brief says native twice. We rebuilt it in SwiftUI, and kept the reducer in TypeScript so the tested business logic moved server-side instead of being rewritten.',
  'Subagent reviews caught real defects the plan itself mandated, a state-corrupting reducer edge on the relay, a StrictMode socket race, a resource key xcodegen silently ignores. The plan is an argument, not an oracle.',
  'A reviewer caught two problems in the new advisor workspace store in one pass: a stale localStorage key left over from an earlier single-case draft, and the Today dashboard\'s four stat tiles silently overlapping instead of partitioning the caseload (a case can count toward both "open" and "waiting" at once). The key was a straight fix. The overlap was ruled to stay, the four tiles are lenses on one caseload, not a partition, and documented loudly in workloadCounts\' own comment instead of forcing a clean split that would misrepresent the numbers.',
  'An implementer, chasing a failing fixture, filtered the relay-live demo case out of the Today "At risk" strip to dodge a test collision. Overruled: data doesn\'t bend to make a test pass. The real fix was better row copy and a fixed test date, not hiding a real at-risk case from the one view built to surface it.',
  'The first dashboard AI produced for the case home stacked a lime hero, a document strip and two stat tiles. Cut back three times by hand: timeline only, then a state-aware sentence with four chapter tiles; the copy went from "Anna is ready when you are" to a greeting that asks for the next chapter. The tiles that were removed left the code the same day.',
  'Cream option tiles on the pricing and notification screens read as buttons. Both became plain rows and the lesson became catalog rule 6, "a cream card means tap me", with a check to run on every screen.',
  'AI had wired every upload straight to the advisor. That is not a hand-off, it is a drip. "Send to Anna" is now an explicit reducer action with tests; Anna\'s queue shows Ready to work only after the client presses it, and her chip says "Filled, not sent yet" before.',
  'The money and matching model was never designed; every screen implied an advisor already assigned and payment "later". The designer asked where the marketplace thinking was. Now: an advisor proposed at the result and reserved at Start (a slot, not time), card saved at Send (the hand-off), charged at Approve, with release and abandonment rules named. The welcome screen stopped implying "here is yours" and says "there are real advisors here".',
  'The advisor workspace was rebuilt on a small desk kit rather than restyled in place. The designer brought a reference dashboard for its structure (cream header band, light title, a row of numbers, hairline cards) and asked for something new that still speaks Taxfix; AI\'s first instinct was to copy the reference\'s palette and orange accent, which was rejected. The desk keeps Taxfix\'s cream, lime and dark green, borrows only the bones, and takes the state-aware sentence from the phone.',
  'A review sweep found the relay still serving the previous day\'s reducer, so the new send step silently did nothing in captures. Restart-after-reducer-change is now written down.',
  'A worker left a probable dead-route bug unfixed, reasoning "no test required it": a relative Link nested two levels under a page route (e.g. Inbox\'s "Open case") would resolve into a doubled path like /advisor/inbox/cases/:id instead of /advisor/cases/:id. A follow-up audit went looking anyway and found exactly that, twice over. Inbox\'s and Clients\' "Open case" links both needed an explicit ../ step-up. "No test caught it" was never evidence nothing was broken.',
]

const BUILD_STAGES = [
  'Brief-mining, the case-study PDF read like a spec; constraints ("native" twice, both actors end in "filed", "focus beats breadth") drove every decision below.',
  'v1: web prototype, the hand-off slice shipped as a React web app in a CSS phone frame, to prove the reducer and the sync model.',
  'Judgment call, a web page in a rounded rectangle doesn\'t clear "native execution" for a builder role. Rebuilt in SwiftUI rather than defended.',
  'Spec then plan, classification, clarifying questions, a written spec, then a 14-task implementation plan with TDD steps, before any rebuild code.',
  'Subagent build loop, fresh implementer per task, independent reviewer per task re-running tests itself, fix rounds with scoped re-reviews.',
  'Persona reviews. Betina and Anna, briefed in character, reviewed the running app and reprioritized the polish backlog.',
  'Stakeholder interviews, the same two personas rebuilt as composites from public sources (reviews, official guidance, profession data), interviewed in character, findings mapped to decisions; live at /stakeholders, answered from the Claude Code session.',
]

const PERSONA_REVIEW_FINDINGS: string[] = [
  'Added a liability + price recap to the approve screen, who\'s liable if the return is wrong, and what you\'re being charged, before the button, not after.',
  '"What Anna checked" on the client review screen was generated from what the advisor actually verified, instead of a fixed claim made in her name. Later cut from the review screen when it was reduced to the numbers, the price and the liability line; the advisor side still records what was verified.',
  'A document preview now sits beside Verify, so the advisor is never asked to certify a document she has never seen.',
  'Flagging a document dropped from three touches and a free-text box to one-click reason chips (blurry, wrong year, page missing, cropped).',
  '"Ask Anna" is now a front door on the client home screen, not something you only find by first admitting you can\'t find a document.',
  'The advisor can request additional documents/checklist items per case, instead of being stuck with a fixed four-item list.',
]

export function AiLog() {
  return (
    <section id="ai-log" className="hub-section">
      <h2 className="hub-section__title">AI in the process</h2>
      <p>
        The honest log: where the agents carried the work, where my judgment overrode them, and the two agents that
        stood in for users. Every correction worth telling is here.
      </p>

      <h3 className="hub-section__subtitle">Accelerated</h3>
      <ul className="hub-list">
        {ACCELERATED.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h3 className="hub-section__subtitle">Where judgment overrode it</h3>
      <ul className="hub-list">
        {OVERRIDES.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h3 className="hub-section__subtitle">Persona-agent reviews</h3>
      <p>
        The two persona agents, Betina and Anna, were briefed on the case PDF, the spec personas, and real screenshots
        of the running app, then reviewed it in character: walking their own journey, flagging hesitation points,
        and asking for what&apos;s missing. Findings were ranked and fed into the final polish round.
      </p>
      <p className="hub-persona-card__quote">
        &quot;Warmth is not the same thing as trust, and I can tell the difference, this app talks to me
        beautifully and then asks for my passport, my IBAN and my signature without ever telling me who&apos;s
        accountable or what I&apos;m paying.&quot;
      </p>
      <p className="hub-quote-by">Betina, persona agent</p>
      <p className="hub-persona-card__quote">
        &quot;…the advisor screen has a button called Verify next to a document it never shows me, and that is not
        a missing feature, that is the product asking me to take a legal risk on its behalf.&quot;
      </p>
      <p className="hub-quote-by">Anna, persona agent</p>
      <p>
        <strong>What we built in response:</strong>
      </p>
      <ul className="hub-list">
        {PERSONA_REVIEW_FINDINGS.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="hub-callout">
        Parked on the roadmap: IBAN checksum validation at entry, the Vollmacht signature step, invoicing, and
        queue search/aging at practice scale.
      </p>
      <p>
        Full reviews: <code>docs/superpowers/reviews/persona-review-amara.md</code> and{' '}
        <code>docs/superpowers/reviews/persona-review-anna.md</code>.
      </p>


      <h3 className="hub-section__subtitle">How this was built</h3>
      <ol className="hub-list">
        {BUILD_STAGES.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      <p>Full process narrative: <code>docs/PROCESS.md</code> in the repo.</p>
    </section>
  )
}
