import './landing.css'

// The deliverable is one link. This page is what it opens: who, and four doors.
// The deck and the hub run here; the phone lives in the repo; the advisor desk runs
// here too, with its live sync offline until the relay is on (it is, in the room).
const REPO = 'https://github.com/GijoRibeiro/tax'

const DOORS: { title: string; tag?: string; line: string; to?: string; href?: string; cta: string }[] = [
  { title: 'Presentation', line: "Arrow keys to move, Esc for the grid, N for notes. It won't make much sense without me presenting it.", to: '/press', cta: 'Open the deck' },
  { title: 'iOS native app', line: "SwiftUI, in the repo under ios/. I'll gladly build it and demo it in real time.", href: REPO, cta: 'Open on GitHub' },
  { title: 'Advisor dashboard', tag: 'Web, work in progress', line: 'The other side of the same case: the queue, the checks, the follow-ups.', to: '/advisor', cta: 'Open the dashboard' },
  { title: 'Specs', line: 'How it was framed and built: personas, flow map, design system, validation, the AI log.', to: '/hub', cta: 'Open the specs' },
]

export function Landing() {
  return (
    <main className="landing">
      <header className="landing__head">
        <p className="landing__eyebrow">Senior Product Designer (Builder) · case study</p>
        <h1 className="landing__title">
          <a className="landing__name" href="https://gijoribeiro.com" target="_blank" rel="noreferrer">
            <span className="landing__at">@</span>Gijo Ribeiro
            <svg className="landing__name-arrow" viewBox="0 0 24 24" width="0.5em" height="0.5em" aria-hidden="true" focusable="false">
              <path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="landing__sr">, personal site</span>
          </a>
        </h1>
      </header>

      <ul className="landing__doors">
        {DOORS.map((d, i) => (
          <li key={d.title} className="landing__door" style={{ animationDelay: `${120 + i * 70}ms` }}>
            <a href={d.to ?? d.href} className="landing__door-link" target="_blank" rel="noreferrer">
              <span className="landing__door-title">{d.title}</span>
              {d.tag && <span className="landing__door-tag">{d.tag}</span>}
              <span className="landing__door-line">{d.line}</span>
              <span className="landing__door-cta">{d.cta} →</span>
            </a>
          </li>
        ))}
      </ul>

      <footer className="landing__foot">
        <p>Some features need the agent running locally.</p>
        <a className="landing__download" href={`${REPO}/archive/refs/heads/main.zip`}>
          Download the whole project (zip)
        </a>
      </footer>
    </main>
  )
}
