const VALIDATION_STEPS = [
  {
    title: 'Beta with a control group',
    body:
      'The app exists, so the honest test is live: the new hand-off behind a flag for a capped slice of real English-UI first-time sign-ups, the current flow as control, a kill switch, and long enough to read a real difference at Taxfix\'s volumes; in the shoulder weeks, not the July peak, because advisor capacity is scarce then. Every number below is read beta against control.',
  },
  {
    title: 'Agents connected to real usage',
    body:
      'The same approach works in real life: agents that learn from what clients and advisors do every day give a first read the same day and order what to test next. They never replace the people; their walkthrough of the current build is on the deck.',
  },
  {
    title: 'Comprehension test (5 users, moderated, remote)',
    body:
      'English-speaking expats in Germany who haven\'t filed. Task: "share what your advisor needs." Measure: can they name what\'s left to do and who acts next, at every step? (The two questions whose ambiguity kills activation.)',
  },
  {
    title: '"I don\'t have this" fake-door analysis',
    body:
      'Instrument the escape hatch in a beta cohort; classify reasons. This tells us which documents need better sourcing guidance vs. which shouldn\'t be required at all.',
  },
  {
    title: 'Advisor-side interviews (3–5 advisors)',
    body:
      "Validate follow-up templates against real follow-up emails; count how many of their last 20 follow-ups the templates could have expressed.",
  },
  {
    title: 'Copy stress test',
    body: 'The German-document explainers reviewed by a tax advisor for correctness, friendly must never become wrong.',
  },
]

export function Validation() {
  return (
    <section id="validation" className="hub-section">
      <h2 className="hub-section__title">Validation</h2>
      <ol className="hub-list">
        {VALIDATION_STEPS.map(step => (
          <li key={step.title}>
            <strong>{step.title}:</strong> {step.body}
          </li>
        ))}
      </ol>
    </section>
  )
}
