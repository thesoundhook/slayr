import { supabase } from '../lib/supabase'
import { idColumn } from '../lib/slug'
import { Event, EventCategory, EventFilters } from '../types/event'
import { DbEvent } from '../types/database'

const EVENT_QUERY = `
  *,
  venues(*),
  organizers(*),
  ticket_types(*)
`

function mapDbEvent(row: DbEvent): Event {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category as EventCategory,
    date: row.date,
    time: row.time,
    venue: {
      id: row.venues!.id,
      slug: row.venues!.slug,
      name: row.venues!.name,
      address: row.venues!.address,
      city: row.venues!.city,
      state: row.venues!.state,
      country: row.venues!.country,
      capacity: row.venues!.capacity,
      hasSeatingChart: row.venues!.has_seating_chart,
    },
    organizer: {
      id: row.organizers!.id,
      slug: row.organizers!.slug,
      name: row.organizers!.name,
      logo: row.organizers!.logo_url ?? undefined,
      description: row.organizers!.description ?? undefined,
      verified: row.organizers!.verified,
    },
    images: row.images,
    tags: row.tags,
    ticketTypes: (row.ticket_types ?? []).filter(tt => !tt.is_archived).map(tt => ({
      id: tt.id,
      name: tt.name,
      description: tt.description ?? undefined,
      price: tt.price / 100,                          // kobo → naira
      originalPrice: tt.original_price != null ? tt.original_price / 100 : undefined,
      quantity: tt.quantity,
      sold: tt.sold,
      maxPerOrder: tt.max_per_order,
      salesStart: tt.sales_start ?? undefined,
      salesEnd: tt.sales_end ?? undefined,
      type: tt.type,
    })),
    totalCapacity: row.total_capacity,
    soldTickets: row.sold_tickets,
    featured: row.featured,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getEvents(filters?: EventFilters): Promise<Event[]> {
  let query = supabase
    .from('events')
    .select(EVENT_QUERY)
    .eq('status', 'upcoming')
    .order('featured', { ascending: false })
    .order('date', { ascending: true })

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return (data as DbEvent[]).map(mapDbEvent)
}

export async function getEventById(idOrSlug: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_QUERY)
    .eq(idColumn(idOrSlug), idOrSlug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return mapDbEvent(data as DbEvent)
}

export async function getFeaturedEvents(limit = 4): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_QUERY)
    .eq('featured', true)
    .eq('status', 'upcoming')
    .order('date', { ascending: true })
    .limit(limit)

  if (error) throw error
  return (data as DbEvent[]).map(mapDbEvent)
}

export interface OrderDetail {
  id: string
  customerEmail: string
  customerFirstName: string
  customerLastName: string
  subtotal: number    // naira
  fees: number        // naira
  total: number       // naira
  status: string
  paystackReference: string | null
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    unitPrice: number  // naira
    totalPrice: number // naira
    ticketTypeName: string
    ticketTypeType: string
    eventTitle: string
    eventDate: string
    eventTime: string
    venueName: string
    venueCity: string
  }>
  tickets: Array<{
    id: string
    qrCode: string
    ticketTypeId: string
    used: boolean
  }>
}

export async function getOrderById(orderId: string): Promise<OrderDetail | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id, quantity, unit_price, total_price,
        ticket_types ( name, type ),
        events ( title, date, time, venues ( name, city ) )
      ),
      tickets ( id, qr_code, ticket_type_id, used )
    `)
    .eq('id', orderId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  const d = data as any
  return {
    id: d.id,
    customerEmail: d.customer_email,
    customerFirstName: d.customer_first_name,
    customerLastName: d.customer_last_name,
    subtotal: d.subtotal / 100,
    fees: d.fees / 100,
    total: d.total / 100,
    status: d.status,
    paystackReference: d.paystack_reference,
    createdAt: d.created_at,
    items: (d.order_items ?? []).map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unit_price / 100,
      totalPrice: item.total_price / 100,
      ticketTypeName: item.ticket_types?.name ?? '',
      ticketTypeType: item.ticket_types?.type ?? '',
      eventTitle: item.events?.title ?? '',
      eventDate: item.events?.date ?? '',
      eventTime: item.events?.time ?? '',
      venueName: item.events?.venues?.name ?? '',
      venueCity: item.events?.venues?.city ?? '',
    })),
    tickets: (d.tickets ?? []).map((t: any) => ({
      id: t.id,
      qrCode: t.qr_code,
      ticketTypeId: t.ticket_type_id,
      used: t.used,
    })),
  }
}
