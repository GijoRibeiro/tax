import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { JOURNEYS, JOURNEY_TABS, NODE_SIZE } from './journey'
import type { JourneyEdge, JourneyNode, JourneyTab } from './journey'

// A pan/zoom canvas of one side's journey: cards with real screenshots, edges
// with labels, and a preview panel for any step. Arrow keys are left alone so
// the deck keeps advancing; the canvas moves with drag, wheel and the buttons.

interface View { x: number; y: number; k: number }

const MIN_K = 0.1
const MAX_K = 2.5

function nodeBox(n: JourneyNode) {
  const s = NODE_SIZE[n.kind]
  return { x: n.x, y: n.y, w: s.w, h: s.h, cx: n.x + s.w / 2, cy: n.y + s.h / 2 }
}

// Edge routing. Same-row forward edges run right to left as a soft curve. Anything that
// changes row travels through the corridor between rows (down out of the source, along
// the corridor, down into the target), so lines never cut across cards. A forward and a
// return edge in the same column are offset so they do not overlap. The label sits on the
// longest horizontal run, or beside the vertical one when there is none.
// Edges that share a corridor and a direction take successive lanes, 40px apart, so their
// labels never stack. `lane` comes from laneMap below.
function edgePath(a: JourneyNode, b: JourneyNode, lane = 0, both = false) {
  const A = nodeBox(a), B = nodeBox(b)
  const stacked = Math.abs(A.cx - B.cx) < 60 && (B.y >= A.y + A.h || B.y + B.h <= A.y)
  if (both || (stacked && Math.abs(A.cy - B.cy) < 900)) {
    // Two cards stacked in one column: one straight line, label beside its middle.
    const x = (A.cx + B.cx) / 2
    const [y1, y2] = B.y >= A.y + A.h ? [A.y + A.h, B.y] : [A.y, B.y + B.h]
    return { d: `M ${x} ${y1} L ${x} ${y2}`, lx: x + 14, ly: (y1 + y2) / 2, anchor: 'start' as const }
  }
  const sameRow = B.y < A.y + A.h && B.y + B.h > A.y
  const ahead = B.x >= A.x + A.w + 40

  if (sameRow && ahead) {
    const x1 = A.x + A.w, y1 = A.cy, x2 = B.x, y2 = B.cy
    const bend = Math.max(60, (x2 - x1) * 0.5)
    return { d: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`, lx: (x1 + x2) / 2, ly: (y1 + y2) / 2, anchor: 'middle' as const }
  }

  const down = B.y >= A.y + A.h
  const up = B.y + B.h <= A.y
  // Forward (down) edges lean right, return (up) edges lean left, so a pair in one column reads as a loop.
  // Each edge enters and leaves its cards at its own x, spread by lane, so two edges that
  // touch the same column never draw one continuous vertical (which reads as a link
  // between cards that are not linked). Up edges sit half a step off the down ones.
  const off = (lane - 1) * 30 + (up ? 15 : 0)
  const ax = A.cx + off, bx = B.cx + off
  const r = 18 // corner radius
  const pts: [number, number][] = []
  let corridorY: number
  // Forward runs sit a little above the corridor's middle, return runs a little below,
  // so their labels do not land on top of each other.
  const stagger = (up ? 1 : -1) * (22 + lane * 40)
  const gap = down ? B.y - (A.y + A.h) : up ? A.y - (B.y + B.h) : 0
  const skipsARow = gap > 400
  if (down && skipsARow) {
    // Down out of A into the corridor below it, along to a free gutter between columns,
    // down that gutter past the row in between, along the corridor above B, into B.
    const c1 = A.y + A.h + 60, c2 = B.y - 60
    const gx = B.cx < A.cx - 60 ? B.x + B.w + 105 : B.x - 105
    corridorY = c2
    pts.push([A.cx + off, A.y + A.h], [A.cx + off, c1], [gx, c1], [gx, c2], [B.cx + off, c2], [B.cx + off, B.y])
  } else if (up && skipsARow) {
    const c1 = A.y - 60, c2 = B.y + B.h + 60
    const gx = B.cx < A.cx - 60 ? B.x + B.w + 105 : B.x - 105
    corridorY = c2
    pts.push([A.cx + off, A.y], [A.cx + off, c1], [gx, c1], [gx, c2], [B.cx + off, c2], [B.cx + off, B.y + B.h])
  } else if (down) {
    corridorY = (A.y + A.h + B.y) / 2 + stagger
    pts.push([ax, A.y + A.h], [ax, corridorY], [bx, corridorY], [bx, B.y])
  } else if (up) {
    corridorY = (B.y + B.h + A.y) / 2 + stagger
    pts.push([ax, A.y], [ax, corridorY], [bx, corridorY], [bx, B.y + B.h])
  } else {
    // Behind on the same row: dip below the row and come back up into the target.
    corridorY = A.y + A.h + 70
    pts.push([A.cx, A.y + A.h], [A.cx, corridorY], [B.cx, corridorY], [B.cx, B.y + B.h])
  }
  // Rounded polyline.
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1], [cx, cy] = pts[i], [nx, ny] = pts[i + 1]
    const inLen = Math.hypot(cx - px, cy - py), outLen = Math.hypot(nx - cx, ny - cy)
    const rr = Math.min(r, inLen / 2, outLen / 2)
    if (rr < 1) { d += ` L ${cx} ${cy}`; continue }
    const ax = cx - ((cx - px) / inLen) * rr, ay = cy - ((cy - py) / inLen) * rr
    const bx = cx + ((nx - cx) / outLen) * rr, by = cy + ((ny - cy) / outLen) * rr
    d += ` L ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`
  }
  const last = pts[pts.length - 1]
  d += ` L ${last[0]} ${last[1]}`
  // Label on the longest horizontal run.
  let best = -1, bestLen = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const len = pts[i][1] === pts[i + 1][1] ? Math.abs(pts[i + 1][0] - pts[i][0]) : 0
    if (len > bestLen) { bestLen = len; best = i }
  }
  if (bestLen >= 60) {
    return { d, lx: (pts[best][0] + pts[best + 1][0]) / 2, ly: pts[best][1], anchor: 'middle' as const }
  }
  // No real horizontal run: label beside the vertical, at the height of the edge's own
  // lane, on the side the edge leans to, so it lines up with the other labels in the corridor.
  const y = pts.length > 1 ? pts[1][1] : pts[0][1]
  return { d, lx: pts[0][0] + (off < 0 ? -14 : 14), ly: y, anchor: (off < 0 ? 'end' : 'start') as 'end' | 'start' }
}

function bounds(nodes: JourneyNode[], labels: { x: number; y: number }[] = []) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const l of labels) { minX = Math.min(minX, l.x); minY = Math.min(minY, l.y) }
  for (const n of nodes) {
    const b = nodeBox(n)
    minX = Math.min(minX, b.x); minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.w); maxY = Math.max(maxY, b.y + b.h)
  }
  return { minX, minY, maxX, maxY }
}

export function JourneyCanvas({ initialTab = 'customer' }: { initialTab?: JourneyTab }) {
  const [tab, setTab] = useState<JourneyTab>(initialTab)
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 })
  const [animate, setAnimate] = useState(true)
  const [preview, setPreview] = useState<JourneyNode | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const drag = useRef<{ px: number; py: number; vx: number; vy: number; moved: boolean } | null>(null)

  const flow = JOURNEYS[tab]
  const byId = useMemo(() => Object.fromEntries(flow.nodes.map(n => [n.id, n])), [flow])
  // Lane per edge: edges leaving one row for another, grouped by the pair of rows and the
  // direction, numbered in order. Same-row curves need none.
  const laneMap = new Map<string, number>()
  {
    const counts = new Map<string, number>()
    for (const e of flow.edges) {
      const a = byId[e.from], b = byId[e.to]
      if (!a || !b || a.y === b.y || e.both) continue
      const key = `${Math.min(a.y, b.y)}-${Math.max(a.y, b.y)}-${b.y > a.y ? 'd' : 'u'}`
      const n = counts.get(key) ?? 0
      counts.set(key, n + 1)
      laneMap.set(`${e.from}>${e.to}`, n)
    }
  }

  const fit = useCallback(() => {
    const el = frameRef.current
    if (!el) return
    const { minX, minY, maxX, maxY } = bounds(flow.nodes, flow.labels)
    const w = el.clientWidth, h = el.clientHeight
    if (!w || !h) return
    // Phones: a smaller margin and a lower floor, so the whole map fits the narrow frame.
    const phone = w < 600
    const pad = phone ? 14 : 48
    const k = Math.min((w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxY - minY), 1.2)
    const kk = Math.max(phone ? 0.06 : MIN_K, Math.min(MAX_K, k))
    setView({ k: kk, x: (w - (maxX - minX) * kk) / 2 - minX * kk, y: (h - (maxY - minY) * kk) / 2 - minY * kk })
  }, [flow])

  useLayoutEffect(() => { setAnimate(true); fit() }, [fit])
  useEffect(() => {
    const onResize = () => fit()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [fit])

  // Esc closes the preview before the deck sees it (deck listens on window too).
  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); setPreview(null) }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [preview])

  const zoomBy = useCallback((factor: number, cx?: number, cy?: number) => {
    setAnimate(cx === undefined)
    setView(v => {
      const el = frameRef.current
      const px = cx ?? (el ? el.clientWidth / 2 : 0)
      const py = cy ?? (el ? el.clientHeight / 2 : 0)
      const k = Math.max(MIN_K, Math.min(MAX_K, v.k * factor))
      const r = k / v.k
      return { k, x: px - (px - v.x) * r, y: py - (py - v.y) * r }
    })
  }, [])

  // Wheel and pinch must be non-passive to keep the browser from zooming the page.
  // React attaches onWheel as passive, so the listeners go on the element directly.
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        // Trackpad pinch arrives as ctrl+wheel in Chrome and Firefox.
        zoomBy(Math.exp(-e.deltaY * 0.006), e.clientX - rect.left, e.clientY - rect.top)
      } else {
        setAnimate(false)
        setView(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
      }
    }
    // Safari reports pinch as gesture events with a cumulative scale.
    let gestureK = 1
    const onGestureStart = (e: Event) => { e.preventDefault(); gestureK = 1 }
    const onGestureChange = (e: Event) => {
      e.preventDefault()
      const ge = e as Event & { scale: number; clientX: number; clientY: number }
      const rect = el.getBoundingClientRect()
      const factor = ge.scale / gestureK
      gestureK = ge.scale
      zoomBy(factor, ge.clientX - rect.left, ge.clientY - rect.top)
    }
    const onGestureEnd = (e: Event) => e.preventDefault()
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('gesturestart', onGestureStart, { passive: false })
    el.addEventListener('gesturechange', onGestureChange, { passive: false })
    el.addEventListener('gestureend', onGestureEnd, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('gesturestart', onGestureStart)
      el.removeEventListener('gesturechange', onGestureChange)
      el.removeEventListener('gestureend', onGestureEnd)
    }
    // zoomBy reads only refs and functional state; safe to bind once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [dragging, setDragging] = useState(false)
  const suppressClick = useRef(false)

  // Drag on the frame pans; listeners go on window so a drag that leaves the
  // frame still ends cleanly. No pointer capture: it would swallow node clicks.
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    drag.current = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y, moved: false }
    suppressClick.current = false
    setAnimate(false)
    setDragging(true)
    const onMove = (ev: PointerEvent) => {
      const d = drag.current
      if (!d) return
      const dx = ev.clientX - d.px, dy = ev.clientY - d.py
      if (Math.abs(dx) + Math.abs(dy) > 4) { d.moved = true; suppressClick.current = true }
      setView(v => ({ ...v, x: d.vx + dx, y: d.vy + dy }))
    }
    const onUp = () => {
      drag.current = null
      setDragging(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const open = (n: JourneyNode) => {
    if (suppressClick.current) { suppressClick.current = false; return }
    setPreview(n)
  }

  return (
    <div className="press-journey">
      <div className="press-journey__bar">
        <div className="press-journey__tabs" role="tablist" aria-label="Journey">
          {JOURNEY_TABS.map(t => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={tab === t ? 'press-journey__tab press-journey__tab--active' : 'press-journey__tab'}
              onClick={() => { setTab(t); setPreview(null) }}
            >
              {JOURNEYS[t].label}
            </button>
          ))}
        </div>
        <p className="press-journey__who">{flow.who}</p>
        <div className="press-journey__zoom" aria-label="Zoom">
          <button type="button" onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom out">−</button>
          <button type="button" onClick={() => { setAnimate(true); fit() }}>Fit</button>
          <button type="button" onClick={() => zoomBy(1.25)} aria-label="Zoom in">+</button>
        </div>
      </div>

      <div
        className={dragging ? 'press-journey__frame press-journey__frame--dragging' : 'press-journey__frame'}
        ref={frameRef}
        onPointerDown={onPointerDown}
      >
        <div
          className={animate ? 'press-journey__world press-journey__world--animate' : 'press-journey__world'}
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
          key={tab}
        >
          <svg className="press-journey__edges" aria-hidden="true">
            <defs>
              <marker id="jarrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {flow.edges.map((e: JourneyEdge, i) => {
              const a = byId[e.from], b = byId[e.to]
              if (!a || !b) return null
              const { d } = edgePath(a, b, laneMap.get(`${e.from}>${e.to}`), e.both)
              return (
                <g key={`${e.from}-${e.to}`} className={e.branch ? 'press-jedge press-jedge--branch' : 'press-jedge'} style={{ animationDelay: `${300 + i * 60}ms` }}>
                  {/* Solid edges draw in over a normalised length; dashed ones keep real units for their dash pattern. */}
                  <path d={d} pathLength={e.branch ? undefined : 1} markerEnd="url(#jarrow)" markerStart={e.both ? 'url(#jarrow)' : undefined} />
                </g>
              )
            })}
          </svg>

          {flow.labels.map(l => (
            <span key={l.text} className="press-jlabel" style={{ left: l.x, top: l.y }}>{l.text}</span>
          ))}

          {flow.nodes.map((n, i) => {
            const s = NODE_SIZE[n.kind]
            return (
              <button
                type="button"
                key={n.id}
                className={`press-jnode press-jnode--${n.kind}`}
                style={{ left: n.x, top: n.y, width: s.w, height: s.h, animationDelay: `${120 + i * 55}ms` }}
                onClick={() => open(n)}
                aria-label={`${n.title}: open step`}
              >
                {n.screenshot && (
                  <span className="press-jnode__shot">
                    <img src={n.screenshot} alt="" draggable={false} />
                  </span>
                )}
                <span className="press-jnode__body">
                  <strong className="press-jnode__title">{n.title}</strong>
                  <span className="press-jnode__caption">{n.caption}</span>
                  {n.solves && <span className="press-jnode__solves">Fixes: {n.solves}</span>}
                </span>
              </button>
            )
          })}

          <svg className="press-journey__edges press-journey__edge-labels" aria-hidden="true">
            {flow.edges.map((e: JourneyEdge, i) => {
              const a = byId[e.from], b = byId[e.to]
              if (!a || !b || !e.label) return null
              const { lx, ly, anchor } = edgePath(a, b, laneMap.get(`${e.from}>${e.to}`), e.both)
              const w = e.label.length * 6.8 + 24
              const rx = anchor === 'middle' ? -w / 2 : anchor === 'start' ? 0 : -w
              const tx = anchor === 'middle' ? 0 : anchor === 'start' ? 12 : -12
              return (
                <g key={`${e.from}-${e.to}-label`} className={e.branch ? 'press-jedge press-jedge--branch' : 'press-jedge'} style={{ animationDelay: `${300 + i * 60}ms` }}>
                  <g transform={`translate(${lx}, ${ly})`} className="press-jedge__label">
                    <rect x={rx} y={-12} width={w} height={24} rx={12} />
                    <text x={tx} textAnchor={anchor} dominantBaseline="middle">{e.label}</text>
                  </g>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {preview && (
        <aside className="press-jpreview" aria-label={`${preview.title} step`}>
          <button type="button" className="press-jpreview__close" onClick={() => setPreview(null)} aria-label="Close">×</button>
          {preview.screenshot && (
            <img className={`press-jpreview__shot press-jpreview__shot--${preview.kind}`} src={preview.screenshot} alt="" />
          )}
          <div className="press-jpreview__text">
            <p className="press-jpreview__eyebrow">{tab === 'customer' ? 'Betina sees' : 'Anna sees'}</p>
            <h3 className="press-jpreview__title">{preview.title}</h3>
            <p className="press-jpreview__caption">{preview.caption}</p>
            {preview.solves && (
              <>
                <p className="press-jpreview__eyebrow">Built to fix</p>
                <p className="press-jpreview__solves">{preview.solves}</p>
              </>
            )}
            <p className="press-jpreview__eyebrow">{tab === 'customer' ? 'Meanwhile, Anna' : 'Meanwhile, Betina'}</p>
            <p className="press-jpreview__mirror">{preview.mirror}</p>
          </div>
        </aside>
      )}
    </div>
  )
}
