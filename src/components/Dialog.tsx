import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

export interface DialogProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  tone?: 'default' | 'danger'
}

export function Dialog({ open, title, children, confirmLabel, onConfirm, onClose, tone = 'default' }: DialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="tf-dialog-backdrop" onClick={onClose}>
      <div className="tf-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <h2 className="tf-dialog__title">{title}</h2>
        <div className="tf-dialog__body">{children}</div>
        <div className="tf-dialog__actions">
          <button type="button" className="tf-button tf-button--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            ref={confirmRef}
            className={`tf-button tf-button--${tone === 'danger' ? 'danger' : 'primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
