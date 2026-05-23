import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHero from '@/components/ui/PageHero'
import { getOrders } from '@/services/orderService'
import type { OrderWithDetails } from '@/services/orderService'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatPrice, formatDateTime } from '@/lib/utils'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'destructive',
  refunded: 'secondary' as 'default',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getOrders()
      .then(o => { setOrders(o); setLoading(false) })
      .catch(console.error)
  }, [])

  const filtered = orders.filter(o => !statusFilter || o.status === statusFilter)

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <>
      <PageHero
        badge="Commerce"
        title="Orders"
        subtitle="Review all ticket purchases and transaction statuses."
        ghost="03"
      />
      <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <p className="text-sm text-muted-foreground">{filtered.length} orders</p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">No orders found.</TableCell>
              </TableRow>
            ) : filtered.map(order => {
              const totalQty = order.order_items.reduce((s, i) => s + i.quantity, 0)
              const eventTitle = order.order_items[0]?.events?.title ?? '—'
              return (
                <TableRow key={order.id} className="cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                  <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}…</TableCell>
                  <TableCell>
                    <div className="font-medium">{order.customer_first_name} {order.customer_last_name}</div>
                    <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-40 truncate">{eventTitle}</TableCell>
                  <TableCell className="text-muted-foreground">{totalQty}</TableCell>
                  <TableCell className="font-medium">{formatPrice(order.total / 100)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[order.status] ?? 'default'} className="capitalize">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{formatDateTime(order.created_at)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      </div>
    </>
  )
}
