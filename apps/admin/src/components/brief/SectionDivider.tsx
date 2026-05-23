interface SectionDividerProps {
  label: string
}

export default function SectionDivider({ label }: SectionDividerProps) {
  return (
    <div className="flex items-center gap-3 my-6">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
