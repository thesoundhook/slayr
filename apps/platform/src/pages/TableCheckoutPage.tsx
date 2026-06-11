import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, ShoppingBag, Loader2 } from 'lucide-react'
import { getEventById } from '../services/eventService'
import { supabase } from '../lib/supabase'
import { formatPrice } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Event } from '../types/event'
import type { MenuItem } from '../services/menuService'

const CART_KEY = 'slayr_table_cart'

interface CartEntry { item: MenuItem; quantity: number }

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
})

export function TableCheckoutPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tableNumber = searchParams.get('table') ?? ''

  const [event, setEvent]     = useState<Event | null>(null)
  const [cartItems, setCartItems] = useState<CartEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', phone: '' })

  useEffect(() => {
    const raw = sessionStorage.getItem(CART_KEY)
    if (!raw) { navigate(-1); return }
    setCartItems(JSON.parse(raw) as CartEntry[])

    if (!slug) return
    getEventById(slug)
      .then(setEvent)
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [slug, navigate])

  const subtotal = cartItems.reduce((s, e) => s + e.item.price * e.quantity, 0)
  const total    = subtotal  // no extra fees for table orders

  const handlePaystack = (e: React.FormEvent) => {
    e.preventDefault()
    if (!event || !form.name.trim() || !form.phone.trim()) return

    const reference = `slayr_tbl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    setProcessing(true)

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string,
      email: `table${tableNumber}@${event.slug}.slayr.live`, // synthetic email for Paystack
      amount: total,   // already in kobo
      currency: 'NGN',
      ref: reference,
      firstname: form.name.split(' ')[0],
      lastname: form.name.split(' ').slice(1).join(' ') || form.name.split(' ')[0],
      phone: form.phone,
      metadata: {
        order_type: 'table',
        event_id: event.id,
        table_number: tableNumber,
      },
      callback: (response) => {
        if (response.status === 'success') {
          handleOrderCreation(response.reference)
        } else {
          setProcessing(false)
        }
      },
      onClose: () => setProcessing(false),
    })

    handler.openIframe()
  }

  const handleOrderCreation = async (reference: string) => {
    if (!event) return
    setProcessing(true)
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 15000)
      )
      const invoke = supabase.functions.invoke('verify-table-order', {
        body: {
          reference,
          eventId: event.id,
          tableNumber: parseInt(tableNumber) || 0,
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          items: cartItems.map(({ item, quantity }) => ({
            menuItemId: item.id,
            name: item.name,
            quantity,
            unitPrice: item.price,
          })),
          subtotal: total,
          total,
        },
      })
      const { data, error: fnErr } = await Promise.race([invoke, timeout])
      if (fnErr) {
        // FunctionsHttpError has a .context Response — read the body to get the real message
        let msg = (fnErr as { message?: string }).message ?? 'Unknown error'
        try {
          const body = await (fnErr as { context?: Response }).context?.json()
          if (body?.error) msg = body.error
        } catch { /* body not JSON — keep original message */ }
        throw new Error(msg)
      }
      if (!data?.orderId) throw new Error(`No orderId returned. Response: ${JSON.stringify(data)}`)
      sessionStorage.removeItem(CART_KEY)
      navigate(`/e/${slug}/order/${data.orderId}?table=${tableNumber}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('[TableCheckout] order creation failed:', msg)
      setProcessing(false)
      setError(`Order failed: ${msg} — Reference: ${reference}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Something went wrong. Please go back and try again.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </button>
          <div className="flex-1" />
          <img src="/slayr logo.png" alt="Slayr" className="h-6 w-auto opacity-70" />
          {tableNumber && (
            <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1">
              Table {tableNumber}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <motion.h1 {...fadeUp(0)} className="text-3xl font-display font-bold mb-8">Checkout</motion.h1>

        {error && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handlePaystack}>
          <div className="grid lg:grid-cols-2 gap-8">

            {/* Contact form */}
            <motion.div {...fadeUp(0.1)} className="space-y-6">
              <Card className="border-0 bg-card/50 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-base">Your details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Full name</label>
                    <Input
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Tunde Bakare"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Phone number</label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="e.g. 0801 234 5678"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-xl bg-muted/30 border border-border/50 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Secure payment via Paystack</p>
                <p>You'll be taken to Paystack to complete payment. Your order will be sent to Table {tableNumber} once confirmed.</p>
              </div>
            </motion.div>

            {/* Order summary */}
            <motion.div {...fadeUp(0.15)}>
              <Card className="border-0 bg-card/50 backdrop-blur-md sticky top-24">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartItems.map(({ item, quantity }) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded object-cover shrink-0" />
                          )}
                          <span className="text-muted-foreground truncate">{item.name}</span>
                          <span className="text-muted-foreground shrink-0">×{quantity}</span>
                        </div>
                        <span className="font-medium shrink-0 ml-2">{formatPrice((item.price * quantity) / 100)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border/50 pt-4 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total / 100)}</span>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={processing || !form.name || !form.phone}>
                    {processing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
                    ) : (
                      <><Lock className="w-4 h-4 mr-2" /> Pay {formatPrice(total / 100)}</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </form>
      </div>
    </div>
  )
}
