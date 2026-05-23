import { cn } from '@/lib/utils'
import type { BriefData } from '@/types/brief'

const GATE_GROUPS = [
  {
    label: 'Client Intake',
    gates: [
      { num: 1, label: 'Client & Brand Brief',         key: 'obj' as keyof BriefData },
      { num: 2, label: 'Event Format & Scope',         key: 'fmt' as keyof BriefData },
      { num: 3, label: 'Event Identity & Creative',    key: 'centralIdea' as keyof BriefData },
      { num: 4, label: 'Audience & Market',            key: 'aud' as keyof BriefData },
    ],
  },
  {
    label: 'Production Scope',
    gates: [
      { num: 5, label: 'Scale & Capacity',             key: 'cap' as keyof BriefData },
      { num: 6, label: 'Production Services',          key: 'coreServices' as keyof BriefData },
      { num: 7, label: 'Talent & Programming',         key: 'talent' as keyof BriefData },
      { num: 8, label: 'Competition Structure',        key: 'compType' as keyof BriefData },
      { num: 9, label: 'Tour Routing',                 key: 'tour' as keyof BriefData },
    ],
  },
  {
    label: 'Commercial & Legal',
    gates: [
      { num: 10, label: 'Permits & Compliance',        key: 'insurance' as keyof BriefData },
      { num: 11, label: 'Budget & P&L',                key: 'c1' as keyof BriefData },
      { num: 12, label: 'Commercial Terms',            key: 'fee' as keyof BriefData },
    ],
  },
  {
    label: 'Sign-off',
    gates: [
      { num: 13, label: 'Key Contacts',                key: 'slayrContacts' as keyof BriefData },
      { num: 14, label: 'Client Pitch Deck',           key: 'deckStyle' as keyof BriefData },
      { num: 15, label: 'Timeline',                    key: 'leadWeeks' as keyof BriefData },
      { num: 16, label: 'Brief & Deliverables',        key: 'client' as keyof BriefData },
    ],
  },
]

function isDone(data: BriefData, key: keyof BriefData): boolean {
  const v = data[key]
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'number') return v > 0
  return Boolean(v)
}

interface BriefSideNavProps {
  currentGate: number
  onGate: (gate: number) => void
  data: BriefData
}

export default function BriefSideNav({ currentGate, onGate, data }: BriefSideNavProps) {
  return (
    <nav className="w-56 shrink-0 bg-card border-r border-border py-4 overflow-y-auto">
      {GATE_GROUPS.map(({ label, gates }) => (
        <div key={label} className="mb-4">
          <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          {gates.map(({ num, label: gateLabel, key }) => {
            const isActive = currentGate === num
            const done = isDone(data, key)
            return (
              <button
                key={num}
                type="button"
                onClick={() => onGate(num)}
                className={cn(
                  'flex items-center gap-2.5 w-full px-4 py-2 text-sm border-l-2 transition-colors',
                  isActive
                    ? 'border-primary bg-accent text-primary font-medium'
                    : done
                    ? 'border-[#1D9E75] text-muted-foreground hover:bg-secondary hover:text-foreground'
                    : 'border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <span className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  isActive ? 'bg-primary text-white' : done ? 'bg-[#1D9E75] text-white' : 'bg-secondary text-muted-foreground'
                )}>
                  {String(num).padStart(2, '0')}
                </span>
                <span className="text-xs leading-tight">{gateLabel}</span>
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
