import type { BriefData } from '@/types/brief'
import { calcCapacityMetrics, fC } from '@/lib/briefUtils'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import CardPicker from '../CardPicker'
import RangeSlider from '../RangeSlider'
import MetricsRow from '../MetricsRow'
import Callout from '../Callout'

const CAPACITY_TIERS = [
  { value: 'Entry level', title: 'Entry level', body: '500–5,000 cap. Lower risk, simpler permits. Inaugural events.', chips: ['500–5k', '12–16 wks', 'Low complexity'] },
  { value: 'Mid-tier', title: 'Mid-tier festival / concert', body: '5,000–15,000. Standard large-scale event.', chips: ['5k–15k', '20–28 wks', 'Medium'], flag: 'Standard' },
  { value: 'Major', title: 'Major event', body: '15,000–40,000. Landmark status.', chips: ['15k–40k', '32–48 wks', 'High'] },
  { value: 'Arena / stadium', title: 'Arena / stadium', body: 'Venue-defined capacity. Typically 10,000–60,000.', chips: ['10k–60k', '24–36 wks', 'Venue-led'] },
  { value: 'National tour', title: 'National tour (per stop)', body: '1,000–8,000 per city. Shared traveling rig.', chips: ['Per stop', 'Touring rig', '36–52 wks total'] },
  { value: 'Mega flagship', title: 'Mega / flagship', body: '40,000–100,000+. Institutional backing.', chips: ['40k–100k+', '12+ months', 'Institutional'] },
]

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

export default function Gate05({ data, update }: Props) {
  const m = calcCapacityMetrics(data.capNum, data.days)
  const totalReach = data.capNum * data.days

  return (
    <div>
      <GateHero gateNum="05" section="Production Scope" title="Scale & Capacity" subtitle="The most important single decision. Capacity sets the floor on production cost, crew size, permit tier, and risk profile. Be honest before committing." />
      <div className="px-12 py-8">
        <SectionDivider label="Capacity tier" />
        <CardPicker
          options={CAPACITY_TIERS}
          value={data.cap}
          onChange={v => {
            const tierCaps: Record<string, number> = {
              'Entry level': 2500, 'Mid-tier': 10000, 'Major': 25000,
              'Arena / stadium': 20000, 'National tour': 3000, 'Mega flagship': 60000,
            }
            update('cap', v)
            update('capNum', tierCaps[v] ?? data.capNum)
          }}
          columns={3}
        />

        <SectionDivider label="Dial in capacity & duration" />
        <RangeSlider
          label="Capacity per day"
          value={data.capNum}
          min={500}
          max={80000}
          step={100}
          format={n => n.toLocaleString()}
          onChange={v => update('capNum', v)}
          bands={['500', '5k', '15k', '40k', '80k']}
        />
        <RangeSlider
          label="Event days"
          value={data.days}
          min={1}
          max={5}
          step={1}
          format={n => String(n)}
          onChange={v => update('days', v)}
          bands={['1', '2', '3', '4', '5']}
        />

        <MetricsRow metrics={[
          { label: 'Total reach', value: fC(totalReach), sub: 'across all days' },
          { label: 'Site area', value: m.siteArea, sub: 'minimum outdoor' },
          { label: 'Min crew', value: m.minCrew, sub: 'on event day' },
          { label: 'Lead time', value: m.leadTime, sub: 'from sign-off' },
          { label: 'Risk tier', value: m.riskTier, variant: m.riskVariant },
        ]} />

        {data.capNum > 5000 && (
          <Callout variant="gold">
            At events above 5,000 capacity in Nigeria, a <strong>Lagos State Safety Commission</strong> permit and <strong>LASPPPA</strong> approval are mandatory. Budget 8–12 weeks for permit processing.
          </Callout>
        )}
      </div>
    </div>
  )
}
