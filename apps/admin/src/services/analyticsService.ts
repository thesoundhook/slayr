import { supabase } from '@/lib/supabase'

export interface SeriesPoint {
  date: string
  value: number
}

export interface KpiStats {
  revenue: number
  tickets: number
  orders: number
  customers: number
}

export interface KpiStatsWithPrev {
  current: KpiStats
  previous: KpiStats
}

export interface TopEvent {
  event_id: string
  title: string
  revenue: number
  tickets: number
}

export interface CategorySlice {
  category: string
  revenue: number
}

export interface StatusSlice {
  status: string
  count: number
  revenue: number
}

export interface SalesFunnel {
  capacity: number
  sold: number
  scanned: number
}

export interface RecentOrder {
  id: string
  customer_name: string
  customer_email: string
  total: number
  status: string
  created_at: string
  event_title: string | null
  quantity: number
}

// ---------- helpers ----------

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10)
}

function rangeFor(days: number) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { from, to }
}

function emptySeries(days: number): SeriesPoint[] {
  const out: SeriesPoint[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    out.push({ date: isoDay(d), value: 0 })
  }
  return out
}

// ---------- KPIs with deltas ----------

export async function getKpiStats(days: number): Promise<KpiStatsWithPrev> {
  const now = new Date()
  const currentFrom = new Date(now)
  currentFrom.setDate(currentFrom.getDate() - days)
  const previousFrom = new Date(currentFrom)
  previousFrom.setDate(previousFrom.getDate() - days)

  const [currentOrders, previousOrders, currentTickets, previousTickets] = await Promise.all([
    supabase
      .from('orders')
      .select('total, customer_email, status, created_at')
      .gte('created_at', currentFrom.toISOString())
      .lte('created_at', now.toISOString()),
    supabase
      .from('orders')
      .select('total, customer_email, status, created_at')
      .gte('created_at', previousFrom.toISOString())
      .lt('created_at', currentFrom.toISOString()),
    supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', currentFrom.toISOString())
      .lte('created_at', now.toISOString()),
    supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', previousFrom.toISOString())
      .lt('created_at', currentFrom.toISOString()),
  ])

  if (currentOrders.error) throw currentOrders.error
  if (previousOrders.error) throw previousOrders.error
  if (currentTickets.error) throw currentTickets.error
  if (previousTickets.error) throw previousTickets.error

  const fold = (rows: typeof currentOrders.data): KpiStats => {
    const confirmed = (rows ?? []).filter(r => r.status === 'confirmed')
    const revenue = confirmed.reduce((s, r) => s + (r.total ?? 0), 0)
    const customers = new Set(confirmed.map(r => r.customer_email)).size
    return {
      revenue,
      tickets: 0,
      orders: confirmed.length,
      customers,
    }
  }

  const current = fold(currentOrders.data)
  current.tickets = currentTickets.count ?? 0
  const previous = fold(previousOrders.data)
  previous.tickets = previousTickets.count ?? 0

  return { current, previous }
}

// ---------- Per-day series (used for sparklines + main chart) ----------

export async function getRevenueSeries(days: number): Promise<SeriesPoint[]> {
  const { from } = rangeFor(days)
  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total')
    .eq('status', 'confirmed')
    .gte('created_at', from.toISOString())
  if (error) throw error
  const series = emptySeries(days)
  const idx = Object.fromEntries(series.map((p, i) => [p.date, i]))
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10)
    if (idx[day] !== undefined) series[idx[day]].value += row.total ?? 0
  }
  return series
}

export async function getOrdersSeries(days: number): Promise<SeriesPoint[]> {
  const { from } = rangeFor(days)
  const { data, error } = await supabase
    .from('orders')
    .select('created_at')
    .eq('status', 'confirmed')
    .gte('created_at', from.toISOString())
  if (error) throw error
  const series = emptySeries(days)
  const idx = Object.fromEntries(series.map((p, i) => [p.date, i]))
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10)
    if (idx[day] !== undefined) series[idx[day]].value += 1
  }
  return series
}

export async function getTicketsSeries(days: number): Promise<SeriesPoint[]> {
  const { from } = rangeFor(days)
  const { data, error } = await supabase
    .from('tickets')
    .select('created_at')
    .gte('created_at', from.toISOString())
  if (error) throw error
  const series = emptySeries(days)
  const idx = Object.fromEntries(series.map((p, i) => [p.date, i]))
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10)
    if (idx[day] !== undefined) series[idx[day]].value += 1
  }
  return series
}

