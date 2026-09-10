import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export { Icon } from './icons'

// Anna's desk kit. The phone is Betina's: black headings, lime, 24pt corners. The desk is
// where the work happens, so it is the same family in a quieter voice: a cream header band
// with a light title and a row of numbers, a white body, white cards with a hairline, one
// lime action per page. Everything here reads tokens from src/styles/tokens.css.

/** The cream band that opens every desk page, and the slim bar it folds into on scroll. */
export function PageHeader({
  eyebrow, title, description, actions, stats,
}: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; stats?: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const [collapsed, setCollapsed] = useState(false)

  // Collapse once the band has scrolled out under the topbar. Driven by the scroll
  // position of the desk's own scroll container, so it is deterministic.
  useEffect(() => {
    const el = ref.current
    const root = el?.closest('.tf-advisor-main') as HTMLElement | null
    if (!el || !root) return
    let frame = 0
    const update = () => {
      frame = 0
      const h = el.offsetHeight
      setCollapsed(h > 0 && root.scrollTop > h - 8)
    }
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    root.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => { root.removeEventListener('scroll', onScroll); if (frame) window.cancelAnimationFrame(frame) }
  }, [])

  return (
    <>
      <header ref={ref} className="dk-header">
        {eyebrow && <p className="dk-header__eyebrow">{eyebrow}</p>}
        <div className="dk-header__row">
          <div className="dk-header__text">
            <h1 className="dk-header__title">{title}</h1>
            {description && <p className="dk-header__description">{description}</p>}
          </div>
          {actions && <div className="dk-header__actions">{actions}</div>}
        </div>
        {stats && <div className="dk-header__stats">{stats}</div>}
      </header>
      {collapsed && (
        <div className="dk-condensed dk-condensed--on">
          <span className="dk-condensed__title">{title}</span>
        </div>
      )}
    </>
  )
}

/** The white body under the band. Sections inside fade in with a short stagger. */
export function PageBody({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div className={`dk-body${wide ? ' dk-body--wide' : ''}`}>{children}</div>
}

/** Two columns: the work on the left, context on the right. Collapses under 980px. */
export function TwoColumn({ children }: { children: ReactNode }) {
  return <div className="dk-columns">{children}</div>
}

/** A white card with a hairline. `padded={false}` for tables and lists that bleed to the edge. */
export function SurfaceCard({
  title, description, actions, children, padded = true, tone = 'surface', className = '',
}: {
  title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode
  padded?: boolean; tone?: 'surface' | 'accent'; className?: string
}) {
  return (
    <section className={`dk-card dk-card--${tone}${padded ? '' : ' dk-card--flush'} ${className}`.trim()}>
      {(title || actions) && (
        <header className="dk-card__header">
          <div>
            {title && <h2 className="dk-card__title">{title}</h2>}
            {description && <p className="dk-card__description">{description}</p>}
          </div>
          {actions && <div className="dk-card__actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

/** One number in the header band. Compose in a StatRow; dividers are drawn by CSS. */
export function Stat({ label, value, hint, tone = 'default' }: { label: string; value: ReactNode; hint?: string; tone?: 'default' | 'success' | 'warning' }) {
  return (
    <div className={`dk-stat dk-stat--${tone}`}>
      <p className="dk-stat__value">{value}</p>
      <p className="dk-stat__label">{label}</p>
      {hint && <p className="dk-stat__hint">{hint}</p>}
    </div>
  )
}
export function StatRow({ children }: { children: ReactNode }) {
  return <div className="dk-stat-row">{children}</div>
}

/** A client without a photo: initials on one of the pastel discs, chosen from the name. */
export function LetterAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase()
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const palette = hash % 4
  return (
    <span className={`dk-avatar dk-avatar--${palette}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }} aria-hidden="true">
      {initials}
    </span>
  )
}

/** A small label above a run of rows or fields. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="dk-section-label">{children}</p>
}

/** A quiet empty row inside a card. */
export function Quiet({ children }: { children: ReactNode }) {
  return <p className="dk-quiet">{children}</p>
}
