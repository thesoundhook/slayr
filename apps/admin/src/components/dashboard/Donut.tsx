import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export interface DonutSlice {
  label: string
  value: number
  color: string
}

interface Props {
  data: DonutSlice[]
  centerLabel?: string
  centerValue?: string
  height?: number
  valueFormatter?: (v: number) => string
}

export default function Donut({
  data,
  centerLabel,
  centerValue,
  height = 200,
  valueFormatter,
}: Props) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const filtered = data.filter(d => d.value > 0)

  if (filtered.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        No data
      </div>
    )
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={filtered}
            innerRadius="64%"
            outerRadius="88%"
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            {filtered.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [
              valueFormatter ? valueFormatter(Number(value)) : Number(value).toLocaleString(),
              '',
            ] as [string, string]}
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue && <span className="text-xl font-bold tabular-nums">{centerValue}</span>}
          {centerLabel && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {centerLabel}
            </span>
          )}
        </div>
      )}
      {total > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {data.map(s => (
            <li key={s.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="truncate capitalize">{s.label}</span>
              </span>
              <span className="tabular-nums text-muted-foreground shrink-0">
                {total > 0 ? `${((s.value / total) * 100).toFixed(0)}%` : '0%'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
