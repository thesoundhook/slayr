import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
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

function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
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
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute session={session}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/new" element={<EventFormPage />} />
          <Route path="events/:id/edit" element={<EventFormPage />} />
          <Route path="events/:id/attendees" element={<AttendeesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="briefs" element={<BriefsPage />} />
        </Route>
        <Route path="/briefs/new" element={
          <ProtectedRoute session={session}><BriefFormPage /></ProtectedRoute>
        } />
        <Route path="/briefs/:id" element={
          <ProtectedRoute session={session}><BriefFormPage /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
