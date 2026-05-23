import type { ReactNode } from 'react'

interface PageHeroProps {
  badge?: string
  title: string
  subtitle?: string
  ghost?: string
  actions?: ReactNode
}

export default function PageHero({ badge, title, subtitle, ghost, actions }: PageHeroProps) {
  return (
    <div className="relative bg-card border-b border-border px-12 py-10 overflow-hidden">
      {ghost && (
        <span className="pointer-events-none select-none absolute right-12 top-2 text-[88px] font-extrabold leading-none text-primary opacity-[0.04]">
          {ghost}
        </span>
      )}
      <div className="relative">
        {badge && (
          <div className="flex items-center gap-2 mb-2">
            <span className="block w-4 h-px bg-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">{badge}</span>
          </div>
        )}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground leading-tight">{title}</h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xl leading-relaxed">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
