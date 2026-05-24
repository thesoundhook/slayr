import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { Permission } from '@/lib/permissions'

export type AdminRole = 'super_admin' | 'admin' | 'event_manager' | 'events_viewer' | 'scanner'

interface AdminContextValue {
  role: AdminRole | null
  roleLoading: boolean
  permissions: Permission[]
  hasPermission: (perm: Permission) => boolean
}

const AdminContext = createContext<AdminContextValue>({
  role: null,
  roleLoading: true,
  permissions: [],
  hasPermission: () => false,
})

export function AdminProvider({
  session,
  children,
}: {
  session: Session | null
  children: React.ReactNode
}) {
  const [role, setRole] = useState<AdminRole | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setRole(null)
      setPermissions([])
      setRoleLoading(false)
      return
    }
    supabase
      .from('admin_profiles')
      .select('role, permissions')
      .eq('user_id', session.user.id)
      .single()
      .then(({ data }) => {
        setRole((data?.role as AdminRole) ?? null)
        setPermissions((data?.permissions as Permission[]) ?? [])
        setRoleLoading(false)
      })
  }, [session?.user.id])

  // super_admin bypasses all permission checks
  const hasPermission = useCallback(
    (perm: Permission) => role === 'super_admin' || permissions.includes(perm),
    [role, permissions],
  )

  return (
    <AdminContext.Provider value={{ role, roleLoading, permissions, hasPermission }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)
