import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, Clock, Users, Share2, Heart, CheckCircle } from 'lucide-react'
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
  const { addItem } = useCartStore()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({})
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

  const updateQuantity = (ticketTypeId: string, change: number) => {
    setTicketQuantities(prev => {
      const current = prev[ticketTypeId] || 0
      const newQuantity = Math.max(0, current + change)
      const ticketType = event.ticketTypes.find(t => t.id === ticketTypeId)
      if (ticketType && newQuantity <= ticketType.maxPerOrder && newQuantity <= (ticketType.quantity - ticketType.sold)) {
        return { ...prev, [ticketTypeId]: newQuantity }
      }
      return prev
    })
  }

  const getTotalTickets = () => {
    return Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0)
  }

  const getTotalPrice = () => {
    return Object.entries(ticketQuantities).reduce((total, [typeId, qty]) => {
      const ticketType = event.ticketTypes.find(t => t.id === typeId)
      return total + (ticketType ? ticketType.price * qty : 0)
    }, 0)
  }

  const handleAddToCart = () => {
    Object.entries(ticketQuantities).forEach(([typeId, quantity]) => {
      if (quantity > 0) {
        const ticketType = event.ticketTypes.find(t => t.id === typeId)
        if (ticketType) {
          addItem(event, ticketType, quantity)
        }
      }
    })
    setTicketQuantities({})
  }

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

                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
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
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Capacity: {event.venue.capacity.toLocaleString()}</span>
                        <span>•</span>
                        <span>{event.soldTickets.toLocaleString()} attending</span>
                      </div>
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
                    <Button variant="outline" size="sm">
                      Follow
                    </Button>
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
              <p className="text-sm text-muted-foreground">
                Select authentic tickets for an unforgettable experience
              </p>
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
                    quantity={ticketQuantities[ticketType.id] || 0}
                    onQuantityChange={(change) => updateQuantity(ticketType.id, change)}
                    isSelected={ticketQuantities[ticketType.id] > 0}
                  />
                </motion.div>
              ))}
            </div>


            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Authentic</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Instant</span>
              </div>
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
          {getTotalTickets() > 0 ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {getTotalTickets()} ticket{getTotalTickets() !== 1 ? 's' : ''} selected
                </p>
                <p className="font-bold text-foreground text-lg leading-tight">
                  {formatPrice(getTotalPrice())}
                </p>
              </div>
              <Button
                size="lg"
                className="relative overflow-hidden px-8"
                onClick={handleAddToCart}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="relative z-10">Add to Cart</span>
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