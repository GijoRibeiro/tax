import { useState } from 'react'

// Slide 8, interactive: the three moments as blocks on one horizontal line, the line
// dashed and moving so the flow reads left to right. Click a block to read that moment.
const MOMENTS = [
  {
    n: 1,
    title: 'Start for free',
    commits: 'Betina commits attention, not money.',
    body:
      'She met Anna one screen earlier, proposed by language, region and load, because a real name before commitment is what the research says moves her. Starting turns that proposal into a reserved place in Anna\'s queue: a slot, not her time. Anna sees a new case marked waiting.',
    risk: 'Anna, a little. Her queue holds a case that may never send, and she answers any question asked before the send. Keeping that small is the platform\'s job: the place is released after two idle weeks (a starting value, not a rule), and questions before the send go to the FAQ and support first.',
  },
  {
    n: 2,
    title: 'Send to Anna',
    commits: 'Betina commits a payment method.',
    body:
      'The card is saved and checked, not charged. One screen, one button, one card entry. Anna starts only after this.',
    risk: 'Anna\'s hours. The saved card covers them: nobody who cannot pay reaches her desk. A client who walks away after the draft is rare; the platform absorbs it, and time-to-approve is the number to watch.',
  },
  {
    n: 3,
    title: 'Approve the return',
    commits: 'Betina commits the money.',
    body:
      'The saved card is charged, Anna files, the invoice arrives by email. Nothing is charged before she has seen her own numbers, which keeps the promise on the pricing screen intact.',
    risk: 'Nobody. Betina pays for a return she has read. Anna is paid for a return that is filed.',
  },
]

export function MomentsFlow() {
  const [active, setActive] = useState(0)
  const moment = MOMENTS[active]

  return (
    <div className="press-mflow">
      <div className="press-mflow__rail" role="tablist" aria-label="The three moments">
        <svg className="press-mflow__line" viewBox="0 0 100 2" preserveAspectRatio="none" aria-hidden="true">
          <line x1="0" y1="1" x2="100" y2="1" />
        </svg>
        {MOMENTS.map((m, i) => (
          <button
            key={m.n}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`press-mflow__step${i === active ? ' press-mflow__step--active' : ''}${i < active ? ' press-mflow__step--done' : ''}`}
            onClick={() => setActive(i)}
          >
            <span className="press-mflow__num">{m.n}</span>
            <span className="press-mflow__title">{m.title}</span>
            <span className="press-mflow__commits">{m.commits}</span>
          </button>
        ))}
      </div>

      <div className="press-mflow__panel" key={active} role="tabpanel">
        <p className="press-mflow__lead">
          <strong>{moment.n}. {moment.title}.</strong> {moment.commits}
        </p>
        <p className="press-mflow__body">{moment.body}</p>
        <p className="press-mflow__risk"><strong>Who carries the risk here:</strong> {moment.risk}</p>
      </div>
    </div>
  )
}
