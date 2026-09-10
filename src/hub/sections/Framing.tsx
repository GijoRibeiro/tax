const CANDIDATE_SLICES = [
  {
    slice: '"Do I even need to file?"',
    why: 'Strong empathy story, but the advisor is invisible, weak on the marketplace criterion. Mostly a content/funnel problem.',
  },
  {
    slice: 'Commitment moment',
    why: 'Trust + pricing clarity matters, but the design output is landing-page-like: least native-app-specific of the three.',
  },
  {
    slice: 'Hand-off moment (chosen)',
    why: "The only slice where both marketplace actors are live. Native-app strengths (camera capture, push-style follow-ups, glanceable status) genuinely earn their place. Activation is the growth team's stated focus.",
    chosen: true,
  },
]

const DROP_OFF_MODEL = [
  {
    q: '"What exactly do you need from me?"',
    a: 'the request feels unbounded; German document names (Lohnsteuerbescheinigung) are opaque to an English-speaking expat.',
  },
  {
    q: '"Is anyone actually there?"',
    a: 'after paying, silence. No visible human, no response promise → trust decays.',
  },
  {
    q: '"What if I get it wrong?"',
    a: 'first-time filers fear uploading the wrong thing; fear → procrastination.',
  },
  {
    q: '"Am I making progress?"',
    a: 'no visible state machine between "signed up" and "filed."',
  },
  {
    q: '"I don\'t have this document."',
    a: 'the most common dead-end; without a path forward, this single item stalls the entire case.',
  },
]

const SCOPE_CUTS = [
  'Payment rails and identity/KYC mechanics. The money model is real in the reducer (a card is saved at the send and charged at approval), the rail behind it is modelled.',
  'Real tax computation (refund figures are seeded, not calculated from actual tax law).',
  'Advisor onboarding, capacity management, multi-advisor routing (one advisor, one live case).',
  'Push notification plumbing beyond local, in-app nudges (no device push infrastructure).',
  'German-language interface (target user explicitly uses English UI; German doc names appear as artifacts to be explained, not as UI language).',
]

const CONSEQUENCES = [
  'Every German document gets a plain-English explainer + "what it looks like" preview.',
  "Unemployment benefits (Arbeitslosengeld) are a first-class checklist category, not an edge case, it's why they must file.",
  'Deadline is ambient but calm: a date chip and "on track" framing, never a countdown-panic pattern (anxious users freeze; see industry standards below).',
  'The advisor is a named, credentialed human from the first screen, the product\'s core reassurance is "an expert has this."',
]


export function Framing() {
  return (
    <section id="framing" className="hub-section">
      <h2 className="hub-section__title">The problem</h2>

      <h3 className="hub-section__subtitle">The slice we chose</h3>
      <p>
        <strong>The hand-off moment.</strong> The user has already decided to file, understood the price, and
        committed. The return now cannot move until the advisor receives the right documents and answers. This is
        a known activation drop-off: the brief calls it "a common activation drop-off," and it is the moment where
        the product's two-sided promise is most fragile, the consumer thinks "I've signed up and handed my taxes
        to a stranger, now what?", the advisor thinks "I can't start."
      </p>

      <h3 className="hub-section__subtitle">Why this slice and not the others</h3>
      <div className="hub-table-scroll">
        <table className="hub-table">
          <thead>
            <tr>
              <th>Candidate slice</th>
              <th>Why not chosen</th>
            </tr>
          </thead>
          <tbody>
            {CANDIDATE_SLICES.map(row => (
              <tr key={row.slice} className={row.chosen ? 'hub-table__row--chosen' : undefined}>
                <td>{row.slice}</td>
                <td>{row.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="hub-section__subtitle">Why people drop at the hand-off</h3>
      <p>
        Five questions. I had no funnel data, so they come from three places: the brief itself, what customers of
        expert services say in public, and the interviews with the two agents below, Betina and Anna, who pushed
        back on the first list until it was theirs. Each screen in the solution answers one of these directly:
      </p>
      <ol className="hub-list">
        {DROP_OFF_MODEL.map(row => (
          <li key={row.q}>
            <strong>{row.q}</strong>, {row.a}
          </li>
        ))}
      </ol>

      <h3 className="hub-section__subtitle">Deliberately not designed</h3>
      <ul className="hub-list">
        {SCOPE_CUTS.map(cut => (
          <li key={cut}>{cut}</li>
        ))}
      </ul>

      <h3 className="hub-section__subtitle">The target user, and what it meant for the design</h3>
      <p>
        An expat in their 30s, English UI, recently re-employed after a gap, first mandatory filing (they received
        unemployment benefits), navigating a foreign system with high stakes, arriving near the 31 July deadline.
      </p>
      <p>Consequences baked into the design:</p>
      <ul className="hub-list">
        {CONSEQUENCES.map(c => (
          <li key={c}>{c}</li>
        ))}
      </ul>

    </section>
  )
}