export async function getCustomersSeries(days: number): Promise<SeriesPoint[]> {
  const { from } = rangeFor(days)
  const { data, error } = await supabase
    .from('orders')
    .select('created_at, customer_email')
    .eq('status', 'confirmed')
    .gte('created_at', from.toISOString())
  if (error) throw error
  const series = emptySeries(days)
  const idx = Object.fromEntries(series.map((p, i) => [p.date, i]))
  const seenByDay: Record<string, Set<string>> = {}
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10)
    if (idx[day] === undefined) continue
    if (!seenByDay[day]) seenByDay[day] = new Set()
    seenByDay[day].add(row.customer_email)
  }
  for (const day of Object.keys(seenByDay)) {
    series[idx[day]].value = seenByDay[day].size
  }
  return series
}

// ---------- Breakdowns ----------

export async function getTopEvents(days: number, limit = 5): Promise<TopEvent[]> {
  const { from } = rangeFor(days)
  const { data, error } = await supabase
    .from('order_items')
    .select('event_id, quantity, total_price, events(title), orders!inner(status, created_at)')
    .eq('orders.status', 'confirmed')
    .gte('orders.created_at', from.toISOString())
  if (error) throw error

  const byEvent: Record<string, TopEvent> = {}
  for (const row of (data ?? []) as unknown as Array<{
    event_id: string
    quantity: number
    total_price: number
    events: { title: string } | null
  }>) {
    const id = row.event_id
    if (!byEvent[id]) {
      byEvent[id] = {
        event_id: id,
        title: row.events?.title ?? 'Untitled',
        revenue: 0,
        tickets: 0,
      }
    }
    byEvent[id].revenue += row.total_price ?? 0
    byEvent[id].tickets += row.quantity ?? 0
  }
  return Object.values(byEvent)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

export async function getCategoryBreakdown(days: number): Promise<CategorySlice[]> {
  const { from } = rangeFor(days)
  const { data, error } = await supabase
    .from('order_items')
    .select('total_price, events(category), orders!inner(status, created_at)')
    .eq('orders.status', 'confirmed')
    .gte('orders.created_at', from.toISOString())
  if (error) throw error

  const byCat: Record<string, number> = {}
  for (const row of (data ?? []) as unknown as Array<{
    total_price: number
    events: { category: string } | null
  }>) {
    const cat = row.events?.category ?? 'other'
    byCat[cat] = (byCat[cat] ?? 0) + (row.total_price ?? 0)
  }
  return Object.entries(byCat)
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
}

export async function getStatusBreakdown(days: number): Promise<StatusSlice[]> {
  const { from } = rangeFor(days)
  const { data, error } = await supabase
    .from('orders')
    .select('status, total')
    .gte('created_at', from.toISOString())
  if (error) throw error

  const by: Record<string, StatusSlice> = {}
  for (const row of data ?? []) {
    if (!by[row.status]) by[row.status] = { status: row.status, count: 0, revenue: 0 }
    by[row.status].count += 1
    by[row.status].revenue += row.total ?? 0
  }
  return Object.values(by).sort((a, b) => b.count - a.count)
}

export async function getSalesFunnel(days: number): Promise<SalesFunnel> {
  const { from } = rangeFor(days)
  const [capacityRes, soldRes, scannedRes] = await Promise.all([
    supabase
      .from('ticket_types')
      .select('quantity'),
    supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', from.toISOString()),
    supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('used', true)
      .gte('used_at', from.toISOString()),
  ])
  if (capacityRes.error) throw capacityRes.error
  if (soldRes.error) throw soldRes.error
  if (scannedRes.error) throw scannedRes.error

  const capacity = (capacityRes.data ?? []).reduce((s, r) => s + (r.quantity ?? 0), 0)
  return {
    capacity,
    sold: soldRes.count ?? 0,
    scanned: scannedRes.count ?? 0,
  }
}

// ---------- Recent activity ----------

export async function getRecentActivity(limit = 8): Promise<RecentOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, customer_first_name, customer_last_name, customer_email, total, status, created_at, order_items(quantity, events(title))')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error

  return ((data ?? []) as unknown as Array<{
    id: string
    customer_first_name: string
    customer_last_name: string
    customer_email: string
    total: number
    status: string
    created_at: string
    order_items: Array<{ quantity: number; events: { title: string } | null }>
  }>).map(o => ({
    id: o.id,
    customer_name: `${o.customer_first_name} ${o.customer_last_name}`,
    customer_email: o.customer_email,
    total: o.total,
    status: o.status,
    created_at: o.created_at,
    event_title: o.order_items[0]?.events?.title ?? null,
    quantity: o.order_items.reduce((s, i) => s + (i.quantity ?? 0), 0),
  }))
}

// ---------- Filter options ----------

export async function getEventOptions(): Promise<Array<{ id: string; title: string }>> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title')
    .order('date', { ascending: false })
    .limit(100)
  if (error) throw error
  return data ?? []
}
