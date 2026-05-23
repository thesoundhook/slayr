import { cn } from '@/lib/utils'

interface ChecklistItemProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export default function ChecklistItem({ label, description, checked, onChange }: ChecklistItemProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-start gap-3 w-full text-left px-4 py-3 rounded-lg border transition-colors',
        checked ? 'bg-[#E1F5EE] border-[#9FE1CB]' : 'bg-card border-border hover:border-primary/40'
      )}
    >
      <span className={cn(
        'mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all',
        checked ? 'bg-success border-success' : 'border-border'
      )}>
        {checked && (
          <svg viewBox="0 0 16 16" fill="none" className="h-2.5 w-2.5"><path d="M3 8l4 4 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', checked ? 'text-[#0F6E56]' : 'text-foreground')}>{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </button>
  )
}
