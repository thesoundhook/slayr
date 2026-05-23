import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatPrice } from '@/lib/utils'
import type { SeriesPoint } from '@/services/analyticsService'

interface Props {
  data: SeriesPoint[]
  height?: number
}

const formatDay = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

const formatTick = (v: number) => {
  if (v >= 1_000_000_00) return `₦${(v / 100 / 1_000_000).toFixed(1)}M`
  if (v >= 1_000_00) return `₦${(v / 100 / 1_000).toFixed(0)}K`
  return `₦${(v / 100).toFixed(0)}`
}

export default function RevenueChart({ data, height = 280 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDay}
          tick={{ fontSize: 11 }}
          stroke="hsl(var(--muted-foreground))"
          tickMargin={8}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatTick}
          tick={{ fontSize: 11 }}
          stroke="hsl(var(--muted-foreground))"
          width={56}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [formatPrice(Number(value) / 100), 'Revenue'] as [string, string]}
          labelFormatter={(label) => formatDay(String(label))}
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#rev-fill)"
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
