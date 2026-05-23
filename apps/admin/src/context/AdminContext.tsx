import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export type AdminRole = 'super_admin' | 'events_viewer'

interface AdminContextValue {
  role: AdminRole | null
  roleLoading: boolean
}

const AdminContext = createContext<AdminContextValue>({ role: null, roleLoading: true })

export function AdminProvider({
  session,
  children,
}: {
  session: Session | null
  children: React.ReactNode
}) {
  const [role, setRole] = useState<AdminRole | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setRole(null)
      setRoleLoading(false)
      return
    }
    supabase
      .from('admin_profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()
      .then(({ data }) => {
        setRole((data?.role as AdminRole) ?? null)
        setRoleLoading(false)
      })
  }, [session?.user.id])

  return (
    <AdminContext.Provider value={{ role, roleLoading }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)
