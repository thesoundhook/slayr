import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHero from '@/components/ui/PageHero'
import { getBriefs, deleteBrief } from '@/services/briefService'
import type { BriefSummary } from '@/services/briefService'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function BriefsPage() {
  const [briefs, setBriefs] = useState<BriefSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getBriefs()
      .then(data => { setBriefs(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      await deleteBrief(id)
      setBriefs(prev => prev.filter(b => b.id !== id))
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Failed to delete brief')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <>
      <PageHero
        badge="Client Work"
        title="Event Briefs"
        subtitle="Create and manage client event production briefs across all 16 production gates."
        ghost="05"
        actions={
          <Button onClick={() => navigate('/briefs/new')}>
            <Plus className="h-4 w-4" />
            New Brief
          </Button>
        }
      />
      <div className="p-4 sm:p-6 space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        {briefs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-card">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">No briefs yet</p>
            <p className="text-xs text-muted-foreground mb-6">Create your first client event brief to get started.</p>
            <Button onClick={() => navigate('/briefs/new')}>
              <Plus className="h-4 w-4" />
              New Brief
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brief title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {briefs.map(brief => (
                  <TableRow key={brief.id} className="cursor-pointer" onClick={() => navigate(`/briefs/${brief.id}`)}>
                    <TableCell className="font-medium">{brief.title || 'Untitled Brief'}</TableCell>
                    <TableCell>
                      <Badge variant={brief.status === 'complete' ? 'success' : 'warning'} className="capitalize">
                        {brief.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round((brief.current_gate / 16) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">Gate {brief.current_gate} / 16</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatRelative(brief.updated_at)}</TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/briefs/${brief.id}`)} title="Open brief">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(brief.id, brief.title)} title="Delete" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}
