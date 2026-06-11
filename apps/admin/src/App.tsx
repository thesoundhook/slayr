import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { AdminProvider, useAdmin } from '@/context/AdminContext'
import type { Permission } from '@/lib/permissions'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import EventsPage from '@/pages/EventsPage'
import EventFormPage from '@/pages/EventFormPage'
import OrdersPage from '@/pages/OrdersPage'
import OrderDetailPage from '@/pages/OrderDetailPage'
import AttendeesPage from '@/pages/AttendeesPage'
import AdminLayout from '@/components/layout/AdminLayout'
import BriefsPage from '@/pages/BriefsPage'
import BriefFormPage from '@/pages/BriefFormPage'
import TeamPage from '@/pages/TeamPage'
import AcceptInvitePage from '@/pages/AcceptInvitePage'
import ScanPage from '@/pages/ScanPage'
import VenuesPage from '@/pages/VenuesPage'
import VenueFormPage from '@/pages/VenueFormPage'
import OrganizersPage from '@/pages/OrganizersPage'
import OrganizerFormPage from '@/pages/OrganizerFormPage'
import EventTablesPage from '@/pages/EventTablesPage'
import EventMenuPage from '@/pages/EventMenuPage'
import EventOrdersPage from '@/pages/EventOrdersPage'

function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequirePermission({ perm, children }: { perm: Permission; children: React.ReactNode }) {
  const { roleLoading, hasPermission } = useAdmin()
  if (roleLoading) return null
  if (!hasPermission(perm)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[40vh]">
        <p className="text-sm text-muted-foreground">You don't have access to this page.</p>
      </div>
    )
  }
  return <>{children}</>
}

const LANDING_PRIORITY: { perm: Permission; path: string }[] = [
  { perm: 'dashboard',         path: '/' },
  { perm: 'events.view',       path: '/events' },
  { perm: 'orders.view',       path: '/orders' },
  { perm: 'scan',              path: '/scan' },
  { perm: 'attendees.view',    path: '/events' },
  { perm: 'briefs.view',       path: '/briefs' },
  { perm: 'venues.view',       path: '/venues' },
  { perm: 'organizers.view',   path: '/organizers' },
  { perm: 'team.manage',       path: '/team' },
]

function LandingRedirect() {
  const { roleLoading, hasPermission } = useAdmin()
  if (roleLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
  const first = LANDING_PRIORITY.find(({ perm }) => hasPermission(perm))
  if (!first) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-sm text-muted-foreground">You don't have access to any pages. Contact your administrator.</p>
    </div>
  )
  return <Navigate to={first.path} replace />
}

function AppRoutes({ session }: { session: Session | null }) {
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/start" replace /> : <LoginPage />} />
      <Route path="/start" element={<ProtectedRoute session={session}><LandingRedirect /></ProtectedRoute>} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/" element={
        <ProtectedRoute session={session}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<RequirePermission perm="dashboard"><DashboardPage /></RequirePermission>} />
        <Route path="events" element={<RequirePermission perm="events.view"><EventsPage /></RequirePermission>} />
        <Route path="events/new" element={<RequirePermission perm="events.create"><EventFormPage /></RequirePermission>} />
        <Route path="events/:id/edit" element={<RequirePermission perm="events.edit"><EventFormPage /></RequirePermission>} />
        <Route path="events/:id/attendees" element={<RequirePermission perm="attendees.view"><AttendeesPage /></RequirePermission>} />
        <Route path="events/:id/tables" element={<RequirePermission perm="events.edit"><EventTablesPage /></RequirePermission>} />
        <Route path="events/:id/menu" element={<RequirePermission perm="events.edit"><EventMenuPage /></RequirePermission>} />
        <Route path="events/:id/orders" element={<RequirePermission perm="events.edit"><EventOrdersPage /></RequirePermission>} />
        <Route path="scan" element={<RequirePermission perm="scan"><ScanPage /></RequirePermission>} />
        <Route path="orders" element={<RequirePermission perm="orders.view"><OrdersPage /></RequirePermission>} />
        <Route path="orders/:id" element={<RequirePermission perm="orders.view"><OrderDetailPage /></RequirePermission>} />
        <Route path="briefs" element={<RequirePermission perm="briefs.view"><BriefsPage /></RequirePermission>} />
        <Route path="team" element={<RequirePermission perm="team.manage"><TeamPage /></RequirePermission>} />
        <Route path="venues" element={<RequirePermission perm="venues.view"><VenuesPage /></RequirePermission>} />
        <Route path="venues/new" element={<RequirePermission perm="venues.manage"><VenueFormPage /></RequirePermission>} />
        <Route path="venues/:id/edit" element={<RequirePermission perm="venues.manage"><VenueFormPage /></RequirePermission>} />
        <Route path="organizers" element={<RequirePermission perm="organizers.view"><OrganizersPage /></RequirePermission>} />
        <Route path="organizers/new" element={<RequirePermission perm="organizers.manage"><OrganizerFormPage /></RequirePermission>} />
        <Route path="organizers/:id/edit" element={<RequirePermission perm="organizers.manage"><OrganizerFormPage /></RequirePermission>} />
      </Route>
      <Route path="/briefs/new" element={
        <ProtectedRoute session={session}><BriefFormPage /></ProtectedRoute>
      } />
      <Route path="/briefs/:id" element={
        <ProtectedRoute session={session}><BriefFormPage /></ProtectedRoute>
      } />
    </Routes>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AdminProvider session={session}>
        <AppRoutes session={session} />
      </AdminProvider>
    </BrowserRouter>
  )
}
