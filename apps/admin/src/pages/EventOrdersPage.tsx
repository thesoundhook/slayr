import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Clock, CheckCircle2, ChefHat, Truck, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getEventById } from '@/services/eventService'
import type { DbEvent } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import PageHero from '@/components/ui/PageHero'
import { cn } from '@/lib/utils'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'served' | 'cancelled'

interface TableOrderItem {
  id: string
  name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface TableOrder {
  id: string
  table_number: number
  customer_name: string
  customer_phone: string
  subtotal: number
  total: number
  status: OrderStatus
  created_at: string
  table_order_items: TableOrderItem[]
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'default' | 'warning' | 'success' | 'destructive'; icon: React.ElementType; next?: OrderStatus; nextLabel?: string }> = {
  pending:   { label: 'Pending',   variant: 'warning',     icon: Clock,         next: 'confirmed', nextLabel: 'Confirm' },
  confirmed: { label: 'Confirmed', variant: 'default',     icon: CheckCircle2,  next: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', variant: 'default',     icon: ChefHat,       next: 'served',    nextLabel: 'Mark Served' },
  served:    { label: 'Served',    variant: 'success',     icon: Truck,         next: undefined },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(iso))
}

function formatPrice(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

export default function EventOrdersPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [event, setEvent]   = useState<DbEvent | null>(null)
  const [orders, setOrders] = useState<TableOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const loadOrders = useCallback(async (eventId: string) => {
    const { data, error } = await supabase
      .from('table_orders')
      .select('*, table_order_items(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (error) throw error
    setOrders((data ?? []) as TableOrder[])
  }, [])

  useEffect(() => {
    if (!id) return
    getEventById(id)
      .then(async ev => {
        setEvent(ev)
        await loadOrders(ev.id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, loadOrders])

  // Realtime subscription
  useEffect(() => {
    if (!event) return
    const channel = supabase
      .channel(`table_orders:${event.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'table_orders',
        filter: `event_id=eq.${event.id}`,
      }, () => {
        loadOrders(event.id).catch(console.error)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [event, loadOrders])

  const updateStatus = async (order: TableOrder, status: OrderStatus) => {
    setUpdating(order.id)
    const { error } = await supabase.from('table_orders').update({ status }).eq('id', order.id)
    if (!error) setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status } : o))
    setUpdating(null)
  }

  const filtered = orders.filter(o => statusFilter === 'all' || o.status === statusFilter)

  // Group by table number
  const byTable = filtered.reduce<Record<number, TableOrder[]>>((acc, o) => {
    if (!acc[o.table_number]) acc[o.table_number] = []
    acc[o.table_number].push(o)
    return acc
  }, {})

  const pendingCount = orders.filter(o => o.status === 'pending').length

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  if (!event)  return <div className="p-6 text-muted-foreground">Event not found.</div>

  return (
    <>
      <PageHero
        badge="Live Orders"
        title={`Orders — ${event.title}`}
        subtitle="Incoming table orders in real time. Update status as items are prepared and served."
        ghost="05"
        actions={
          <div className="flex gap-2 items-center">
            {pendingCount > 0 && (
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-3 py-1 animate-pulse">
                {pendingCount} pending
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => event && loadOrders(event.id)}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/events/${event.slug}/edit`)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'confirmed', 'preparing', 'served', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors capitalize',
                statusFilter === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {s === 'all' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed bg-card flex flex-col items-center justify-center py-16 text-center gap-3">
            <p className="text-sm text-muted-foreground">
              {orders.length === 0 ? 'No orders yet. Orders will appear here in real time.' : 'No orders match this filter.'}
            </p>
          </div>
        )}

        {/* Orders grouped by table */}
        {Object.entries(byTable)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([tableNum, tableOrders]) => (
            <div key={tableNum} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Table {tableNum}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{tableOrders.length} order{tableOrders.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tableOrders.map(order => {
                  const cfg = STATUS_CONFIG[order.status]
                  const StatusIcon = cfg.icon
                  return (
                    <Card key={order.id} className={cn('overflow-hidden', order.status === 'pending' && 'ring-1 ring-amber-300')}>
                      {/* Card header */}
                      <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm">{order.customer_name}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatTime(order.created_at)}</p>
                          </div>
                          <Badge variant={cfg.variant} className="flex items-center gap-1 capitalize">
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="px-4 pb-4 space-y-3">
                        {/* Items */}
                        <div className="space-y-1.5">
                          {order.table_order_items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{item.name} ×{item.quantity}</span>
                              <span className="font-medium">{formatPrice(item.total_price)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Total */}
                        <div className="border-t border-border/50 pt-2 flex justify-between text-sm font-semibold">
                          <span>Total</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-1">
                          {cfg.next && (
                            <Button
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => updateStatus(order, cfg.next!)}
                              disabled={updating === order.id}
                            >
                              {updating === order.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : cfg.nextLabel}
                            </Button>
                          )}
                          {order.status !== 'cancelled' && order.status !== 'served' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs text-destructive hover:text-destructive border-destructive/30"
                              onClick={() => updateStatus(order, 'cancelled')}
                              disabled={updating === order.id}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
      </div>
    </>
  )
}
