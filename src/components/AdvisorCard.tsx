import { ADVISOR } from '../types'

export interface AdvisorCardProps {
  compact?: boolean
}

export function AdvisorCard({ compact }: AdvisorCardProps) {
  return (
    <div className={`tf-advisor-card ${compact ? 'tf-advisor-card--compact' : ''}`}>
      <span className="tf-advisor-card__avatar" aria-hidden="true">
        {ADVISOR.initials}
      </span>
      <div className="tf-advisor-card__info">
        <p className="tf-advisor-card__name">{ADVISOR.name}</p>
        <p className="tf-advisor-card__title">{ADVISOR.title}</p>
        {!compact && <p className="tf-advisor-card__promise">{ADVISOR.responsePromise}</p>}
      </div>
    </div>
  )
}
