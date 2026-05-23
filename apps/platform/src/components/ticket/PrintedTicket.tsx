import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, QrCode, Scissors } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { formatDate, formatTime, formatPrice } from '../../lib/utils'

interface TicketType {
  id: string
  name: string
  type: string
  price: number
  originalPrice?: number
  description?: string
  quantity: number
  sold: number
  maxPerOrder: number
}

interface Event {
  id: string
  title: string
  date: string
  time: string
  venue: {
    name: string
    address: string
    city: string
    state: string
  }
  category: string
  images: string[]
}

interface PrintedTicketProps {
  event: Event
  ticketType: TicketType
  quantity: number
  onQuantityChange: (change: number) => void
  isSelected?: boolean
  onClick?: () => void
}

export function PrintedTicket({
  event,
  ticketType,
  quantity,
  onQuantityChange,
  isSelected = false,
  onClick,
}: PrintedTicketProps) {
  const available = ticketType.quantity - ticketType.sold
  const isAvailable = available > 0
  const isVip = ticketType.type === 'vip'

  const ticketNumber = `${event.id.slice(-3).toUpperCase()}${ticketType.id.slice(-3).toUpperCase()}${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`

  return (
    <motion.div
      layout
      className="relative group cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Shadow */}
      <div className="absolute inset-0 bg-black/10 blur-sm transform translate-x-1 translate-y-2 rounded-r-2xl" />

      {/* Main Ticket */}
      <div className={`relative overflow-hidden border transition-all duration-300 ${
        isVip
          ? 'bg-gradient-to-br from-purple-50 via-white to-purple-50 border-purple-200'
          : 'bg-gradient-to-br from-white via-white to-slate-50 border-slate-200 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:border-slate-700'
      } ${isSelected ? 'ring-2 ring-primary/30' : ''} ${!isAvailable ? 'opacity-60' : ''}`}>

        {/* Perforated left strip */}
        <div className={`absolute left-0 top-0 bottom-0 w-4 ${
          isVip ? 'bg-purple-100' : 'bg-slate-100 dark:bg-slate-800'
        }`}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full absolute left-1.5 ${
                isVip ? 'bg-purple-50' : 'bg-white dark:bg-slate-900'
              }`}
              style={{ top: `${8 + i * 8}%` }}
            />
          ))}
        </div>

        <div className="flex">
          {/* Main Body */}
          <div className="flex-1 p-5 pl-8">

            {/* Header */}
            <div className="flex justify-between items-start mb-4 gap-2">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={isVip ? 'default' : 'secondary'}
                    className={isVip
                      ? 'bg-purple-700 text-white border-0 text-xs font-bold'
                      : 'text-xs font-semibold'
                    }
                  >
                    {isVip ? '✦ ' : ''}{ticketType.name}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400 truncate max-w-[80px]">
                    #{ticketNumber}
                  </span>
                </div>
                <h3 className={`font-display font-bold text-sm sm:text-base leading-tight line-clamp-2 ${
                  isVip ? 'text-purple-900' : 'text-slate-900 dark:text-slate-100'
                }`}>
                  {event.title}
                </h3>
              </div>

              <div className="text-right flex-shrink-0">
                <div className={`font-bold text-base sm:text-xl leading-none ${
                  isVip ? 'text-purple-800' : 'text-slate-900 dark:text-slate-100'
                }`}>
                  {formatPrice(ticketType.price)}
                </div>
                {ticketType.originalPrice && ticketType.originalPrice > ticketType.price && (
                  <div className="text-xs text-slate-400 line-through mt-0.5">
                    {formatPrice(ticketType.originalPrice)}
                  </div>
                )}
              </div>
            </div>

            {/* Event details */}
            <div className={`space-y-1.5 mb-4 text-xs ${
              isVip ? 'text-purple-600/80' : 'text-slate-500 dark:text-slate-400'
            }`}>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>{formatDate(event.date)}</span>
                <Clock className="w-3 h-3 flex-shrink-0 ml-1" />
                <span>{formatTime(event.time)}</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{event.venue.name}, {event.venue.city}</span>
              </div>
              {ticketType.description && (
                <p className="leading-relaxed pt-0.5 text-slate-400">{ticketType.description}</p>
              )}
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>{available} remaining</span>
              <span>Max {ticketType.maxPerOrder}</span>
            </div>

            {/* Quantity selector */}
            {isAvailable ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => { e.stopPropagation(); onQuantityChange(-1) }}
                    disabled={quantity === 0}
                  >
                    −
                  </Button>
                  <span className="w-6 text-center text-sm font-bold text-slate-900 dark:text-slate-100">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => { e.stopPropagation(); onQuantityChange(1) }}
                    disabled={quantity >= ticketType.maxPerOrder || quantity >= available}
                  >
                    +
                  </Button>
                </div>
                {quantity > 0 && (
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatPrice(ticketType.price * quantity)}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-center">
                <Badge variant="destructive" className="text-xs tracking-widest">SOLD OUT</Badge>
              </div>
            )}

            {/* Bottom decorative rule */}
            <div className={`absolute bottom-0 left-8 right-4 h-px ${
              isVip
                ? 'bg-gradient-to-r from-purple-200 via-purple-300 to-purple-200'
                : 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700'
            }`} />
          </div>

          {/* Tear-off Stub */}
          <div className={`relative border-l-2 border-dashed ${
            isVip ? 'border-purple-300' : 'border-slate-200 dark:border-slate-700'
          }`}>
            <div className={`w-14 h-full ${
              isVip
                ? 'bg-gradient-to-b from-purple-600 to-purple-800'
                : 'bg-gradient-to-b from-slate-700 to-slate-800 dark:from-slate-700 dark:to-slate-800'
            }`}>
              <div className="p-2 h-full flex flex-col items-center justify-between">
                {/* QR */}
                <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center flex-shrink-0">
                  <QrCode className={`w-6 h-6 ${isVip ? 'text-purple-600' : 'text-slate-800'}`} />
                </div>

                {/* ADMIT ONE */}
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-[9px] font-mono font-bold tracking-widest -rotate-90 whitespace-nowrap text-white/70">
                    ADMIT ONE
                  </span>
                </div>

                {/* Scissors */}
                <Scissors className="w-3 h-3 text-white/40 flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Paper texture */}
        <div className="absolute inset-0 opacity-30 mix-blend-multiply dark:mix-blend-screen pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Selected badge */}
      {quantity > 0 && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          {quantity}
        </motion.div>
      )}
    </motion.div>
  )
}
