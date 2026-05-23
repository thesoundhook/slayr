import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatPrice } from '@/lib/utils'
import {
  getTotalRevenue,
  getTotalTicketsSold,
  getActiveEventsCount,
  getTotalOrdersCount,
  getRevenueByDay,
  type RevenueByDay,
} from '@/services/analyticsService'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Ticket, Calendar, ShoppingBag } from 'lucide-react'

interface KPI {
  label: string
  value: string
  icon: React.ElementType
  color: string
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPI[]>([])
  const [chartData, setChartData] = useState<RevenueByDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [revenue, tickets, activeEvents, orders, revenueByDay] = await Promise.all([
        getTotalRevenue(),
        getTotalTicketsSold(),
        getActiveEventsCount(),
        getTotalOrdersCount(),
        getRevenueByDay(30),
      ])
      setKpis([
        { label: 'Total Revenue', value: formatPrice(revenue / 100), icon: TrendingUp, color: 'text-violet-600' },
        { label: 'Tickets Sold', value: tickets.toLocaleString(), icon: Ticket, color: 'text-blue-600' },
        { label: 'Active Events', value: activeEvents.toLocaleString(), icon: Calendar, color: 'text-green-600' },
        { label: 'Total Orders', value: orders.toLocaleString(), icon: ShoppingBag, color: 'text-orange-600' },
      ])
      setChartData(revenueByDay)
      setLoading(false)
    }
    load()
  }, [])

  const formatChartDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  const formatChartValue = (value: number) => formatPrice(value / 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue — last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={formatChartDate}
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tickFormatter={v => `₦${(v / 100).toLocaleString()}`}
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                formatter={(value) => [formatChartValue(Number(value)), 'Revenue'] as [string, string]}
                labelFormatter={(label) => formatChartDate(String(label))}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
