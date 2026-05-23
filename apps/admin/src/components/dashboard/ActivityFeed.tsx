import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { RecentOrder } from '@/services/analyticsService'

interface Props {
  orders: RecentOrder[]
}

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  confirmed: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  pending: { icon: Clock, color: 'text-amber-600 bg-amber-50' },
  cancelled: { icon: XCircle, color: 'text-rose-600 bg-rose-50' },
  refunded: { icon: RotateCcw, color: 'text-slate-600 bg-slate-100' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

export default function ActivityFeed({ orders }: Props) {
  const navigate = useNavigate()

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No recent activity.</p>
  }

  return (
    <ul className="divide-y divide-border -mx-6">
      {orders.map(order => {
        const cfg = statusConfig[order.status] ?? statusConfig.pending
        const Icon = cfg.icon
        return (
          <li
            key={order.id}
            className="px-6 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
            onClick={() => navigate(`/orders/${order.id}`)}
          >
            <div className="flex items-center gap-3">
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0', cfg.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{order.customer_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {order.quantity} × {order.event_title ?? '—'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold tabular-nums">{formatPrice(order.total / 100)}</p>
                <p className="text-[10px] text-muted-foreground">{timeAgo(order.created_at)}</p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
