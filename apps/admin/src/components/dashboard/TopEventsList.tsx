import { useNavigate } from 'react-router-dom'
import { formatPrice } from '@/lib/utils'
import type { TopEvent } from '@/services/analyticsService'

interface Props {
  events: TopEvent[]
}

export default function TopEventsList({ events }: Props) {
  const navigate = useNavigate()
  const max = Math.max(...events.map(e => e.revenue), 1)

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No sales yet in this period.</p>
  }

  return (
    <ol className="space-y-3">
      {events.map((event, i) => {
        const pct = (event.revenue / max) * 100
        return (
          <li
            key={event.event_id}
            className="group cursor-pointer"
            onClick={() => navigate(`/events/${event.event_id}/edit`)}
          >
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {event.title}
                </span>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold tabular-nums">{formatPrice(event.revenue / 100)}</div>
                <div className="text-[10px] text-muted-foreground">{event.tickets} tickets</div>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden ml-7">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        )
      })}
    </ol>
  )
}
