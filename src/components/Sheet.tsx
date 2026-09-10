import type { ReactNode } from 'react'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  if (!open) return null

  return (
    <div className="tf-sheet-backdrop" onClick={onClose}>
      <div className="tf-sheet" onClick={e => e.stopPropagation()}>
        <div className="tf-sheet__header">
          <h2 className="tf-sheet__title">{title}</h2>
          <button type="button" className="tf-sheet__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
