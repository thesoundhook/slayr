import type { BriefData } from '@/types/brief'
import { fN } from '@/lib/briefUtils'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import CardPicker from '../CardPicker'
import RangeSlider from '../RangeSlider'
import MetricsRow from '../MetricsRow'
import ChecklistItem from '../ChecklistItem'

const TALENT_MODELS = [
  { value: 'Client provides artist — SlayR manages', title: 'Client provides artist — SlayR manages', body: 'Client has already agreed terms with headliner. SlayR handles all rider fulfilment, logistics, and show-day management.', chips: ['Lower fee scope', 'Rider mgmt only'] },
  { value: 'SlayR books full lineup', title: 'SlayR books full lineup', body: 'SlayR handles all artist negotiations, contracts, and bookings within the approved talent budget. Booking fee applies.', chips: ['10–15% booking fee', 'Full service'] },
  { value: 'Co-curated — client approval on all', title: 'Co-curated lineup', body: 'SlayR recommends and negotiates. Client signs off on every booking.', chips: ['Approval process', 'Longer timeline'] },
  { value: 'Open call / audition process', title: 'Open call / audition', body: 'Emerging talent selected via open submission or audition. SlayR manages the process.', chips: ['Community play', '8–12 wks process'] },
]

const ADDITIONAL = [
  { label: 'Comedy / MC / host', description: 'On-stage host and/or comedy acts. Standard for Nigerian large-scale events.' },
  { label: 'Fashion show / brand runway moment', description: 'Integrated fashion presentation — client or partner brands showcased mid-event.' },
  { label: 'Panel / industry talks (daytime programming)', description: 'Pre-show programming for professional audiences. Builds dwell time and content output.' },
  { label: 'DJ / after-party', description: 'Late-night extension after main stage. Separate access control / wristband.' },
]

function toggleList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

export default function Gate07({ data, update }: Props) {
  const totalTalent = data.hlBudget + data.supBudget
  const bookFee = Math.round(totalTalent * 0.12)
  const actsAffordable = Math.floor(data.supBudget / 5000000)

  return (
    <div>
      <GateHero gateNum="07" section="Production Scope" title="Talent & Programming" subtitle="Define the lineup architecture before approaching any agent. Talent spend is typically 30–50% of total event budget. Get the budget signed off first." />
      <div className="px-12 py-8">
        <SectionDivider label="Talent sourcing model" />
        <CardPicker options={TALENT_MODELS} value={data.talent} onChange={v => update('talent', v)} columns={2} />

        <SectionDivider label="Talent budget architecture" />
        <RangeSlider label="Headliner fee budget (₦)" value={data.hlBudget} min={1000000} max={500000000} step={1000000} format={fN} onChange={v => update('hlBudget', v)} />
        <RangeSlider label="Support acts total (₦)" value={data.supBudget} min={500000} max={200000000} step={500000} format={fN} onChange={v => update('supBudget', v)} />

        <MetricsRow metrics={[
          { label: 'Total talent spend', value: fN(totalTalent) },
          { label: 'Implied booking fee 12%', value: fN(bookFee) },
          { label: 'Support acts affordable', value: String(actsAffordable), sub: 'at ₦5M avg' },
        ]} />

        <SectionDivider label="Additional programming" />
        <div className="flex flex-col gap-2">
          {ADDITIONAL.map(item => (
            <ChecklistItem key={item.label} label={item.label} description={item.description} checked={data.additionalProgramming.includes(item.label)} onChange={() => update('additionalProgramming', toggleList(data.additionalProgramming, item.label))} />
          ))}
        </div>
      </div>
    </div>
  )
}
