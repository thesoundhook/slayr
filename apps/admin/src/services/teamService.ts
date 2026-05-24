import { supabase } from '@/lib/supabase'
import type { AdminRole } from '@/context/AdminContext'
import type { Permission } from '@/lib/permissions'
import { ROLE_DEFAULT_PERMISSIONS } from '@/lib/permissions'

export interface TeamMember {
  id: string
  user_id: string
  role: AdminRole
  name: string | null
  created_at: string
  permissions: Permission[]
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as TeamMember[]
}

export async function inviteTeamMember(email: string, role: AdminRole, password?: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const permissions = ROLE_DEFAULT_PERMISSIONS[role] ?? []
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-admin`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        email,
        role,
        permissions,
        ...(password ? { password } : { redirectTo: `${window.location.origin}/accept-invite` }),
      }),
    },
  )
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Failed to add team member')
}

export async function updateMemberPermissions(userId: string, permissions: Permission[]): Promise<void> {
  const { error } = await supabase
    .from('admin_profiles')
    .update({ permissions })
    .eq('user_id', userId)
  if (error) throw error
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
