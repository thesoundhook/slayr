import { supabase } from '@/lib/supabase'
import type { DbEvent, DbTicketType } from '@/types/database'

export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*, venues(*), organizers(*)')
    .order('date', { ascending: false })
  if (error) throw error
  return data as DbEvent[]
}

export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*, venues(*), organizers(*), ticket_types(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as DbEvent
}

export interface EventFormData {
  title: string
  description: string
  category: string
  date: string
  time: string
  venue_id: string
  organizer_id: string
  images: string[]
  tags: string[]
  total_capacity: number
  featured: boolean
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled'
}

export interface TicketTypeFormData {
  id?: string
  name: string
  description: string | null
  price: number
  original_price: number | null
  quantity: number
  max_per_order: number
  sales_start: string | null
  sales_end: string | null
  type: 'general' | 'vip' | 'early-bird' | 'group'
}

export async function createEvent(eventData: EventFormData, ticketTypes: TicketTypeFormData[]) {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({ ...eventData, sold_tickets: 0 })
    .select()
    .single()
  if (eventError) throw eventError

  if (ticketTypes.length > 0) {
    const { error: ttError } = await supabase
      .from('ticket_types')
      .insert(ticketTypes.map(tt => ({ ...tt, event_id: event.id, sold: 0 })))
    if (ttError) throw ttError
  }

  return event as DbEvent
}

export async function updateEvent(id: string, eventData: Partial<EventFormData>, ticketTypes: TicketTypeFormData[]) {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .update({ ...eventData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (eventError) throw eventError

  // Delete existing ticket types and reinsert
  await supabase.from('ticket_types').delete().eq('event_id', id)

  if (ticketTypes.length > 0) {
    const { error: ttError } = await supabase
      .from('ticket_types')
      .insert(ticketTypes.map(tt => {
        const { id: _id, ...rest } = tt
        return { ...rest, event_id: id, sold: 0 }
      }))
    if (ttError) throw ttError
  }

  return event as DbEvent
}

export async function deleteEvent(id: string) {
  const { count } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id)

  if (count && count > 0) {
    throw new Error(`Cannot delete — ${count} order(s) exist for this event. Cancel the event instead.`)
  }

  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getVenues() {
  const { data, error } = await supabase.from('venues').select('*').order('name')
  if (error) throw error
  return data
}

export async function getOrganizers() {
  const { data, error } = await supabase.from('organizers').select('*').order('name')
  if (error) throw error
  return data
}

export async function getTicketTypesByEvent(eventId: string) {
  const { data, error } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('event_id', eventId)
  if (error) throw error
  return data as DbTicketType[]
}
