import type { BriefData } from '@/types/brief'

// ─── Formatters ──────────────────────────────────────────────────────────────

export function fN(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(0)}M`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`
  return `₦${n.toLocaleString()}`
}

export function fC(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString()
}

// ─── Calculators ─────────────────────────────────────────────────────────────

export interface CapacityMetrics {
  siteArea: string
  minCrew: string
  leadTime: string
  riskTier: string
  riskVariant: 'success' | 'warning' | 'destructive'
}

export function calcCapacityMetrics(cap: number, days: number): CapacityMetrics {
  const totalReach = cap * days
  const siteArea = Math.max(1, Math.round(cap / 2000)) + ' ha'
  const minCrew = fC(Math.round(cap * 0.03))
  const leadTime =
    cap < 3000 ? '12 wks' : cap < 10000 ? '20 wks' : cap < 25000 ? '32 wks' : '48 wks'
  const riskTier =
    cap < 3000 ? 'Low' : cap < 10000 ? 'Medium' : cap < 25000 ? 'High' : 'Very High'
  const riskVariant: CapacityMetrics['riskVariant'] =
    cap < 3000 ? 'success' : cap < 10000 ? 'warning' : 'destructive'

  void totalReach
  return { siteArea, minCrew, leadTime, riskTier, riskVariant }
}

export interface BudgetCalc {
  totalCosts: number
  ticketRevenue: number
  totalRevenue: number
  netPL: number
  breakEven: number
}

export function calcBudget(data: BriefData): BudgetCalc {
  const totalCosts = data.c1 + data.c2 + data.c3 + data.c4 + data.c5 + data.c6 + data.c7 +
    data.c8 + data.c9 + data.c10 + data.c11 + data.c12 + data.c13 + data.c14
  const ticketRevenue = (data.r1p * data.r1q) + (data.r2p * data.r2q) + (data.r3p * data.r3q)
  const totalRevenue = ticketRevenue + data.r4 + data.r5 + data.r6
  const netPL = totalRevenue - totalCosts
  const totalTickets = data.r1q + data.r2q + data.r3q
  const avgPrice = totalTickets > 0 ? ticketRevenue / totalTickets : 0
  const breakEven = avgPrice > 0 ? Math.ceil(totalCosts / avgPrice) : 0
  return { totalCosts, ticketRevenue, totalRevenue, netPL, breakEven }
}

export interface FeeCalc {
  totalFee: number
  retainer: number
  midProduction: number
  completion: number
}

export function calcFee(base: number, pct: number): FeeCalc {
  const totalFee = base * (pct / 100)
  return {
    totalFee,
    retainer: totalFee * 0.5,
    midProduction: totalFee * 0.3,
    completion: totalFee * 0.2,
  }
}

// ─── Document Generation ─────────────────────────────────────────────────────

function docStyles(): string {
  return `
    <style>
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f8f7f4;color:#1a1a1a;padding:40px}
      .brand-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #1a1a1a}
      .brand-name{font-size:20px;font-weight:700;letter-spacing:-0.02em}
      .brand-sub{font-size:12px;color:#888780;margin-top:2px}
      .doc-title{font-size:36px;font-weight:700;margin-bottom:6px}
      .doc-subtitle{font-size:14px;color:#888780;margin-bottom:24px}
      .meta-table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:32px}
      .meta-table td{padding:6px 0;border-bottom:1px solid #D3D1C7}
      .meta-table td:first-child{color:#888780;width:180px}
      h2{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#888780;margin:28px 0 10px;padding-bottom:6px;border-bottom:1px solid #D3D1C7}
      p,li{font-size:13px;line-height:1.7;color:#1a1a1a}
      ul{padding-left:20px;margin:8px 0}
      .callout{padding:12px 16px;border-left:3px solid #3C3489;background:#EEEDFE;font-size:13px;margin:12px 0;border-radius:0 6px 6px 0}
    </style>
  `
}

