import type { BriefData } from '@/types/brief'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import ChecklistItem from '../ChecklistItem'

const CORE = [
  { label: 'Stage production — design, construction, rigging', description: 'Full staging package from design through to strike. Sourced from approved suppliers.' },
  { label: 'AV systems — sound, lighting, screens, LED walls', description: 'Full technical specification and vendor management. Includes FOH and monitor mix.' },
  { label: 'Site infrastructure — power, fencing, toilets, waste', description: 'Generator supply, temporary power distribution, fencing, sanitation, LAWMA compliance.' },
  { label: 'Talent booking & artist management', description: 'Negotiation, contract execution, rider fulfilment, artist logistics and green room management.' },
  { label: 'Ticketing platform management', description: 'Ticketing system setup, access control, scanning, and on-the-door management.' },
  { label: 'Security — crowd management & access control', description: 'Licensed private security firm procurement, briefing, crowd flow planning, NSCDC compliance.' },
  { label: 'Medical services provision', description: 'On-site paramedics, ambulance standby, first aid posts. SAN-certified provider.' },
  { label: 'Permits, licensing & compliance', description: 'All Nigerian regulatory permits across all required agencies. Managed by SlayR compliance desk.' },
]

const OPTIONAL = [
  { label: 'Creative direction & branding design', description: 'Full event identity — visual language, stage design, environmental branding, digital assets.' },
  { label: 'Content production — photo, video, live stream', description: 'Multi-camera video, live broadcast, photographer, post-event content delivery.' },
  { label: 'Marketing & PR management', description: 'Campaign strategy, media buying, influencer management, press releases, pre-event hype.' },
  { label: 'VIP experience design & management', description: 'Premium hospitality, VIP lounge design, exclusive access, meet & greet logistics.' },
  { label: 'Merchandise design & on-site retail', description: 'Event merch design, production, stall management, and post-event e-commerce.' },
  { label: 'Sponsorship sales support', description: 'SlayR builds the sponsorship deck, handles outreach, manages sponsor relationships on behalf of client.' },
  { label: 'Post-event reporting & analytics', description: 'Attendance data, social listening report, content performance, sponsor ROI pack, executive summary.' },
]

const VISUAL = [
  { label: 'LED screen / projection — live scoring and sponsor content', description: 'Full display management across event day including content between events' },
  { label: 'Broadcast-quality live feed (if applicable)', description: 'Live display on screens — not necessarily broadcast to TV unless agreed' },
  { label: 'Slideshow / content management between events', description: 'Sponsor slides, athlete profiles, countdown, branding between competition rounds' },
]

const POWER = [
  { label: 'Primary power assessment and connection', description: 'Site power audit before equipment delivery' },
  { label: 'Generator backup — dual redundancy for all critical systems', description: 'No single point of failure on sound, screens, or lighting' },
  { label: 'Cable management and H&S compliance across venue', description: 'All runs taped, matted, or elevated — no trip hazards' },
]

function toggleList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

export default function Gate06({ data, update }: Props) {
  return (
    <div>
      <GateHero gateNum="06" section="Production Scope" title="Production Services" subtitle="Define which production services SlayR is delivering. This determines what gets quoted, what gets subcontracted, and how the management fee is structured." />
      <div className="px-12 py-8">
        <SectionDivider label="Core production services — SlayR delivers" />
        <div className="flex flex-col gap-2 mb-4">
          {CORE.map(item => <ChecklistItem key={item.label} label={item.label} description={item.description} checked={data.coreServices.includes(item.label)} onChange={() => update('coreServices', toggleList(data.coreServices, item.label))} />)}
        </div>

        <SectionDivider label="Optional / enhanced services" />
        <div className="flex flex-col gap-2 mb-4">
          {OPTIONAL.map(item => <ChecklistItem key={item.label} label={item.label} description={item.description} checked={data.optionalServices.includes(item.label)} onChange={() => update('optionalServices', toggleList(data.optionalServices, item.label))} />)}
        </div>

        <SectionDivider label="Visual & display" />
        <div className="flex flex-col gap-2 mb-4">
          {VISUAL.map(item => <ChecklistItem key={item.label} label={item.label} description={item.description} checked={data.visualDisplay.includes(item.label)} onChange={() => update('visualDisplay', toggleList(data.visualDisplay, item.label))} />)}
        </div>

        <SectionDivider label="Power & infrastructure" />
        <div className="flex flex-col gap-2">
          {POWER.map(item => <ChecklistItem key={item.label} label={item.label} description={item.description} checked={data.powerInfra.includes(item.label)} onChange={() => update('powerInfra', toggleList(data.powerInfra, item.label))} />)}
        </div>
      </div>
    </div>
  )
}
