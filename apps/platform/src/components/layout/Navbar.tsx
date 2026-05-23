import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, ShoppingCart, User, Moon, Sun } from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'
import { useState, useEffect } from 'react'

export function Navbar() {
  const location = useLocation()
  const { items } = useCartStore()
  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)

    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const navItems = [
    { name: 'Home', path: '/', icon: null },
    { name: 'Events', path: '/events', icon: null },
  ]

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
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
            {/* Search */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Moon className="w-4 h-4 text-muted-foreground" />
              )}
            </motion.button>

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

            {/* User Menu */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="User menu"
            >
              <User className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  )
}