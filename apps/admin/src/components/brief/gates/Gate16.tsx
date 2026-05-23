import { useState } from 'react'
import type { BriefData } from '@/types/brief'
import { calcBudget, calcFee, calcCapacityMetrics, fN, generateClientBrief, generateInternalBrief, generateBudgetBrief, downloadHtml } from '@/lib/briefUtils'
import GateHero from '../GateHero'
import SectionDivider from '../SectionDivider'
import Callout from '../Callout'

interface Props { data: BriefData; update: <K extends keyof BriefData>(k: K, v: BriefData[K]) => void }

const DOCS = [
  {
    id: 'client',
    title: 'Client Event Brief',
    desc: 'Scope, objectives, budget summary, and SlayR scope of work — formatted for client sign-off.',
    generate: generateClientBrief,
    filename: (d: BriefData) => `${d.evtName || 'brief'}-client.html`,
  },
  {
    id: 'internal',
    title: 'Internal Production Brief',
    desc: 'Full production detail — creative direction, contacts, open items, and programme. For SlayR desk use only.',
    generate: generateInternalBrief,
    filename: (d: BriefData) => `${d.evtName || 'brief'}-internal.html`,
  },
  {
    id: 'budget',
    title: 'Budget & P&L Brief',
    desc: 'Complete financial model — cost breakdown, revenue breakdown, net P&L, and break-even analysis.',
    generate: generateBudgetBrief,
    filename: (d: BriefData) => `${d.evtName || 'brief'}-budget.html`,
  },
]

function riskVariant(level: 'Low' | 'Medium' | 'High' | 'Very High'): string {
  if (level === 'Low') return 'bg-[#E1F5EE] text-[#0F6E56]'
  if (level === 'Medium') return 'bg-[#FAEEDA] text-[#854F0B]'
  return 'bg-[#FAECE7] text-[#993C1D]'
}

