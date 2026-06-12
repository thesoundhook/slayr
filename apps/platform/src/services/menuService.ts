import { supabase } from '../lib/supabase'

export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
}

export interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}

export interface EventPaymentSettings {
  orderingEnabled: boolean
  acceptOnline: boolean
  acceptPos: boolean
  acceptTransfer: boolean
  transferBankName: string | null
  transferAccountNumber: string | null
  transferAccountName: string | null
  transferInstructions: string | null
}

const DEFAULT_SETTINGS: EventPaymentSettings = {
  orderingEnabled: true,
  acceptOnline: true,
  acceptPos: false,
  acceptTransfer: false,
  transferBankName: null,
  transferAccountNumber: null,
  transferAccountName: null,
  transferInstructions: null,
}

export async function getPaymentSettings(eventId: string): Promise<EventPaymentSettings> {
  const { data, error } = await supabase
    .from('event_payment_settings')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle()
  if (error) throw error
  if (!data) return DEFAULT_SETTINGS
  return {
    orderingEnabled:       data.ordering_enabled,
    acceptOnline:          data.accept_online,
    acceptPos:             data.accept_pos,
    acceptTransfer:        data.accept_transfer,
    transferBankName:      data.transfer_bank_name,
    transferAccountNumber: data.transfer_account_number,
    transferAccountName:   data.transfer_account_name,
    transferInstructions:  data.transfer_instructions,
  }
}

// The name of the usher assigned to a table (null if none / not found).
export async function getTableUsher(eventId: string, tableNumber: number): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_table_usher', {
    p_event_id: eventId,
    p_table_number: tableNumber,
  })
  if (error) return null
  return (data as string | null) ?? null
}

export async function getMenuByEvent(eventId: string): Promise<MenuCategory[]> {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*, menu_items(*)')
    .eq('event_id', eventId)
    .order('display_order', { ascending: true })

  if (error) throw error
  if (!data) return []

  return data.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    items: (cat.menu_items ?? [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? null,
        price: item.price,
        imageUrl: item.image_url ?? null,
        isAvailable: item.is_available,
      })),
  }))
}
