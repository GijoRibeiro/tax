export interface ProgressBarProps {
  value: number
  max: number
}

export function ProgressBar({ value, max }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0

  return (
    <div className="tf-progress-bar">
      <div className="tf-progress-bar__track">
        <div className="tf-progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="tf-progress-bar__caption">{`${value} of ${max} shared`}</span>
    </div>
  )
}
