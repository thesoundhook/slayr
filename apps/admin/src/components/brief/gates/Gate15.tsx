import type { BriefData } from '@/types/brief'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import RangeSlider from '../RangeSlider'
import Callout from '../Callout'

interface Milestone {
  phase: string
  tasks: string[]
  weekOffset: number // negative = weeks before event
}

function buildMilestones(weeks: number): Milestone[] {
  const w = (fraction: number) => Math.round(weeks * fraction)
  return [
    {
      phase: 'Week 1 — Brief lock & commercial',
      tasks: ['Commercial terms signed', 'Brief locked and approved', 'Compliance officer assigned', 'SlayR onboarding call with client'],
      weekOffset: -weeks,
    },
    {
      phase: `Week ${w(0.08) + 1}–${w(0.25)} — Venue, permits & talent`,
      tasks: ['Venue confirmed and contracted', 'Permit applications submitted (LASSC, Police, LGA)', 'Headliner term sheet issued', 'Content team briefed'],
      weekOffset: -Math.round(weeks * 0.75),
    },
    {
      phase: `Week ${w(0.25) + 1}–${w(0.5)} — Design & procurement`,
      tasks: ['Creative direction sign-off', 'Stage and AV design approved', 'All vendors selected and contracted', 'Ticket platform live'],
      weekOffset: -Math.round(weeks * 0.5),
    },
    {
      phase: `Week ${w(0.5) + 1}–${w(0.7)} — Marketing & activations`,
      tasks: ['Campaign launches (digital + OOH)', 'Headliner confirmed publicly', 'Sponsor activations briefed', 'Security & medical firms locked'],
      weekOffset: -Math.round(weeks * 0.3),
    },
    {
      phase: `Week ${w(0.7) + 1}–${w(0.85)} — Production build`,
      tasks: ['Site surveys and technical inspections', 'Final permits secured', 'Crew schedule issued', 'Artist riders finalised and distributed'],
      weekOffset: -Math.round(weeks * 0.15),
    },
    {
      phase: `Week ${w(0.85) + 1}–${weeks - 1} — Advance week`,
      tasks: ['Full build and install complete', 'Technical rehearsals and sound checks', 'Credentialing and access control briefing', 'Medical and safety walkthrough'],
      weekOffset: -1,
    },
    {
      phase: 'Event day',
      tasks: ['Doors open and operations active', 'All teams radio-checked and briefed', 'Live content production running'],
      weekOffset: 0,
    },
    {
      phase: 'Post-event',
      tasks: ['Strike and site clear within 48h', 'Client debrief within 7 days', 'Final billing and content handover', 'Post-event report delivered'],
      weekOffset: 1,
    },
  ]
}

function calloutVariant(weeks: number): 'red' | 'gold' | 'green' {
  if (weeks < 8) return 'red'
  if (weeks < 14) return 'gold'
  return 'green'
}

function calloutText(weeks: number): string {
  if (weeks < 8) return `${weeks}-week lead time is critically short. Permits alone require 8–12 weeks. This timeline significantly increases cost, risk, and the likelihood of compliance failures. Consider postponement.`
  if (weeks < 12) return `${weeks} weeks is tight but achievable for events under 5,000 capacity. Permit applications must be submitted in week one. No scope changes after week three.`
  if (weeks < 20) return `${weeks} weeks is a workable lead time for a mid-scale event. All milestones are achievable at normal pace with this runway.`
  return `${weeks} weeks gives strong runway. Use the additional time to secure better vendor rates, run a pre-event site visit, and build a more robust marketing campaign.`
}

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

export default function Gate15({ data, update }: Props) {
  const milestones = buildMilestones(data.leadWeeks)
  const variant = calloutVariant(data.leadWeeks)

  return (
    <div>
      <GateHero gateNum="15" section="Sign-off" title="Production Timeline" subtitle="Set the lead time and review the production milestone schedule. All milestone dates are generated from the event date backward." />
      <div className="px-12 py-8">
        <SectionDivider label="Lead time" />
        <RangeSlider
          label="Weeks to event day"
          value={data.leadWeeks}
          min={4}
          max={52}
          step={1}
          format={n => `${n} weeks`}
          onChange={v => update('leadWeeks', v)}
          bands={['4 wks', '12 wks', '20 wks', '36 wks', '52 wks']}
        />

        <Callout variant={variant}>{calloutText(data.leadWeeks)}</Callout>

        <SectionDivider label="Milestone schedule" />
        <p className="text-xs text-muted-foreground mb-4">Phase schedule generated from a {data.leadWeeks}-week lead time. Adjust the slider above to recalculate.</p>

        <div className="flex flex-col gap-2">
          {milestones.map((m, i) => (
            <div key={m.phase} className={`border rounded-lg overflow-hidden ${m.weekOffset === 0 ? 'border-primary/60 bg-accent' : 'border-border bg-card'}`}>
              <div className="grid items-stretch" style={{ gridTemplateColumns: '200px 1fr' }}>
                <div className={`flex flex-col justify-center px-4 py-3 border-r border-border text-xs font-semibold ${m.weekOffset === 0 ? 'bg-primary text-primary-foreground border-primary/60' : 'bg-secondary text-foreground'}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60 mb-0.5">Phase {String(i + 1).padStart(2, '0')}</span>
                  {m.phase}
                </div>
                <ul className="px-4 py-3 flex flex-col gap-1">
                  {m.tasks.map(t => (
                    <li key={t} className="flex items-start gap-2 text-xs text-foreground">
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.weekOffset === 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 border border-border rounded-lg bg-secondary text-xs text-muted-foreground">
          <strong className="text-foreground">SlayR production rule:</strong> No event above 1,000 capacity proceeds to production without a signed brief, commercial terms, and written evidence that permit applications have been submitted. This check is non-negotiable regardless of lead time.
        </div>
      </div>
    </div>
  )
}
