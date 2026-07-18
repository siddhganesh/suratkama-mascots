import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Ticket, MapPin, CheckCircle2, ArrowLeft,
  User, Mail, Phone, Clock, FileText, Users, X,
  Calendar, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react'
import { MOCK_EVENTS } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { db, isFirebaseEnabled } from '../config/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { Booking } from '../types'
import SEO from '../components/ui/SEO'
import RazorpayButton from '../components/ui/RazorpayButton'
import { useSlotAvailability, getBookedDatesForMascot } from '../hooks/useSlotAvailability'

type Step = 'details' | 'payment' | 'confirm'

// ── Step Dot ──────────────────────────────────────────────────────────────────
function StepDot({ label, active, done, index }: { label: string; active: boolean; done: boolean; index: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
        done    ? 'bg-green-500 border-green-500 text-white' :
        active  ? 'bg-brown-700 border-brown-700 text-white shadow-[0_0_20px_rgba(107,66,38,0.4)]' :
                  'bg-brown-100 border-brown-200 text-brown-400'
      }`}>
        {done ? <CheckCircle2 size={18} /> : index + 1}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-brown-900' : 'text-brown-400'}`}>{label}</span>
    </div>
  )
}

// ── Inline Mini Calendar ───────────────────────────────────────────────────────
function MiniCalendar({
  selectedDate,
  onSelect,
  bookedDates,
}: {
  selectedDate: string
  onSelect: (d: string) => void
  bookedDates: string[]
}) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1) // default view = next month if needed
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1))

  const fmt = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const todayStr = today.toISOString().split('T')[0]

  const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div className="bg-white border border-brown-200 rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brown-50 text-brown-600 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-brown-900">{MONTHS[month]} {year}</span>
        <button type="button" onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brown-50 text-brown-600 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-brown-400 py-1">{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = fmt(day)
          const isPast = dateStr < todayStr
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          const isBooked = bookedDates.includes(dateStr)

          return (
            <button
              type="button"
              key={day}
              disabled={isPast || isBooked}
              onClick={() => !isPast && !isBooked && onSelect(dateStr)}
              className={`
                w-full aspect-square rounded-lg text-xs font-semibold transition-all
                ${isSelected ? 'bg-brown-700 text-white shadow-md' :
                  isToday ? 'bg-brown-100 text-brown-800 border border-brown-300' :
                  isBooked ? 'bg-red-100 text-red-400 cursor-not-allowed' :
                  isPast ? 'text-brown-200 cursor-not-allowed' :
                  'hover:bg-brown-100 text-brown-700'}
              `}
              title={isBooked ? 'Booked' : isPast ? 'Past date' : dateStr}
            >
              {day}
              {isBooked && <span className="block w-1 h-1 bg-red-400 rounded-full mx-auto mt-0.5" />}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-brown-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-brown-700" />
          <span className="text-[10px] text-brown-500 font-semibold">Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
          <span className="text-[10px] text-brown-500 font-semibold">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-brown-100 border border-brown-300" />
          <span className="text-[10px] text-brown-500 font-semibold">Today</span>
        </div>
      </div>
    </div>
  )
}

// ── Time Slot Picker ───────────────────────────────────────────────────────────
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
function formatHour(h: number) {
  if (h === 12) return '12:00 PM'
  if (h > 12) return `${h - 12}:00 PM`
  return `${h}:00 AM`
}

