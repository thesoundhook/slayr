import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { AdminProvider, useAdmin } from '@/context/AdminContext'
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
import VenuesPage from '@/pages/VenuesPage'
import VenueFormPage from '@/pages/VenueFormPage'
import OrganizersPage from '@/pages/OrganizersPage'
import OrganizerFormPage from '@/pages/OrganizerFormPage'

function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Redirects events_viewer away from super_admin-only routes
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { role, roleLoading } = useAdmin()
  if (roleLoading) return null
  if (role !== 'super_admin') return <Navigate to="/events" replace />
  return <>{children}</>
}

function AppRoutes({ session }: { session: Session | null }) {
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute session={session}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<SuperAdminRoute><DashboardPage /></SuperAdminRoute>} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/new" element={<EventFormPage />} />
        <Route path="events/:id/edit" element={<EventFormPage />} />
        <Route path="events/:id/attendees" element={<AttendeesPage />} />
        <Route path="orders" element={<SuperAdminRoute><OrdersPage /></SuperAdminRoute>} />
        <Route path="orders/:id" element={<SuperAdminRoute><OrderDetailPage /></SuperAdminRoute>} />
        <Route path="briefs" element={<SuperAdminRoute><BriefsPage /></SuperAdminRoute>} />
        <Route path="team" element={<SuperAdminRoute><TeamPage /></SuperAdminRoute>} />
        <Route path="venues" element={<SuperAdminRoute><VenuesPage /></SuperAdminRoute>} />
        <Route path="venues/new" element={<SuperAdminRoute><VenueFormPage /></SuperAdminRoute>} />
        <Route path="venues/:id/edit" element={<SuperAdminRoute><VenueFormPage /></SuperAdminRoute>} />
        <Route path="organizers" element={<SuperAdminRoute><OrganizersPage /></SuperAdminRoute>} />
        <Route path="organizers/new" element={<SuperAdminRoute><OrganizerFormPage /></SuperAdminRoute>} />
        <Route path="organizers/:id/edit" element={<SuperAdminRoute><OrganizerFormPage /></SuperAdminRoute>} />
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
