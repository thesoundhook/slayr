import { motion } from 'framer-motion'
import { Calendar, MapPin, QrCode } from 'lucide-react'
import { formatDate } from '../../lib/utils'

interface TicketStubProps {
  event: {
    id: string
    title: string
    date: string
    time: string
    venue: {
      name: string
      city: string
      state: string
    }
    category: string
    images: string[]
  }
  ticketType: {
    id: string
    name: string
    type: string
    price: number
  }
  quantity: number
  ticketNumber?: string
  className?: string
}

export function TicketStub({
  event,
  ticketType,
  quantity,
  ticketNumber,
  className = ""
}: TicketStubProps) {
  const isVip = ticketType.type === 'vip'
  const stubNumber = ticketNumber || `${event.id.slice(-3).toUpperCase()}${ticketType.id.slice(-3).toUpperCase()}${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`

  return (
    <motion.div
      className={`relative group ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Mini Ticket Design */}
      <div className={`relative bg-gradient-to-br ${
        isVip
          ? 'from-purple-50 via-white to-purple-50 dark:from-purple-900/20 dark:via-slate-900/20 dark:to-purple-900/20'
          : 'from-slate-50 via-white to-blue-50 dark:from-slate-900/50 dark:via-slate-800/50 dark:to-slate-900/50'
      } border border-slate-200 dark:border-slate-700 rounded-l-lg overflow-hidden shadow-sm`}>

        {/* Perforated Left Edge */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-transparent via-slate-300/50 to-transparent dark:via-slate-600/50">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 bg-white dark:bg-slate-800 rounded-full absolute left-0.5"
              style={{ top: `${15 + i * 12}%` }}
            />
          ))}
        </div>

        <div className="flex">
          {/* Main Ticket Content */}
          <div className="flex-1 p-3 pl-4 min-w-0">
            <div className="space-y-2">
              {/* Event Title */}
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                {event.title}
              </h4>

              {/* Event Details */}
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{event.venue.city}</span>
                </div>
              </div>

              {/* Ticket Info */}
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded ${
                  isVip
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {ticketType.name}
                </span>
                {quantity > 1 && (
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    ×{quantity}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Stub */}
          <div className="relative border-l-2 border-dashed border-slate-300 dark:border-slate-600">
            <div className={`w-16 h-full ${
              isVip
                ? 'bg-gradient-to-b from-purple-600 to-purple-800'
                : 'bg-gradient-to-b from-slate-100 to-blue-100 dark:from-slate-800/50 dark:to-slate-900/50'
            } flex flex-col items-center justify-center p-2 space-y-2`}>

              {/* Mini QR Code */}
              <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-sm flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white dark:text-slate-900" />
              </div>

              {/* Ticket Number */}
              <div className="text-center">
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 leading-none">
                  {stubNumber.slice(0, 3)}
                </div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  {stubNumber.slice(3)}
                </div>
              </div>

              {/* Admit One */}
              <div className="text-xs text-slate-500 dark:text-slate-400 transform -rotate-90 whitespace-nowrap">
                ADMIT
              </div>
            </div>
          </div>
        </div>

        {/* Paper texture */}
        <div className="absolute inset-0 opacity-20 mix-blend-multiply dark:mix-blend-screen pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='m0 20l20-20h-20v20zm20 0v-20h-20l20 20z'/%3E%3C/g%3E%3C/svg%3E")`
        }} />

        {/* VIP Shimmer Effect */}
        {isVip && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-200/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      {/* Quantity Badge */}
      {quantity > 1 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
          {quantity}
        </div>
      )}
    </motion.div>
  )
}