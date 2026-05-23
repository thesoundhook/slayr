import type { BriefData } from '@/types/brief'
import { calcBudget, fN } from '@/lib/briefUtils'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import MetricsRow from '../MetricsRow'
import Callout from '../Callout'

const COST_FIELDS: { key: keyof BriefData; label: string }[] = [
  { key: 'c1', label: 'Venue / site hire (₦)' },
  { key: 'c2', label: 'Stage & production build (₦)' },
  { key: 'c3', label: 'AV — sound, lights, screens (₦)' },
  { key: 'c4', label: 'Headliner fee (₦)' },
  { key: 'c5', label: 'Support acts total (₦)' },
  { key: 'c6', label: 'Security (₦)' },
  { key: 'c7', label: 'Medical services (₦)' },
  { key: 'c8', label: 'Site infrastructure (₦)' },
  { key: 'c9', label: 'Catering / F&B (₦)' },
  { key: 'c10', label: 'Marketing & advertising (₦)' },
  { key: 'c11', label: 'Permits & insurance (₦)' },
  { key: 'c12', label: 'Artist logistics & riders (₦)' },
  { key: 'c13', label: 'Content production (₦)' },
  { key: 'c14', label: 'Contingency — 10% (₦)' },
]

const REV_FIELDS: { priceKey: keyof BriefData; qtyKey: keyof BriefData; label: string }[] = [
  { priceKey: 'r1p', qtyKey: 'r1q', label: 'GA' },
  { priceKey: 'r2p', qtyKey: 'r2q', label: 'VIP' },
  { priceKey: 'r3p', qtyKey: 'r3q', label: 'VVIP / table' },
]

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

export default function Gate11({ data, update }: Props) {
  const fi = 'w-full px-3 py-2 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
  const fl = 'block text-xs font-medium text-muted-foreground mb-1.5'

  const { totalCosts, ticketRevenue, totalRevenue, netPL, breakEven } = calcBudget(data)

  return (
    <div>
      <GateHero gateNum="11" section="Commercial & Legal" title="Budget & P&L" subtitle="Build the financial model for this event. All figures in Nigerian Naira (₦)." />
      <div className="px-12 py-8">
        <MetricsRow metrics={[
          { label: 'Total costs', value: fN(totalCosts) },
          { label: 'Ticket revenue', value: fN(ticketRevenue) },
          { label: 'Total revenue', value: fN(totalRevenue) },
          { label: 'Net P&L', value: (netPL >= 0 ? '+' : '') + fN(netPL), variant: netPL >= 0 ? 'success' : 'destructive' },
          { label: 'Break-even', value: breakEven.toLocaleString(), sub: 'tickets needed' },
        ]} />

        <Callout variant={netPL >= 0 ? 'green' : 'red'}>
          {netPL >= 0
            ? `Projected surplus of ${fN(netPL)}. Event is viable at current assumptions.`
            : `Projected deficit of ${fN(Math.abs(netPL))}. Review costs or increase revenue assumptions.`}
        </Callout>

        <SectionDivider label="Production cost inputs" />
        <div className="grid grid-cols-3 gap-3 mb-6">
          {COST_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex flex-col">
              <label className={fl}>{label}</label>
              <input type="number" className={fi} value={data[key] as number} onChange={e => update(key, Number(e.target.value))} min={0} />
            </div>
          ))}
        </div>

        <SectionDivider label="Revenue inputs" />
        <div className="grid grid-cols-3 gap-3 mb-4">
          {REV_FIELDS.map(({ priceKey, qtyKey, label }) => (
            <div key={priceKey} className="border border-border rounded-lg p-3 bg-card">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col"><label className={fl}>Price (₦)</label><input type="number" className={fi} value={data[priceKey] as number} onChange={e => update(priceKey, Number(e.target.value))} min={0} /></div>
                <div className="flex flex-col"><label className={fl}>Qty to sell</label><input type="number" className={fi} value={data[qtyKey] as number} onChange={e => update(qtyKey, Number(e.target.value))} min={0} /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col"><label className={fl}>Client fee / brand budget (₦)</label><input type="number" className={fi} value={data.r4} onChange={e => update('r4', Number(e.target.value))} min={0} /></div>
          <div className="flex flex-col"><label className={fl}>Sponsorship income (₦)</label><input type="number" className={fi} value={data.r5} onChange={e => update('r5', Number(e.target.value))} min={0} /></div>
          <div className="flex flex-col"><label className={fl}>Other revenue (₦)</label><input type="number" className={fi} value={data.r6} onChange={e => update('r6', Number(e.target.value))} min={0} /></div>
        </div>
      </div>
    </div>
  )
}
