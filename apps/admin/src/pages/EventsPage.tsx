import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHero from '@/components/ui/PageHero'
import { getEvents, deleteEvent } from '@/services/eventService'
import { supabase } from '@/lib/supabase'
import type { DbEvent } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatDateShort } from '@/lib/utils'
import { Plus, Pencil, Trash2, Users, Ban, Search } from 'lucide-react'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  upcoming: 'success',
  ongoing: 'default',
  past: 'secondary' as 'default',
  cancelled: 'destructive',
}

export default function EventsPage() {
  const [events, setEvents] = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getEvents().then(data => { setEvents(data); setLoading(false) }).catch(console.error)
  }, [])

  const handleCancel = async (id: string, title: string) => {
    if (!confirm(`Cancel "${title}"? Tickets already sold will remain valid.`)) return
    setError(null)
    const { error: err } = await supabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (err) { setError(err.message); return }
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'cancelled' } : e))
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setError(null)
    try {
      await deleteEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to delete event')
    }
  }

  const filtered = events.filter(e => {
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.venues?.name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || e.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <>
      <PageHero
        badge="Catalogue"
        title="Events"
        subtitle="Create, manage, and monitor all events on the platform."
        ghost="01"
        actions={
          <Button onClick={() => navigate('/events/new')}>
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        }
      />
      <div className="p-4 sm:p-6 space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-64 sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events…"
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="past">Past</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <p className="text-muted-foreground text-sm whitespace-nowrap">{filtered.length} of {events.length}</p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No events yet. <Link to="/events/new" className="text-primary underline">Create one.</Link>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No events match your search.
                </TableCell>
              </TableRow>
            ) : filtered.map(event => (
              <TableRow key={event.id}>
                <TableCell className="font-medium max-w-48 truncate">{event.title}</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">{formatDateShort(event.date)}</TableCell>
                <TableCell className="text-muted-foreground">{event.venues?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground capitalize">{event.category}</TableCell>
                <TableCell className="text-muted-foreground">
                  {event.sold_tickets.toLocaleString()} / {event.total_capacity.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[event.status] ?? 'default'} className="capitalize">
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${event.id}/attendees`)} title="Attendees">
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${event.id}/edit`)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {event.status !== 'cancelled' && (
                      <Button variant="ghost" size="icon" onClick={() => handleCancel(event.id, event.title)} title="Cancel event" className="text-orange-500 hover:text-orange-600">
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id, event.title)} title="Delete" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </div>
    </>
  )
}
