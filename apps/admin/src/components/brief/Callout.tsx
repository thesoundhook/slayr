import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const styles = {
  blue:  { border: 'border-primary',      bg: 'bg-accent',      text: 'text-accent-foreground' },
  green: { border: 'border-[#1D9E75]',    bg: 'bg-[#E1F5EE]',   text: 'text-[#085041]' },
  gold:  { border: 'border-[#BA7517]',    bg: 'bg-[#FAEEDA]',   text: 'text-[#633806]' },
  red:   { border: 'border-[#D85A30]',    bg: 'bg-[#FAECE7]',   text: 'text-[#712B13]' },
}

interface CalloutProps {
  variant?: 'blue' | 'green' | 'gold' | 'red'
  children: ReactNode
}

export default function Callout({ variant = 'blue', children }: CalloutProps) {
  const s = styles[variant]
  return (
    <div className={cn('px-4 py-3 border-l-[3px] rounded-r-lg text-sm leading-relaxed my-3', s.border, s.bg, s.text)}>
      {children}
    </div>
  )
}
