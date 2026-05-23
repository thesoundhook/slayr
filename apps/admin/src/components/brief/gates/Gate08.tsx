import { useId } from 'react'
import type { BriefData, ActivityRow } from '@/types/brief'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import CardPicker from '../CardPicker'
import Callout from '../Callout'

const COMP_TYPES = [
  { value: 'Concert / live show', title: 'Concert / live show', body: 'Single or multi-act live performance. Main stage, support acts, DJ.', chips: ['Performance-led', 'Stage-first'] },
  { value: 'Festival', title: 'Festival', body: 'Multi-stage, multi-act event with activations, food, and experiences.', chips: ['Multi-zone', 'Full day'] },
  { value: 'Competition / sport event', title: 'Competition / sport event', body: 'A judged or timed competition at the core — fitness, sports, creative, gaming.', chips: ['Competition-led', 'Results-driven'] },
  { value: 'Brand activation / experience', title: 'Brand activation / experience', body: 'Sponsor or brand-driven experiential event. Entertainment supports the activation.', chips: ['Brand-first', 'Activation-led'] },
  { value: 'Corporate / conference', title: 'Corporate / conference', body: 'Professional gathering with keynotes, panels, networking, and entertainment.', chips: ['B2B / corporate', 'Daytime heavy'] },
  { value: 'Award ceremony / gala', title: 'Award ceremony / gala', body: 'Formal recognition event with dinner, entertainment, and award presentations.', chips: ['Black-tie option', 'Prestige format'] },
]

const ACTIVITY_TYPES = ['Performance','Competition','Activation','Ceremony','Panel / Talk','Entertainment','Break / interval','Logistics','Other']

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

export default function Gate08({ data, update }: Props) {
  const uid = useId()
  const fi = 'w-full px-3 py-2 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
  const fs = fi + ' appearance-none'
  const fl = 'block text-xs font-medium text-muted-foreground mb-1.5'

  const addActivity = () => update('activities', [...data.activities, { id: uid + Date.now(), name: '', notes: '', type: '' }])
  const removeActivity = (id: string) => { if (data.activities.length > 1) update('activities', data.activities.filter(a => a.id !== id)) }
  const updateActivity = (id: string, field: keyof ActivityRow, value: string) =>
    update('activities', data.activities.map(a => a.id === id ? { ...a, [field]: value } : a))

  const isComp = data.compType === 'Competition / sport event'

  return (
    <div>
      <GateHero gateNum="08" section="Production Scope" title="Competition Structure" subtitle="For events built around a competition or sport. Define categories, events, eligibility, prizes, and registration. This feeds the Internal Brief and the run of show." />
      <div className="px-12 py-8">
        <SectionDivider label="What type of event is this?" />
        <CardPicker options={COMP_TYPES} value={data.compType} onChange={v => update('compType', v)} columns={3} />

        <SectionDivider label="Event activities — add every element of the programme" />
        <Callout variant="blue">List every planned activity, performance, or segment. These populate the run of show and the internal brief.</Callout>
        <div className="flex flex-col gap-2 mb-3">
          {(data.activities.length > 0 ? data.activities : [{ id: 'default', name: '', notes: '', type: '' }]).map(act => (
            <div key={act.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 1fr 120px 32px' }}>
              <input className={fi} placeholder="Activity name (e.g. Opening Ceremony)" value={act.name} onChange={e => updateActivity(act.id, 'name', e.target.value)} />
              <input className={fi} placeholder="Notes (e.g. 15 min, MC-led, sponsor on stage)" value={act.notes} onChange={e => updateActivity(act.id, 'notes', e.target.value)} />
              <select className={fs} value={act.type} onChange={e => updateActivity(act.id, 'type', e.target.value)}>
                <option value="">Type</option>
                {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <button type="button" onClick={() => removeActivity(act.id)} className="flex items-center justify-center h-9 w-8 text-muted-foreground hover:text-destructive text-lg">×</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addActivity} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-70 transition-opacity">+ Add activity</button>

        {isComp && (
          <>
            <SectionDivider label="Competition details" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col"><label className={fl}>Main competition category</label><input className={fi} value={data.mainCat} onChange={e => update('mainCat', e.target.value)} /></div>
              <div className="flex flex-col"><label className={fl}>Additional categories</label><input className={fi} value={data.optCats} onChange={e => update('optCats', e.target.value)} /></div>
              <div className="flex flex-col"><label className={fl}>Eligibility / entry requirements</label><input className={fi} value={data.eligibility} onChange={e => update('eligibility', e.target.value)} /></div>
              <div className="flex flex-col"><label className={fl}>Registration process</label><input className={fi} value={data.registration} onChange={e => update('registration', e.target.value)} /></div>
              <div className="flex flex-col col-span-2"><label className={fl}>Judging / scoring method</label><input className={fi} value={data.judging} onChange={e => update('judging', e.target.value)} /></div>
            </div>

            <SectionDivider label="Prizes & awards" />
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col"><label className={fl}>1st place</label><input className={fi} value={data.prize1} onChange={e => update('prize1', e.target.value)} placeholder="e.g. ₦500,000 cash + Trophy" /></div>
              <div className="flex flex-col"><label className={fl}>2nd place</label><input className={fi} value={data.prize2} onChange={e => update('prize2', e.target.value)} /></div>
              <div className="flex flex-col"><label className={fl}>3rd place</label><input className={fi} value={data.prize3} onChange={e => update('prize3', e.target.value)} /></div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
