import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, Ticket } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { TicketStub } from '../components/ticket/TicketStub'
import { useCartStore } from '../stores/cartStore'
import { formatPrice } from '../lib/utils'

export function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore()

  const fees = getTotalPrice() * 0.1
  const total = getTotalPrice() + fees

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-8">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 space-y-8"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="w-24 h-24 mx-auto rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center"
            >
              <ShoppingBag className="w-12 h-12 text-primary" />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-3xl font-display font-bold text-foreground">Your cart is empty</h1>
              <p className="text-muted-foreground">Find an event and grab your tickets.</p>
            </div>

            <Link to="/events">
              <Button size="lg" className="px-8">Explore Events</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-8 pb-28">
      <div className="max-w-6xl mx-auto px-4 md:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-4"
        >
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:text-primary transition-colors" />
            Continue Shopping
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Your Cart</h1>
              <p className="text-sm text-muted-foreground">
                {items.reduce((s, i) => s + i.quantity, 0)} ticket{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.div
                  key={`${item.eventId}-${item.ticketTypeId}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  className="border border-border/50 rounded-xl overflow-hidden bg-card/30"
                >
                  {/* Ticket visual */}
                  <TicketStub
                    event={item.event}
                    ticketType={item.ticketType}
                    quantity={item.quantity}
                    className="w-full"
                  />

                  {/* Controls — inline, no extra box */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.eventId, item.ticketTypeId, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold text-foreground">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.eventId, item.ticketTypeId, item.quantity + 1)}
                        disabled={item.quantity >= item.ticketType.maxPerOrder}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-foreground">{formatPrice(item.price * item.quantity)}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-muted-foreground">{formatPrice(item.price)} each</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.eventId, item.ticketTypeId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {items.length > 1 && (
              <div className="text-right pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear cart
                </Button>
              </div>
            )}
          </div>

          {/* Order summary — desktop sidebar */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 border border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm p-6 space-y-6"
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground">Order Summary</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Service fee</span>
                  <span>{formatPrice(fees)}</span>
                </div>
                <div className="border-t border-border/40 pt-3 flex justify-between font-bold text-foreground text-base">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Link to="/checkout">
                <Button size="lg" className="w-full">Proceed to Checkout</Button>
              </Link>

              <Link to="/events">
                <Button variant="outline" size="sm" className="w-full mt-2">Add More Tickets</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar — mobile only */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/90 backdrop-blur-md border-t border-border/50 px-4 py-3"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Total incl. fees</p>
            <p className="font-bold text-foreground text-lg leading-tight">{formatPrice(total)}</p>
          </div>
          <Link to="/checkout">
            <Button size="lg" className="px-8">Checkout</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
