import { useState } from 'react'

// Slide 9: the five pain points from slide 5 again, now with the screens that answer
// each. Hover or tap a question on the left; the two screens on the right follow.
const PAINS: { q: string; answer: string; screens: { src: string; note: string }[] }[] = [
  {
    q: '"What exactly do you need from me?"',
    answer: 'Four chapters, a short list in each, and every document with a picture and where it comes from.',
    screens: [
      { src: '/screenshots/s2-checklist.png', note: 'One chapter: three things, in plain English.' },
      { src: '/screenshots/s3-item.png', note: 'One document: what it is, what it looks like, where to find it.' },
    ],
  },
  {
    q: '"Is anyone actually there?"',
    answer: 'Real advisors by name on the very first screen, and once she starts, Anna\'s card on the home with one button to write to her.',
    screens: [
      { src: '/screenshots/w1-welcome.png', note: 'The first screen: real advisors, real names, before anything is asked.' },
      { src: '/screenshots/s1-home.png', note: 'The home: Anna, her credential, one message button.' },
    ],
  },
  {
    q: '"What if I get it wrong?"',
    answer: 'Each document explained before the photo, confirmed the moment it arrives, and Anna says if a retake is needed.',
    screens: [
      { src: '/screenshots/s3-item.png', note: 'The tip block: one page, a grid of numbered boxes, where it comes from.' },
      { src: '/screenshots/s4-followups.png', note: 'If something is off, Anna asks on the home. One tap replies.' },
    ],
  },
  {
    q: '"Am I making progress?"',
    answer: 'A sentence that knows where she is, chapters that turn green, and one clear "all set" before the send.',
    screens: [
      { src: '/screenshots/s5-send.png', note: 'All set: five of five, a card, one button.' },
      { src: '/screenshots/s5-momentum.png', note: 'After the send: the plan, and whose turn it is.' },
    ],
  },
  {
    q: '"I don\'t have this document."',
    answer: 'A way forward instead of a dead end: how to get it, ask Anna, or "does this apply to me?"',
    screens: [
      { src: '/screenshots/s3-escape.png', note: 'The sheet, over the document. She stays where she was.' },
      { src: '/screenshots/s9-chat.png', note: 'Her question lands in one thread, answered in Anna\'s words.' },
    ],
  },
]

export function PainAnswers() {
  const [active, setActive] = useState(0)
  const pain = PAINS[active]
  return (
    <div className="press-pains">
      <ol className="press-pains__list" role="tablist" aria-label="The five pain points">
        {PAINS.map((p, i) => (
          <li key={p.q}>
            <button
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`press-pains__q${i === active ? ' press-pains__q--active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
            >
              <span className="press-pains__num">{i + 1}</span>
              <span>{p.q}</span>
            </button>
          </li>
        ))}
        <li className="press-pains__answer" key={`a-${active}`}>{pain.answer}</li>
      </ol>
      <div className="press-pains__screens" key={active} role="tabpanel">
        {pain.screens.map(s => (
          <figure key={s.src + s.note} className="press-pains__screen">
            <img src={s.src} alt="" />
            <figcaption>{s.note}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
