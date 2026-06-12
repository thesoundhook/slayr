import { supabase } from '@/lib/supabase'
import type { DbEventTable } from '@/types/database'

export async function getTablesByEvent(eventId: string): Promise<DbEventTable[]> {
  const { data, error } = await supabase
    .from('event_tables')
    .select('*, ticket_types(id, name, type), event_ushers(id, name, phone)')
    .eq('event_id', eventId)
    .order('table_number', { ascending: true })
  if (error) throw error
  return data as DbEventTable[]
}

export async function createTables(
  eventId: string,
  rows: { table_number: number; name: string | null; ticket_type_id: string | null }[]
): Promise<DbEventTable[]> {
  const { data, error } = await supabase
    .from('event_tables')
    .insert(rows.map(r => ({ ...r, event_id: eventId })))
    .select('*, ticket_types(id, name, type), event_ushers(id, name, phone)')
  if (error) throw error
  return data as DbEventTable[]
}

export async function updateTable(
  id: string,
  updates: { name?: string | null; ticket_type_id?: string | null; usher_id?: string | null }
): Promise<void> {
  const { error } = await supabase.from('event_tables').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteTable(id: string): Promise<void> {
  const { error } = await supabase.from('event_tables').delete().eq('id', id)
  if (error) throw error
}
