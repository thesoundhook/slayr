interface GateHeroProps {
  gateNum: string
  section: string
  title: string
  subtitle: string
}

export default function GateHero({ gateNum, section, title, subtitle }: GateHeroProps) {
  return (
    <div className="relative bg-card border-b border-border px-12 py-10 overflow-hidden">
      <span className="pointer-events-none select-none absolute right-12 top-0 text-[88px] font-extrabold leading-none text-primary opacity-[0.04]">
        {gateNum}
      </span>
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="block w-4 h-px bg-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
            Gate {gateNum} — {section}
          </span>
        </div>
        <h2 className="text-3xl font-bold text-foreground leading-tight">{title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xl leading-relaxed">{subtitle}</p>
      </div>
    </div>
  )
}
