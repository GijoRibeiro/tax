import { useEffect, useRef, useState } from 'react'
import { SLIDES } from './slides'
import './press.css'

// The running order skips parked slides; those stay reachable from the
// overview grid (Esc) until the presenter decides where they go.
export const RUN_ORDER = SLIDES.filter(s => !s.parked)

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Press() {
  // `index` addresses SLIDES (so parked slides can be shown); arrows and dots move through RUN_ORDER.
  const [index, setIndex] = useState(0)
  const [overview, setOverview] = useState(false)
  const [presenter, setPresenter] = useState(false)
  // The clock starts when the deck loads (a refresh resets it) and shows in the corner
  // of every slide, so the talk can be paced without opening the notes.
  const [startedAt] = useState<number>(() => Date.now())
  const [now, setNow] = useState(() => Date.now())

  // One step forward or back through the running order. Arrow keys, the phone bar and a
  // swipe all call these; a parked slide stays put (Esc leaves it).
  const step = (dir: 1 | -1) =>
    setIndex(i => {
      const run = RUN_ORDER.indexOf(SLIDES[i])
      if (run === -1) return i
      return SLIDES.indexOf(RUN_ORDER[Math.min(Math.max(run + dir, 0), RUN_ORDER.length - 1)])
    })

  // Swipe on touch screens: a mostly horizontal move of 48px or more turns the page.
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY } }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current; touch.current = null
    if (!start || overview) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x, dy = t.clientY - start.y
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    step(dx < 0 ? 1 : -1)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOverview(o => !o)
        return
      }
      // Toggles and openers ignore key auto-repeat: a held key must not flip notes
      // back and forth or open the interviews once per repeat tick.
      if (e.key === 'n' || e.key === 'N') {
        if (e.repeat) return
        setPresenter(p => !p)
        return
      }
      if (e.key === 's' || e.key === 'S') {
        if (e.repeat) return
        // Named target: a second press focuses the same tab instead of opening another.
        window.open('/stakeholders', 'taxfix-stakeholders')
        return
      }
      if (overview) return
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        step(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        step(-1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [overview])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (overview) {
    return (
      <div className="press press--overview">
        <div className="press-overview">
          <p className="press-overview__hint">
            Esc to return · click a slide to jump · N toggles presenter notes · S opens the stakeholder interviews
          </p>
          <div className="press-overview__grid">
            {SLIDES.map((slide, i) => (
              <button
                type="button"
                key={slide.id}
                className={slide.parked ? 'press-overview__item press-overview__item--parked' : 'press-overview__item'}
                onClick={() => {
                  setIndex(i)
                  setOverview(false)
                }}
              >
                <span className="press-overview__index">
                  {slide.parked ? 'parked' : RUN_ORDER.indexOf(slide) + 1}
                </span>
                <span className="press-overview__title">{slide.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const slide = SLIDES[index]
  const runIdx = RUN_ORDER.indexOf(slide)
  const next = runIdx === -1 ? undefined : RUN_ORDER[runIdx + 1]
  const talk = slide.talk ?? (slide.note ? [slide.note] : [])

  return (
    <div className={presenter ? 'press press--presenter' : 'press'} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Keyed by index so every slide change remounts and replays the enter animation. */}
      <div className={slide.full ? 'press-slide press-slide--full' : 'press-slide'} key={index}>
        {slide.id !== 'title' && <p className="press-slide__eyebrow">Taxfix Expert Service</p>}
        <h1 className="press-slide__title">{slide.title}</h1>
        <div className="press-slide__body">{slide.body}</div>
      </div>

      {slide.id === 'title' && (
        <p className="press-continue" aria-hidden="true" key={`continue-${index}`}>→ to continue</p>
      )}

      <nav className="press-dots" aria-label="Slides">
        {RUN_ORDER.map((s, i) => (
          <button
            type="button"
            key={s.id}
            className={i === runIdx ? 'press-dot press-dot--active' : 'press-dot'}
            aria-label={`Slide ${i + 1} of ${RUN_ORDER.length}: ${s.title}`}
            aria-current={i === runIdx ? 'step' : undefined}
            onClick={() => setIndex(SLIDES.indexOf(s))}
          />
        ))}
      </nav>

      <p className="press-clock" aria-label="Time since the deck opened">{formatElapsed(Math.max(0, now - startedAt))}</p>

      {/* Phones only (CSS): previous, the count, next. Desktop keeps the dots and the arrow keys. */}
      <nav className="press-mobile-nav" aria-label="Slide navigation">
        <button type="button" className="press-mobile-nav__btn" aria-label="Previous slide" onClick={() => step(-1)} disabled={runIdx <= 0}>‹</button>
        <p className="press-mobile-nav__count"><strong>{runIdx === -1 ? 'Parked' : runIdx + 1}</strong>{runIdx === -1 ? '' : ` of ${RUN_ORDER.length}`}</p>
        <button type="button" className="press-mobile-nav__btn press-mobile-nav__btn--next" aria-label="Next slide" onClick={() => step(1)} disabled={runIdx === -1 || runIdx >= RUN_ORDER.length - 1}>›</button>
      </nav>

      {/* Always mounted so it can slide up and down; hidden from AT when closed. */}
      <aside
        className={presenter ? 'press-presenter press-presenter--open' : 'press-presenter'}
        aria-label="Presenter notes"
        aria-hidden={!presenter}
      >
        <div className="press-presenter__notes" key={index}>
          {talk.length === 0 && <p className="press-presenter__empty">No notes for this slide yet.</p>}
          {talk.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        <div className="press-presenter__meta">
          <p className="press-presenter__clock">{formatElapsed(Math.max(0, now - startedAt))}</p>
          <p className="press-presenter__slide">
            {runIdx === -1 ? 'parked' : `${runIdx + 1} / ${RUN_ORDER.length}`}
            {slide.budget && <span> · {slide.budget}</span>}
          </p>
          <p className="press-presenter__next">
            {runIdx === -1 ? 'Esc to return to the running order' : next ? `Next: ${next.title}` : 'Last slide'}
          </p>
          <p className="press-presenter__hint">N hides notes · S opens the interviews</p>
        </div>
      </aside>
    </div>
  )
}
