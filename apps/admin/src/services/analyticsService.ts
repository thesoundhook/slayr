import { supabase } from '@/lib/supabase'

export interface RevenueByDay {
  date: string
  revenue: number
}

export async function getTotalRevenue() {
  const { data, error } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'confirmed')
  if (error) throw error
  return (data ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0)
}

export async function getTotalTicketsSold() {
  const { data, error } = await supabase
    .from('ticket_types')
    .select('sold')
  if (error) throw error
  return (data ?? []).reduce((sum, tt) => sum + (tt.sold ?? 0), 0)
}

export async function getActiveEventsCount() {
  const { count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'upcoming')
  if (error) throw error
  return count ?? 0
}

export async function getTotalOrdersCount() {
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

export async function getRevenueByDay(days = 30): Promise<RevenueByDay[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total')
    .eq('status', 'confirmed')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  if (error) throw error

  const byDay: Record<string, number> = {}

  // Pre-fill all days with 0
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    byDay[d.toISOString().slice(0, 10)] = 0
  }

  for (const order of data ?? []) {
    const day = order.created_at.slice(0, 10)
    if (byDay[day] !== undefined) {
      byDay[day] += order.total ?? 0
    }
  }

  return Object.entries(byDay).map(([date, revenue]) => ({ date, revenue }))
}
