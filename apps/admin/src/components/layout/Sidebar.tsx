import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, ShoppingBag, FileText, Users, MapPin, UserCircle, ScanLine, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdmin } from '@/context/AdminContext'

const superAdminGroups = [
  {
    label: 'Analytics',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/events', label: 'Events', icon: Calendar, end: false },
      { to: '/venues', label: 'Venues', icon: MapPin, end: false },
      { to: '/organizers', label: 'Organizers', icon: UserCircle, end: false },
      { to: '/orders', label: 'Orders', icon: ShoppingBag, end: false },
      { to: '/scan', label: 'Scan Tickets', icon: ScanLine, end: false },
    ],
  },
  {
    label: 'Client Work',
    items: [
      { to: '/briefs', label: 'Briefs', icon: FileText, end: false },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/team', label: 'Team', icon: Users, end: false },
    ],
  },
]

const eventsViewerGroups = [
  {
    label: 'Catalogue',
    items: [
      { to: '/events', label: 'Events', icon: Calendar, end: false },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { role } = useAdmin()
  const navGroups = role === 'super_admin' ? superAdminGroups : eventsViewerGroups

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col',
          'transition-transform duration-200 ease-out',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border">
          <img src="/slayr logo.png" alt="Slayr" className="h-7 w-auto" />
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mt-0.5">Admin Panel</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden -mr-2 p-2 text-muted-foreground hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navGroups.map(({ label, items }) => (
            <div key={label} className="mb-4">
              <p className="px-5 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {label}
              </p>
              {items.map(({ to, label: itemLabel, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-5 py-2.5 text-sm border-l-2 transition-colors',
                      isActive
                        ? 'border-primary bg-accent text-primary font-medium'
                        : 'border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {itemLabel}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
