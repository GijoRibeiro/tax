const SUCCESS_CRITERIA = [
  'Primary, hand-off completion rate: % of committed users who press "Send to Anna" within 7 days of signup, read in the beta against the control cohort first. Target: beat the verification-heavy-app band (50–65%, above) and improve baseline by a stated relative lift.',
  'Time-to-first-upload after commitment (momentum proxy; target: median < 24h).',
  "Follow-up rounds per case (advisor efficiency; target: ≤2. Anna's profitability line).",
  'The business pair: starts that reach Approve (the charge) and filed returns per advisor per week (the capacity). The hand-off is worth it only if both move.',
  'Questions to the advisor before the send, per case: the client can write before any card is saved, so each message is unpaid advisor time. Must stay small.',
  'Checklist-screen drop-off and escape-hatch usage rate per item (diagnostic).',
  "Deadline-cohort activation: hand-off completion for users arriving < 21 days before 31 July (Tom's cohort), the growth team's hardest segment.",
  'One number that may not get worse: how often the advisor has to send a document back per case. A faster hand-off must not be bought with blurrier photos and more advisor time.',
  'Completion loop, approval rate after draft sent: % of sent drafts approved without a re-send (trust in the review screen, not just the hand-off).',
  'Completion loop, time-to-filed: median time from "advisor can start" to MARK_FILED (the full-loop equivalent of the hand-off metric above).',
  'Completion loop, filed-before-deadline share: % of cases marked filed ahead of the 31 July deadline chip.',
]

export function Metrics() {
  return (
    <section id="metrics" className="hub-section">
      <h2 className="hub-section__title">Success criteria</h2>

      <h3 className="hub-section__subtitle">Benchmarks used, with sources</h3>
      <ul className="hub-list">
        <li>
          Progressive disclosure &amp; field economy: every additional form field costs ~1–2% conversion (Baymard,
          via{' '}
          <a href="https://zigment.ai/blog/7-ways-to-reduce-fintech-onboarding-drop-off-in-2026" target="_blank" rel="noreferrer">
            Zigment
          </a>
          ); we chunk the checklist by group, mark deductions optional, and ask only for what moves the return.
        </li>
        <li>
          Document-upload UX: offer capture fallbacks (camera or file), save-and-return, inline microcopy at every
          non-obvious point, and explicit receipt acknowledgment (
          <a href="https://www.eleken.co/blog-posts/fintech-onboarding-simplification" target="_blank" rel="noreferrer">
            Eleken
          </a>
          ,{' '}
          <a href="https://userpilot.com/blog/fintech-onboarding/" target="_blank" rel="noreferrer">
            Userpilot
          </a>
          ), all present in S3.
        </li>
        <li>
          Trust at drop-off points: visible humans, credentials, and response-time promises counter onboarding
          abandonment in fintech (
          <a href="https://insart.com/anatomy-of-trust-fintech-ux-onboarding-dropoff/" target="_blank" rel="noreferrer">
            INSART
          </a>
          ), the advisor card is on the first screen for this reason.
        </li>
        <li>
          Benchmarks for targets: fintech onboarding-checklist completion averages ~24.5%, with verification-heavy
          apps reaching 50–65% (
          <a href="https://userpilot.com/blog/onboarding-checklist-completion-rate-benchmarks/" target="_blank" rel="noreferrer">
            Userpilot benchmark report
          </a>
          ,{' '}
          <a href="https://www.digia.tech/post/app-onboarding-rates-statistics/" target="_blank" rel="noreferrer">
            Digia
          </a>
          ); 2026 median fintech activation ~44% (
          <a
            href="https://getperspective.ai/blog/2026-customer-onboarding-benchmark-activation-rates-by-industry"
            target="_blank"
            rel="noreferrer"
          >
            Perspective AI
          </a>
          ). These anchor the success criteria below.
        </li>
      </ul>

      <h3 className="hub-section__subtitle">The numbers</h3>
      <ul className="hub-list">
        {SUCCESS_CRITERIA.map(c => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </section>
  )
}
