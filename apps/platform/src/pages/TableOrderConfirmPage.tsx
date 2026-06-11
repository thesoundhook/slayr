import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, UtensilsCrossed } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatPrice } from '../lib/utils'
import { Card, CardContent } from '../components/ui/Card'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
})

interface OrderItem { name: string; quantity: number; unit_price: number; total_price: number }
interface Order {
  id: string
  table_number: number
  customer_name: string
  subtotal: number
  total: number
  status: string
  created_at: string
  table_order_items: OrderItem[]
}

export function TableOrderConfirmPage() {
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>()
  const [searchParams] = useSearchParams()
  const tableNumber = searchParams.get('table')

  const [order, setOrder]   = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    supabase
      .from('table_orders')
      .select('*, table_order_items(*)')
      .eq('id', orderId)
      .single()
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); return }
        setOrder(data as Order)
      })
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <UtensilsCrossed className="w-10 h-10 text-muted-foreground" />
        <p className="text-muted-foreground">Order not found. Please show your payment reference to staff.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/slayr logo.png" alt="Slayr" className="h-6 w-auto opacity-70" />
          {tableNumber && (
            <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1">
              Table {tableNumber}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Success banner */}
        <motion.div {...fadeUp(0)} className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Order placed!</h1>
          <p className="text-muted-foreground">
            Thanks, {order.customer_name.split(' ')[0]}. Your order is being prepared and will be brought to Table {order.table_number}.
          </p>
        </motion.div>

        {/* Order card */}
        <motion.div {...fadeUp(0.2)}>
          <Card className="border-0 bg-card/50 backdrop-blur-md">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Order #{order.id.slice(0, 8).toUpperCase()}</h2>
                <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 capitalize">
                  {order.status}
                </span>
              </div>

              <div className="space-y-3 border-t border-border/50 pt-4">
                {order.table_order_items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} ×{item.quantity}</span>
                    <span className="font-medium">{formatPrice(item.total_price / 100)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/50 pt-4 flex justify-between font-bold">
                <span>Total paid</span>
                <span className="text-primary">{formatPrice(order.total / 100)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back to menu */}
        <motion.div {...fadeUp(0.3)} className="mt-8 text-center">
          <Link
            to={`/e/${slug}/menu?table=${tableNumber ?? ''}`}
            className="text-sm text-primary hover:underline"
          >
            ← Back to menu
          </Link>
        </motion.div>

        <motion.div {...fadeUp(0.35)} className="mt-12 text-center">
          <p className="text-xs text-muted-foreground/40 tracking-widest uppercase">Powered by Slayr</p>
        </motion.div>
      </div>
    </div>
  )
}
