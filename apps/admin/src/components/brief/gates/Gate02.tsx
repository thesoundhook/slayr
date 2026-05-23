import type { BriefData } from '@/types/brief'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import CardPicker from '../CardPicker'

const FORMATS = [
  { value: 'Single concert', title: 'Single concert', body: 'One night. One headliner. One venue. Full production spectacle.', chips: ['1 night', 'Arena / outdoor', '8–16 wks lead'] },
  { value: 'Festival — single day', title: 'Festival — single day', body: 'Multi-stage, multi-act one-day event. Standard large-scale brand or community festival.', chips: ['Multi-stage', '5k–40k cap', '16–24 wks'] },
  { value: 'Festival — multi-day', title: 'Festival — multi-day', body: '2–4 days on one site. Full festival infrastructure. Requires the most planning.', chips: ['2–4 days', 'On-site accom', '24–40 wks'], flag: 'Complex' },
  { value: 'City tour', title: 'City tour', body: 'Same format across multiple cities. Traveling production rig.', chips: ['3–8 cities', 'Traveling rig', 'Per-city ops'] },
  { value: 'National tour', title: 'National tour', body: 'Full touring circuit — Lagos, Abuja, PH, and regional cities.', chips: ['5–10 stops', 'National reach', '36–52 wks'] },
  { value: 'Hybrid activation + show', title: 'Hybrid activation + show', body: 'Brand activation experience with live entertainment. Dual KPIs.', chips: ['Brand-first', 'Dual KPIs', 'Flexible'] },
]

const ROLES = [
  { value: 'Full production — turnkey', title: 'Full production — turnkey', body: 'SlayR manages everything end-to-end. Single point of contact. Full management fee.', chips: ['Full ownership', 'Max fee'] },
  { value: 'Creative direction + production management', title: 'Creative + production management', body: 'SlayR leads creative and manages vendors. Client handles some vendor relationships.', chips: ['Creative lead', 'Shared ops'] },
  { value: 'Production management only', title: 'Production management only', body: 'Client provides concept. SlayR manages all logistics, vendors, site, crew, permits.', chips: ['Ops lead', 'Client concept'] },
  { value: 'Consulting + oversight', title: 'Consulting + oversight', body: 'SlayR advises and quality-controls. Client runs with their team.', chips: ['Advisory', 'Reduced fee'] },
  { value: 'Talent booking + management', title: 'Talent booking + management', body: 'SlayR handles artist negotiations, contracts, riders, and logistics only.', chips: ['Talent-only', 'Fee per booking'] },
  { value: 'Co-production / Joint venture', title: 'Co-production / JV', body: 'Equal production partners. Revenue and risk shared.', chips: ['Shared P&L', 'Equity stake'] },
]

const GENRES = ['Strength & Fitness Competition','Afrobeats & Afropop','Hip-hop & Rap','Electronic & Dance','R&B & Soul','Gospel & Inspirational','Comedy & Entertainment','Cross-genre / Mixed','Fashion & Culture','Other']

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

export default function Gate02({ data, update }: Props) {
  const fi = 'w-full px-3 py-2 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
  const fs = fi + ' appearance-none'
  const fl = 'block text-xs font-medium text-muted-foreground mb-1.5'
  const fld = 'flex flex-col'

  return (
    <div>
      <GateHero gateNum="02" section="Client Intake" title="Event Format & Scope" subtitle="What type of event are we producing? This single decision determines the production model, crew structure, and commercial architecture." />
      <div className="px-12 py-8">
        <SectionDivider label="Primary format" />
        <CardPicker options={FORMATS} value={data.fmt} onChange={v => update('fmt', v)} columns={3} />

        <SectionDivider label="Event name & identity" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className={fld}><label className={fl}>Working event title</label><input className={fi} value={data.evtName} onChange={e => update('evtName', e.target.value)} placeholder="e.g. Access Fest Lagos, GTB Art Weekend" /></div>
          <div className={fld}><label className={fl}>Edition / year</label><input className={fi} value={data.edition} onChange={e => update('edition', e.target.value)} placeholder="e.g. Inaugural Edition 2025" /></div>
          <div className={fld}><label className={fl}>Genre / theme</label>
            <select className={fs} value={data.genre} onChange={e => update('genre', e.target.value)}>
              <option value="">Select genre</option>
              {GENRES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className={fld}><label className={fl}>Event type description</label><input className={fi} value={data.evtType} onChange={e => update('evtType', e.target.value)} placeholder="e.g. Strength & Fitness Competition — Fire Festival Format" /></div>
        </div>

        <SectionDivider label="SlayR's production role" />
        <CardPicker options={ROLES} value={data.role} onChange={v => update('role', v)} columns={3} />
      </div>
    </div>
  )
}
