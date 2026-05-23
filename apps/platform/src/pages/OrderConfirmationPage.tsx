import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Calendar, MapPin, Download, Home } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { getOrderById, OrderDetail } from '../services/eventService'
import { formatDate, formatTime, formatPrice } from '../lib/utils'

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getOrderById(id)
      .then(data => {
        if (!data) setError('Order not found.')
        else setOrder(data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading your order...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Order not found</h1>
          <p className="text-muted-foreground">{error}</p>
          <Link to="/events">
            <Button>Browse Events</Button>
          </Link>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            You're going!
          </h1>
          <p className="text-muted-foreground mt-2">
            Your tickets have been confirmed. Check your email at{' '}
            <span className="text-foreground font-medium">{order.customerEmail}</span>
          </p>

          <div className="mt-4">
            <Badge variant="success" className="text-sm px-3 py-1">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </Badge>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Tickets grouped by order item */}
          {order.items.map((item, itemIndex) => {
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: itemIndex * 0.1 + 0.2 }}
              >
                <Card className="border-0 bg-card/50 backdrop-blur-md overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{item.eventTitle}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(item.eventDate)} · {formatTime(item.eventTime)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{item.venueName}, {item.venueCity}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize shrink-0">
                        {item.ticketTypeName}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Individual QR codes */}
                    {order.tickets
                      .slice(
                        order.items.slice(0, itemIndex).reduce((s, i) => s + i.quantity, 0),
                        order.items.slice(0, itemIndex + 1).reduce((s, i) => s + i.quantity, 0)
                      )
                      .map((ticket, tIndex) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              Ticket {itemIndex * item.quantity + tIndex + 1} of{' '}
                              {order.items.reduce((s, i) => s + i.quantity, 0)}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {ticket.qrCode.slice(0, 18).toUpperCase()}...
                            </p>
                          </div>
                          {/* QR code placeholder — replace with a real QR lib if needed */}
                          <div className="w-16 h-16 bg-foreground rounded-lg flex items-center justify-center shrink-0">
                            <div className="w-12 h-12 bg-background rounded grid grid-cols-3 gap-0.5 p-0.5">
                              {Array.from({ length: 9 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`rounded-sm ${
                                    [0, 2, 4, 6, 8].includes(i) ? 'bg-foreground' : 'bg-background'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 bg-card/50 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.ticketTypeName} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">Service fees</span>
                  <span>{formatPrice(order.fees)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border/50">
                  <span>Total paid</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
                {order.paystackReference && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Paystack ref: {order.paystackReference}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/events" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Browse More Events
              </Button>
            </Link>
            <Button
              variant="default"
              className="flex-1"
              onClick={() => window.print()}
            >
              <Download className="w-4 h-4 mr-2" />
              Save / Print Tickets
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
