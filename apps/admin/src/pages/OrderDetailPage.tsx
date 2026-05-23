import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrderById } from '@/services/orderService'
import type { OrderWithDetails } from '@/services/orderService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'destructive',
  refunded: 'secondary' as 'default',
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) getOrderById(id).then(setOrder).catch(console.error).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  if (!order) {
    return <p className="text-muted-foreground">Order not found.</p>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{order.customer_first_name} {order.customer_last_name}</p>
            <p className="text-muted-foreground">{order.customer_email}</p>
            {order.customer_phone && <p className="text-muted-foreground">{order.customer_phone}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Order Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-xs">{order.id.slice(0, 8)}…</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={statusVariant[order.status] ?? 'default'} className="capitalize">{order.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{formatDateTime(order.created_at)}</span>
            </div>
            {order.paystack_reference && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paystack Ref</span>
                <span className="font-mono text-xs">{order.paystack_reference}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Ticket Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.order_items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.events?.title ?? '—'}</TableCell>
                  <TableCell className="capitalize">{item.ticket_types?.name ?? '—'}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatPrice(item.unit_price / 100)}</TableCell>
                  <TableCell className="text-right">{formatPrice(item.total_price / 100)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span><span>{formatPrice(order.subtotal / 100)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Fees</span><span>{formatPrice(order.fees / 100)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base border-t pt-2">
            <span>Total</span><span>{formatPrice(order.total / 100)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
