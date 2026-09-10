interface ReferenceEntry {
  product: string
  pattern: string
  verdict: 'borrowed' | 'rejected'
  whereItLives: string
  why: string
}

const REFERENCES: ReferenceEntry[] = [
  {
    product: 'TurboTax',
    pattern: 'Refund-as-hero on review',
    verdict: 'borrowed',
    whereItLives: 'S7 Review, the €1,286 hero number, shown before the line-item breakdown.',
    why: 'Leading with the number reframes the whole checklist slog as "this is what it bought you" at the exact moment approval is asked for.',
  },
  {
    product: 'TurboTax',
    pattern: 'Upsell interstitials at hand-off',
    verdict: 'rejected',
    whereItLives: 'Nowhere, deliberately absent from C2 Price & commitment and every screen after it.',
    why: 'Trust is the scarcest resource right after someone commits and starts sharing documents; an upsell there reads as bait-and-switch and corrodes exactly the trust the hand-off depends on.',
  },
  {
    product: 'N26 / Monzo',
    pattern: 'One-decision-per-screen onboarding',
    verdict: 'borrowed',
    whereItLives: 'W5 Result screen: one screen that says why the return is most likely mandatory, no quiz, no branches, no dead ends.',
    why: 'A single decision per screen keeps a first-time filer unstuck instead of facing a form that looks like it needs a tax textbook.',
  },
  {
    product: 'Uber',
    pattern: 'Live status timeline as anxiety killer',
    verdict: 'borrowed',
    whereItLives: 'S1 Case home, the visible state machine (our 5-stage status), not a spinner or silence.',
    why: 'A named, always-visible state answers the trust question a silent status bar cannot, it converts waiting into legible progress, the same trick a countdown driver map plays.',
  },
  {
    product: 'Airbnb',
    pattern: 'Two-sided status mirroring',
    verdict: 'borrowed',
    whereItLives: "Every consumer screen has an advisor mirror (e.g. S1 Case home → Anna sees \"Waiting on client\"); the advisor queue mirrors it back.",
    why: 'A host seeing what the guest sees (and vice versa) builds trust on both marketplace sides at once, neither party is guessing about the other.',
  },
  {
    product: 'WhatsApp',
    pattern: 'Delivery receipts',
    verdict: 'borrowed',
    whereItLives: 'S3 Item + upload, instant receipt on upload, then the checklist item status pill moves Uploaded → Verified.',
    why: 'A familiar "sent, then seen" mental model reassures someone that a document landed and was looked at, instead of vanishing into a void.',
  },
  {
    product: 'Stripe',
    pattern: 'Pay-on-approval trust sequencing',
    verdict: 'borrowed',
    whereItLives: 'C2 Price & commitment, one price, "pay only when you approve," which fires COMMIT_CASE.',
    why: 'Charging after the customer signs off on the outcome, not before, removes the biggest reason to distrust an unfamiliar service with money.',
  },
  {
    product: 'Duolingo',
    pattern: 'Momentum psychology',
    verdict: 'borrowed',
    whereItLives: 'S5 Momentum, "the ball is out of your court," explicit and dated, no streaks or loss framing.',
    why: 'Forward motion is motivating on its own; we kept the momentum cue and left out streak counters and loss-aversion nudges that would feel wrong next to a tax filing.',
  },
]

export function References() {
  return (
    <section id="references" className="hub-section">
      <h2 className="hub-section__title">References</h2>
      <p>
        None of this is invented from scratch. Seven products we studied for this slice, what we borrowed, what we
        explicitly rejected, and exactly where each judgment call lives in the build.
      </p>

      <div className="hub-references">
        {REFERENCES.map(entry => (
          <article
            key={`${entry.product}-${entry.pattern}`}
            className={
              entry.verdict === 'rejected' ? 'hub-reference-card hub-reference-card--rejected' : 'hub-reference-card'
            }
          >
            <div className="hub-reference-card__head">
              <span className="hub-reference-card__product">{entry.product}</span>
              {entry.verdict === 'rejected' ? (
                <span className="hub-reference-card__tag">Rejected</span>
              ) : (
                <span className="hub-reference-card__tag hub-reference-card__tag--borrowed">Borrowed</span>
              )}
            </div>
            <h3 className="hub-reference-card__pattern">{entry.pattern}</h3>
            <p className="hub-reference-card__where">
              <strong>Where:</strong> {entry.whereItLives}
            </p>
            <p className="hub-reference-card__why">{entry.why}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
