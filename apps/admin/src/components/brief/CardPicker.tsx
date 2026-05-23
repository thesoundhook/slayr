import { cn } from '@/lib/utils'

interface CardOption {
  value: string
  title: string
  body: string
  chips?: string[]
  flag?: string
}

interface CardPickerProps {
  options: CardOption[]
  value: string | null
  onChange: (value: string) => void
  columns?: 2 | 3 | 4
}

export default function CardPicker({ options, value, onChange, columns = 3 }: CardPickerProps) {
  const gridCols = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[columns]

  return (
    <div className={cn('grid gap-2', gridCols)}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative text-left rounded-lg border border-t-2 p-4 transition-all',
            value === opt.value
              ? 'border-primary border-t-primary bg-accent'
              : 'border-border border-t-border bg-card hover:border-primary/40 hover:-translate-y-px'
          )}
        >
          {opt.flag && (
            <span className="absolute -top-px right-4 text-[9px] font-semibold tracking-wider text-success-foreground bg-[#E1F5EE] border border-[#9FE1CB] px-2 py-0.5 rounded-b-md">
              {opt.flag}
            </span>
          )}
          {value === opt.value && (
            <span className="absolute top-2.5 right-2.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
              <svg viewBox="0 0 16 16" fill="none" className="h-2.5 w-2.5"><path d="M4 8l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          )}
          <p className={cn('text-sm font-semibold mb-1', value === opt.value ? 'text-accent-foreground' : 'text-foreground')}>
            {opt.title}
          </p>
          <p className={cn('text-xs leading-relaxed mb-2', value === opt.value ? 'text-primary/70' : 'text-muted-foreground')}>
            {opt.body}
          </p>
          {opt.chips && opt.chips.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {opt.chips.map(chip => (
                <span key={chip} className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', value === opt.value ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground')}>
                  {chip}
                </span>
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
