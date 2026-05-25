import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, MapPin, ChevronDown, Star } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { getEvents } from '../services/eventService'
import { formatDate, formatPrice } from '../lib/utils'
import { Event } from '../types/event'

export function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [allEvents, setAllEvents] = useState<Event[]>([])

  useEffect(() => {
    getEvents().then(events => {
      setAllEvents(events)
      setFeaturedEvents(events.filter(e => e.featured))
      setUpcomingEvents(events.filter(e => !e.featured).slice(0, 6))
    }).catch(() => {})
  }, [])

  const exploreLink = allEvents.length === 1 ? `/events/${allEvents[0].id}` : '/events'

  return (
    <div className="min-h-screen">
      {/* Hero Section - Fullscreen Video */}
      <section className="relative -mt-16 min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video background — replace src with your event video file */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          src="https://videos.pexels.com/video-files/26744649/11999035_1920_1080_25fps.mp4"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12 px-4">
          {/* Main heading */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight tracking-tight">
              Producing culture
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                defining events
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              creating the space where the best creative talent does their best work
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Link to={exploreLink}>
              <Button
                size="lg"
                className="px-8 py-3 text-base font-medium whitespace-nowrap flex items-center"
              >
                Experience Culture
                <ArrowRight className="ml-2 w-4 h-4 flex-shrink-0" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-white/60"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* Three-Part Engine Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Producing Culture-defining events
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Driven by a relentless three-part engine.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: '01',
                title: 'Experience',
                description: 'We use our exposure, expertise, and creative instinct to design events that feel different from the ordinary in every space we step into. At SlayR, breaking convention is the standard.',
                delay: 0.1,
              },
              {
                number: '02',
                title: 'Infrastructure',
                description: 'Built from a strong technical foundation, we understand the systems behind exceptional experiences. We merge technical knowledge with creative direction to ensure events is not only visually compelling, but flawless from start to finish.',
                delay: 0.2,
              },
              {
                number: '03',
                title: 'Execution',
                description: 'Ideas means nothing without delivery. We bring together the right people, and production system to execute events with precision, an excellent mindset and zero compromise on quality, detail, and creative vision.',
                delay: 0.3,
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                className="bg-background rounded-2xl p-8 border border-border/50 space-y-5"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: item.delay, duration: 0.6 }}
              >
                <span className="text-xs font-mono font-semibold tracking-widest text-primary/60 uppercase">
                  {item.number}
                </span>
                <h3 className="font-display font-semibold text-xl text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-between mb-12"
            >
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-primary fill-primary" />
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  Featured
                </h2>
              </div>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="group"
                >
                  <Link to={`/events/${event.slug ?? event.id}`} className="block">
                    <Card className="overflow-hidden border-0 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300 group-hover:shadow-md ring-1 ring-primary/20">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={event.images[0]}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge variant="secondary" className="text-xs capitalize bg-white/90 text-foreground">
                            {event.category}
                          </Badge>
                          <Badge variant="warning" className="text-xs">
                            ⭐ Featured
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <h3 className="font-display font-medium text-base line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{event.venue.city}</span>
                          </div>
                        </div>
                        <div className="pt-1">
                          <span className="font-semibold text-foreground">
                            {formatPrice(Math.min(...event.ticketTypes.map(t => t.price)))}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events - Grid Layout */}
      {upcomingEvents.length > 0 && (
        <section className={`py-24 px-4 ${featuredEvents.length > 0 ? 'pt-0' : ''}`}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-between mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                More Events
              </h2>
              <Link to="/events">
                <Button variant="outline" className="flex items-center">
                  View All
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="group"
                >
                  <Link to={`/events/${event.slug ?? event.id}`} className="block">
                    <Card className="overflow-hidden border-0 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300 group-hover:shadow-md">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={event.images[0]}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="text-xs capitalize bg-white/90 text-foreground">
                            {event.category}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <h3 className="font-display font-medium text-base line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{event.venue.city}</span>
                          </div>
                        </div>
                        <div className="pt-1">
                          <span className="font-semibold text-foreground">
                            {formatPrice(Math.min(...event.ticketTypes.map(t => t.price)))}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
