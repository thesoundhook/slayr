import { useState } from 'react'
import type { BriefData } from '@/types/brief'
import { downloadHtml } from '@/lib/briefUtils'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import CardPicker from '../CardPicker'
import Callout from '../Callout'

const DECK_STYLES = [
  { value: 'SlayR Signature', title: 'SlayR Signature', body: 'Deep purple, warm cream, bold typography. SlayR brand-forward.', chips: ['Default'], flag: 'Recommended' },
  { value: 'Bold & Dark', title: 'Bold & Dark', body: 'Dark background, white type, high-contrast. Maximum impact.', chips: ['High impact'] },
  { value: 'Clean & Minimal', title: 'Clean & Minimal', body: 'White background, generous space, refined. Boardroom ready.', chips: ['Boardroom'] },
  { value: 'Brand-led', title: 'Brand-led', body: 'Lead with client brand colours. SlayR mark is secondary.', chips: ['Client-first'] },
]

const ALL_MODULES = [
  'Event Overview',
  'Creative Direction & Identity',
  'Competition & Programme Structure',
  'Experience & Coverage',
  'Event Programming Highlights',
  'Technical Production',
  'Marketing & Promotions Plan',
  'Why SlayR',
  'Scope of Work Summary',
  'Next Steps',
]

const DEFAULT_TALKING_POINTS: Record<string, string> = {
  'Event Overview': 'Introduce the event concept, scale, and strategic purpose. Confirm the format and our role.',
  'Creative Direction & Identity': 'Walk through the central idea, visual language, and pillars that will define the experience.',
  'Competition & Programme Structure': 'Detail competition categories, activity schedule, and prize structure.',
  'Experience & Coverage': 'Cover the audience journey, content production scope, and digital coverage plan.',
  'Event Programming Highlights': 'Headline talent, support acts, special programming moments.',
  'Technical Production': 'Stage and AV capabilities, site infrastructure, safety and medical.',
  'Marketing & Promotions Plan': 'Campaign strategy, timeline, channels, and KPI targets.',
  'Why SlayR': 'Portfolio evidence, team credentials, and what makes SlayR the right partner.',
  'Scope of Work Summary': 'Full service list, deliverables, and what is excluded.',
  'Next Steps': 'Contract signing, deposit payment, and brief lock timeline.',
}

