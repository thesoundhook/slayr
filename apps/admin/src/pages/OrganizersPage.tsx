import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHero from '@/components/ui/PageHero'
import { getOrganizers, deleteOrganizer } from '@/services/eventService'
import type { DbOrganizer } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState<DbOrganizer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getOrganizers().then(data => { setOrganizers(data); setLoading(false) }).catch(console.error)
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setError(null)
    try {
      await deleteOrganizer(id)
      setOrganizers(prev => prev.filter(o => o.id !== id))
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to delete organizer')
    }
  }

  const filtered = organizers.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <>
      <PageHero
        badge="Catalogue"
        title="Organizers"
        subtitle="Manage event organizers on the platform."
        ghost="03"
        actions={
          <Button onClick={() => navigate('/organizers/new')}>
            <Plus className="h-4 w-4" />
            Add Organizer
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="relative max-w-64 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search organizers…"
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <p className="text-muted-foreground text-sm whitespace-nowrap">{filtered.length} of {organizers.length}</p>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                    No organizers yet. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                    No organizers match your search.
                  </TableCell>
                </TableRow>
              ) : filtered.map(org => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {org.logo_url && (
                        <img src={org.logo_url} alt={org.name} className="h-6 w-6 rounded-full object-cover" />
                      )}
                      {org.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-64 truncate">{org.description ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={org.verified ? 'success' : 'default'}>
                      {org.verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/organizers/${org.id}/edit`)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(org.id, org.name)} title="Delete" className="text-destructive hover:text-destructive">
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
