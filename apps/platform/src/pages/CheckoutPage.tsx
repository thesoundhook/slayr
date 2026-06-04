import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Lock, Ticket } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { TicketStub } from '../components/ticket/TicketStub'
import { useCartStore } from '../stores/cartStore'
import { supabase } from '../lib/supabase'
import { formatPrice } from '../lib/utils'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  })

  const feeRate = (items[0]?.event.serviceFeePercentage ?? 4.5) / 100
  const fees = getTotalPrice() * feeRate
  const total = getTotalPrice() + fees

  // Track whether we navigated away intentionally so the empty-cart guard
  // doesn't fire after clearCart() runs in handleOrderCreation.
  const navigatedToOrder = useRef(false)

  useEffect(() => {
    if (items.length === 0 && !navigatedToOrder.current) {
      navigate('/cart')
    }
  }, [items.length, navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleOrderCreation = async (paystackReference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment-and-create-order', {
        body: {
          reference: paystackReference,
          customer: formData,
          items: items.map(item => ({
            eventId: item.eventId,
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPrice: Math.round(item.price * 100), // naira → kobo
          })),
        },
      })

      if (error) throw error

      navigatedToOrder.current = true
      navigate(`/orders/${data.orderId}`)
      clearCart()
    } catch (err: any) {
      setIsProcessing(false)
      alert(
        `Payment succeeded but order could not be created. ` +
        `Please contact support with reference: ${paystackReference}\n\nError: ${err.message}`
      )
    }
  }

  const handlePaystack = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.firstName || !formData.lastName || !formData.phone) {
      return
    }

    const reference = `slayr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const amountInKobo = Math.round(total * 100)

    setIsProcessing(true)

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string,
      email: formData.email,
      amount: amountInKobo,
      currency: 'NGN',
      ref: reference,
      firstname: formData.firstName,
      lastname: formData.lastName,
      phone: formData.phone,
      metadata: {
        cart_items: items.map(i => ({
          event_id: i.eventId,
          ticket_type_id: i.ticketTypeId,
          quantity: i.quantity,
        })),
      },
      callback: (response) => {
        if (response.status === 'success') {
          handleOrderCreation(response.reference)
        } else {
          setIsProcessing(false)
        }
      },
      onClose: () => {
        setIsProcessing(false)
      },
    })

    handler.openIframe()
  }

  return (
    <div className="min-h-screen pt-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <motion.div
            whileHover={{ x: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="inline-block"
          >
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-all duration-200 group whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0 group-hover:text-primary transition-colors" />
              <span>Back to Cart</span>
            </Link>
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-display font-bold mt-6 text-foreground">
            Checkout
          </h1>
        </motion.div>

        <form onSubmit={handlePaystack}>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-0 bg-card/50 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                      <Input
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-muted-foreground p-4 rounded-xl bg-muted/30 border border-border/50"
              >
                <p className="font-medium text-foreground mb-1">Payment via Paystack</p>
                <p>You'll be taken to Paystack's checkout to complete payment. We never store your card details.</p>
              </motion.div>
            </div>

            {/* Order Summary */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="sticky top-24 border-0 bg-card/50 backdrop-blur-md glow-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="w-5 h-5" />
                      Your Tickets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Ticket Collection */}
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <motion.div
                          key={`${item.eventId}-${item.ticketTypeId}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <TicketStub
                            event={item.event}
                            ticketType={item.ticketType}
                            quantity={item.quantity}
                            className="w-full"
                          />

                          <div className="flex justify-between items-center mt-2 px-2">
                            <span className="text-xs text-muted-foreground">
                              {item.ticketType.name} × {item.quantity}
                            </span>
                            <span className="font-medium text-sm">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-3 pt-4 border-t border-border/50">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{formatPrice(getTotalPrice())}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Service fees ({((items[0]?.event.serviceFeePercentage ?? 4.5))}%)</span>
                        <span>{formatPrice(fees)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border/50">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>

                    {/* Pay Button */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      variant="gradient"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Pay {formatPrice(total)} with Paystack
                        </>
                      )}
                    </Button>

                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