function completionPct(data: BriefData): number {
  const checks = [
    !!data.client, !!data.evtName, !!data.fmt, !!data.obj,
    !!data.centralIdea, !!data.cap, data.capNum > 0,
    data.coreServices.length > 0, !!data.talent,
    data.c1 > 0 || data.c2 > 0, !!data.fee, data.feeBase > 0,
    data.slayrContacts.some(c => c.name), !!data.deckStyle, data.leadWeeks > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export default function Gate16({ data }: Props) {
  const [openDoc, setOpenDoc] = useState<string | null>(null)
  const { totalCosts, totalRevenue, netPL } = calcBudget(data)
  const { totalFee } = calcFee(data.feeBase, data.feePct)
  const { leadTime, riskTier } = calcCapacityMetrics(data.capNum, data.days)
  const pct = completionPct(data)

  const permitsSecured = Object.values(data.permitStatuses).filter(v => v === 'secured').length
  const permitsTotal = Object.keys(data.permitStatuses).length
  const permitsLabel = permitsTotal === 0 ? 'Not started' : `${permitsSecured} / ${permitsTotal} secured`
  const permitsRisk = permitsSecured === permitsTotal && permitsTotal > 0 ? 'Low' : permitsTotal === 0 ? 'High' : 'Medium'

  const timelineRisk: 'Low' | 'Medium' | 'High' = data.leadWeeks >= 16 ? 'Low' : data.leadWeeks >= 10 ? 'Medium' : 'High'
  const budgetRisk: 'Low' | 'Medium' | 'High' = netPL >= 0 ? 'Low' : netPL > -10_000_000 ? 'Medium' : 'High'

  const SUMMARY = [
    ['Client', data.client || '—'],
    ['Event name', data.evtName || '—'],
    ['Edition', data.edition || '—'],
    ['Format', data.fmt || '—'],
    ['SlayR role', data.role || '—'],
    ['Sector', data.sector || '—'],
    ['Objective', data.obj || '—'],
    ['Capacity / day', data.capNum.toLocaleString()],
    ['Event days', String(data.days)],
    ['Tour type', data.tour || 'Single city'],
    ['Capacity tier', data.cap || '—'],
    ['Talent model', data.talent || '—'],
    ['Lead time required', leadTime],
    ['Risk tier', riskTier],
    ['Core services', data.coreServices.length > 0 ? `${data.coreServices.length} services confirmed` : '—'],
    ['Competition type', data.compType || 'None'],
    ['Activities', data.activities.length > 0 ? `${data.activities.length} activities` : '—'],
    ['Permits', permitsLabel],
    ['Fee model', data.fee || '—'],
    ['Management fee', totalFee > 0 ? fN(totalFee) : '—'],
    ['Total production cost', totalCosts > 0 ? fN(totalCosts) : '—'],
    ['Total revenue', totalRevenue > 0 ? fN(totalRevenue) : '—'],
    ['Net P&L', totalCosts > 0 ? `${netPL >= 0 ? '+' : ''}${fN(netPL)}` : '—'],
    ['Lead weeks', `${data.leadWeeks} weeks`],
    ['Deck style', data.deckStyle || '—'],
  ]

  const RISK_MATRIX: [string, 'Low' | 'Medium' | 'High' | 'Very High', string][] = [
    ['Compliance & permits', permitsRisk as 'Low' | 'Medium' | 'High', permitsLabel],
    ['Production timeline', timelineRisk, `${data.leadWeeks}w lead — ${timelineRisk === 'Low' ? 'comfortable runway' : timelineRisk === 'Medium' ? 'manageable but tight' : 'critically short'}`],
    ['Financial viability', budgetRisk, netPL >= 0 ? `Surplus ${fN(netPL)}` : `Deficit ${fN(Math.abs(netPL))}`],
    ['Capacity & crowd risk', riskTier as 'Low' | 'Medium' | 'High' | 'Very High', `${data.capNum.toLocaleString()} / day — ${riskTier} tier`],
    ['Commercial sign-off', data.fee && data.paymentTerms.length > 0 ? 'Low' : 'Medium', data.fee ? `${data.fee} agreed` : 'Fee model not confirmed'],
    ['Creative readiness', data.centralIdea ? 'Low' : 'Medium', data.centralIdea ? `Central idea defined` : 'Creative direction pending'],
  ]

  return (
    <div>
      <GateHero gateNum="16" section="Sign-off" title="Brief & Deliverables" subtitle="Review the complete brief summary, assess risk, and export production documents." />
      <div className="px-12 py-8">

        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
            <div className="h-2 bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm font-semibold text-primary w-16 text-right">{pct}% complete</span>
        </div>

        {pct < 80 && (
          <Callout variant="gold">This brief is {pct}% complete. Review earlier gates to fill in missing fields before exporting documents or presenting to the client.</Callout>
        )}
        {pct >= 80 && (
          <Callout variant="green">Brief is {pct}% complete. All critical fields have been filled. You can now export documents and present to the client.</Callout>
        )}

        <SectionDivider label="Brief summary" />
        <div className="border border-border rounded-lg overflow-hidden mb-6">
          <div className="grid bg-secondary border-b-2 border-foreground" style={{ gridTemplateColumns: '220px 1fr' }}>
            {['Field', 'Value'].map(h => (
              <div key={h} className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</div>
            ))}
          </div>
          {SUMMARY.map(([label, value]) => (
            <div key={label} className="grid border-b border-border last:border-0" style={{ gridTemplateColumns: '220px 1fr' }}>
              <div className="px-4 py-2.5 text-xs font-medium text-muted-foreground border-r border-border bg-secondary/50">{label}</div>
              <div className={`px-4 py-2.5 text-sm ${value === '—' ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>{value}</div>
            </div>
          ))}
        </div>

        <SectionDivider label="Risk assessment" />
        <div className="border border-border rounded-lg overflow-hidden mb-6">
          <div className="grid bg-secondary border-b-2 border-foreground" style={{ gridTemplateColumns: '220px 120px 1fr' }}>
            {['Category', 'Risk level', 'Detail'].map(h => (
              <div key={h} className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</div>
            ))}
          </div>
          {RISK_MATRIX.map(([cat, level, detail]) => (
            <div key={cat} className="grid border-b border-border last:border-0 items-center" style={{ gridTemplateColumns: '220px 120px 1fr' }}>
              <div className="px-4 py-3 text-sm font-medium text-foreground border-r border-border">{cat}</div>
              <div className="px-4 py-3 border-r border-border">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${riskVariant(level)}`}>{level}</span>
              </div>
              <div className="px-4 py-3 text-xs text-muted-foreground">{detail}</div>
            </div>
          ))}
        </div>

        <SectionDivider label="Export documents" />
        <div className="flex flex-col gap-3 mb-6">
          {DOCS.map(doc => (
            <div key={doc.id} className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenDoc(openDoc === doc.id ? null : doc.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition-colors"
              >
                <div>
                  <div className="text-sm font-semibold text-foreground">{doc.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{doc.desc}</div>
                </div>
                <span className="text-muted-foreground text-lg ml-4">{openDoc === doc.id ? '−' : '+'}</span>
              </button>
              {openDoc === doc.id && (
                <div className="px-5 pb-5 border-t border-border bg-secondary/30">
                  <p className="text-xs text-muted-foreground py-3">Click export to generate an HTML file. Open in any browser and use File → Print → Save as PDF to create a PDF version.</p>
                  <button
                    type="button"
                    onClick={() => downloadHtml(doc.generate(data), doc.filename(data))}
                    className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Export {doc.title}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <SectionDivider label="Deliverables confirmed" />
        {data.coreServices.length === 0 && data.optionalServices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services confirmed yet. Complete Gate 06 to populate the deliverables list.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[...data.coreServices, ...data.optionalServices].map(s => (
              <div key={s} className="flex items-start gap-2.5 px-4 py-3 bg-card border border-border rounded-lg text-sm">
                <span className="mt-0.5 w-2 h-2 rounded-full bg-success flex-shrink-0" />
                <span className="text-foreground">{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
