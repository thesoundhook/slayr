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
