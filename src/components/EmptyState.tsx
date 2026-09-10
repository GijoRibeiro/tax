export interface EmptyStateProps {
  icon: string
  title: string
  body: string
}

export function EmptyState({ icon, title, body }: EmptyStateProps) {
  return (
    <div className="tf-empty-state">
      <span className="tf-empty-state__icon" aria-hidden="true">
        {icon}
      </span>
      <p className="tf-empty-state__title">{title}</p>
      <p className="tf-empty-state__body">{body}</p>
    </div>
  )
}
