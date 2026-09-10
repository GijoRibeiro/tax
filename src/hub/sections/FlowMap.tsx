interface FlowNode {
  id: string
  screenshot: string
  title: string
  annotation: string
  advisorMirror: string
}

interface FlowPhase {
  heading: string
  nodes: FlowNode[]
}

const PHASES: FlowPhase[] = [
  {
    heading: 'Onboarding runway',
    nodes: [
      {
        id: 'w1-welcome',
        screenshot: '/screenshots/w1-welcome.png',
        title: 'Welcome',
        annotation:
          'Answers: "who is this for?" and "is anyone actually there?": the promise, then a real advisor by name. You see who would take your case before you start.',
        advisorMirror: "Anna sees: nothing, the case doesn't exist yet",
      },
      {
        id: 'w2-questions',
        screenshot: '/screenshots/w2-questions.png',
        title: 'A few questions',
        annotation:
          'Where Taxfix\'s own questions about the year would run: job status, benefits. The prototype marks the step and skips it, because the result screen depends on the answers and a panel should see that.',
        advisorMirror: 'Anna sees: nothing yet',
      },
      {
        id: 'w5-result',
        screenshot: '/screenshots/w5-result.png',
        title: 'Result',
        annotation:
          'Answers: "do I even need to file?" and "am I in trouble?" in one screen: the rules that make an expat\'s return mandatory, then who would take the case and why.',
        advisorMirror: 'Anna sees: nothing yet',
      },
      {
        id: 'n1-notifications',
        screenshot: '/screenshots/n1-notifications.png',
        title: 'Permission, explained',
        annotation:
          'Answers: "why would I let you notify me?" before iOS asks. Their own illustration, copy only, no list.',
        advisorMirror: 'Anna sees: nothing yet',
      },
      {
        id: 'c2-pricing',
        screenshot: '/screenshots/c2-pricing.png',
        title: 'Price & commitment',
        annotation:
          'Answers: "what am I committing to?": nothing today. Three moments say when money moves; the price sits where it is charged. "Start for free" fires COMMIT_CASE.',
        advisorMirror: 'Anna sees: new case lands in the queue, live',
      },
    ],
  },
  {
    heading: 'The hand-off (the deep slice)',
    nodes: [
      {
        id: 's1-home',
        screenshot: '/screenshots/s1-home.png',
        title: 'Case home',
        annotation:
          'Answers: "what do I do now?": a sentence that knows where she is, four chapters to fill, Anna one tap away. 31 July in the eyebrow, calm.',
        advisorMirror: 'Anna sees: Waiting on client',
      },
      {
        id: 's2-checklist',
        screenshot: '/screenshots/s2-checklist.png',
        title: 'Checklist',
        annotation: 'One chapter at a time: "About you" is three documents in plain English. A chapter tap lands on its first open document; Back shows this list.',
        advisorMirror: 'Anna sees: 0 of 5 in, waiting on client',
      },
      {
        id: 's3-item',
        screenshot: '/screenshots/s3-item.png',
        title: 'Item + upload',
        annotation:
          'Answers: "what if I get it wrong?": what it is, what it looks like, where to find it, in one Tip. After it is in, one tap to the next document.',
        advisorMirror: 'Anna sees: document arrives for review',
      },
      {
        id: 's3-escape',
        screenshot: '/screenshots/s3-escape.png',
        title: '"I don\'t have this"',
        annotation:
          'The #1 stall gets a forward path: sourcing tip, ask Anna, or "does this apply to me?"',
        advisorMirror: 'Anna sees: client question, answerable in one click',
      },
      {
        id: 's4-followups',
        screenshot: '/screenshots/s4-followups.png',
        title: 'Anna asks',
        annotation: 'Anna\'s question takes over the home: the headline says she asked, her card shows what, the button turns lime. Answered in one tagged thread.',
        advisorMirror: 'Anna sees: templated composer, ≤2-touch goal',
      },
      {
        id: 's5-send',
        screenshot: '/screenshots/s5-send.png',
        title: 'Send to Anna',
        annotation:
          'Filling is not sending. All four chapters green, "All set", a card saved, one button. This tap is the hand-off.',
        advisorMirror: 'Anna sees: "Filled, not sent yet"',
      },
      {
        id: 's5-momentum',
        screenshot: '/screenshots/s5-momentum.png',
        title: 'Sent',
        annotation: '"That\'s everything, Betina. Anna has it from here." The chapters step aside and the plan takes over. Anna\'s queue flips to Ready to work.',
        advisorMirror: 'Anna sees: Ready to work',
      },
    ],
  },
  {
    heading: 'Completion loop',
    nodes: [
      {
        id: 's6-preparing',
        screenshot: '/screenshots/s6-preparing.png',
        title: 'Preparing',
        annotation:
          'Answers: "is something happening?", a quiet reassurance state while Anna works, no action required.',
        advisorMirror: 'Anna sees: Preparing',
      },
      {
        id: 's7-review',
        screenshot: '/screenshots/s7-review.png',
        title: 'Review & approve',
        annotation:
          'Answers: "can I trust this before it\'s filed?", human-readable summary, estimated refund, informed consent, not a rubber stamp.',
        advisorMirror: 'Anna sees: Awaiting client approval',
      },
      {
        id: 's8-filed',
        screenshot: '/screenshots/s8-filed.png',
        title: 'Filed',
        annotation:
          'Calm celebration, "Filed with Finanzamt Berlin on [date]," what happens next, refund timing.',
        advisorMirror: 'Anna sees: Filed',
      },
    ],
  },
]

