import { supabase } from '@/lib/supabase'
import type { DbMenuCategory, DbMenuItem } from '@/types/database'

// ── Categories ────────────────────────────────────────────────────────────────

export async function getCategoriesByEvent(eventId: string): Promise<DbMenuCategory[]> {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*, menu_items(*)')
    .eq('event_id', eventId)
    .order('display_order', { ascending: true })
  if (error) throw error
  // Sort items within each category
  return (data as DbMenuCategory[]).map(c => ({
    ...c,
    menu_items: (c.menu_items ?? []).sort((a, b) => a.display_order - b.display_order),
  }))
}

export async function createCategory(eventId: string, name: string, displayOrder: number): Promise<DbMenuCategory> {
  const { data, error } = await supabase
    .from('menu_categories')
    .insert({ event_id: eventId, name, display_order: displayOrder })
    .select()
    .single()
  if (error) throw error
  return { ...(data as DbMenuCategory), menu_items: [] }
}

export async function updateCategory(id: string, updates: { name?: string; display_order?: number }): Promise<void> {
  const { error } = await supabase.from('menu_categories').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('menu_categories').delete().eq('id', id)
  if (error) throw error
}

// ── Items ─────────────────────────────────────────────────────────────────────

export interface MenuItemFormData {
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
}

export async function createMenuItem(
  eventId: string,
  categoryId: string,
  data: MenuItemFormData,
  displayOrder: number
): Promise<DbMenuItem> {
  const { data: item, error } = await supabase
    .from('menu_items')
    .insert({ ...data, event_id: eventId, category_id: categoryId, display_order: displayOrder })
    .select()
    .single()
  if (error) throw error
  return item as DbMenuItem
}

export async function updateMenuItem(id: string, updates: Partial<MenuItemFormData>): Promise<void> {
  const { error } = await supabase.from('menu_items').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) throw error
}