function generatePitchDeck(data: BriefData): string {
  const styleMap: Record<string, { bg: string; fg: string; accent: string; subFg: string }> = {
    'SlayR Signature': { bg: '#3C3489', fg: '#ffffff', accent: '#EEEDFE', subFg: '#c5c2f0' },
    'Bold & Dark': { bg: '#111111', fg: '#ffffff', accent: '#2a2a2a', subFg: '#aaaaaa' },
    'Clean & Minimal': { bg: '#ffffff', fg: '#1a1a1a', accent: '#f8f7f4', subFg: '#888780' },
    'Brand-led': { bg: '#f8f7f4', fg: '#1a1a1a', accent: '#EEEDFE', subFg: '#888780' },
  }
  const s = styleMap[data.deckStyle ?? 'SlayR Signature'] ?? styleMap['SlayR Signature']

  const modules = data.deckModules.length > 0 ? data.deckModules : ALL_MODULES

  const slides = modules.map((mod, i) => {
    const points = data.deckTalkingPoints[mod] || DEFAULT_TALKING_POINTS[mod] || ''
    return `
      <div class="slide" style="background:${i === 0 ? s.bg : s.accent};color:${i === 0 ? s.fg : s.fg};page-break-after:always">
        <div class="slide-num" style="color:${i === 0 ? s.subFg : '#888780'}">${String(i + 1).padStart(2, '0')}</div>
        <div class="slide-body">
          <div class="slide-label" style="color:${i === 0 ? s.subFg : '#888780'}">${data.evtName || 'Event Name'}</div>
          <div class="slide-title" style="color:${i === 0 ? s.fg : '#1a1a1a'}">${mod}</div>
          <div class="slide-text" style="color:${i === 0 ? s.subFg : '#555550'}">${points.replace(/\n/g, '<br>')}</div>
        </div>
      </div>`
  }).join('')

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${data.evtName || 'Pitch Deck'} — SlayR</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#333}
      .cover{background:${s.bg};color:${s.fg};min-height:100vh;display:flex;flex-direction:column;justify-content:flex-end;padding:80px;position:relative}
      .cover-brand{font-size:14px;letter-spacing:0.15em;text-transform:uppercase;color:${s.subFg};margin-bottom:auto;padding-top:48px}
      .cover-title{font-size:64px;font-weight:800;line-height:1;letter-spacing:-0.03em;margin-bottom:16px}
      .cover-tagline{font-size:18px;color:${s.subFg};margin-bottom:48px}
      .cover-meta{font-size:12px;color:${s.subFg};border-top:1px solid ${s.subFg}40;padding-top:16px;display:flex;gap:40px}
      .slide{min-height:100vh;padding:80px;display:flex;flex-direction:column;position:relative}
      .slide-num{font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#888780;margin-bottom:auto;padding-top:48px}
      .slide-body{margin-top:auto}
      .slide-label{font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:16px}
      .slide-title{font-size:48px;font-weight:800;line-height:1.05;letter-spacing:-0.02em;margin-bottom:24px}
      .slide-text{font-size:16px;line-height:1.7;max-width:700px}
      @media print{.slide,.cover{page-break-after:always}}
    </style>
  </head><body>
    <div class="cover">
      <div class="cover-brand">SlayR Productions — Confidential</div>
      <div class="cover-title">${data.evtName || 'Event Name'}</div>
      <div class="cover-tagline">${data.deckTagline || 'Prepared by SlayR Productions'}</div>
      <div class="cover-meta">
        <span>Prepared for: ${data.deckPreparedFor || data.client || '—'}</span>
        <span>Presenter: ${data.deckPresenter || '—'}</span>
        <span>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
    </div>
    ${slides}
    <div style="background:${s.bg};color:${s.subFg};padding:60px 80px;font-size:13px;line-height:1.7">
      <div style="font-size:20px;font-weight:700;color:${s.fg};margin-bottom:8px">SlayR Productions</div>
      <div>${data.deckConfidentiality || 'This document is confidential and intended solely for the named recipient.'}</div>
    </div>
  </body></html>`
}

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

export default function Gate14({ data, update }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const fi = 'w-full px-3 py-2 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
  const fl = 'block text-xs font-medium text-muted-foreground mb-1.5'
  const ta = fi + ' resize-none'

  const toggleModule = (mod: string) => {
    const current = data.deckModules
    update('deckModules', current.includes(mod) ? current.filter(m => m !== mod) : [...current, mod])
  }

  const updateTP = (mod: string, val: string) =>
    update('deckTalkingPoints', { ...data.deckTalkingPoints, [mod]: val })

  return (
    <div>
      <GateHero gateNum="14" section="Sign-off" title="Client Pitch Deck" subtitle="Configure and export the client-facing pitch deck. Select a visual style, choose modules, and customise talking points per slide." />
      <div className="px-12 py-8">
        <SectionDivider label="Deck style" />
        <CardPicker options={DECK_STYLES} value={data.deckStyle} onChange={v => update('deckStyle', v)} columns={2} />

        <SectionDivider label="Deck details" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col"><label className={fl}>Presenter name</label><input className={fi} value={data.deckPresenter} onChange={e => update('deckPresenter', e.target.value)} placeholder="e.g. Benjamin Masebinu" /></div>
          <div className="flex flex-col"><label className={fl}>Prepared for</label><input className={fi} value={data.deckPreparedFor} onChange={e => update('deckPreparedFor', e.target.value)} placeholder="e.g. Coca-Cola Nigeria" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col"><label className={fl}>Cover tagline</label><input className={fi} value={data.deckTagline} onChange={e => update('deckTagline', e.target.value)} placeholder="e.g. Africa's No.1 Street Dance Festival" /></div>
          <div className="flex flex-col"><label className={fl}>Confidentiality note (footer)</label><input className={fi} value={data.deckConfidentiality} onChange={e => update('deckConfidentiality', e.target.value)} placeholder="This document is confidential…" /></div>
        </div>

        <SectionDivider label="Slide modules" />
        <p className="text-xs text-muted-foreground mb-3">Select the sections to include in the deck. Click a module to expand its talking points.</p>
        <div className="flex flex-col gap-1 mb-4">
          {ALL_MODULES.map(mod => {
            const isChecked = data.deckModules.includes(mod)
            const isOpen = expanded === mod
            const tp = data.deckTalkingPoints[mod] ?? DEFAULT_TALKING_POINTS[mod] ?? ''
            return (
              <div key={mod} className={`border rounded-lg overflow-hidden transition-colors ${isChecked ? 'border-primary/40' : 'border-border'}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleModule(mod)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <span className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-primary border-primary' : 'border-border bg-card'}`}>
                      {isChecked && <svg viewBox="0 0 16 16" fill="none" className="h-2.5 w-2.5"><path d="M3 8l4 4 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    <span className={`text-sm font-medium ${isChecked ? 'text-primary' : 'text-foreground'}`}>{mod}</span>
                  </button>
                  {isChecked && (
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : mod)}
                      className="text-xs font-medium text-primary hover:opacity-70 flex-shrink-0"
                    >
                      {isOpen ? 'Collapse' : 'Edit talking points'}
                    </button>
                  )}
                </div>
                {isChecked && isOpen && (
                  <div className="px-4 pb-4 border-t border-border bg-secondary/30">
                    <label className={`${fl} pt-3`}>Talking points for this slide</label>
                    <textarea className={ta} rows={3} value={tp} onChange={e => updateTP(mod, e.target.value)} placeholder={DEFAULT_TALKING_POINTS[mod] ?? 'Add talking points for this slide…'} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <Callout variant="blue">Talking points are speaker notes — they appear on the slide below the title and guide the presenter. They are not transmitted to the client unless you choose to include them.</Callout>

        <SectionDivider label="Export" />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => downloadHtml(generatePitchDeck(data), `${data.evtName || 'pitch-deck'}-SlayR.html`)}
            className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Export pitch deck
          </button>
        </div>
      </div>
    </div>
  )
}
