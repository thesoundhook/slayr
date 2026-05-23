import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/events': 'Events',
  '/events/new': 'Create Event',
  '/orders': 'Orders',
  '/briefs': 'Briefs',
  '/briefs/new': 'New Brief',
  '/team': 'Team',
  '/scan': 'Scan Tickets',
}

function getTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.includes('/attendees')) return 'Attendees'
  if (pathname.includes('/edit')) return 'Edit Event'
  if (pathname.startsWith('/orders/')) return 'Order Detail'
  return 'Admin'
}

export default function AdminLayout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <TopBar title={getTitle(pathname)} />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
