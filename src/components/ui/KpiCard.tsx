import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { clsx } from 'clsx'

interface KpiCardProps {
  label: string
  value: string | number
  change?: number
  unit?: string
  icon?: React.ReactNode
}

export function KpiCard({ label, value, change, unit, icon }: KpiCardProps) {
  const trend = change !== undefined
    ? change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    : null

  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-text-secondary font-medium">{label}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-accent-violet/10 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-text-primary">
          {value}{unit}
        </span>
        {trend && (
          <div className={clsx(
            'flex items-center gap-1 text-xs font-medium mb-0.5',
            trend === 'up' && 'text-accent-success',
            trend === 'down' && 'text-accent-danger',
            trend === 'neutral' && 'text-text-secondary',
          )}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {trend === 'neutral' && <Minus className="w-3 h-3" />}
            {Math.abs(change!)}%
          </div>
        )}
      </div>
    </div>
  )
}
