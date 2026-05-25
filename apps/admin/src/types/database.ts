export interface DbVenue {
  id: string
  slug: string
  name: string
  address: string
  city: string
  state: string
  country: string
  capacity: number
  has_seating_chart: boolean
  created_at: string
}

export interface DbOrganizer {
  id: string
  slug: string
  name: string
  logo_url: string | null
  description: string | null
  verified: boolean
  created_at: string
}

export interface DbTicketType {
  id: string
  event_id: string
  name: string
  description: string | null
  price: number
  original_price: number | null
  quantity: number
  sold: number
  max_per_order: number
  sales_start: string | null
  sales_end: string | null
  type: 'general' | 'vip' | 'early-bird' | 'group'
  is_archived: boolean
  created_at: string
}

export interface DbEvent {
  id: string
  slug: string
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
  sold_tickets: number
  featured: boolean
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled'
  created_at: string
  updated_at: string
  venues?: DbVenue
  organizers?: DbOrganizer
  ticket_types?: DbTicketType[]
}

export interface DbOrder {
  id: string
  customer_email: string
  customer_first_name: string
  customer_last_name: string
  customer_phone: string | null
  subtotal: number
  fees: number
  total: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
  paystack_reference: string | null
  paystack_verified: boolean
  created_at: string
  updated_at: string
}

export interface DbOrderItem {
  id: string
  order_id: string
  event_id: string
  ticket_type_id: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface DbTicket {
  id: string
  order_id: string
  order_item_id: string
  event_id: string
  ticket_type_id: string
  qr_code: string
  used: boolean
  used_at: string | null
  created_at: string
}


export interface DbBrief {
  id: string
  slug: string
  created_at: string
  updated_at: string
  title: string
  status: 'draft' | 'complete'
  current_gate: number
  data: Record<string, unknown>
}
