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
    <div className="relative bg-card border-b border-border px-4 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10 overflow-hidden">
      {ghost && (
        <span className="pointer-events-none select-none absolute right-4 sm:right-8 lg:right-12 top-2 text-[64px] sm:text-[88px] font-extrabold leading-none text-primary opacity-[0.04]">
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
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{title}</h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xl leading-relaxed">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
