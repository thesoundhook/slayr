import { cn } from '@/lib/utils'

type Status = 'required' | 'inprogress' | 'secured' | 'tbd' | 'confirmed'

interface StatusCyclerProps {
  value: string
  states: { value: string; label: string; className: string }[]
  onChange: (next: string) => void
}

export default function StatusCycler({ value, states, onChange }: StatusCyclerProps) {
  const current = states.find(s => s.value === value) ?? states[0]
  const nextIndex = (states.indexOf(current) + 1) % states.length

  return (
    <button
      type="button"
      onClick={() => onChange(states[nextIndex].value)}
      className={cn('px-3 py-2 text-[9px] font-semibold uppercase tracking-wider cursor-pointer transition-colors', current.className)}
    >
      {current.label}
    </button>
  )
}

export const PERMIT_STATES: StatusCyclerProps['states'] = [
  { value: 'required',   label: 'Required',    className: 'text-[#993C1D] bg-[#FAECE7]' },
  { value: 'inprogress', label: 'In Progress',  className: 'text-[#854F0B] bg-[#FAEEDA]' },
  { value: 'secured',    label: 'Secured',      className: 'text-[#0F6E56] bg-[#E1F5EE]' },
]

export const STOP_STATES: StatusCyclerProps['states'] = [
  { value: 'tbd',        label: 'TBD',          className: 'text-muted-foreground bg-secondary' },
  { value: 'inprogress', label: 'In Progress',  className: 'text-[#854F0B] bg-[#FAEEDA]' },
  { value: 'confirmed',  label: 'Confirmed',    className: 'text-[#0F6E56] bg-[#E1F5EE]' },
]

void (null as unknown as Status)
