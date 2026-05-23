import { useId } from 'react'
import type { BriefData, TourStop } from '@/types/brief'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import CardPicker from '../CardPicker'
import StatusCycler, { STOP_STATES } from '../StatusCycler'
import Callout from '../Callout'

const TOUR_TYPES = [
  { value: 'Single city — skip routing', title: 'Single city — skip routing', body: 'One venue, one city. No tour routing needed.', chips: [] },
  { value: '2-city tour (Lagos + Abuja)', title: '2-city tour', body: 'Lagos + Abuja. Standard two-stop model.', chips: ['2 stops'] },
  { value: 'National — 3 to 6 cities', title: 'National — 3 to 6 cities', body: 'Full national circuit. Lagos, Abuja, PH, and regional cities.', chips: ['3–6 stops'] },
  { value: 'International / Pan-African', title: 'International / Pan-African', body: 'Multi-country circuit. Requires international logistics.', chips: ['Cross-border'] },
]

const RIG_MODELS = [
  { value: 'Full traveling rig', title: 'Full traveling rig', body: 'All production equipment travels with the show. Highest cost, most consistent.', chips: ['Consistent', 'Highest cost'] },
  { value: 'Local sourcing per city', title: 'Local sourcing per city', body: 'All equipment sourced locally in each city. Lowest transport cost, variable quality.', chips: ['Lowest transport', 'Variable quality'] },
  { value: 'Core rig + local top-up', title: 'Core rig + local top-up', body: 'Core production travels; heavy/bulk items sourced locally. Best balance.', chips: ['Best balance'], flag: 'Recommended' },
]

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

export default function Gate09({ data, update }: Props) {
  const uid = useId()
  const fi = 'flex-1 px-3 py-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none'

  const addStop = () => update('stops', [...data.stops, { id: uid + Date.now(), city: '', venue: '', date: '', status: 'tbd' }])
  const removeStop = (id: string) => { if (data.stops.length > 1) update('stops', data.stops.filter(s => s.id !== id)) }
  const updateStop = (id: string, field: keyof TourStop, value: string) =>
    update('stops', data.stops.map(s => s.id === id ? { ...s, [field]: value } : s))

  const stops = data.stops.length > 0 ? data.stops : [{ id: uid + '-default', city: '', venue: '', date: '', status: 'tbd' as const }]

  return (
    <div>
      <GateHero gateNum="09" section="Production Scope" title="Tour Routing" subtitle="If this is a multi-city production, map the stops, lock dates, and confirm the traveling production model." />
      <div className="px-12 py-8">
        <SectionDivider label="Tour type" />
        <CardPicker options={TOUR_TYPES} value={data.tour} onChange={v => update('tour', v)} columns={2} />

        {data.tour !== 'Single city — skip routing' && (
          <>
            <SectionDivider label="Tour stop tracker" />
            <div className="flex flex-col gap-1.5 mb-3">
              {stops.map((stop, i) => (
                <div key={stop.id} className="grid border border-border rounded-lg overflow-hidden items-stretch" style={{ gridTemplateColumns: '32px 1fr 1fr 160px 120px 32px' }}>
                  <div className="flex items-center justify-center bg-secondary text-[10px] font-bold text-muted-foreground border-r border-border">{String(i + 1).padStart(2, '0')}</div>
                  <div className="border-r border-border flex"><input className={fi} placeholder="City / market" value={stop.city} onChange={e => updateStop(stop.id, 'city', e.target.value)} /></div>
                  <div className="border-r border-border flex"><input className={fi} placeholder="Venue name" value={stop.venue} onChange={e => updateStop(stop.id, 'venue', e.target.value)} /></div>
                  <div className="border-r border-border flex items-center px-3"><input type="date" className="text-sm text-foreground bg-transparent focus:outline-none w-full" value={stop.date} onChange={e => updateStop(stop.id, 'date', e.target.value)} /></div>
                  <div className="border-r border-border">
                    <StatusCycler value={stop.status} states={STOP_STATES} onChange={v => updateStop(stop.id, 'status', v)} />
                  </div>
                  <button type="button" onClick={() => removeStop(stop.id)} className="flex items-center justify-center text-muted-foreground hover:text-destructive text-lg">×</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addStop} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-70 mb-6 transition-opacity">+ Add stop</button>

            <Callout variant="gold">Budget for per-city compliance costs separately. NSCDC and LGA clearances must be obtained in each city.</Callout>

            <SectionDivider label="Traveling production model" />
            <CardPicker options={RIG_MODELS} value={data.rig} onChange={v => update('rig', v)} columns={3} />
          </>
        )}
      </div>
    </div>
  )
}
