import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Event, TicketType } from '../types/event'

interface CartState {
  items: CartItem[]
  addItem: (event: Event, ticketType: TicketType, quantity: number) => void
  removeItem: (eventId: string, ticketTypeId: string) => void
  updateQuantity: (eventId: string, ticketTypeId: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (event, ticketType, quantity) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.eventId === event.id && item.ticketTypeId === ticketType.id
          )

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.eventId === event.id && item.ticketTypeId === ticketType.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            }
          }

          const newItem: CartItem = {
            eventId: event.id,
            ticketTypeId: ticketType.id,
            quantity,
            price: ticketType.price,
            event,
            ticketType,
          }

          return {
            items: [...state.items, newItem],
          }
        })
      },

      removeItem: (eventId, ticketTypeId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.eventId === eventId && item.ticketTypeId === ticketTypeId)
          ),
        }))
      },

      updateQuantity: (eventId, ticketTypeId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(eventId, ticketTypeId)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.eventId === eventId && item.ticketTypeId === ticketTypeId
              ? { ...item, quantity }
              : item
          ),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)