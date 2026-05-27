import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { EventsPage } from './pages/EventsPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderConfirmationPage } from './pages/OrderConfirmationPage'
import { trackPageView } from './lib/analytics'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function AnalyticsTracker() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    trackPageView(pathname + search)
  }, [pathname, search])
  return null
}

function App() {
  return (
    <Layout>
      <ScrollToTop />
      <AnalyticsTracker />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders/:id" element={<OrderConfirmationPage />} />
      </Routes>
    </Layout>
  )
}

export default App