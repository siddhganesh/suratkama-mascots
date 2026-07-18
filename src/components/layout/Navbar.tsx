import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Menu, X, User, LogOut, Ticket, ChevronDown, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import gsap from 'gsap'

export default function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const logoRef = useRef<HTMLAnchorElement>(null)
  const logoInner = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setProfileOpen(false) }, [location.pathname])

  // GSAP Magnetic Logo effect
  useEffect(() => {
    const el = logoRef.current
    const inner = logoInner.current
    if (!el || !inner) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      gsap.to(inner, {
        x: x * 0.18,
        y: y * 0.18,
        duration: 0.4,
        ease: 'power2.out',
      })
    }
    const handleMouseLeave = () => {
      gsap.to(inner, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' })
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Our Mascots' },
    { href: '/book', label: 'Book Now' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'glass border-b border-brown-200/20 shadow-[0_4px_30px_rgba(192,125,53,0.05)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo — GSAP Magnetic */}
            <Link ref={logoRef} to="/" className="flex items-center gap-2.5 group">
              <div ref={logoInner} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brown-500 flex items-center justify-center
                                group-hover:shadow-[0_0_20px_rgba(192,125,53,0.5)] transition-all duration-300">
                  <Zap size={16} className="text-white" />
                </div>
                <span className="font-heading font-bold text-lg text-brown-900">
                  Suratkama<span className="gradient-text">Mascots</span>
                </span>
              </div>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label }) => {
                const active = location.pathname === href
                return (
                  <Link
                    key={href}
                    to={href}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-brown-100 text-brown-900'
                        : 'text-brown-700 hover:text-brown-950 hover:bg-brown-50'
                    }`}
                  >
                    {label}
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-lg bg-brown-100/50 border border-brown-200/30"
                        style={{ zIndex: -1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              })}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-all duration-200 flex items-center gap-1.5"
                >
                  <Shield size={14} />
                  Admin
                </Link>
              )}
            </div>

            {/* Right section */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    id="profile-menu-btn"
                    onClick={() => setProfileOpen(o => !o)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-brown-200/30
                               hover:border-brown-400 transition-all duration-200 text-sm text-brown-900"
                  >
                    <img
                      src={user?.avatar}
                      alt={user?.name}
                      className="w-7 h-7 rounded-full border border-brown-200"
                    />
                    <span className="font-medium max-w-[100px] truncate">{user?.name?.split(' ')[0]}</span>
                    {isAdmin && <Shield size={12} className="text-amber-600" />}
                    <ChevronDown size={14} className={`transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 glass rounded-xl overflow-hidden shadow-xl
                                   border border-brown-200/20"
                      >
                        <div className="p-3 border-b border-brown-100 bg-brown-50/50">
                          <p className="text-xs text-brown-500">Signed in as</p>
                          <p className="text-sm font-semibold text-brown-900 truncate">{user?.email}</p>
                          {isAdmin && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs text-amber-600">
                              <Shield size={10} /> Super Admin
                            </span>
                          )}
                        </div>
                        <div className="p-1.5 bg-white">
                          <Link
                            to="/profile"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-brown-700
                                       hover:bg-brown-50 hover:text-brown-950 transition-all duration-150"
                          >
                            <User size={15} /> My Profile
                          </Link>
                          <Link
                            to="/profile"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-brown-700
                                       hover:bg-brown-50 hover:text-brown-950 transition-all duration-150"
                          >
                            <Ticket size={15} /> My Bookings
                          </Link>
                          {isAdmin && (
                            <Link
                              to="/admin"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-amber-600
                                         hover:bg-amber-50 hover:text-amber-700 transition-all duration-150"
                            >
                              <Shield size={15} /> Admin Panel
                            </Link>
                          )}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                                       text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150"
                          >
                            <LogOut size={15} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link to="/auth" className="btn-ghost text-sm py-2 px-4">Sign In</Link>
                  <Link to="/auth?tab=signup" className="btn-primary text-sm py-2 px-4">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 rounded-lg glass border border-brown-200/20 text-brown-700 hover:text-brown-950 transition-all"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden glass border-t border-brown-200/10 overflow-hidden bg-white"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    to={href}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      location.pathname === href
                        ? 'bg-brown-500 text-white'
                        : 'text-brown-700 hover:text-brown-950 hover:bg-brown-50'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-2 block px-4 py-3 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 transition-all">
                    <Shield size={14} /> Admin Panel
                  </Link>
                )}
                <div className="pt-3 border-t border-brown-100 flex flex-col gap-2">
                  {isAuthenticated ? (
                    <>
                      <Link to="/profile" className="btn-ghost text-sm justify-start">
                        <User size={15} /> My Profile
                      </Link>
                      <button onClick={handleLogout} className="btn-ghost text-sm text-red-600 border-red-500/30 justify-start">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/auth" className="btn-ghost text-sm">Sign In</Link>
                      <Link to="/auth?tab=signup" className="btn-primary text-sm">Get Started</Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Overlay to close profile dropdown */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}
    </>
  )
}
