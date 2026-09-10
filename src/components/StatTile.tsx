export interface StatTileProps {
  label: string
  value: number | string
  tone?: 'default' | 'success' | 'warning'
}

export function StatTile({ label, value, tone = 'default' }: StatTileProps) {
  return (
    <div className={`tf-stat-tile tf-stat-tile--${tone}`}>
      <span className="tf-stat-tile__value">{value}</span>
      <span className="tf-stat-tile__label">{label}</span>
    </div>
  )
}
