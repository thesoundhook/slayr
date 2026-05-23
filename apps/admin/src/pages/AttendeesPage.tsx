import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEventById } from '@/services/eventService'
import { getTicketsByEvent } from '@/services/orderService'
import type { DbEvent, DbTicket } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, Download } from 'lucide-react'
import PageHero from '@/components/ui/PageHero'

type Attendee = DbTicket & {
  orders: { customer_first_name: string; customer_last_name: string; customer_email: string; customer_phone: string | null } | null
  ticket_types: { name: string; type: string } | null
}

export default function AttendeesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<DbEvent | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([getEventById(id), getTicketsByEvent(id)])
      .then(([e, a]) => { setEvent(e); setAttendees(a as Attendee[]) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'Ticket Type', 'QR Code', 'Purchased At', 'Used']
    const rows = attendees.map(a => [
      `${a.orders?.customer_first_name ?? ''} ${a.orders?.customer_last_name ?? ''}`.trim(),
      a.orders?.customer_email ?? '',
      a.orders?.customer_phone ?? '',
      a.ticket_types?.name ?? '',
      a.qr_code,
      a.created_at,
      a.used ? 'Yes' : 'No',
    ])
    const csv = [header, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendees-${event?.title ?? id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <>
      <PageHero
        badge="Access"
        title="Attendees"
        subtitle={event ? `All registered attendees for ${event.title}.` : 'All registered attendees for this event.'}
        ghost="04"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate('/events')}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={attendees.length === 0}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </>
        }
      />
      <div className="p-6 space-y-4">
      {event && (
        <div>
          <h2 className="text-lg font-semibold">{event.title}</h2>
          <p className="text-sm text-muted-foreground">{attendees.length} attendees</p>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Ticket Type</TableHead>
              <TableHead>QR Code</TableHead>
              <TableHead>Purchased</TableHead>
              <TableHead>Used</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">No attendees yet.</TableCell>
              </TableRow>
            ) : attendees.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {a.orders?.customer_first_name} {a.orders?.customer_last_name}
                </TableCell>
                <TableCell className="text-muted-foreground">{a.orders?.customer_email}</TableCell>
                <TableCell className="text-muted-foreground">{a.orders?.customer_phone ?? '—'}</TableCell>
                <TableCell className="capitalize">{a.ticket_types?.name ?? '—'}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{a.qr_code.slice(0, 12)}…</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">{formatDateTime(a.created_at)}</TableCell>
                <TableCell>
                  <span className={a.used ? 'text-green-600' : 'text-muted-foreground'}>
                    {a.used ? 'Yes' : 'No'}
                  </span>
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
