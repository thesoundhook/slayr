import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHero from '@/components/ui/PageHero'
import { getVenues, deleteVenue } from '@/services/eventService'
import type { DbVenue } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

export default function VenuesPage() {
  const [venues, setVenues] = useState<DbVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getVenues().then(data => { setVenues(data); setLoading(false) }).catch(console.error)
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setError(null)
    try {
      await deleteVenue(id)
      setVenues(prev => prev.filter(v => v.id !== id))
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to delete venue')
    }
  }

  const filtered = venues.filter(v =>
    !search ||
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.city.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <>
      <PageHero
        badge="Catalogue"
        title="Venues"
        subtitle="Manage venues available for events."
        ghost="02"
        actions={
          <Button onClick={() => navigate('/venues/new')}>
            <Plus className="h-4 w-4" />
            Add Venue
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
              placeholder="Search venues…"
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <p className="text-muted-foreground text-sm whitespace-nowrap">{filtered.length} of {venues.length}</p>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No venues yet. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No venues match your search.
                  </TableCell>
                </TableRow>
              ) : filtered.map(venue => (
                <TableRow key={venue.id}>
                  <TableCell className="font-medium">{venue.name}</TableCell>
                  <TableCell className="text-muted-foreground">{venue.city}</TableCell>
                  <TableCell className="text-muted-foreground">{venue.state}</TableCell>
                  <TableCell className="text-muted-foreground">{venue.country}</TableCell>
                  <TableCell className="text-muted-foreground">{venue.capacity.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/venues/${venue.slug}/edit`)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(venue.id, venue.name)} title="Delete" className="text-destructive hover:text-destructive">
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
