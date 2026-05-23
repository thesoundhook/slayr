import { LogOut, Menu } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'

interface TopBarProps {
  title: string
  onMenuClick: () => void
}

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-card flex items-center justify-between px-4 sm:px-6 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden -ml-1 p-2 text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </header>
  )
}
