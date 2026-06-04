export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  time: string;
  venue: Venue;
  organizer: Organizer;
  images: string[];
  tags: string[];
  ticketTypes: TicketType[];
  totalCapacity: number;
  soldTickets: number;
  featured: boolean;
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled';
  serviceFeePercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  capacity: number;
  hasSeatingChart: boolean;
  seatingChart?: SeatingChart;
}

export interface SeatingChart {
  sections: Section[];
  layout: string; // SVG or layout data
}

export interface Section {
  id: string;
  name: string;
  capacity: number;
  price: number;
  available: number;
  type: 'general' | 'reserved' | 'vip';
}

export interface Organizer {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  description?: string;
  verified: boolean;
}

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  sold: number;
  maxPerOrder: number;
  salesStart?: string;
  salesEnd?: string;
  type: 'general' | 'vip' | 'early-bird' | 'group';
}

export interface CartItem {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  price: number;
  event: Event;
  ticketType: TicketType;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  fees: number;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  createdAt: string;
  tickets: Ticket[];
}

export interface OrderItem {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Ticket {
  id: string;
  orderId: string;
  eventId: string;
  ticketTypeId: string;
  qrCode: string;
  used: boolean;
  usedAt?: string;
}

export type EventCategory =
  | 'music'
  | 'sports'
  | 'theater'
  | 'comedy'
  | 'conferences'
  | 'workshops'
  | 'food'
  | 'arts'
  | 'family'
  | 'nightlife'
  | 'other';

export interface EventFilters {
  category?: EventCategory;
  location?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  search?: string;
}