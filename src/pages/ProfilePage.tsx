import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calendar, MapPin, Ticket, CheckCircle2, Clock,
  XCircle, LogOut, User, Mail, Star, Edit3
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Booking } from '../types'
import SEO from '../components/ui/SEO'

const STATUS_STYLES: Record<Booking['status'], string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-250',
  pending:   'bg-amber-50 text-amber-700 border-amber-250',
  cancelled: 'bg-red-50   text-red-700   border-red-250',
}
const STATUS_ICONS: Record<Booking['status'], React.ElementType> = {
  confirmed: CheckCircle2,
  pending:   Clock,
  cancelled: XCircle,
}

function BookingCard({ booking, index }: { booking: Booking; index: number }) {
  const Icon = STATUS_ICONS[booking.status]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      className="glass rounded-2xl p-6 border border-brown-200/20 bg-white hover:border-brown-400/40 transition-all duration-300 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-heading font-semibold text-brown-950 leading-tight">{booking.eventTitle}</h3>
            <span className={`badge border shrink-0 ${STATUS_STYLES[booking.status]}`}>
              <Icon size={11} />
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 text-sm text-brown-700 font-semibold">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-brown-500" />
              {new Date(booking.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-brown-500" />
              <span className="truncate">{booking.eventLocation}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-brown-500" />
              {booking.ticketCount} Hour{booking.ticketCount > 1 ? 's' : ''} Performance
            </div>
            <div className="flex items-center gap-1.5 font-bold text-brown-950">
              {booking.currency}{booking.totalPrice.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right: confirmation code */}
        <div className="shrink-0 bg-brown-50/50 rounded-xl px-4 py-3 text-center border border-brown-200/30 min-w-[140px]">
          <p className="text-xs text-brown-600 mb-1 font-semibold">Confirmation</p>
          <p className="font-mono font-bold text-brown-900 text-sm">{booking.confirmationCode}</p>
          <p className="text-xs text-brown-500 mt-1 font-bold">
            {new Date(booking.bookedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default function ProfilePage() {
  const { isAuthenticated, user, logout, refreshBookings } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true })
    } else {
      refreshBookings()
    }
  }, [isAuthenticated, navigate, refreshBookings])

  if (!user) return null

  const totalSpent = user.bookings.reduce((acc, b) => acc + b.totalPrice, 0)
  const confirmedCount = user.bookings.filter(b => b.status === 'confirmed').length

  return (
    <div className="min-h-screen bg-cream pt-24 pb-24">
      <SEO 
        title="My Dashboard" 
        description="View your active mascot bookings, review confirmation codes, and manage your user profile on Suratkama Mascots."
      />
      {/* Header blobs */}
      <div className="absolute inset-x-0 top-0 h-96 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-brown-200/10 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── Profile card ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-3xl p-8 border border-brown-200/20 mb-8 bg-white shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-2xl border-2 border-brown-300/40 bg-brown-50"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-brown-500 flex items-center justify-center shadow-sm">
                <Star size={11} fill="white" className="text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-black text-3xl text-brown-950 mb-1">{user.name}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-brown-700 font-semibold">
                <span className="flex items-center gap-1.5"><Mail size={13} /> {user.email}</span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  Member since {new Date(user.joinedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              <button id="edit-profile-btn" className="btn-ghost text-sm py-2 px-4 bg-white shadow-sm border-brown-200">
                <Edit3 size={14} /> Edit
              </button>
              <button
                id="logout-btn"
                onClick={() => { logout(); navigate('/') }}
                className="btn-ghost text-sm py-2 px-4 text-red-600 border-red-200/45 hover:bg-red-50 bg-white shadow-sm"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-brown-100">
            {[
              { label: 'Total Bookings', value: user.bookings.length },
              { label: 'Confirmed',      value: confirmedCount },
              { label: 'Total Spent',    value: `₹${totalSpent.toLocaleString()}` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="font-heading font-black text-2xl text-brown-600 mb-1">{value}</div>
                <div className="text-brown-700 text-xs font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Bookings section ──────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="section-label mb-1 text-brown-600">Your History</p>
              <h2 className="font-heading font-bold text-2xl text-brown-950">My Bookings</h2>
            </div>
            <Link to="/events" className="btn-ghost text-sm py-2 px-4 bg-white shadow-sm border-brown-200">
              Browse More Mascots
            </Link>
          </div>

          {user.bookings.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center border border-brown-200/20 bg-white shadow-sm">
              <div className="text-5xl mb-4">🎟️</div>
              <h3 className="font-heading font-bold text-brown-950 text-xl mb-2">No bookings yet</h3>
              <p className="text-brown-800 mb-6 font-medium">Discover and book your first mascot performance!</p>
              <Link to="/events" className="btn-primary">Explore Mascots</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {user.bookings.map((booking, i) => (
                <BookingCard key={booking.id} booking={booking} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* ── Quick actions ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 grid sm:grid-cols-3 gap-4"
        >
          {[
            { icon: Ticket,   label: 'Book a Mascot',    href: '/events',  desc: 'Discover & book' },
            { icon: User,     label: 'Edit Profile',     href: '#',        desc: 'Update your info' },
            { icon: Star,     label: 'Leave a Review',   href: '/events',  desc: 'Rate past performances' },
          ].map(({ icon: Icon, label, href, desc }) => (
            <Link key={label} to={href}
              className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-brown-200/20
                         hover:border-brown-400 hover:shadow-sm transition-all duration-300 group shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brown-50 border border-brown-100 flex items-center justify-center
                              group-hover:bg-brown-100 transition-colors shrink-0">
                <Icon size={18} className="text-brown-600" />
              </div>
              <div>
                <p className="text-brown-950 font-bold text-sm">{label}</p>
                <p className="text-brown-500 text-xs font-semibold">{desc}</p>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
