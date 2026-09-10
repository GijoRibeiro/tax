import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../workspace/WorkspaceStore'
import { needsAttention } from '../workspace/selectors'
import type { AttentionItem } from '../workspace/selectors'
import type { AdvisorSettings } from '../workspace/types'
import { Icon } from '../kit/icons'

// Which settings toggle gates which needsAttention kind, verified against
// SettingsView's checkbox copy: uploads -> notifyClientUploads, questions ->
// notifyQuestions, ready-to-draft -> notifyApprovals.
function isEnabled(item: AttentionItem, settings: AdvisorSettings): boolean {
  if (item.kind === 'verify') return settings.notifyClientUploads
  if (item.kind === 'question') return settings.notifyQuestions
  return settings.notifyApprovals
}

export function NotificationMenu() {
  const { ws } = useWorkspace()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)

  const items = needsAttention(ws).filter(item => isEnabled(item, ws.settings))

  // Outside-click and Escape both close the dropdown, only wired up while
  // it's actually open, and torn down on close/unmount.
  useEffect(() => {
    if (!open) return

    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setOpen(false)
      bellRef.current?.focus()
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="tf-notif" ref={rootRef}>
      <button
        ref={bellRef}
        type="button"
        className="tf-notif__bell"
        aria-label={`Notifications${items.length > 0 ? ` (${items.length} new)` : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <Icon name="bell" size={18} />
        {items.length > 0 && (
          <span className="tf-notif__count" data-testid="notif-count">
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <div className="tf-notif__dropdown" role="menu">
          {items.length === 0 ? (
            <p className="tf-notif__empty">Nothing new.</p>
          ) : (
            <ul className="tf-notif__list">
              {items.map((item, i) => (
                <li key={`${item.caseId}-${item.kind}-${i}`}>
                  <Link
                    className="tf-notif__row"
                    to={`/advisor/cases/${item.caseId}`}
                    onClick={() => setOpen(false)}
                  >
                    <span className="tf-notif__client">{item.client}</span>
                    <span className="tf-notif__text">{item.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
