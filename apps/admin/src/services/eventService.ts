import { supabase } from '@/lib/supabase'
import { idColumn } from '@/lib/slug'
import type { DbEvent, DbTicketType, DbVenue, DbOrganizer } from '@/types/database'

export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*, venues(*), organizers(*)')
    .order('date', { ascending: false })
  if (error) throw error
  return data as DbEvent[]
}

export async function getEventById(idOrSlug: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*, venues(*), organizers(*), ticket_types(*)')
    .eq(idColumn(idOrSlug), idOrSlug)
    .single()
  if (error) throw error
  const event = data as DbEvent
  if (event.ticket_types) {
    event.ticket_types = event.ticket_types.filter(tt => !tt.is_archived)
  }
  return event
}

export interface EventFormData {
  title: string
  slug?: string
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

  const keptIds = ticketTypes.map(tt => tt.id).filter(Boolean) as string[]

  // Find ticket types for this event that the user removed from the form
  const removedQuery = supabase
    .from('ticket_types')
    .select('id')
    .eq('event_id', id)
    .eq('is_archived', false)
  if (keptIds.length > 0) removedQuery.not('id', 'in', `(${keptIds.join(',')})`)
  const { data: removedRows, error: removedError } = await removedQuery
  if (removedError) throw removedError

  if (removedRows && removedRows.length > 0) {
    const removedIds = removedRows.map(r => r.id)

    // Ticket types that have orders must be soft-deleted (archived) to preserve the FK
    const { data: orderedRows, error: orderedError } = await supabase
      .from('order_items')
      .select('ticket_type_id')
      .in('ticket_type_id', removedIds)
    if (orderedError) throw orderedError

    const orderedIds = new Set((orderedRows ?? []).map(r => r.ticket_type_id))
    const hardDeleteIds = removedIds.filter(rid => !orderedIds.has(rid))
    const archiveIds = removedIds.filter(rid => orderedIds.has(rid))

    if (hardDeleteIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('ticket_types')
        .delete()
        .in('id', hardDeleteIds)
      if (deleteError) throw deleteError
    }

    if (archiveIds.length > 0) {
      const { error: archiveError } = await supabase
        .from('ticket_types')
        .update({ is_archived: true })
        .in('id', archiveIds)
      if (archiveError) throw archiveError
    }
  }

  const toInsert = ticketTypes.filter(tt => !tt.id)
  const toUpdate = ticketTypes.filter(tt => tt.id)

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('ticket_types')
      .insert(toInsert.map(({ id: _id, ...rest }) => ({ ...rest, event_id: id, sold: 0, is_archived: false })))
    if (insertError) throw insertError
  }

  for (const tt of toUpdate) {
    const { id: ttId, ...rest } = tt
    const { error: updateError } = await supabase
      .from('ticket_types')
      .update({ ...rest, event_id: id })
      .eq('id', ttId!)
    if (updateError) throw updateError
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
  return data as DbVenue[]
}

export interface VenueFormData {
  name: string
  slug?: string
  address: string
  city: string
  state: string
  country: string
  capacity: number
  has_seating_chart: boolean
}

export async function createVenue(data: VenueFormData) {
  const { data: venue, error } = await supabase.from('venues').insert(data).select().single()
  if (error) throw error
  return venue as DbVenue
}

export async function updateVenue(id: string, data: Partial<VenueFormData>) {
  const { data: venue, error } = await supabase.from('venues').update(data).eq('id', id).select().single()
  if (error) throw error
  return venue as DbVenue
}

export async function deleteVenue(id: string) {
  const { count } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', id)
  if (count && count > 0) {
    throw new Error(`Cannot delete — ${count} event(s) use this venue.`)
  }
  const { error } = await supabase.from('venues').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getOrganizers() {
  const { data, error } = await supabase.from('organizers').select('*').order('name')
  if (error) throw error
  return data as DbOrganizer[]
}

export interface OrganizerFormData {
  name: string
  slug?: string
  logo_url: string | null
  description: string | null
  verified: boolean
}

export async function createOrganizer(data: OrganizerFormData) {
  const { data: org, error } = await supabase.from('organizers').insert(data).select().single()
  if (error) throw error
  return org as DbOrganizer
}

export async function updateOrganizer(id: string, data: Partial<OrganizerFormData>) {
  const { data: org, error } = await supabase.from('organizers').update(data).eq('id', id).select().single()
  if (error) throw error
  return org as DbOrganizer
}

export async function deleteOrganizer(id: string) {
  const { count } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', id)
  if (count && count > 0) {
    throw new Error(`Cannot delete — ${count} event(s) use this organizer.`)
  }
  const { error } = await supabase.from('organizers').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getTicketTypesByEvent(eventId: string) {
  const { data, error } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('event_id', eventId)
  if (error) throw error
  return data as DbTicketType[]
}
