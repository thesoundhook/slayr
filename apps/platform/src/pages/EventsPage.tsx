import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Calendar, MapPin, Users } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { getEvents } from '../services/eventService'
import { formatDate, formatPrice } from '../lib/utils'
import { Event, EventCategory } from '../types/event'

const categories: { value: 'all' | EventCategory; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'theater', label: 'Theater' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'conferences', label: 'Conferences' },
  { value: 'workshops', label: 'Workshops' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'arts', label: 'Arts' },
  { value: 'family', label: 'Family' },
  { value: 'nightlife', label: 'Nightlife' },
]

export function EventsPage() {
  const [filters, setFilters] = useState<{
    category: 'all' | EventCategory;
    search: string;
  }>({
    category: 'all',
    search: '',
  })
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getEvents({
      category: filters.category === 'all' ? undefined : filters.category,
      search: filters.search || undefined,
    })
      .then(setEvents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div className="min-h-screen pt-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 mb-12"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold">
              Discover <span className="gradient-text">Events</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Find amazing events happening near you
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search events, venues, or cities..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={filters.category === category.value ? 'default' : 'outline'}
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => setFilters(prev => ({ ...prev, category: category.value }))}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `${events.length} event${events.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* Event Grid */}
          {error ? (
            <div className="text-center py-20 text-destructive">{error}</div>
          ) : loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-card/50 animate-pulse aspect-[3/4]" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="space-y-4">
                <div className="text-6xl">🎭</div>
                <h3 className="text-xl font-semibold">No events found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters to find more events.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.6 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <Link to={`/events/${event.id}`}>
                    <Card className="overflow-hidden border-0 bg-card/50 backdrop-blur-md hover:bg-card/70 transition-all duration-300 glow-border">
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={event.images[0]}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-4 left-4">
                          <Badge
                            variant={event.featured ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {event.category}
                          </Badge>
                        </div>
                        {event.featured && (
                          <div className="absolute top-4 right-4">
                            <Badge variant="warning" className="text-xs">
                              ⭐ Featured
                            </Badge>
                          </div>
                        )}
                        <div className="absolute bottom-4 left-4 text-white">
                          <div className="flex items-center space-x-1 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                        </div>
                      </div>

                      <CardHeader className="space-y-3">
                        <h3 className="font-display font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center text-muted-foreground text-sm">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{event.venue.name}, {event.venue.city}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-muted-foreground text-sm">
                              <Users className="w-4 h-4 mr-2" />
                              <span>{event.soldTickets.toLocaleString()} attending</span>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">
                                {formatPrice(Math.min(...event.ticketTypes.map(t => t.price)))}
                              </div>
                              <div className="text-xs text-muted-foreground">starting from</div>
                            </div>
                          </div>

                          {/* Availability indicator */}
                          <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.max(10, Math.min(90, ((event.totalCapacity - event.soldTickets) / event.totalCapacity) * 100))}%`
                              }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground text-center">
                            {event.totalCapacity - event.soldTickets} tickets available
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}