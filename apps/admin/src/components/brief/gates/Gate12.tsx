import type { BriefData } from '@/types/brief'
import { calcFee, fN } from '@/lib/briefUtils'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import CardPicker from '../CardPicker'
import RangeSlider from '../RangeSlider'
import ChecklistItem from '../ChecklistItem'

const FEE_MODELS = [
  { value: 'Fixed management fee', title: 'Fixed management fee', body: 'Agreed lump sum. Predictable for both parties.', chips: ['Simple'] },
  { value: '% of total event budget', title: '% of total event budget', body: 'Fee tied to total event budget. Scales with scope.', chips: ['Standard'], flag: 'Standard' },
  { value: 'Base fee + profit share', title: 'Base fee + profit share', body: 'Lower retainer + % of net profit. Aligned incentives.', chips: ['Upside share'] },
  { value: 'Per-service line items', title: 'Per-service line items', body: 'Each service billed separately. Maximum transparency.', chips: ['Itemised'] },
  { value: 'Retainer + project fee', title: 'Retainer + project fee', body: 'Monthly retainer for ongoing work + event fee at close.', chips: ['Ongoing clients'] },
]

const OPEN_ITEMS = [
  { label: 'Venue — confirmed and contracted', description: 'Site agreement signed before production begins' },
  { label: 'Event date — locked', description: 'No date changes after production milestone 2' },
  { label: 'Competition events — final selection agreed', description: 'All categories and events confirmed before AV spec' },
  { label: 'Prize fund, trophies, sponsor products — confirmed', description: 'Procurement lead time may be 4–6 weeks' },
  { label: 'Permits and government approvals — submitted', description: 'All applications in progress by week 3 of production' },
  { label: 'Sponsor list provided to SlayR', description: 'For branding, space allocation, and activation planning' },
  { label: 'Live band sourced and rider collected', description: 'If applicable — 8 week lead for specialist acts' },
  { label: 'On-site medical support and safety officer appointed', description: 'NSCDC requirement for events above 500 capacity' },
]

const PAYMENT_TERMS = [
  { label: '50% management fee on contract signing', description: 'Non-negotiable. Production does not begin without payment.' },
  { label: 'All vendor costs invoiced to client', description: 'SlayR pays vendors and recharges. Float may be required.' },
  { label: 'Scope change clause', description: 'Any additions to scope after brief lock are billed at agreed day rate.' },
  { label: 'Cancellation policy — 70% fee retained if cancelled within 8 weeks', description: 'Full fee retained if cancelled within 4 weeks of event.' },
  { label: 'SlayR credited on all event materials', description: 'Required on all print, digital, and broadcast materials.' },
]

function toggleList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

export default function Gate12({ data, update }: Props) {
  const { totalFee, retainer, midProduction, completion } = calcFee(data.feeBase, data.feePct)

  return (
    <div>
      <GateHero gateNum="12" section="Commercial & Legal" title="Commercial Terms" subtitle="Agree the fee structure, payment schedule, and open items before brief lock. No production begins without a signed commercial agreement." />
      <div className="px-12 py-8">
        <SectionDivider label="SlayR fee model" />
        <CardPicker options={FEE_MODELS} value={data.fee} onChange={v => update('fee', v)} columns={3} />

        <SectionDivider label="Fee calculator" />
        <RangeSlider label="Total approved event budget (₦)" value={data.feeBase} min={10000000} max={1000000000} step={1000000} format={fN} onChange={v => update('feeBase', v)} />
        <RangeSlider label="Management fee %" value={data.feePct} min={8} max={25} step={1} format={n => `${n}%`} onChange={v => update('feePct', v)} bands={['8%', '12%', '15%', '20%', '25%']} />

        <div className="bg-accent border border-primary/20 rounded-xl p-6 mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-1">Total management fee</p>
          <p className="text-5xl font-bold text-primary leading-none mb-4">{fN(totalFee)}</p>
          <div className="grid grid-cols-3 gap-3">
            {[['Retainer (50% on sign)', retainer], ['Mid-production (30%)', midProduction], ['Completion (20%)', completion]].map(([label, val]) => (
              <div key={String(label)} className="bg-card border border-primary/20 rounded-lg p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">{label}</p>
                <p className="text-lg font-bold text-accent-foreground">{fN(Number(val))}</p>
              </div>
            ))}
          </div>
        </div>

        <SectionDivider label="Open items & decisions" />
        <div className="flex flex-col gap-2 mb-4">
          {OPEN_ITEMS.map(item => (
            <ChecklistItem key={item.label} label={item.label} description={item.description} checked={data.openItems.includes(item.label)} onChange={() => update('openItems', toggleList(data.openItems, item.label))} />
          ))}
        </div>

        <SectionDivider label="Payment schedule & protections" />
        <div className="flex flex-col gap-2">
          {PAYMENT_TERMS.map(item => (
            <ChecklistItem key={item.label} label={item.label} description={item.description} checked={data.paymentTerms.includes(item.label)} onChange={() => update('paymentTerms', toggleList(data.paymentTerms, item.label))} />
          ))}
        </div>
      </div>
    </div>
  )
}
