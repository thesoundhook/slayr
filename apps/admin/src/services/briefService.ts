import { supabase } from '@/lib/supabase'
import type { DbBrief } from '@/types/database'
import type { BriefData } from '@/types/brief'

export type BriefSummary = Pick<DbBrief, 'id' | 'title' | 'status' | 'current_gate' | 'created_at' | 'updated_at'>

export async function getBriefs(): Promise<BriefSummary[]> {
  const { data, error } = await supabase
    .from('event_briefs')
    .select('id, title, status, current_gate, created_at, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getBriefById(id: string): Promise<DbBrief> {
  const { data, error } = await supabase
    .from('event_briefs')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createBrief(briefData: BriefData): Promise<string> {
  const title = deriveTitleFromData(briefData)
  const { data, error } = await supabase
    .from('event_briefs')
    .insert({ title, status: 'draft', current_gate: 1, data: briefData })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateBrief(
  id: string,
  patch: { data?: BriefData; current_gate?: number; status?: 'draft' | 'complete' }
): Promise<void> {
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.data !== undefined) {
    updatePayload.data = patch.data
    updatePayload.title = deriveTitleFromData(patch.data)
  }
  if (patch.current_gate !== undefined) updatePayload.current_gate = patch.current_gate
  if (patch.status !== undefined) updatePayload.status = patch.status

  const { error } = await supabase.from('event_briefs').update(updatePayload).eq('id', id)
  if (error) throw error
}

export async function deleteBrief(id: string): Promise<void> {
  const { error } = await supabase.from('event_briefs').delete().eq('id', id)
  if (error) throw error
}

function deriveTitleFromData(data: BriefData): string {
  const parts = [data.evtName || data.client || 'Untitled Brief']
  if (data.edition) parts.push(data.edition)
  return parts.join(' — ')
}