const ALL_NODE_IDS: string[] = PHASES.flatMap(phase => phase.nodes.map(node => node.id))

export function FlowMap() {
  return (
    <section id="flow-map" className="hub-section">
      <h2 className="hub-section__title">The flow</h2>
      <p>
        The full journey, native app on one side and both marketplace seats visible at every step. Each node shows
        a real screenshot of the built app, a usability annotation, and an "Anna sees" mirror chip showing the
        advisor-side state at that step.
      </p>

      <div className="hub-flow-map">
        {PHASES.map(phase => (
          <div className="hub-flow-map__phase" key={phase.heading}>
            <h3 className="hub-flow-map__phase-heading">{phase.heading}</h3>
            <ol className="hub-flow-map__rail">
              {phase.nodes.map(node => (
                <li className="hub-flow-node" key={node.id}>
                  <span className="hub-flow-node__index">{ALL_NODE_IDS.indexOf(node.id) + 1}</span>
                  <img className="hub-flow-node__screenshot" src={node.screenshot} alt={`${node.title} screen`} />
                  <h4 className="hub-flow-node__title">{node.title}</h4>
                  <p className="hub-flow-node__annotation">{node.annotation}</p>
                  <span className="hub-flow-node__mirror">{node.advisorMirror}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}

        <div className="hub-flow-map__advisor-rail">
          <img
            className="hub-flow-map__advisor-screenshot"
            src="/screenshots/a2-case.png"
            alt="Advisor case detail screen"
          />
          <p className="hub-flow-map__advisor-caption">
            A2. Case detail, the advisor's single seat mirrors every hand-off node above: same checklist,
            verify/flag controls, templated follow-up composer, plus the draft/approve/file controls for the
            completion loop.
          </p>

          <ul className="hub-flow-map__advisor-strip">
            <li>
              <img src="/screenshots/a1-today.png" alt="Advisor Today dashboard screen" />
              <span>A1. Today, needs-you-now, at risk, activity</span>
            </li>
            <li>
              <img src="/screenshots/a3-cases.png" alt="Advisor Cases table screen" />
              <span>A3. Cases, the full ~20-case table</span>
            </li>
            <li>
              <img src="/screenshots/a4-inbox.png" alt="Advisor Inbox screen" />
              <span>A4. Inbox, needs-reply / waiting-on-client</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
