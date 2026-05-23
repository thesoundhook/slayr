import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, Clock, Users, CheckCircle, ShoppingCart } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PrintedTicket } from '../components/ticket/PrintedTicket'
import { getEventById } from '../services/eventService'
import { formatDate, formatTime, formatPrice } from '../lib/utils'
import { useCartStore } from '../stores/cartStore'
import { Event } from '../types/event'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items, addItem, removeItem, updateQuantity: updateCartQuantity } = useCartStore()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getEventById(id)
      .then(setEvent)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen pt-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-32 bg-card/50 rounded" />
            <div className="aspect-video bg-card/50 rounded-xl" />
            <div className="h-10 w-3/4 bg-card/50 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <Link to="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getTicketQuantity = (ticketTypeId: string) => {
    const cartItem = items.find(i => i.eventId === event.id && i.ticketTypeId === ticketTypeId)
    return cartItem?.quantity ?? 0
  }

  const updateQuantity = (ticketTypeId: string, change: number) => {
    const ticketType = event.ticketTypes.find(t => t.id === ticketTypeId)
    if (!ticketType) return

    const current = getTicketQuantity(ticketTypeId)
    const newQuantity = current + change

    if (newQuantity < 0) return
    if (newQuantity > ticketType.maxPerOrder) return
    if (newQuantity > ticketType.quantity - ticketType.sold) return

    if (newQuantity === 0) {
      removeItem(event.id, ticketTypeId)
    } else if (current === 0) {
      addItem(event, ticketType, 1)
    } else {
      updateCartQuantity(event.id, ticketTypeId, newQuantity)
    }
  }

  const eventCartItems = items.filter(i => i.eventId === event.id)
  const totalTickets = eventCartItems.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = eventCartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div className="min-h-screen pt-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <motion.div
            whileHover={{ x: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="inline-block"
          >
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-all duration-200 group whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0 group-hover:text-primary transition-colors" />
              <span>Back to Events</span>
            </Link>
          </motion.div>
        </motion.div>

        <div className="space-y-8">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden">
                <img
                  src={event.images[selectedImage]}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                {/* Image thumbnails */}
                {event.images.length > 1 && (
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    {event.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`w-16 h-10 rounded border-2 overflow-hidden transition-all ${
                          selectedImage === index ? 'border-primary' : 'border-white/50'
                        }`}
                      >
                        <img src={image} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant="success" className="capitalize">
                    {event.category}
                  </Badge>
                  {event.featured && (
                    <Badge variant="warning">⭐ Featured</Badge>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Event Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <h1 className="text-3xl md:text-4xl font-display font-bold">
                    {event.title}
                  </h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{formatTime(event.time)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Venue Info */}
              <Card className="border-0 bg-card/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-5 h-5 mt-1 text-primary" />
                    <div className="space-y-1">
                      <h3 className="font-semibold">{event.venue.name}</h3>
                      <p className="text-muted-foreground">
                        {event.venue.address}, {event.venue.city}, {event.venue.state}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <div className="space-y-4">
                <h2 className="text-2xl font-display font-bold">About This Event</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="capitalize">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Organizer */}
              <Card className="border-0 bg-card/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{event.organizer.name}</h3>
                        {event.organizer.verified && (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Event Organizer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Ticket Selection */}
          <motion.div
            id="ticket-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6 pb-10"
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-display font-bold text-foreground">
                Choose Your Tickets
              </h2>
            </div>

            {/* Ticket grid — 1 col on mobile, 2 col on tablet+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.ticketTypes.map((ticketType, index) => (
                <motion.div
                  key={ticketType.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PrintedTicket
                    event={event}
                    ticketType={ticketType}
                    quantity={getTicketQuantity(ticketType.id)}
                    onQuantityChange={(change) => updateQuantity(ticketType.id, change)}
                    isSelected={getTicketQuantity(ticketType.id) > 0}
                  />
                </motion.div>
              ))}
            </div>

          </motion.div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border/50 px-4 py-3 safe-area-pb"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          {totalTickets > 0 ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {totalTickets} ticket{totalTickets !== 1 ? 's' : ''} in cart
                </p>
                <p className="font-bold text-foreground text-lg leading-tight">
                  {formatPrice(totalPrice)}
                </p>
              </div>
              <Button
                size="lg"
                className="relative overflow-hidden px-8"
                onClick={() => navigate('/checkout')}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                <span>Checkout ({totalTickets})</span>
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => document.getElementById('ticket-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get Tickets
            </Button>
          )}
        </div>
      </motion.div>

      {/* Spacer so content isn't hidden behind the sticky bar */}
      <div className="h-20" />
    </div>
  )
}
