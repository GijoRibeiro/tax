import { useEffect, useState } from 'react'
import { Framing } from './sections/Framing'
import { Personas } from './sections/Personas'
import { FlowMap } from './sections/FlowMap'
import { Architecture } from './sections/Architecture'
import { DesignSystem } from './sections/DesignSystem'
import { References } from './sections/References'
import { EdgeCases } from './sections/EdgeCases'
import { Validation } from './sections/Validation'
import { Metrics } from './sections/Metrics'
import { AiLog } from './sections/AiLog'
import { Assumptions } from './sections/Assumptions'
import './hub.css'

const NAV_LINKS = [
  { href: '#framing', label: 'The problem' },
  { href: '#personas', label: 'The people and the agents' },
  { href: '#flow-map', label: 'The flow' },
  { href: '#architecture', label: 'How it is built' },
  { href: '#design-system', label: 'Design system' },
  { href: '#references', label: 'References' },
  { href: '#edge-cases', label: 'Edge cases' },
  { href: '#validation', label: 'Validation' },
  { href: '#metrics', label: 'Success criteria' },
  { href: '#ai-log', label: 'AI in the process' },
  { href: '#assumptions', label: 'Assumptions' },
]

export function Hub() {
  // Scroll spy: the menu marks the section under the reader. Observed on the section
  // elements themselves; jsdom has no IntersectionObserver, so it degrades to no mark.
  const [activeId, setActiveId] = useState<string>('framing')
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const sections = NAV_LINKS.map(l => document.getElementById(l.href.slice(1))).filter((el): el is HTMLElement => !!el)
    const visible = new Map<string, number>()
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top)
        else visible.delete(e.target.id)
      }
      if (visible.size === 0) return
      // The topmost visible section wins.
      const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0]
      setActiveId(top)
    }, { rootMargin: '-15% 0px -60% 0px', threshold: [0, 0.1, 0.5] })
    sections.forEach(s => io.observe(s))
    return () => io.disconnect()
  }, [])

  return (
    <div className="hub">
      <aside className="hub-nav">
        <div className="hub-nav__brand">
          <p className="hub-nav__eyebrow">Taxfix Expert Service</p>
          <h1 className="hub-nav__title">The Hand-off Moment</h1>
          <p className="hub-nav__subtitle">Senior Product Designer (Builder) case study</p>
        </div>

        <nav aria-label="Sections">
          <ul className="hub-nav__list">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <a href={link.href} className={activeId === link.href.slice(1) ? 'is-active' : undefined} aria-current={activeId === link.href.slice(1) ? 'true' : undefined}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hub-nav__launch">
          <a className="hub-launch-button hub-launch-button--primary" href="/press" target="_blank" rel="noreferrer">
            Open the deck
          </a>
          <a className="hub-launch-button hub-launch-button--secondary" href="/advisor" target="_blank" rel="noreferrer">
            Advisor dashboard, web, in progress
          </a>
        </div>
      </aside>

      <main className="hub-main">
        <Framing />
        <Personas />
        <FlowMap />
        <Architecture />
        <DesignSystem />
        <References />
        <EdgeCases />
        <Validation />
        <Metrics />
        <AiLog />
        <Assumptions />
      </main>
    </div>
  )
}
