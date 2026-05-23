import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SeriesPoint } from '@/services/analyticsService'

interface StatCardProps {
  label: string
  value: string
  previous?: number
  current?: number
  icon: React.ElementType
  accent: string
  sparkline?: SeriesPoint[]
  format?: 'number' | 'currency'
}

function deltaPct(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null
  return ((curr - prev) / prev) * 100
}

export default function StatCard({
  label,
  value,
  previous,
  current,
  icon: Icon,
  accent,
  sparkline,
}: StatCardProps) {
  const delta = previous !== undefined && current !== undefined ? deltaPct(current, previous) : null
  const direction = delta === null ? 'flat' : delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'flat'

  const deltaColor =
    direction === 'up' ? 'text-emerald-600 bg-emerald-50'
    : direction === 'down' ? 'text-rose-600 bg-rose-50'
    : 'text-muted-foreground bg-muted'

  const DeltaIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus

  const gradientId = `spark-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="relative rounded-xl border bg-card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          </div>
          <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', accent)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {delta !== null ? (
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', deltaColor)}>
              <DeltaIcon className="h-3 w-3" />
              {direction === 'flat' ? '—' : `${Math.abs(delta).toFixed(1)}%`}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">new period</span>
          )}
          <span className="text-xs text-muted-foreground">vs previous</span>
        </div>
      </div>

      {sparkline && sparkline.length > 0 && (
        <div className="h-12 -mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