// ── Main BookingPage ───────────────────────────────────────────────────────────
export default function BookingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated, user, refreshBookings, setLocalUserBookings } = useAuth()

  const eventId = searchParams.get('event') ?? ''
  const mascotsParam = searchParams.get('mascots') ?? ''
  const isMultiMode = mascotsParam.length > 0
  const selectedIds = isMultiMode
    ? mascotsParam.split(',').filter(Boolean)
    : eventId ? [eventId] : [MOCK_EVENTS[0].id]

  const selectedMascots = selectedIds
    .map(id => MOCK_EVENTS.find(e => e.id === id))
    .filter(Boolean) as typeof MOCK_EVENTS

  const event = selectedMascots[0] ?? MOCK_EVENTS[0]

  const [step, setStep] = useState<Step>('details')
  const [quantity, setQuantity] = useState(2) // hours
  const [activeMascots, setActiveMascots] = useState<Set<string>>(new Set(selectedMascots.map(m => m.id)))

  // ── Booking date + time ───────────────────────────────────────────────────
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const [bookingDate, setBookingDate] = useState(tomorrowStr)
  const [startHour, setStartHour] = useState(10)
  const [bookedDates, setBookedDates] = useState<string[]>([])
  const [showCalendar, setShowCalendar] = useState(false)

  // ── Slot availability check ───────────────────────────────────────────────
  const mascotIdsArr = Array.from(activeMascots)
  const { isAvailable, conflictingSlots, isLoading: slotLoading } = useSlotAvailability({
    mascotIds: mascotIdsArr,
    date: bookingDate,
    startHour,
    durationHours: quantity,
  })

  // ── Load booked dates for mini calendar ──────────────────────────────────
  useEffect(() => {
    const primaryId = mascotIdsArr[0]
    if (!primaryId) return
    getBookedDatesForMascot(primaryId).then(setBookedDates)
  }, [mascotIdsArr[0]])

  // Custom form details
  const [functionType, setFunctionType] = useState('Birthday Party')
  const [venueAddress, setVenueAddress] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
  })

  const [confirmCode, setConfirmCode] = useState('')
  const [confirmPaymentId, setConfirmPaymentId] = useState('')

  useEffect(() => {
    if (!isAuthenticated) navigate('/auth?redirect=/book')
  }, [isAuthenticated, navigate])

  const bookedMascots = selectedMascots.filter(m => activeMascots.has(m.id))
  const pricePerHour = bookedMascots.reduce((sum, m) => sum + m.price, 0)
  const total = pricePerHour * quantity
  const serviceFee = Math.round(total * 0.05)
  const grandTotal = total + serviceFee

  const removeMascot = (id: string) => {
    if (activeMascots.size === 1) return
    setActiveMascots(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleDetailsNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAvailable) return // blocked by slot conflict
    setStep('payment')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveLocally = (booking: Booking) => {
    try {
      const stored = localStorage.getItem('sk_bookings')
      const localBookings = stored ? JSON.parse(stored) : []
      const updated = [booking, ...localBookings]
      localStorage.setItem('sk_bookings', JSON.stringify(updated))
      setLocalUserBookings(updated)
    } catch (err) {
      console.error('Error saving booking locally:', err)
    }
  }

  // ── Called by RazorpayButton on success ───────────────────────────────────
  const handlePaymentSuccess = useCallback(async (paymentId: string) => {
    if (!user) return

    const code = `MCT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const bookedAt = new Date().toISOString()
    const mascotNames = bookedMascots.map(m => m.title).join(', ')

    const newBooking: Omit<Booking, 'id'> = {
      eventId: bookedMascots.map(m => m.id).join(','),
      eventTitle: mascotNames,
      eventDate: bookingDate,
      eventLocation: venueAddress || event.location,
      ticketCount: quantity,
      totalPrice: grandTotal,
      currency: event.currency,
      bookedAt,
      status: 'confirmed',
      confirmationCode: code,
    }

    // Extended booking object with slot info + notification fields
    const fullBooking = {
      ...newBooking,
      userId: user.id,
      // Notification fields — Cloud Function reads these to send SMS + Email
      userName: formData.name,
      userPhone: formData.phone,
      userEmail: formData.email,
      venueAddress: venueAddress || event.location,
      functionType,
      specialRequests,
      mascotIds: Array.from(activeMascots),
      bookingDate,
      startHour,
      endHour: startHour + quantity,
      razorpayPaymentId: paymentId,
    }

    if (isFirebaseEnabled && db) {
      try {
        await addDoc(collection(db, 'bookings'), fullBooking)
        await refreshBookings()
      } catch (err) {
        console.error('Firestore write failed, saving locally:', err)
        saveLocally({ id: `bk-${Date.now()}`, ...newBooking })
      }
    } else {
      saveLocally({ id: `bk-${Date.now()}`, ...newBooking })
    }

    setConfirmCode(code)
    setConfirmPaymentId(paymentId)
    setStep('confirm')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [user, bookedMascots, bookingDate, venueAddress, event, quantity, grandTotal,
      functionType, specialRequests, activeMascots, startHour])

  const handlePaymentFailure = useCallback((error: string) => {
    alert(`Payment failed: ${error}`) // In production, use a toast
  }, [])

  const STEPS: Step[] = ['details', 'payment', 'confirm']
  const stepIdx = STEPS.indexOf(step)

  return (
    <div className="min-h-screen bg-cream pt-20 pb-24">
      <SEO
        title={`Book Mascot${bookedMascots.length > 1 ? 's' : ''} — ${bookedMascots.map(m => m.title).join(', ')}`}
        description={`Book ${bookedMascots.length} dancing mascot${bookedMascots.length > 1 ? 's' : ''} in Surat. Customize booking duration and venue.`}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brown-700 hover:text-brown-950 text-sm mb-8 transition-colors">
          <ArrowLeft size={15} /> Back
        </button>

        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="section-label mb-2 text-brown-600">Secure Checkout</p>
          <h1 className="font-heading font-black text-4xl text-brown-950">
            Book{' '}
            {bookedMascots.length > 1
              ? <span className="gradient-text">{bookedMascots.length} Mascots</span>
              : 'Mascot Performance'
            }
          </h1>
          {bookedMascots.length > 1 && (
            <p className="text-brown-700 mt-2 text-sm font-semibold">
              {bookedMascots.map(m => m.title).join(' · ')}
            </p>
          )}
        </motion.div>

        {/* Progress stepper */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {(['details', 'payment', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <StepDot
                label={s.charAt(0).toUpperCase() + s.slice(1)}
                active={step === s}
                done={stepIdx > i}
                index={i}
              />
              {i < 2 && (
                <div className={`w-16 sm:w-24 h-0.5 mx-1 transition-all duration-500 ${stepIdx > i ? 'bg-green-500' : 'bg-brown-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* ── Main form ────────────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">

              {/* Step 1: Details */}
              {step === 'details' && (
                <motion.form
                  key="details"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleDetailsNext}
                  className="glass rounded-2xl p-8 border border-white/5 space-y-6"
                >
                  <h2 className="font-heading font-bold text-white text-xl flex items-center gap-2">
                    <User size={18} className="text-indigo-light" /> Host & Event Details
                  </h2>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="text-xs section-label block mb-2">Your Name</label>
                      <div className="relative">
                        <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          id="booking-name" type="text" required placeholder="Aryan Mehta"
                          value={formData.name}
                          onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                          className="input-field pl-11"
                        />
                      </div>
                    </div>

                    {/* Email + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs section-label block mb-2">Email Address</label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            id="booking-email" type="email" required placeholder="you@example.com"
                            value={formData.email}
                            onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                            className="input-field pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs section-label block mb-2">Phone Number</label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            id="booking-phone" type="tel" required placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                            className="input-field pl-11"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="divider-gradient" />

                    {/* Function Type */}
                    <div>
                      <label className="text-xs section-label block mb-2">Function Type</label>
                      <select
                        id="booking-function" value={functionType}
                        onChange={e => setFunctionType(e.target.value)}
                        className="input-field cursor-pointer bg-white text-brown-950"
                      >
                        <option value="Birthday Party">Birthday Party</option>
                        <option value="Wedding Entry">Wedding Entry</option>
                        <option value="Baby Shower">Baby Shower / Gender Reveal</option>
                        <option value="Festival / Mela">Festival / Mela</option>
                        <option value="Corporate Event">Corporate Event</option>
                        <option value="School Event">School Event</option>
                        <option value="Other">Other Celebration</option>
                      </select>
                    </div>

                    {/* Venue Address */}
                    <div>
                      <label className="text-xs section-label block mb-2">Venue Address (in Surat)</label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-4 top-3 text-gray-500" />
                        <textarea
                          id="booking-address" required rows={3}
                          placeholder="Please enter the complete venue details (e.g. Party Plot, Adajan, Surat)"
                          value={venueAddress}
                          onChange={e => setVenueAddress(e.target.value)}
                          className="input-field pl-11 pt-2 resize-none"
                        />
                      </div>
                    </div>

                    {/* ── DATE PICKER ────────────────────────────────────── */}
                    <div>
                      <label className="text-xs section-label block mb-2">Booking Date</label>
                      <button
                        type="button"
                        onClick={() => setShowCalendar(prev => !prev)}
                        className="w-full input-field flex items-center gap-3 text-left bg-white text-brown-950"
                      >
                        <Calendar size={15} className="text-brown-500 shrink-0" />
                        <span className="font-semibold">
                          {bookingDate
                            ? new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-IN', {
                                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
                              })
                            : 'Select a date'}
                        </span>
                        <span className="ml-auto text-xs text-brown-400">{showCalendar ? '▲' : '▼'}</span>
                      </button>

                      <AnimatePresence>
                        {showCalendar && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="mt-2"
                          >
                            <MiniCalendar
                              selectedDate={bookingDate}
                              onSelect={d => { setBookingDate(d); setShowCalendar(false) }}
                              bookedDates={bookedDates}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ── TIME PICKER ────────────────────────────────────── */}
                    <div>
                      <label className="text-xs section-label block mb-2">Start Time</label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {HOURS.map(h => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setStartHour(h)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                              startHour === h
                                ? 'bg-brown-700 text-white border-brown-700 shadow-md'
                                : 'bg-white text-brown-700 border-brown-200 hover:border-brown-400'
                            }`}
                          >
                            {formatHour(h)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── DURATION ────────────────────────────────────────── */}
                    <div>
                      <label className="text-xs section-label block mb-2">Booking Duration (Hours)</label>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="w-10 h-10 rounded-xl glass border border-brown-200 text-brown-900 hover:border-brown-400 transition-all font-bold">
                          −
                        </button>
                        <span className="font-heading font-bold text-2xl text-brown-900 w-8 text-center">{quantity}</span>
                        <button type="button" onClick={() => setQuantity(q => Math.min(8, q + 1))}
                          className="w-10 h-10 rounded-xl glass border border-brown-200 text-brown-900 hover:border-brown-400 transition-all font-bold">
                          +
                        </button>
                        <span className="text-brown-700 text-sm font-semibold">
                          {formatHour(startHour)} – {formatHour(startHour + quantity)}
                        </span>
                      </div>
                    </div>

                    {/* ── SLOT AVAILABILITY INDICATOR ─────────────────────── */}
                    <AnimatePresence>
                      {slotLoading ? (
                        <motion.div key="loading"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-2 text-sm text-brown-500 bg-brown-50 border border-brown-200 rounded-xl px-4 py-3">
                          <div className="w-4 h-4 border-2 border-brown-300 border-t-brown-700 rounded-full animate-spin" />
                          Checking availability…
                        </motion.div>
                      ) : isAvailable ? (
                        <motion.div key="available"
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 font-semibold">
                          <CheckCircle2 size={16} className="text-green-500" />
                          ✅ This slot is available! Your mascot(s) are free on this date & time.
                        </motion.div>
                      ) : (
                        <motion.div key="conflict"
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                          <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold">🔴 Slot Unavailable</p>
                            <p className="text-xs mt-0.5">
                              {conflictingSlots.map(s => s.mascotTitle || s.mascotId).join(', ')} is already booked during this time. Please pick a different date or time.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Special Requests */}
                    <div>
                      <label className="text-xs section-label block mb-2">Special Requests / Entry Instructions</label>
                      <div className="relative">
                        <FileText size={14} className="absolute left-4 top-3 text-gray-500" />
                        <textarea
                          id="booking-special" rows={2}
                          placeholder="e.g. Cake cutting sequence song, entry surprise stunt, specific dances..."
                          value={specialRequests}
                          onChange={e => setSpecialRequests(e.target.value)}
                          className="input-field pl-11 pt-2 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isAvailable || slotLoading}
                    className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!isAvailable ? '🔴 Select Available Slot to Continue' : 'Continue to Payment →'}
                  </button>
                </motion.form>
              )}

              {/* Step 2: Payment */}
              {step === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3 }}
                  className="glass rounded-2xl p-8 border border-white/5 space-y-6"
                >
                  <h2 className="font-heading font-bold text-white text-xl flex items-center gap-2">
                    💳 Secure Payment
                  </h2>

                  {/* Booking summary recap */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>Mascot(s)</span>
                      <span className="text-white font-semibold">{bookedMascots.map(m => m.title).join(', ')}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Date</span>
                      <span className="text-white font-semibold">
                        {new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Time Slot</span>
                      <span className="text-white font-semibold">{formatHour(startHour)} – {formatHour(startHour + quantity)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Venue</span>
                      <span className="text-white text-xs font-medium max-w-[200px] text-right">{venueAddress}</span>
                    </div>
                  </div>

                  <RazorpayButton
                    amount={grandTotal}
                    name={bookedMascots.map(m => m.title).join(' + ')}
                    description={`${quantity} hrs · ${functionType} · ${formatHour(startHour)}–${formatHour(startHour + quantity)}`}
                    prefill={{
                      name: formData.name,
                      email: formData.email,
                      contact: formData.phone,
                    }}
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                  />

                  <button type="button" onClick={() => setStep('details')} className="btn-ghost w-full justify-center py-3">
                    ← Back to Details
                  </button>
                </motion.div>
              )}

              {/* Step 3: Confirmation */}
              {step === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="glass rounded-2xl p-8 border border-green-500/30 text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 size={40} className="text-green-400" />
                  </motion.div>
                  <div>
                    <h2 className="font-heading font-black text-3xl text-white mb-2">Booking Confirmed! 🎉</h2>
                    <p className="text-gray-400">Your mascot performance details have been sent to {formData.email}</p>
                  </div>

                  <div className="glass-light rounded-xl p-5 space-y-3 text-left border border-white/5">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Confirmation Code</span>
                      <span className="font-mono font-bold text-indigo-light">{confirmCode}</span>
                    </div>
                    {confirmPaymentId && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Payment ID</span>
                        <span className="font-mono text-xs text-gray-300">{confirmPaymentId}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Mascot(s)</span>
                      <span className="text-white text-sm font-medium max-w-[200px] text-right">
                        {bookedMascots.map(m => m.title).join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Booking Date</span>
                      <span className="text-white text-sm font-semibold">
                        {new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Time Slot</span>
                      <span className="text-white text-sm font-semibold">{formatHour(startHour)} – {formatHour(startHour + quantity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Function Type</span>
                      <span className="text-white text-sm font-semibold">{functionType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Duration Booked</span>
                      <span className="text-white text-sm">{quantity} hr{quantity !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Venue Address</span>
                      <span className="text-white text-sm max-w-[180px] text-right truncate">{venueAddress || 'Surat'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Total Paid</span>
                      <span className="gradient-text font-bold text-lg">{event.currency}{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link to="/profile" className="btn-ghost flex-1 justify-center py-3">
                      <Ticket size={15} /> My Bookings
                    </Link>
                    <Link to="/events" className="btn-primary flex-1 justify-center py-3">
                      View More Mascots
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Order Summary ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 lg:sticky lg:top-24">
            <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="font-heading font-semibold text-white text-lg flex items-center gap-2">
                <Users size={16} className="text-indigo-light" />
                Booking Summary
                {bookedMascots.length > 1 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-electric/20 text-indigo-light border border-indigo-electric/30">
                    {bookedMascots.length} Mascots
                  </span>
                )}
              </h3>

              {bookedMascots.length > 1 ? (
                <div className="space-y-2">
                  {bookedMascots.map(m => (
                    <div key={m.id} className="flex items-center gap-3 group">
                      <img src={m.image} alt={m.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{m.title}</p>
                        <p className="text-gray-400 text-xs">₹{m.price.toLocaleString()}/hr</p>
                      </div>
                      {step === 'details' && activeMascots.size > 1 && (
                        <button type="button" onClick={() => removeMascot(m.id)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-all">
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <img src={event.image} alt={event.title} className="w-full h-36 object-cover rounded-xl" />
              )}

              {bookedMascots.length === 1 && (
                <div>
                  <h4 className="font-semibold text-white text-sm leading-tight mb-1">{event.title}</h4>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1.5">
                    <Clock size={11} className="text-indigo-light shrink-0" /> {event.time}
                  </div>
                </div>
              )}

              {/* Date + Time summary */}
              {bookingDate && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-300 text-xs">
                    <Calendar size={12} className="text-indigo-light shrink-0" />
                    <span className="font-semibold">
                      {new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 text-xs">
                    <Clock size={12} className="text-indigo-light shrink-0" />
                    <span className="font-semibold">{formatHour(startHour)} – {formatHour(startHour + quantity)}</span>
                    <span className="ml-auto text-gray-500">({quantity} hr{quantity > 1 ? 's' : ''})</span>
                  </div>
                  {venueAddress && (
                    <div className="flex items-start gap-2 text-gray-400 text-xs">
                      <MapPin size={11} className="text-indigo-light shrink-0 mt-0.5" />
                      <span className="leading-tight">{venueAddress}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="divider-gradient" />
              <div className="space-y-2 text-sm">
                {bookedMascots.length > 1 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Rate ({bookedMascots.length} mascots)</span>
                    <span>₹{pricePerHour.toLocaleString()}/hr</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>{quantity} Hour{quantity !== 1 ? 's' : ''} Performance</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Sanitization & Travel Fee</span>
                  <span>₹{serviceFee.toLocaleString()}</span>
                </div>
              </div>
              <div className="divider-gradient" />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white">Grand Total</span>
                <span className="font-heading font-black text-xl gradient-text">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
