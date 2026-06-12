import { supabase } from '@/lib/supabase'
import type { DbEventUsher } from '@/types/database'

export async function getUshersByEvent(eventId: string): Promise<DbEventUsher[]> {
  const { data, error } = await supabase
    .from('event_ushers')
    .select('*')
    .eq('event_id', eventId)
    .order('name', { ascending: true })
  if (error) throw error
  return data as DbEventUsher[]
}

export async function createUsher(
  eventId: string,
  usher: { name: string; phone: string }
): Promise<DbEventUsher> {
  const { data, error } = await supabase
    .from('event_ushers')
    .insert({ ...usher, event_id: eventId })
    .select('*')
    .single()
  if (error) throw error
  return data as DbEventUsher
}

export async function updateUsher(
  id: string,
  updates: { name?: string; phone?: string }
): Promise<void> {
  const { error } = await supabase.from('event_ushers').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteUsher(id: string): Promise<void> {
  const { error } = await supabase.from('event_ushers').delete().eq('id', id)
  if (error) throw error
}
