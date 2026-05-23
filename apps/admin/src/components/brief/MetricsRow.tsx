import { cn } from '@/lib/utils'

interface Metric {
  label: string
  value: string
  sub?: string
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

interface MetricsRowProps {
  metrics: Metric[]
}

const variantColors: Record<string, string> = {
  default: 'text-foreground',
  success: 'text-[#0F6E56]',
  warning: 'text-[#854F0B]',
  destructive: 'text-[#993C1D]',
}

export default function MetricsRow({ metrics }: MetricsRowProps) {
  return (
    <div className="grid border border-border rounded-lg overflow-hidden mb-4" style={{ gridTemplateColumns: `repeat(${metrics.length}, 1fr)` }}>
      {metrics.map((m, i) => (
        <div key={i} className={cn('bg-card p-4', i > 0 && 'border-l border-border')}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{m.label}</p>
          <p className={cn('text-2xl font-bold leading-none', variantColors[m.variant ?? 'default'])}>{m.value}</p>
          {m.sub && <p className="text-[11px] text-muted-foreground mt-1">{m.sub}</p>}
        </div>
      ))}
    </div>
  )
}
