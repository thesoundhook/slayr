import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'

interface TopBarProps {
  title: string
}

export default function TopBar({ title }: TopBarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-card flex items-center justify-between px-6">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </header>
  )
}
