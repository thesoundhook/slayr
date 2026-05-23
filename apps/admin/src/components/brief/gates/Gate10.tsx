import type { BriefData } from '@/types/brief'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import ChecklistItem from '../ChecklistItem'
import StatusCycler, { PERMIT_STATES } from '../StatusCycler'
import Callout from '../Callout'

const PERMITS = [
  { id: 'lassc', name: 'Lagos State Safety Commission', desc: 'Public gatherings permit', time: '8–12 wks' },
  { id: 'laspppa', name: 'LASPPPA', desc: 'Physical planning approval', time: '6–10 wks' },
  { id: 'police', name: 'Nigeria Police Force', desc: 'Security deployment approval', time: '4–6 wks' },
  { id: 'lga', name: 'LGA / LASG', desc: 'Local government event clearance', time: '3–5 wks' },
  { id: 'coson', name: 'COSON / MCSN', desc: 'Music copyright performance rights', time: '2–3 wks' },
  { id: 'nafdac', name: 'NAFDAC', desc: 'Food & beverage vendor clearance', time: '3–5 wks' },
  { id: 'lawma', name: 'LAWMA', desc: 'Waste management approval', time: '2–3 wks' },
  { id: 'fire', name: 'Lagos State Fire Service', desc: 'Fire safety inspection', time: '3–4 wks' },
  { id: 'ncc', name: 'NCC', desc: 'Broadcast license (if live streaming / TV)', time: '4–8 wks' },
  { id: 'nis', name: 'NIS / Immigration', desc: 'Artist work permits (international acts)', time: '6–10 wks' },
  { id: 'nscdc', name: 'NSCDC', desc: 'Licensed private security firm clearance', time: 'Ongoing' },
]

const INSURANCE = [
  { label: 'Public liability — min ₦500M coverage', description: 'Mandatory for events above 1,000 capacity in Nigeria.' },
  { label: 'Event cancellation / postponement insurance', description: 'Covers force majeure, artist cancellation, and weather events.' },
  { label: 'Production equipment insurance', description: 'All hired equipment covered for theft, loss, and damage.' },
  { label: 'Employer liability — all crew & contractors', description: 'Required under Nigerian labour law for events with contracted crew.' },
]

function toggleList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

export default function Gate10({ data, update }: Props) {
  const updatePermit = (id: string, status: string) =>
    update('permitStatuses', { ...data.permitStatuses, [id]: status as 'required' | 'inprogress' | 'secured' })

  return (
    <div>
      <GateHero gateNum="10" section="Commercial & Legal" title="Permits & Compliance" subtitle="Non-negotiable. SlayR does not proceed to production on any event above 1,000 capacity without a clear permit timeline in place." />
      <div className="px-12 py-8">
        <Callout variant="red">
          <strong>Non-negotiable rule:</strong> SlayR does not proceed to production on any event above 1,000 capacity without written confirmation that permit applications have been submitted and a compliance officer is assigned.
        </Callout>

        <SectionDivider label="Core permits" />
        <div className="flex flex-col gap-1 mb-4">
          {PERMITS.map(p => (
            <div key={p.id} className="grid border border-border rounded-lg overflow-hidden text-sm" style={{ gridTemplateColumns: '1fr 120px 120px' }}>
              <div className="px-4 py-3 border-r border-border">
                <span className="font-semibold text-foreground">{p.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">{p.desc}</span>
              </div>
              <div className="flex items-center px-3 text-[10px] font-medium text-muted-foreground border-r border-border bg-secondary">{p.time}</div>
              <StatusCycler value={data.permitStatuses[p.id] ?? 'required'} states={PERMIT_STATES} onChange={v => updatePermit(p.id, v)} />
            </div>
          ))}
        </div>

        <SectionDivider label="Insurance — mandatory" />
        <div className="flex flex-col gap-2">
          {INSURANCE.map(item => (
            <ChecklistItem key={item.label} label={item.label} description={item.description} checked={data.insurance.includes(item.label)} onChange={() => update('insurance', toggleList(data.insurance, item.label))} />
          ))}
        </div>
      </div>
    </div>
  )
}
