import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, ShoppingBag, Loader2, CreditCard, Wallet, Banknote, Copy, Check, Upload, X } from 'lucide-react'
import { getEventById } from '../services/eventService'
import { getPaymentSettings, type EventPaymentSettings, type MenuItem } from '../services/menuService'
import { supabase } from '../lib/supabase'
import { formatPrice } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Event } from '../types/event'

const CART_KEY = 'slayr_table_cart'

type PaymentMethod = 'online' | 'pos' | 'transfer'

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

  const [event, setEvent]         = useState<Event | null>(null)
  const [settings, setSettings]   = useState<EventPaymentSettings | null>(null)
  const [cartItems, setCartItems] = useState<CartEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', phone: '' })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online')

  // Transfer-specific
  const [copied, setCopied] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(CART_KEY)
    if (!raw) { navigate(-1); return }
    setCartItems(JSON.parse(raw) as CartEntry[])

    if (!slug) return
    getEventById(slug)
      .then(async ev => {
        setEvent(ev)
        if (ev) {
          const s = await getPaymentSettings(ev.id)
          setSettings(s)
          // Default to the first enabled method
          if (s.acceptOnline) setPaymentMethod('online')
          else if (s.acceptTransfer) setPaymentMethod('transfer')
          else if (s.acceptPos) setPaymentMethod('pos')
        }
      })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [slug, navigate])

  const subtotal = cartItems.reduce((s, e) => s + e.item.price * e.quantity, 0)
  const total    = subtotal

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!event || !form.name.trim() || !form.phone.trim()) return
    if (paymentMethod === 'online')   handlePaystack()
    else if (paymentMethod === 'pos') handleOfflineOrder('pos')
    else if (paymentMethod === 'transfer') handleOfflineOrder('transfer')
  }

  // ── Offline orders (POS / transfer): create unpaid, optional proof upload ──
  const handleOfflineOrder = async (method: 'pos' | 'transfer') => {
    if (!event) return
    setProcessing(true)
    setError(null)
    try {
      let proofUrl: string | null = null

      // Upload transfer proof if provided
      if (method === 'transfer' && proofFile) {
        const ext = proofFile.name.split('.').pop()
        const path = `${event.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from('order-proofs').upload(path, proofFile)
        if (upErr) throw new Error(`Proof upload failed: ${upErr.message}`)
        const { data: pub } = supabase.storage.from('order-proofs').getPublicUrl(path)
        proofUrl = pub.publicUrl
      }

      const { data: order, error: orderErr } = await supabase
        .from('table_orders')
        .insert({
          event_id:          event.id,
          table_number:      parseInt(tableNumber) || 0,
          customer_name:     form.name.trim(),
          customer_phone:    form.phone.trim(),
          subtotal:          total,
          total,
          status:            'pending',
          payment_method:    method,
          is_paid:           false,
          payment_proof_url: proofUrl,
        })
        .select()
        .single()
      if (orderErr) throw new Error(orderErr.message)

      const { error: itemsErr } = await supabase
        .from('table_order_items')
        .insert(cartItems.map(({ item, quantity }) => ({
          order_id:     order.id,
          menu_item_id: item.id,
          name:         item.name,
          quantity,
          unit_price:   item.price,
          total_price:  item.price * quantity,
        })))
      if (itemsErr) throw new Error(itemsErr.message)

      sessionStorage.removeItem(CART_KEY)
      navigate(`/e/${slug}/order/${order.id}?table=${tableNumber}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      setProcessing(false)
      setError(`Could not place order: ${msg}`)
    }
  }

  const handlePaystack = () => {
    if (!event) return
    const reference = `slayr_tbl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    setProcessing(true)

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string,
      email: `table${tableNumber}@${event.slug}.slayr.live`,
      amount: total,
      currency: 'NGN',
      ref: reference,
      firstname: form.name.split(' ')[0],
      lastname: form.name.split(' ').slice(1).join(' ') || form.name.split(' ')[0],
      phone: form.phone,
      metadata: { order_type: 'table', event_id: event.id, table_number: tableNumber },
      callback: (response) => {
        if (response.status === 'success') handleOrderCreation(response.reference)
        else setProcessing(false)
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
            menuItemId: item.id, name: item.name, quantity, unitPrice: item.price,
          })),
          subtotal: total,
          total,
        },
      })
      const { data, error: fnErr } = await Promise.race([invoke, timeout])
      if (fnErr) {
        let msg = (fnErr as { message?: string }).message ?? 'Unknown error'
        try {
          const body = await (fnErr as { context?: Response }).context?.json()
          if (body?.error) msg = body.error
        } catch { /* keep */ }
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

  const copyAccount = () => {
    if (!settings?.transferAccountNumber) return
    navigator.clipboard.writeText(settings.transferAccountNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!event || !settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Something went wrong. Please go back and try again.</p>
      </div>
    )
  }

  const methods: { id: PaymentMethod; enabled: boolean; icon: React.ElementType; title: string; subtitle: string }[] = [
    { id: 'online',   enabled: settings.acceptOnline,   icon: CreditCard, title: 'Pay online',              subtitle: 'Card, transfer or USSD via Paystack' },
    { id: 'transfer', enabled: settings.acceptTransfer, icon: Banknote,   title: 'Bank transfer',           subtitle: 'Transfer to the account shown' },
    { id: 'pos',      enabled: settings.acceptPos,      icon: Wallet,     title: 'Pay at table (POS / cash)', subtitle: 'An attendant comes to collect payment' },
  ]
  const enabledMethods = methods.filter(m => m.enabled)

  // No methods configured at all
  if (enabledMethods.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Wallet className="w-10 h-10 text-muted-foreground" />
        <p className="text-muted-foreground max-w-sm">Payments aren't set up for this event yet. Please ask a staff member.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Back to menu</Button>
      </div>
    )
  }

  const submitLabel = processing
    ? 'Processing…'
    : paymentMethod === 'online' ? `Pay ${formatPrice(total / 100)}`
    : paymentMethod === 'transfer' ? "I've sent the transfer"
    : 'Place Order · Pay at Table'

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

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-8">

            {/* Left column */}
            <motion.div {...fadeUp(0.1)} className="space-y-6">
              {/* Details */}
              <Card className="border-0 bg-card/50 backdrop-blur-md">
                <CardHeader><CardTitle className="text-base">Your details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Full name</label>
                    <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Tunde Bakare" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Phone number</label>
                    <Input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="e.g. 0801 234 5678" required />
                  </div>
                </CardContent>
              </Card>

              {/* Payment method (only if more than one) */}
              {enabledMethods.length > 1 && (
                <Card className="border-0 bg-card/50 backdrop-blur-md">
                  <CardHeader><CardTitle className="text-base">Payment method</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {enabledMethods.map(m => {
                      const Icon = m.icon
                      const active = paymentMethod === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${active ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-border'}`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{m.title}</p>
                            <p className="text-xs text-muted-foreground">{m.subtitle}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${active ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`} />
                        </button>
                      )
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Transfer details */}
              {paymentMethod === 'transfer' && settings.transferAccountNumber && (
                <Card className="border-0 bg-card/50 backdrop-blur-md">
                  <CardHeader><CardTitle className="text-base">Transfer to</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border border-border/60 divide-y">
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-xs text-muted-foreground">Bank</span>
                        <span className="text-sm font-semibold">{settings.transferBankName}</span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-xs text-muted-foreground">Account number</span>
                        <button type="button" onClick={copyAccount} className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
                          {settings.transferAccountNumber}
                          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-xs text-muted-foreground">Account name</span>
                        <span className="text-sm font-semibold">{settings.transferAccountName}</span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-3 bg-primary/5">
                        <span className="text-xs text-muted-foreground">Amount</span>
                        <span className="text-sm font-bold text-primary">{formatPrice(total / 100)}</span>
                      </div>
                    </div>

                    {settings.transferInstructions && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{settings.transferInstructions}</p>
                    )}

                    {/* Proof upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Upload payment proof <span className="text-muted-foreground font-normal">(optional)</span></label>
                      {proofFile ? (
                        <div className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2.5">
                          <Check className="w-4 h-4 text-green-600 shrink-0" />
                          <span className="text-sm truncate flex-1">{proofFile.name}</span>
                          <button type="button" onClick={() => { setProofFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-muted-foreground hover:text-destructive">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Upload className="w-4 h-4" /> Add transfer screenshot
                        </button>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => setProofFile(e.target.files?.[0] ?? null)} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Method note */}
              <div className="rounded-xl bg-muted/30 border border-border/50 p-4 text-sm text-muted-foreground">
                {paymentMethod === 'online' && (
                  <><p className="font-medium text-foreground mb-1">Secure payment via Paystack</p><p>You'll be taken to Paystack to complete payment. Your order goes to Table {tableNumber} once confirmed.</p></>
                )}
                {paymentMethod === 'pos' && (
                  <><p className="font-medium text-foreground mb-1">Pay when the attendant arrives</p><p>Place your order now — an attendant will bring a POS to Table {tableNumber} to collect payment.</p></>
                )}
                {paymentMethod === 'transfer' && (
                  <><p className="font-medium text-foreground mb-1">Transfer, then confirm</p><p>Make the transfer to the account above, then tap the button. Staff will verify and your order will be prepared.</p></>
                )}
              </div>
            </motion.div>

            {/* Order summary */}
            <motion.div {...fadeUp(0.15)}>
              <Card className="border-0 bg-card/50 backdrop-blur-md sticky top-24">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartItems.map(({ item, quantity }) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded object-cover shrink-0" />}
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
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> :
                      paymentMethod === 'online' ? <Lock className="w-4 h-4 mr-2" /> :
                      paymentMethod === 'transfer' ? <Banknote className="w-4 h-4 mr-2" /> :
                      <Wallet className="w-4 h-4 mr-2" />}
                    {submitLabel}
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
