import { supabase } from '@/lib/supabase'
import type { DbOrder, DbOrderItem, DbTicket } from '@/types/database'

export interface OrderWithDetails extends DbOrder {
  order_items: (DbOrderItem & {
    events: { title: string } | null
    ticket_types: { name: string; type: string } | null
  })[]
}

export async function getOrders(filters?: { status?: string; event_id?: string }) {
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        events(title),
        ticket_types(name, type)
      )
    `)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data as OrderWithDetails[]
}

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        events(title),
        ticket_types(name, type)
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as OrderWithDetails
}

export async function getOrdersByEvent(eventId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items!inner(
        *,
        ticket_types(name, type)
      )
    `)
    .eq('order_items.event_id', eventId)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as OrderWithDetails[]
}

export async function getTicketsByEvent(eventId: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      orders(customer_first_name, customer_last_name, customer_email, customer_phone),
      ticket_types(name, type)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as (DbTicket & {
    orders: { customer_first_name: string; customer_last_name: string; customer_email: string; customer_phone: string | null } | null
    ticket_types: { name: string; type: string } | null
  })[]
}
