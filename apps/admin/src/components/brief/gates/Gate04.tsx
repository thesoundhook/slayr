import type { BriefData } from '@/types/brief'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import CardPicker from '../CardPicker'

const AUDIENCES = [
  { value: 'Gen Z — 18 to 26', title: 'Gen Z — 18 to 26', body: 'Social-native. FOMO-driven. Visual spectacle and creator culture.', chips: ['TikTok / IG first', 'UGC output'] },
  { value: 'Millennials — 27 to 38', title: 'Millennials — 27 to 38', body: 'Higher disposable income. Brand loyalty. Premium pricing tolerance.', chips: ['Higher spend', 'VIP appetite'] },
  { value: 'Mixed 18 to 35', title: 'Mixed 18 to 35', body: 'Broadest commercial sweet spot. Multi-stage serves both groups.', chips: ['Widest reach', 'Highest volume'], flag: 'Most common' },
  { value: 'Family & all ages', title: 'Family & all ages', body: 'All ages event. Family zones, age-appropriate content, daytime programming.', chips: ['Daytime heavy', 'No 18+ content'] },
  { value: 'Industry & professional', title: 'Industry & professional', body: 'Tastemakers, creatives, executives. B2B value. Premium pricing.', chips: ['B2B layer', 'Influence-dense'] },
  { value: 'Diaspora & international', title: 'Diaspora & international', body: 'Targeting Nigerian / African diaspora. Travel packages viable.', chips: ['UK/US/EU', 'Premium'] },
]

const GEOS = [
  { value: 'Lagos only', title: 'Lagos only', body: 'Deepest audience base. Highest production capacity.', chips: [] },
  { value: 'Lagos + Abuja', title: 'Lagos + Abuja', body: "Nigeria's two commercial capitals. Two-stop model.", chips: [] },
  { value: 'Nigeria national', title: 'Nigeria national', body: 'Full national circuit: Lagos, Abuja, PH, Kano, Enugu, Ibadan.', chips: [] },
  { value: 'Ondo State / South-West', title: 'Ondo State / South-West', body: 'Regional focus — Ondo, Akure, Ekiti and South-West states.', chips: [] },
  { value: 'West Africa — regional', title: 'West Africa — regional', body: 'Nigeria + Ghana + Côte d\'Ivoire / Senegal.', chips: [] },
  { value: 'International — UK / US / EU', title: 'International', body: 'Primarily outside Africa. Requires international promoter partnerships.', chips: [] },
]

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

export default function Gate04({ data, update }: Props) {
  const fi = 'w-full px-3 py-2 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
  const fl = 'block text-xs font-medium text-muted-foreground mb-1.5'

  return (
    <div>
      <GateHero gateNum="04" section="Client Intake" title="Audience & Market" subtitle="Who is this event for? The client's brand audience and SlayR's community audience must align. This shapes lineup, pricing, venue choice, and the marketing strategy." />
      <div className="px-12 py-8">
        <SectionDivider label="Primary audience demographic" />
        <CardPicker options={AUDIENCES} value={data.aud} onChange={v => update('aud', v)} columns={3} />

        <SectionDivider label="Specific target audience detail" />
        <div className="flex flex-col mb-4">
          <label className={fl}>Describe the primary attendee in detail</label>
          <textarea className={fi} rows={2} value={data.audDetail} onChange={e => update('audDetail', e.target.value)} placeholder="e.g. Athletes, gym communities, lifestyle enthusiasts, families, and brand partners" />
        </div>

        <SectionDivider label="Geographic market" />
        <CardPicker options={GEOS} value={data.geo} onChange={v => update('geo', v)} columns={3} />

        <SectionDivider label="Demand & community" />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col"><label className={fl}>Client's existing community / fan base</label><input className={fi} value={data.fanbase} onChange={e => update('fanbase', e.target.value)} placeholder="e.g. Brand community, 50k+ social followers, gym / sports network" /></div>
          <div className="flex flex-col"><label className={fl}>Expected demand source</label><input className={fi} value={data.demand} onChange={e => update('demand', e.target.value)} placeholder="e.g. Organic community + gym network + university outreach" /></div>
        </div>
      </div>
    </div>
  )
}
