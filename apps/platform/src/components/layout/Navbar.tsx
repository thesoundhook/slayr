import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'
import { useEffect } from 'react'

export function Navbar() {
  const location = useLocation()
  const { items } = useCartStore()
  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    document.documentElement.classList.remove('dark')
    localStorage.removeItem('theme')
  }, [])

  const navItems = [
    { name: 'Home', path: '/', icon: null },
    { name: 'Events', path: '/events', icon: null },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-transparent border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Simplified */}
          <Link to="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src="/slayr logo.png"
                alt="Slayr"
                className="h-8 w-auto object-contain"
              />
            </motion.div>
          </Link>

          {/* Navigation Links - Center */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  location.pathname === item.path
                    ? 'text-foreground bg-muted/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side actions - Minimal */}
          <div className="flex items-center space-x-2">
            {/* Cart */}
            <Link to="/cart">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                {cartItemsCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-xs font-medium text-primary-foreground flex items-center justify-center"
                  >
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </motion.span>
                )}
              </motion.div>
            </Link>

          </div>
        </div>
      </div>
    </nav>
  )
}