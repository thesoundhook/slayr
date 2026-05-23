import { cn } from '@/lib/utils'

export type RangeKey = '7d' | '30d' | '90d' | '12m'

export const RANGE_DAYS: Record<RangeKey, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12m': 365,
}

const OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: '12m', label: '12m' },
]

interface Props {
  value: RangeKey
  onChange: (key: RangeKey) => void
}

export default function DateRangeFilter({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-md border bg-card p-0.5">
      {OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded transition-colors',
            value === opt.key
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