function docBase(title: string, subtitle: string, data: BriefData): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title>${docStyles()}</head><body>
    <div class="brand-bar">
      <div><div class="brand-name">SlayR Productions</div><div class="brand-sub">Internal Document — Confidential</div></div>
      <div style="font-size:13px;color:#888780">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>
    <div class="doc-title">${title}</div>
    <div class="doc-subtitle">${subtitle}</div>
    <table class="meta-table">
      <tr><td>Client</td><td>${data.client || '—'}</td></tr>
      <tr><td>Event</td><td>${data.evtName || '—'}</td></tr>
      <tr><td>Edition</td><td>${data.edition || '—'}</td></tr>
      <tr><td>Format</td><td>${data.fmt || '—'}</td></tr>
      <tr><td>SlayR Role</td><td>${data.role || '—'}</td></tr>
      <tr><td>Prepared by</td><td>SlayR Productions</td></tr>
    </table>`
}

export function generateClientBrief(data: BriefData): string {
  const { totalCosts, totalRevenue, netPL } = calcBudget(data)
  return docBase('Client Event Brief', `${data.evtName || 'Untitled Event'} — Client Scope of Work`, data) + `
    <h2>Event Context</h2>
    <p>${data.evtDesc || 'No event description provided.'}</p>
    <h2>Event Objective</h2>
    <p>${data.obj || '—'}</p>
    <h2>Primary KPI</h2>
    <p>${data.kpi || '—'}</p>
    <h2>SlayR Scope of Work</h2>
    <ul>${data.coreServices.map(s => `<li>${s}</li>`).join('')}${data.optionalServices.map(s => `<li>${s}</li>`).join('')}</ul>
    <h2>Budget Summary</h2>
    <p>Total production cost: <strong>${fN(totalCosts)}</strong></p>
    <p>Total projected revenue: <strong>${fN(totalRevenue)}</strong></p>
    <p>Net P&amp;L: <strong style="color:${netPL >= 0 ? '#0F6E56' : '#993C1D'}">${netPL >= 0 ? '+' : ''}${fN(netPL)}</strong></p>
    <h2>Key Contacts</h2>
    <ul>${data.slayrContacts.filter(c => c.name).map(c => `<li><strong>${c.name}</strong> — ${c.role}</li>`).join('')}</ul>
    <h2>Next Steps</h2>
    <div class="callout">Contract signing, brief lock, and permit applications to commence immediately upon engagement.</div>
    <div style="margin-top:48px;padding-top:16px;border-top:1px solid #D3D1C7;font-size:12px;color:#888780">SlayR Productions — Confidential. Not for distribution.</div>
  </body></html>`
}

export function generateInternalBrief(data: BriefData): string {
  const metrics = calcCapacityMetrics(data.capNum, data.days)
  return docBase('Internal Event Brief', `${data.evtName || 'Untitled'} — Production Desk Copy`, data) + `
    <h2>Creative Direction</h2>
    <p><strong>Central idea:</strong> ${data.centralIdea || '—'}</p>
    <p>${data.conceptDesc || ''}</p>
    <h2>Scale & Capacity</h2>
    <p>Tier: ${data.cap || '—'} | Capacity/day: ${data.capNum.toLocaleString()} | Days: ${data.days}</p>
    <p>Lead time: ${metrics.leadTime} | Risk: ${metrics.riskTier} | Min crew: ${metrics.minCrew}</p>
    <h2>Competition Structure</h2>
    <p>Type: ${data.compType || '—'} | Categories: ${data.mainCat || '—'}</p>
    <h2>Event Programme</h2>
    <ul>${data.activities.length > 0 ? data.activities.map(a => `<li><strong>${a.name}</strong>${a.notes ? ` — ${a.notes}` : ''} [${a.type || 'Other'}]</li>`).join('') : '<li>No activities defined yet.</li>'}</ul>
    <h2>Key Contacts</h2>
    <ul>${[...data.slayrContacts, ...data.extContacts].filter(c => c.name).map(c => `<li><strong>${c.name}</strong> (${c.type}) — ${c.role}${c.contact ? ` | ${c.contact}` : ''}</li>`).join('')}</ul>
    <h2>Open Items</h2>
    <ul>${data.openItems.map(i => `<li>${i}</li>`).join('') || '<li>None recorded.</li>'}</ul>
    <div style="margin-top:48px;padding-top:16px;border-top:1px solid #D3D1C7;font-size:12px;color:#888780">SlayR Productions — Internal use only.</div>
  </body></html>`
}

export function generateBudgetBrief(data: BriefData): string {
  const { totalCosts, ticketRevenue, totalRevenue, netPL, breakEven } = calcBudget(data)
  const costLines: [string, number][] = [
    ['Venue / site hire', data.c1], ['Stage & production build', data.c2],
    ['AV — sound, lights, screens', data.c3], ['Headliner fee', data.c4],
    ['Support acts total', data.c5], ['Security', data.c6], ['Medical services', data.c7],
    ['Site infrastructure', data.c8], ['Catering / F&B', data.c9],
    ['Marketing & advertising', data.c10], ['Permits & insurance', data.c11],
    ['Artist logistics & riders', data.c12], ['Content production', data.c13],
    ['Contingency', data.c14],
  ]
  return docBase('Budget & P&L Brief', `${data.evtName || 'Untitled'} — Financial Model`, data) + `
    <h2>Budget Summary</h2>
    <p>Total costs: <strong>${fN(totalCosts)}</strong></p>
    <p>Ticket revenue: <strong>${fN(ticketRevenue)}</strong> | Other revenue: <strong>${fN(data.r4 + data.r5 + data.r6)}</strong></p>
    <p>Total revenue: <strong>${fN(totalRevenue)}</strong></p>
    <p>Net P&amp;L: <strong style="color:${netPL >= 0 ? '#0F6E56' : '#993C1D'}">${netPL >= 0 ? '+' : ''}${fN(netPL)}</strong></p>
    <p>Break-even: <strong>${breakEven.toLocaleString()} tickets</strong></p>
    <h2>Cost Breakdown</h2>
    <ul>${costLines.map(([label, val]) => `<li>${label}: <strong>${fN(val)}</strong></li>`).join('')}</ul>
    <h2>Revenue Breakdown</h2>
    <ul>
      <li>GA tickets (${data.r1q.toLocaleString()} × ${fN(data.r1p)}): <strong>${fN(data.r1p * data.r1q)}</strong></li>
      <li>VIP tickets (${data.r2q.toLocaleString()} × ${fN(data.r2p)}): <strong>${fN(data.r2p * data.r2q)}</strong></li>
      <li>VVIP / tables (${data.r3q.toLocaleString()} × ${fN(data.r3p)}): <strong>${fN(data.r3p * data.r3q)}</strong></li>
      <li>Client fee / brand budget: <strong>${fN(data.r4)}</strong></li>
      <li>Sponsorship income: <strong>${fN(data.r5)}</strong></li>
      <li>Other revenue: <strong>${fN(data.r6)}</strong></li>
    </ul>
    <div style="margin-top:48px;padding-top:16px;border-top:1px solid #D3D1C7;font-size:12px;color:#888780">SlayR Productions — Confidential financial document.</div>
  </body></html>`
}

export function downloadHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
