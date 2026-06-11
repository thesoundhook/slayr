import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Clock, UtensilsCrossed, Users, CheckCircle, Plus, Minus, ShoppingBag } from 'lucide-react'
import { getEventById } from '../services/eventService'
import { getMenuByEvent, type MenuCategory, type MenuItem } from '../services/menuService'
import { formatDate, formatTime, formatPrice } from '../lib/utils'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Event } from '../types/event'

type CartEntry = { item: MenuItem; quantity: number }

const CART_KEY = 'slayr_table_cart'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
})

export function MenuPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tableNumber = searchParams.get('table')

  const [event, setEvent]   = useState<Event | null>(null)
  const [menu, setMenu]     = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [cart, setCart]     = useState<Record<string, CartEntry>>({})

  useEffect(() => {
    if (!slug) return
    getEventById(slug)
      .then(async ev => {
        setEvent(ev)
        if (ev) {
          const cats = await getMenuByEvent(ev.id)
          setMenu(cats)
        }
      })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [slug])

  // ── Cart helpers ─────────────────────────────────────────────────────────
  const cartItems    = Object.values(cart)
  const cartCount    = cartItems.reduce((s, e) => s + e.quantity, 0)
  const cartSubtotal = cartItems.reduce((s, e) => s + e.item.price * e.quantity, 0)

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev[item.id]
      return { ...prev, [item.id]: { item, quantity: (existing?.quantity ?? 0) + 1 } }
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev[itemId]
      if (!existing || existing.quantity <= 1) {
        const next = { ...prev }
        delete next[itemId]
        return next
      }
      return { ...prev, [itemId]: { ...existing, quantity: existing.quantity - 1 } }
    })
  }

  const handleOrder = () => {
    if (!event || cartCount === 0) return
    sessionStorage.setItem(CART_KEY, JSON.stringify(cartItems))
    navigate(`/e/${slug}/checkout?table=${tableNumber ?? ''}`)
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse">
          <div className="w-full bg-muted" style={{ height: 400 }} />
          <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
            <div className="h-8 w-1/3 bg-muted rounded" />
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 h-64 bg-muted rounded-xl" />
              <div className="h-64 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <UtensilsCrossed className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="font-display font-bold text-xl">QR code not found</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          This QR code is no longer valid. Ask a member of staff for assistance.
        </p>
      </div>
    )
  }

  const coverImage = event.images?.[0]
  const hasMenu = menu.length > 0

  return (
    <div className="min-h-screen bg-background pb-28">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ maxHeight: 520, minHeight: 300 }}>
        {coverImage ? (
          <img src={coverImage} alt={event.title} className="w-full object-cover" style={{ maxHeight: 520, minHeight: 300, objectFit: 'cover', display: 'block' }} />
        ) : (
          <div className="w-full bg-gradient-to-br from-violet-900 via-indigo-950 to-black" style={{ height: 400 }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Top bar */}
        <div className="absolute top-6 left-0 right-0 px-6 flex items-center justify-between" style={{ maxWidth: '64rem', margin: '0 auto', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
          <img src="/slayr logo.png" alt="Slayr" className="h-7 w-auto opacity-80" />
          {tableNumber && (
            <div className="bg-white/10 backdrop-blur-md border border-white/25 rounded-full px-5 py-2">
              <span className="text-white text-sm font-semibold tracking-wide">Table {tableNumber}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 pb-8 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fadeUp(0)} className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="success" className="capitalize">{event.category}</Badge>
                {event.featured && <Badge variant="warning">⭐ Featured</Badge>}
                {event.status === 'ongoing' && (
                  <Badge className="bg-red-500/80 text-white border-0 animate-pulse">● Live Now</Badge>
                )}
              </div>
              <h1 className="text-white text-3xl md:text-4xl font-display font-bold leading-tight drop-shadow-lg">
                {event.title}
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-8 items-start">

          {/* ── Left: menu (2/3) ─────────────────────────────────────────────── */}
          <div className="md:col-span-2 space-y-8">

            {/* Table welcome (mobile) */}
            {tableNumber && (
              <motion.div {...fadeUp(0.1)} className="md:hidden">
                <div className="rounded-2xl bg-primary/10 border border-primary/20 p-5 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/20 border border-primary/30 flex flex-col items-center justify-center shrink-0">
                    <span className="text-primary font-display font-bold text-2xl leading-none">{tableNumber}</span>
                    <span className="text-primary/60 text-[10px] uppercase tracking-widest mt-0.5">Table</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Welcome to Table {tableNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Browse the menu and add items to your order.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Menu */}
            <motion.div {...fadeUp(0.15)} className="space-y-8">
              <h2 className="text-2xl font-display font-bold">Menu</h2>

              {!hasMenu ? (
                <Card className="border-0 bg-card/30 backdrop-blur-sm">
                  <CardContent className="py-16 flex flex-col items-center text-center gap-5">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"
                    >
                      <UtensilsCrossed className="w-7 h-7 text-primary/60" />
                    </motion.div>
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground text-lg">Menu not available yet</p>
                      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mx-auto">
                        The menu for this event hasn't been set up. Check back shortly or ask a staff member.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-10">
                  {menu.map((cat, catIdx) => (
                    <motion.div key={cat.id} {...fadeUp(0.15 + catIdx * 0.05)}>
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-lg font-display font-bold">{cat.name}</h3>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">{cat.items.filter(i => i.isAvailable).length} available</span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        {cat.items.map(item => {
                          const qty = cart[item.id]?.quantity ?? 0
                          return (
                            <Card
                              key={item.id}
                              className={`border-0 bg-card/30 backdrop-blur-sm overflow-hidden transition-opacity ${!item.isAvailable ? 'opacity-40 pointer-events-none' : ''}`}
                            >
                              <CardContent className="p-0">
                                <div className="flex">
                                  {item.imageUrl && (
                                    <img src={item.imageUrl} alt={item.name} className="w-24 h-full object-cover shrink-0 min-h-[88px]" />
                                  )}
                                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                                    <div>
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold text-sm leading-snug">{item.name}</p>
                                        {!item.isAvailable && (
                                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">Sold out</span>
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                      <p className="text-sm font-bold text-primary">
                                        {item.price > 0 ? formatPrice(item.price / 100) : 'Free'}
                                      </p>
                                      {/* +/- controls */}
                                      {qty === 0 ? (
                                        <button
                                          onClick={() => addToCart(item)}
                                          className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full px-3 py-1.5 transition-colors"
                                        >
                                          <Plus className="w-3 h-3" /> Add
                                        </button>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                                          >
                                            <Minus className="w-3.5 h-3.5" />
                                          </button>
                                          <AnimatePresence mode="wait">
                                            <motion.span
                                              key={qty}
                                              initial={{ scale: 0.7, opacity: 0 }}
                                              animate={{ scale: 1, opacity: 1 }}
                                              exit={{ scale: 0.7, opacity: 0 }}
                                              transition={{ duration: 0.15 }}
                                              className="text-sm font-bold w-5 text-center"
                                            >
                                              {qty}
                                            </motion.span>
                                          </AnimatePresence>
                                          <button
                                            onClick={() => addToCart(item)}
                                            className="w-7 h-7 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                                          >
                                            <Plus className="w-3.5 h-3.5 text-primary-foreground" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Right: sidebar (1/3) ─────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Table welcome (desktop) */}
            {tableNumber && (
              <motion.div {...fadeUp(0.1)} className="hidden md:block">
                <div className="rounded-2xl bg-primary/10 border border-primary/20 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 border border-primary/30 flex flex-col items-center justify-center shrink-0">
                      <span className="text-primary font-display font-bold text-xl leading-none">{tableNumber}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Table {tableNumber}</p>
                      <p className="text-xs text-muted-foreground">You're all checked in</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Browse the menu and your order will be brought directly to this table.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Order summary (desktop, shown when cart has items) */}
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="hidden md:block"
                >
                  <Card className="border-0 bg-card/30 backdrop-blur-sm sticky top-6">
                    <CardContent className="p-5 space-y-4">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-primary" /> Your Order
                      </h3>
                      <div className="space-y-2">
                        {cartItems.map(({ item, quantity }) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{item.name} ×{quantity}</span>
                            <span className="font-medium">{formatPrice((item.price * quantity) / 100)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-border/50 pt-3 flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(cartSubtotal / 100)}</span>
                      </div>
                      <Button className="w-full" onClick={handleOrder}>
                        Place Order
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Event details */}
            <motion.div {...fadeUp(0.2)}>
              <Card className="border-0 bg-card/30 backdrop-blur-sm">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-sm">Event Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <Calendar className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">{formatTime(event.time)}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{event.venue.name}{event.venue.city ? `, ${event.venue.city}` : ''}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Organiser */}
            <motion.div {...fadeUp(0.25)}>
              <Card className="border-0 bg-card/30 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {event.organizer.logo
                        ? <img src={event.organizer.logo} alt={event.organizer.name} className="w-full h-full object-cover" />
                        : <Users className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{event.organizer.name}</span>
                        {event.organizer.verified && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">Event Organiser</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div className="py-8 text-center border-t border-border/40 mt-4">
        <p className="text-xs text-muted-foreground/50 tracking-widest uppercase">Powered by Slayr</p>
      </div>

      {/* ── Sticky bottom bar (mobile) ────────────────────────────────────────── */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border/50 px-4 py-3"
          >
            <div className="flex items-center gap-3 max-w-lg mx-auto">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
                <p className="font-bold text-foreground text-lg leading-tight">{formatPrice(cartSubtotal / 100)}</p>
              </div>
              <Button size="lg" className="px-8 shrink-0" onClick={handleOrder}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Place Order
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
