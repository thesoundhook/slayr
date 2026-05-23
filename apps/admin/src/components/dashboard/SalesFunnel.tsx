import type { SalesFunnel as FunnelData } from '@/services/analyticsService'

interface Props {
  data: FunnelData
}

export default function SalesFunnel({ data }: Props) {
  const max = Math.max(data.capacity, data.sold, data.scanned, 1)

  const stages = [
    { label: 'Total capacity', value: data.capacity, color: 'bg-slate-300', textColor: 'text-slate-700' },
    { label: 'Tickets sold', value: data.sold, color: 'bg-violet-500', textColor: 'text-violet-700' },
    { label: 'Checked in', value: data.scanned, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
  ]

  const sellThrough = data.capacity > 0 ? (data.sold / data.capacity) * 100 : 0
  const checkInRate = data.sold > 0 ? (data.scanned / data.sold) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sell-through</p>
          <p className="text-xl font-bold tabular-nums mt-1">{sellThrough.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Check-in rate</p>
          <p className="text-xl font-bold tabular-nums mt-1">{checkInRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {stages.map(stage => {
          const pct = (stage.value / max) * 100
          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{stage.label}</span>
                <span className={`font-semibold tabular-nums ${stage.textColor}`}>
                  {stage.value.toLocaleString()}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${stage.color} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
