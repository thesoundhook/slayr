interface BriefProgressBarProps {
  current: number
  total: number
  saving?: boolean
}

export default function BriefProgressBar({ current, total, saving }: BriefProgressBarProps) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-card">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
      <div className="flex-1 h-0.5 bg-border rounded-full">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {saving && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Saving…</span>
      )}
    </div>
  )
}
