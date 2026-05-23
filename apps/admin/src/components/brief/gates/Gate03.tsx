import type { BriefData } from '@/types/brief'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import ChecklistItem from '../ChecklistItem'

const CREATIVE_DELIVERABLES = [
  { label: 'Event name treatment and visual identity', description: 'Logo, colour language, typography — full brand system for the event' },
  { label: 'Digital assets', description: 'Flyers, social media templates, countdown content, hype reels' },
  { label: 'Stage and competition zone design', description: 'Backdrops, banners, signage, athlete staging — all physical branding' },
  { label: 'On-ground brand application', description: 'Entry points, spectator areas, sponsor zones, food village dressing' },
  { label: 'Art direction brief for photography and video teams', description: 'Shot list, framing guidelines, mood reference for content crew' },
]

const EXPERIENCE_COVERAGE = [
  { label: 'Photography — full event documentation', description: 'Competition shots, crowd moments, activations, ceremony, BTS' },
  { label: 'Videography — full-day capture', description: 'Wide coverage, close-ups, crowd atmosphere, red carpet / interviews' },
  { label: 'Highlight reel — social-ready edit', description: 'Short-form edit for social media. Delivered within agreed turnaround.' },
  { label: 'Live stream / broadcast', description: 'Live feed to social media, TV broadcast, or on-site screen display' },
  { label: 'BTS content — behind the scenes', description: 'Brand storytelling content throughout production and event day' },
  { label: 'Pre-event / production day coverage', description: 'Build documentation, setup, crew, and venue dressing capture' },
  { label: 'Post-event social media rollout', description: 'Content package delivered to client for their own channels' },
]

const TURNAROUND = ['Within 72 hours', 'Within 7 days', 'Within 14 days', 'To be agreed']
const GALLERY_TURNAROUND = ['Within 7 days', 'Within 14 days', 'Within 30 days', 'To be agreed']

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

function toggleList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

export default function Gate03({ data, update }: Props) {
  const fi = 'w-full px-3 py-2 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
  const fs = fi + ' appearance-none'
  const fl = 'block text-xs font-medium text-muted-foreground mb-1.5'
  const fld = 'flex flex-col'

  return (
    <div>
      <GateHero gateNum="03" section="Client Intake" title="Event Identity & Creative Direction" subtitle="Define the creative concept, tone, and visual language before any design work begins. This gate feeds directly into both the Client Brief and the Internal Production Brief." />
      <div className="px-12 py-8">
        <SectionDivider label="Central creative concept" />
        <div className="grid gap-4 mb-4">
          <div className={fld}><label className={fl}>Central idea / tagline</label><input className={fi} value={data.centralIdea} onChange={e => update('centralIdea', e.target.value)} placeholder='e.g. "Sound of a Generation" — your event big idea' /></div>
          <div className={fld}><label className={fl}>Concept description — what does this event stand for?</label><textarea className={fi} rows={3} value={data.conceptDesc} onChange={e => update('conceptDesc', e.target.value)} placeholder="e.g. Strength is not just physical — it is something carried in the community…" /></div>
        </div>

        <SectionDivider label="Colour & tone direction" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className={fld}><label className={fl}>Dominant / primary colour</label><input className={fi} value={data.colour1} onChange={e => update('colour1', e.target.value)} placeholder="e.g. Red — fire, power, and intensity" /></div>
          <div className={fld}><label className={fl}>Supporting colours</label><input className={fi} value={data.colour2} onChange={e => update('colour2', e.target.value)} placeholder="e.g. Black and white — amplify contrast" /></div>
          <div className={fld + ' col-span-2'}><label className={fl}>Colour application — where and how it appears</label><input className={fi} value={data.colourApp} onChange={e => update('colourApp', e.target.value)} placeholder="e.g. Stage design, athlete branding, digital assets, signage, lighting effects" /></div>
        </div>

        <SectionDivider label="Three creative pillars" />
        <div className="grid grid-cols-3 gap-4 mb-4">
          {([1, 2, 3] as const).map(n => (
            <div key={n} className="flex flex-col gap-2">
              <div className={fld}><label className={fl}>Pillar {String(n).padStart(2, '0')} — title</label><input className={fi} value={data[`pillar${n}t`]} onChange={e => update(`pillar${n}t`, e.target.value)} placeholder={`e.g. ${['Power & Spectacle', 'Community & Pride', 'Festival Energy'][n - 1]}`} /></div>
              <div className={fld}><label className={fl}>Description</label><textarea className={fi} rows={2} value={data[`pillar${n}d`]} onChange={e => update(`pillar${n}d`, e.target.value)} /></div>
            </div>
          ))}
        </div>

        <SectionDivider label="Creative deliverables SlayR will produce" />
        <div className="flex flex-col gap-2 mb-4">
          {CREATIVE_DELIVERABLES.map(item => (
            <ChecklistItem key={item.label} label={item.label} description={item.description} checked={data.creativeDeliverables.includes(item.label)} onChange={() => update('creativeDeliverables', toggleList(data.creativeDeliverables, item.label))} />
          ))}
        </div>

        <SectionDivider label="Additional creative notes" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className={fld}><label className={fl}>Mood / aesthetic references</label><input className={fi} value={data.moodRef} onChange={e => update('moodRef', e.target.value)} placeholder="e.g. Raw industrial, cinematic sports broadcast, Afrofuturist" /></div>
          <div className={fld}><label className={fl}>Creative restrictions or must-avoids</label><input className={fi} value={data.creativeRestrict} onChange={e => update('creativeRestrict', e.target.value)} placeholder="e.g. No competitor brand colours, no wellness / soft aesthetic" /></div>
        </div>

        <SectionDivider label="Experience & coverage" />
        <div className="flex flex-col gap-2 mb-4">
          {EXPERIENCE_COVERAGE.map(item => (
            <ChecklistItem key={item.label} label={item.label} description={item.description} checked={data.experienceCoverage.includes(item.label)} onChange={() => update('experienceCoverage', toggleList(data.experienceCoverage, item.label))} />
          ))}
        </div>

        <SectionDivider label="Content delivery specifications" />
        <div className="grid grid-cols-3 gap-4">
          <div className={fld}><label className={fl}>Content delivery format</label><input className={fi} value={data.delivFormat} onChange={e => update('delivFormat', e.target.value)} placeholder="e.g. Gallery (hi-res JPG) + Highlight reel (MP4) + Raw archive" /></div>
          <div className={fld}><label className={fl}>Highlight reel turnaround</label>
            <select className={fs} value={data.reelTurnaround} onChange={e => update('reelTurnaround', e.target.value)}>
              <option value="">Select</option>
              {TURNAROUND.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className={fld}><label className={fl}>Full gallery turnaround</label>
            <select className={fs} value={data.galleryTurnaround} onChange={e => update('galleryTurnaround', e.target.value)}>
              <option value="">Select</option>
              {GALLERY_TURNAROUND.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
