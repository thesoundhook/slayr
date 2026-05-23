import { supabase } from '@/lib/supabase'
import type { AdminRole } from '@/context/AdminContext'

export interface TeamMember {
  id: string
  user_id: string
  role: AdminRole
  name: string | null
  created_at: string
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as TeamMember[]
}

export async function inviteTeamMember(email: string, role: AdminRole): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-admin`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ email, role }),
    },
  )
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Failed to send invite')
}

export async function updateMemberRole(userId: string, role: AdminRole): Promise<void> {
  const { error } = await supabase
    .from('admin_profiles')
    .update({ role })
    .eq('user_id', userId)
  if (error) throw error
}

export async function removeMember(userId: string): Promise<void> {
  const { error } = await supabase
    .from('admin_profiles')
    .delete()
    .eq('user_id', userId)
  if (error) throw error
}
