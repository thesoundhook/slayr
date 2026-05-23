import { useEffect, useState } from 'react'
import PageHero from '@/components/ui/PageHero'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatPrice } from '@/lib/utils'
import {
  getKpiStats,
  getRevenueSeries,
  getOrdersSeries,
  getTicketsSeries,
  getCustomersSeries,
  getTopEvents,
  getCategoryBreakdown,
  getStatusBreakdown,
  getSalesFunnel,
  getRecentActivity,
  type KpiStatsWithPrev,
  type SeriesPoint,
  type TopEvent,
  type CategorySlice,
  type StatusSlice,
  type SalesFunnel as FunnelData,
  type RecentOrder,
} from '@/services/analyticsService'
import RevenueChart from '@/components/dashboard/RevenueChart'
import StatCard from '@/components/dashboard/StatCard'
import Donut, { type DonutSlice } from '@/components/dashboard/Donut'
import TopEventsList from '@/components/dashboard/TopEventsList'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import SalesFunnel from '@/components/dashboard/SalesFunnel'
import DateRangeFilter, { RANGE_DAYS, type RangeKey } from '@/components/dashboard/DateRangeFilter'
import { TrendingUp, Ticket, ShoppingBag, Users } from 'lucide-react'

const CATEGORY_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626',
  '#0891b2', '#db2777', '#65a30d', '#9333ea', '#ea580c', '#475569',
]

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#10b981',
  pending: '#f59e0b',
  cancelled: '#ef4444',
  refunded: '#64748b',
}

interface DashboardData {
  kpis: KpiStatsWithPrev
  revenueSeries: SeriesPoint[]
  ordersSeries: SeriesPoint[]
  ticketsSeries: SeriesPoint[]
  customersSeries: SeriesPoint[]
  topEvents: TopEvent[]
  categories: CategorySlice[]
  statuses: StatusSlice[]
  funnel: FunnelData
  recent: RecentOrder[]
}

export default function DashboardPage() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const days = RANGE_DAYS[range]
    Promise.all([
      getKpiStats(days),
      getRevenueSeries(days),
      getOrdersSeries(days),
      getTicketsSeries(days),
      getCustomersSeries(days),
      getTopEvents(days, 5),
      getCategoryBreakdown(days),
      getStatusBreakdown(days),
      getSalesFunnel(days),
      getRecentActivity(8),
    ]).then(([kpis, revenueSeries, ordersSeries, ticketsSeries, customersSeries, topEvents, categories, statuses, funnel, recent]) => {
      if (cancelled) return
      setData({ kpis, revenueSeries, ordersSeries, ticketsSeries, customersSeries, topEvents, categories, statuses, funnel, recent })
      setLoading(false)
    }).catch(err => {
      console.error(err)
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [range])

  if (loading || !data) {
    return (
      <>
        <PageHero
          badge="Overview"
          title="Dashboard"
          subtitle="Track revenue, ticket sales, and events at a glance."
          ghost="00"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </>
    )
  }

  const categorySlices: DonutSlice[] = data.categories.map((c, i) => ({
    label: c.category,
    value: c.revenue,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }))

  const statusSlices: DonutSlice[] = data.statuses.map(s => ({
    label: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? '#94a3b8',
  }))

  const totalOrders = data.statuses.reduce((s, x) => s + x.count, 0)

  return (
    <>
      <PageHero
        badge="Overview"
        title="Dashboard"
        subtitle="Track revenue, ticket sales, and events at a glance."
        ghost="00"
        actions={<DateRangeFilter value={range} onChange={setRange} />}
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* KPI bento row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Revenue"
            value={formatPrice(data.kpis.current.revenue / 100)}
            current={data.kpis.current.revenue}
            previous={data.kpis.previous.revenue}
            icon={TrendingUp}
            accent="bg-violet-50 text-violet-600"
            sparkline={data.revenueSeries}
          />
          <StatCard
            label="Tickets"
            value={data.kpis.current.tickets.toLocaleString()}
            current={data.kpis.current.tickets}
            previous={data.kpis.previous.tickets}
            icon={Ticket}
            accent="bg-blue-50 text-blue-600"
            sparkline={data.ticketsSeries}
          />
          <StatCard
            label="Orders"
            value={data.kpis.current.orders.toLocaleString()}
            current={data.kpis.current.orders}
            previous={data.kpis.previous.orders}
            icon={ShoppingBag}
            accent="bg-amber-50 text-amber-600"
            sparkline={data.ordersSeries}
          />
          <StatCard
            label="Customers"
            value={data.kpis.current.customers.toLocaleString()}
            current={data.kpis.current.customers}
            previous={data.kpis.previous.customers}
            icon={Users}
            accent="bg-emerald-50 text-emerald-600"
            sparkline={data.customersSeries}
          />
        </div>

        {/* Main bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Revenue chart — spans 2 cols */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Revenue trend</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Confirmed orders over the last {RANGE_DAYS[range]} days
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">
                  {formatPrice(data.kpis.current.revenue / 100)}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  this period
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <RevenueChart data={data.revenueSeries} />
            </CardContent>
          </Card>

          {/* Order status donut */}
          <Card>
            <CardHeader>
              <CardTitle>Order status</CardTitle>
              <p className="text-xs text-muted-foreground">{totalOrders} orders</p>
            </CardHeader>
            <CardContent>
              <Donut
                data={statusSlices}
                centerLabel="Total"
                centerValue={totalOrders.toLocaleString()}
              />
            </CardContent>
          </Card>

          {/* Top events */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top events</CardTitle>
              <p className="text-xs text-muted-foreground">Ranked by revenue this period</p>
            </CardHeader>
            <CardContent>
              <TopEventsList events={data.topEvents} />
            </CardContent>
          </Card>

          {/* Sales funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Sales funnel</CardTitle>
              <p className="text-xs text-muted-foreground">Capacity → sold → checked-in</p>
            </CardHeader>
            <CardContent>
              <SalesFunnel data={data.funnel} />
            </CardContent>
          </Card>

          {/* Category breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by category</CardTitle>
              <p className="text-xs text-muted-foreground">
                {data.categories.length} {data.categories.length === 1 ? 'category' : 'categories'}
              </p>
            </CardHeader>
            <CardContent>
              <Donut
                data={categorySlices}
                centerLabel="Total"
                centerValue={formatPrice(data.categories.reduce((s, c) => s + c.revenue, 0) / 100)}
                valueFormatter={(v) => formatPrice(v / 100)}
              />
            </CardContent>
          </Card>

          {/* Activity feed — spans 2 cols */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <p className="text-xs text-muted-foreground">Latest orders across the platform</p>
            </CardHeader>
            <CardContent className="px-0">
              <ActivityFeed orders={data.recent} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
