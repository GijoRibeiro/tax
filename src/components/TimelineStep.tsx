export interface TimelineStepProps {
  label: string
  state: 'done' | 'current' | 'todo'
}

export function TimelineStep({ label, state }: TimelineStepProps) {
  return (
    <div className={`tf-timeline-step tf-timeline-step--${state}`}>
      <span className="tf-timeline-step__dot" aria-hidden="true" />
      <span className="tf-timeline-step__label">{label}</span>
    </div>
  )
}
