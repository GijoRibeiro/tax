import type { ChecklistItem } from '../types'
import { StatusPill } from './StatusPill'

export interface ChecklistItemRowProps {
  item: ChecklistItem
  onClick: () => void
}

export function ChecklistItemRow({ item, onClick }: ChecklistItemRowProps) {
  return (
    <button type="button" className="tf-checklist-row" onClick={onClick}>
      <span className="tf-checklist-row__text">
        <span className="tf-checklist-row__title">{item.title}</span>
        {item.germanName && <span className="tf-checklist-row__caption">{item.germanName}</span>}
        {item.status === 'issue' && item.issueNote && (
          <span className="tf-checklist-row__issue">{item.issueNote}</span>
        )}
      </span>
      <StatusPill status={item.status} />
    </button>
  )
}
