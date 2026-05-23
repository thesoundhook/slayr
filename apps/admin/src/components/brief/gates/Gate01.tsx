import type { BriefData } from '@/types/brief'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import CardPicker from '../CardPicker'

const SECTORS = ['Financial services / Banking','Telecoms','FMCG / Consumer goods','Entertainment / Media','Fashion & Lifestyle','Tech / Fintech','Health & Wellness','Government / Public sector','NGO / Non-profit','Other']

const OBJECTIVES = [
  { value: 'Brand awareness & reach', title: 'Brand awareness', body: 'Maximise impressions, reach, and brand salience.', chips: ['Broad reach', 'Media coverage'] },
  { value: 'Product launch / activation', title: 'Product launch', body: 'Event built around introducing a product, service, or campaign.', chips: ['Activation-first', 'Demo moments'] },
  { value: 'Consumer experience & loyalty', title: 'Consumer experience', body: 'Deepen brand love with existing customers. Quality over quantity.', chips: ['Loyalty play', 'VIP-weighted'] },
  { value: 'Revenue generation / ticketed', title: 'Revenue generation', body: 'Ticket sales, vendor fees, and secondary revenue are primary KPIs.', chips: ['P&L driven', 'Ticketed'] },
  { value: 'Talent / artist showcase', title: 'Talent showcase', body: 'Built around a specific artist, talent roster, or creative property.', chips: ['Artist-led', 'Fans first'] },
  { value: 'Culture & community building', title: 'Culture & community', body: 'Building a long-term property. Community ownership, cultural credibility.', chips: ['Long-term play', 'Identity brand'] },
]

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

export default function Gate01({ data, update }: Props) {
  const fi = 'w-full px-3 py-2 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
  const fs = fi + ' appearance-none'
  const fl = 'block text-xs font-medium text-muted-foreground mb-1.5'
  const fld = 'flex flex-col'

  return (
    <div>
      <GateHero gateNum="01" section="Client Intake" title="Client & Brand Brief" subtitle="Capture who the client is, what they want the event to achieve, and what constraints they're bringing in. This is the brief behind the brief." />
      <div className="px-12 py-8">
        <SectionDivider label="Client details" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className={fld}><label className={fl}>Client / brand name</label><input className={fi} value={data.client} onChange={e => update('client', e.target.value)} placeholder="e.g. Access Bank, Guinness Nigeria, MTN Nigeria" /></div>
          <div className={fld}><label className={fl}>Client contact name</label><input className={fi} value={data.contact} onChange={e => update('contact', e.target.value)} placeholder="Name of the decision-maker" /></div>
          <div className={fld}><label className={fl}>Industry / sector</label>
            <select className={fs} value={data.sector} onChange={e => update('sector', e.target.value)}>
              <option value="">Select sector</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className={fld}><label className={fl}>Brief received date</label><input className={fi} type="date" value={data.briefDate} onChange={e => update('briefDate', e.target.value)} /></div>
        </div>

        <SectionDivider label="Event overview" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className={fld}><label className={fl}>Expected attendance</label><input className={fi} value={data.attendance} onChange={e => update('attendance', e.target.value)} placeholder="e.g. 1,000 – 2,000" /></div>
          <div className={fld}><label className={fl}>Event duration</label><input className={fi} value={data.duration} onChange={e => update('duration', e.target.value)} placeholder="e.g. Full-day event, 08:00 AM – 10:00 PM" /></div>
        </div>
        <div className={fld + ' mb-4'}><label className={fl}>Event description — one paragraph for the brief</label><textarea className={fi} rows={3} value={data.evtDesc} onChange={e => update('evtDesc', e.target.value)} placeholder="e.g. This is not a standard gym event. It is a high-energy spectator-driven production…" /></div>

        <SectionDivider label="Event objectives" />
        <CardPicker options={OBJECTIVES} value={data.obj} onChange={v => update('obj', v)} columns={3} />

        <SectionDivider label="KPIs & success metrics" />
        <div className="grid grid-cols-2 gap-4">
          <div className={fld}><label className={fl}>Primary KPI</label><input className={fi} value={data.kpi} onChange={e => update('kpi', e.target.value)} placeholder="e.g. 5,000 attendees, 10M impressions, ₦200M brand exposure" /></div>
          <div className={fld}><label className={fl}>Secondary KPIs</label><input className={fi} value={data.kpi2} onChange={e => update('kpi2', e.target.value)} placeholder="e.g. Social reach, press features, sponsor activations" /></div>
          <div className={fld}><label className={fl}>Brand restrictions / must-not-do</label><input className={fi} value={data.restrict} onChange={e => update('restrict', e.target.value)} placeholder="e.g. No competitor mentions, no alcohol branding" /></div>
          <div className={fld}><label className={fl}>Previous events — context</label><input className={fi} value={data.prev} onChange={e => update('prev', e.target.value)} placeholder="e.g. 3rd year of the event, inaugural edition" /></div>
        </div>
      </div>
    </div>
  )
}
