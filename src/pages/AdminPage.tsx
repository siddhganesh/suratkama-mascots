import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { db, isFirebaseEnabled } from '../config/firebase'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { MOCK_EVENTS } from '../data/mockData'
import { Event } from '../types'
import {
  LayoutDashboard, Users, Ticket, Package, Plus, Edit3, Trash2,
  X, Check, AlertTriangle, DollarSign,
  Search, Eye, Shield, LogOut,
  Star, RefreshCw, Save, Clock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ImageUploader from '../components/ui/ImageUploader'

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminBooking {
  id: string
  userId: string
  eventId: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  ticketCount: number
  totalPrice: number
  currency: string
  bookedAt: string
  status: 'confirmed' | 'pending' | 'cancelled'
  confirmationCode: string
  userName?: string
  userEmail?: string
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, gradient, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded-2xl p-6 border border-brown-200/30 shadow-sm bg-white"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${gradient}`} />
      <div className="relative z-10">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-brown-50 border border-brown-100">
          <Icon size={20} className="text-brown-600" />
        </div>
        <div className="text-3xl font-black text-brown-950 font-heading mb-1">{value}</div>
        <div className="text-sm text-brown-600 font-semibold">{label}</div>
      </div>
    </motion.div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border ${
        type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
          : 'bg-red-50 border-red-200 text-red-700 font-semibold'
      }`}
    >
      {type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </motion.div>
  )
}

// ── Event Form Modal ───────────────────────────────────────────────────────────
function EventFormModal({
  event, onClose, onSave
}: {
  event: Partial<Event> | null
  onClose: () => void
  onSave: (data: Partial<Event>) => Promise<void>
}) {
  const isEdit = !!event?.id
  const [form, setForm] = useState<Partial<Event>>(event || {
    title: '', category: 'Animal', price: 2000, currency: '₹',
    location: 'Surat', city: 'Surat', description: '', longDescription: '',
    organizer: 'SuratKama Mascots', capacity: 1, booked: 0, tags: [],
    featured: false, rating: 5.0, reviewCount: 0, isSoldOut: false,
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=mascot',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
  })
  const [loading, setLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSave(form)
    setLoading(false)
  }

  const addTag = () => {
    if (tagInput.trim()) {
      setForm(f => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] }))
      setTagInput('')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm cursor-pointer"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-brown-200/30 bg-white shadow-xl cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brown-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brown-50 border border-brown-100 flex items-center justify-center">
              {isEdit ? <Edit3 size={16} className="text-brown-600" /> : <Plus size={16} className="text-brown-600" />}
            </div>
            <h2 className="font-heading font-bold text-xl text-brown-950">
              {isEdit ? 'Edit Mascot' : 'Add New Mascot'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-brown-50 text-brown-500 hover:text-brown-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-brown-600 mb-1.5 uppercase tracking-wider">Mascot Title *</label>
              <input
                required
                value={form.title || ''}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Dancing Gorilla"
                className="input-field bg-white text-brown-950 border-brown-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brown-600 mb-1.5 uppercase tracking-wider">Category</label>
              <select
                value={form.category || 'Animal'}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                className="input-field bg-white text-brown-950 border-brown-200 cursor-pointer"
              >
                <option value="Animal">Animal</option>
                <option value="Classic">Classic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-brown-600 mb-1.5 uppercase tracking-wider">Price (₹)</label>
              <input
                type="number"
                value={form.price || ''}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                className="input-field bg-white text-brown-950 border-brown-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brown-600 mb-1.5 uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={form.date || ''}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="input-field bg-white text-brown-950 border-brown-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brown-600 mb-1.5 uppercase tracking-wider">Time</label>
              <input
                value={form.time || ''}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                placeholder="e.g., 10:00 AM"
                className="input-field bg-white text-brown-950 border-brown-200"
              />
            </div>
            <div className="col-span-2">
              <ImageUploader
                label="Mascot Image"
                value={form.image || ''}
                onChange={url => setForm(f => ({ ...f, image: url }))}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-brown-600 mb-1.5 uppercase tracking-wider">Short Description</label>
              <textarea
                value={form.description || ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="input-field bg-white text-brown-950 border-brown-200 resize-none"
                placeholder="Short description shown in card..."
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-brown-600 mb-1.5 uppercase tracking-wider">Full Description</label>
              <textarea
                value={form.longDescription || ''}
                onChange={e => setForm(f => ({ ...f, longDescription: e.target.value }))}
                rows={3}
                className="input-field bg-white text-brown-950 border-brown-200 resize-none"
                placeholder="Detailed description for the mascot page..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brown-600 mb-1.5 uppercase tracking-wider">Capacity</label>
              <input
                type="number"
                value={form.capacity || 1}
                onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                className="input-field bg-white text-brown-950 border-brown-200"
              />
            </div>
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setForm(f => ({ ...f, featured: !f.featured }))}
                  className={`w-11 h-6 rounded-full transition-colors duration-300 flex items-center ${form.featured ? 'bg-brown-500' : 'bg-brown-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${form.featured ? 'translate-x-5.5 ml-0.5' : 'ml-0.5'}`} />
                </div>
                <span className="text-sm text-brown-800 font-semibold">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setForm(f => ({ ...f, isSoldOut: !f.isSoldOut }))}
                  className={`w-11 h-6 rounded-full transition-colors duration-300 flex items-center ${form.isSoldOut ? 'bg-red-500' : 'bg-brown-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${form.isSoldOut ? 'translate-x-5.5 ml-0.5' : 'ml-0.5'}`} />
                </div>
                <span className="text-sm text-brown-800 font-semibold">Sold Out</span>
              </label>
            </div>

            {/* Tags */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-brown-600 mb-1.5 uppercase tracking-wider">Tags</label>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="Add tag & press Enter..."
                  className="input-field bg-white text-brown-950 border-brown-200 flex-1"
                />
                <button type="button" onClick={addTag} className="btn-ghost px-4 py-2.5 text-sm bg-white shadow-sm border-brown-200">Add</button>
              </div>
              {(form.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(form.tags || []).map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-brown-50 border border-brown-200/50 rounded-full text-xs text-brown-700 font-semibold">
                      {tag}
                      <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags?.filter((_, idx) => idx !== i) }))} className="opacity-60 hover:opacity-100">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 bg-white shadow-sm border-brown-200">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Save size={16} /> {isEdit ? 'Save Changes' : 'Create Mascot'}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────
function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-2xl p-8 text-center border border-brown-200/30 bg-white shadow-xl"
      >
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={28} className="text-red-650" />
        </div>
        <h3 className="text-xl font-bold text-brown-950 mb-2">Delete Mascot?</h3>
        <p className="text-brown-700 text-sm mb-6 font-semibold">
          Are you sure you want to delete <span className="text-brown-950 font-bold">"{name}"</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1 bg-white border-brown-200">Cancel</button>
          <button onClick={onConfirm} className="flex-1 btn-primary bg-red-600 hover:bg-red-700 hover:shadow-none">
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
type AdminTab = 'dashboard' | 'mascots' | 'bookings' | 'users'

export default function AdminPage() {
  const { user, isAdmin, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [events, setEvents] = useState<Event[]>([])
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null | false>(false)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all')

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoadingData(true)
    if (isFirebaseEnabled && db) {
      try {
        // Load events
        const eventsSnap = await getDocs(collection(db, 'events'))
        const eventsData = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Event))
        setEvents(eventsData.length > 0 ? eventsData : MOCK_EVENTS)

        // Load all bookings
        const bookingsSnap = await getDocs(query(collection(db, 'bookings'), orderBy('bookedAt', 'desc')))
        setBookings(bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() } as AdminBooking)))
      } catch (e) {
        console.error('Error loading admin data:', e)
        setEvents(MOCK_EVENTS)
      }
    } else {
      setEvents(MOCK_EVENTS)
      // Mock bookings
      setBookings([
        {
          id: 'bk-001', userId: 'u1', eventId: 'ev-001', eventTitle: 'Dancing Gorilla',
          eventDate: '2025-03-15', eventLocation: 'Surat', ticketCount: 2,
          totalPrice: 4000, currency: '₹', bookedAt: '2025-02-10T10:30:00Z',
          status: 'confirmed', confirmationCode: 'SK-001', userName: 'Priya Patel', userEmail: 'priya@example.com'
        },
        {
          id: 'bk-002', userId: 'u2', eventId: 'ev-002', eventTitle: 'Panda Bear',
          eventDate: '2025-04-20', eventLocation: 'Surat', ticketCount: 1,
          totalPrice: 2500, currency: '₹', bookedAt: '2025-03-01T09:00:00Z',
          status: 'pending', confirmationCode: 'SK-002', userName: 'Rahul Shah', userEmail: 'rahul@example.com'
        },
        {
          id: 'bk-003', userId: 'u3', eventId: 'ev-003', eventTitle: 'Pink Fox',
          eventDate: '2025-05-10', eventLocation: 'Surat', ticketCount: 3,
          totalPrice: 7500, currency: '₹', bookedAt: '2025-04-01T14:00:00Z',
          status: 'confirmed', confirmationCode: 'SK-003', userName: 'Meera Joshi', userEmail: 'meera@example.com'
        },
      ])
    }
    setLoadingData(false)
  }

  useEffect(() => { loadData() }, [])

  // ── CRUD Operations ────────────────────────────────────────────────────────
  const handleSaveEvent = async (data: Partial<Event>) => {
    if (isFirebaseEnabled && db) {
      try {
        if (data.id) {
          const { id, ...rest } = data
          await updateDoc(doc(db, 'events', id), { ...rest, updatedAt: serverTimestamp() })
          setEvents(prev => prev.map(e => e.id === id ? { ...e, ...rest } as Event : e))
          showToast('Mascot updated successfully!')
        } else {
          const newData = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
          const ref = await addDoc(collection(db, 'events'), newData)
          setEvents(prev => [...prev, { id: ref.id, ...data } as Event])
          showToast('Mascot created successfully!')
        }
      } catch (e) {
        showToast('Error saving mascot. Please try again.', 'error')
      }
    } else {
      // Mock mode
      if (data.id) {
        setEvents(prev => prev.map(e => e.id === data.id ? { ...e, ...data } as Event : e))
        showToast('Mascot updated! (Mock mode — not persisted)')
      } else {
        const newEvent = { ...data, id: `ev-${Date.now()}` } as Event
        setEvents(prev => [...prev, newEvent])
        showToast('Mascot created! (Mock mode — not persisted)')
      }
    }
    setEditingEvent(false)
  }

  const handleDeleteEvent = async (event: Event) => {
    if (isFirebaseEnabled && db) {
      try {
        await deleteDoc(doc(db, 'events', event.id))
        showToast('Mascot deleted successfully!')
      } catch {
        showToast('Error deleting mascot.', 'error')
      }
    } else {
      showToast('Mascot deleted! (Mock mode)')
    }
    setEvents(prev => prev.filter(e => e.id !== event.id))
    setDeletingEvent(null)
  }

  const handleUpdateBookingStatus = async (bookingId: string, status: AdminBooking['status']) => {
    if (isFirebaseEnabled && db) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), { status })
        showToast(`Booking status updated to ${status}!`)
      } catch {
        showToast('Error updating booking.', 'error')
      }
    } else {
      showToast(`Status updated to ${status}! (Mock mode)`)
    }
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b))
  }

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-brown-300/20 border-t-brown-500 rounded-full animate-spin" />
          <p className="text-brown-700 text-sm font-semibold">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalPrice, 0)
  const pendingCount = bookings.filter(b => b.status === 'pending').length

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredBookings = bookings.filter(b => {
    const matchSearch = b.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.userName || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter
    return matchSearch && matchStatus
  })

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'mascots', label: 'Mascots', icon: Package },
    { id: 'bookings', label: 'Bookings', icon: Ticket },
    { id: 'users', label: 'Users', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-cream">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brown-200/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-brown-300/5 rounded-full blur-[100px]" />
      </div>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 z-30 border-r border-brown-200/30 bg-white/95 backdrop-blur-md">
        {/* Logo */}
        <div className="p-6 border-b border-brown-100">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brown-500 flex items-center justify-center shadow-sm">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <div className="font-heading font-bold text-brown-950 text-sm">Admin Panel</div>
              <div className="text-xs text-brown-500 font-semibold">SuratKama Mascots</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="p-4 flex-1 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === id
                  ? 'bg-brown-500 text-white shadow-sm'
                  : 'text-brown-700 hover:text-brown-950 hover:bg-brown-50'
              }`}
            >
              <Icon size={18} />
              {label}
              {id === 'bookings' && pendingCount > 0 && (
                <span className="ml-auto w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-brown-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-brown-50/50 border border-brown-100">
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full border border-brown-300" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-brown-950 truncate">{user.name}</div>
              <div className="text-xs text-brown-600 font-bold">Super Admin</div>
            </div>
            <button
              onClick={() => { logout(); navigate('/') }}
              className="p-1.5 text-brown-500 hover:text-red-650 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-20 px-8 py-4 border-b border-brown-150 flex items-center justify-between bg-white/90 backdrop-blur-md">
          <div>
            <h1 className="font-heading font-bold text-xl text-brown-950">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-brown-550 mt-0.5 font-bold">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="p-2 rounded-lg text-brown-500 hover:text-brown-850 hover:bg-brown-50 transition-all shadow-sm bg-white border border-brown-200" title="Refresh">
              <RefreshCw size={16} className={loadingData ? 'animate-spin' : ''} />
            </button>
            {(activeTab === 'mascots') && (
              <button onClick={() => setEditingEvent({})} className="btn-primary text-sm py-2 px-4">
                <Plus size={16} /> Add Mascot
              </button>
            )}
          </div>
        </div>

        <div className="p-8">
          {/* ── Dashboard ─────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-4 gap-5 mb-8">
                  <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon={DollarSign} gradient="bg-brown-500" delay={0} />
                  <StatCard label="Total Bookings" value={bookings.length} icon={Ticket} gradient="bg-brown-600" delay={0.1} />
                  <StatCard label="Active Mascots" value={events.filter(e => !e.isSoldOut).length} icon={Package} gradient="bg-amber-500" delay={0.2} />
                  <StatCard label="Pending Review" value={pendingCount} icon={AlertTriangle} gradient="bg-red-500" delay={0.3} />
                </div>

                {/* Recent Bookings */}
                <div className="rounded-2xl border border-brown-200 bg-white overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between p-6 border-b border-brown-100">
                    <h2 className="font-heading font-bold text-lg text-brown-950">Recent Bookings</h2>
                    <button onClick={() => setActiveTab('bookings')} className="text-sm text-brown-600 hover:text-brown-800 transition-colors font-bold">
                      View All →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-brown-100 bg-brown-50/50">
                          {['Mascot', 'Customer', 'Date', 'Amount', 'Status'].map(h => (
                            <th key={h} className="text-left px-6 py-3 text-xs font-bold text-brown-600 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.slice(0, 5).map((booking, i) => (
                          <motion.tr
                            key={booking.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="border-b border-brown-100 hover:bg-brown-50/20 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm text-brown-950 font-bold">{booking.eventTitle}</td>
                            <td className="px-6 py-4 text-sm text-brown-700 font-semibold">{booking.userName || 'Unknown'}</td>
                            <td className="px-6 py-4 text-sm text-brown-500 font-semibold">{booking.eventDate}</td>
                            <td className="px-6 py-4 text-sm text-brown-950 font-bold">
                              {booking.currency}{booking.totalPrice.toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Mascots CRUD ─────────────────────────────────────────────── */}
            {activeTab === 'mascots' && (
              <motion.div key="mascots" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Search */}
                <div className="relative mb-6">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-500" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search mascots..."
                    className="input-field pl-11 bg-white text-brown-950 border-brown-200"
                  />
                </div>

                {loadingData ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-2 border-brown-300/20 border-t-brown-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-5">
                    {filteredEvents.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="group rounded-2xl border border-brown-200 bg-white overflow-hidden transition-all duration-300 hover:border-brown-400/40 hover:shadow-sm"
                      >
                        <div className="relative h-36 overflow-hidden bg-brown-50">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${event.id}` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          {event.featured && (
                            <div className="absolute top-2 left-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white rounded-full text-xs font-bold border border-amber-600 shadow-sm">
                                <Star size={10} fill="currentColor" /> Featured
                              </span>
                            </div>
                          )}
                          {event.isSoldOut && (
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-0.5 bg-red-650 text-white rounded-full text-xs font-bold border border-red-750 shadow-sm">Sold Out</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-brown-950 text-sm">{event.title}</h3>
                              <p className="text-xs text-brown-500 font-semibold mt-0.5">{event.category} · ₹{event.price?.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingEvent(event)}
                                className="p-1.5 rounded-lg text-brown-650 hover:text-brown-850 hover:bg-brown-50 transition-all border border-brown-200 bg-white"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => setDeletingEvent(event)}
                                className="p-1.5 rounded-lg text-brown-650 hover:text-red-750 hover:bg-red-50 transition-all border border-brown-200 bg-white"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-brown-700 font-semibold line-clamp-2">{event.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Bookings ─────────────────────────────────────────────────── */}
            {activeTab === 'bookings' && (
              <motion.div key="bookings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-500" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search bookings..."
                      className="input-field pl-11 bg-white text-brown-950 border-brown-200"
                    />
                  </div>
                  <select
                    value={bookingStatusFilter}
                    onChange={e => setBookingStatusFilter(e.target.value as any)}
                    className="input-field w-44 bg-white text-brown-950 border-brown-200 cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-brown-200 bg-white overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-brown-100 bg-brown-50/50">
                          {['Code', 'Mascot', 'Customer', 'Date', 'Hours', 'Total', 'Status', 'Actions'].map(h => (
                            <th key={h} className="text-left px-5 py-4 text-xs font-bold text-brown-600 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((booking, i) => (
                          <motion.tr
                            key={booking.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-brown-100 hover:bg-brown-50/20 transition-colors"
                          >
                            <td className="px-5 py-4 text-xs font-mono text-brown-800 font-bold">{booking.confirmationCode}</td>
                            <td className="px-5 py-4 text-sm text-brown-950 font-bold">{booking.eventTitle}</td>
                            <td className="px-5 py-4">
                              <div className="text-sm text-brown-950 font-bold">{booking.userName || '—'}</div>
                              <div className="text-xs text-brown-500 font-semibold">{booking.userEmail || '—'}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-sm text-brown-700 font-semibold">
                                {(booking as any).bookingDate || booking.eventDate}
                              </div>
                              {((booking as any).startHour !== undefined) && (
                                <div className="flex items-center gap-1 text-xs text-brown-500 font-semibold mt-0.5">
                                  <Clock size={10} />
                                  {(() => {
                                    const sh = (booking as any).startHour
                                    const eh = (booking as any).endHour
                                    const fmt = (h: number) => h === 12 ? '12PM' : h > 12 ? `${h-12}PM` : `${h}AM`
                                    return `${fmt(sh)} – ${fmt(eh)}`
                                  })()}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-sm text-brown-700 font-semibold text-center">{booking.ticketCount} hr{booking.ticketCount !== 1 ? 's' : ''}</td>
                            <td className="px-5 py-4 text-sm text-brown-950 font-bold">
                              {booking.currency}{booking.totalPrice.toLocaleString('en-IN')}
                            </td>
                            <td className="px-5 py-4">
                              <select
                                value={booking.status}
                                onChange={e => handleUpdateBookingStatus(booking.id, e.target.value as any)}
                                className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none transition-colors ${
                                  booking.status === 'confirmed' ? 'bg-emerald-50 border-emerald-250 text-emerald-700' :
                                  booking.status === 'pending' ? 'bg-amber-50 border-amber-250 text-amber-700' :
                                  'bg-red-50 border-red-250 text-red-700'
                                }`}
                                style={{ background: 'transparent' }}
                              >
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="px-5 py-4">
                              <button className="p-1.5 rounded-lg text-brown-500 hover:text-brown-850 hover:bg-brown-50 transition-all border border-brown-200 bg-white">
                                <Eye size={14} />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredBookings.length === 0 && (
                      <div className="py-16 text-center text-brown-500">
                        <Ticket size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-semibold">No bookings found</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Users ─────────────────────────────────────────────────────── */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="rounded-2xl border border-brown-200 bg-white overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-brown-100">
                    <h2 className="font-heading font-bold text-lg text-brown-950">Registered Users</h2>
                    <p className="text-sm text-brown-500 font-semibold mt-1">
                      {isFirebaseEnabled ? 'User list from Firestore users collection.' : 'Running in mock/demo mode.'}
                    </p>
                  </div>
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-brown-50 border border-brown-100 flex items-center justify-center mx-auto mb-4">
                      <Users size={28} className="text-brown-600" />
                    </div>
                    <p className="text-brown-700 text-sm mb-2 font-semibold">
                      {isFirebaseEnabled
                        ? 'Connect to Firebase to see registered users from the Firestore users collection.'
                        : 'Enable Firebase to manage real users. Currently in mock mode.'}
                    </p>
                    <p className="text-xs text-brown-500 font-bold">
                      To grant admin access: set <code className="text-brown-800 bg-brown-50 px-1 py-0.5 rounded border border-brown-150">role: "admin"</code> in the Firestore <code className="text-brown-800 bg-brown-50 px-1 py-0.5 rounded border border-brown-150">users</code> collection for the user's UID document.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editingEvent !== false && (
          <EventFormModal
            event={editingEvent}
            onClose={() => setEditingEvent(false)}
            onSave={handleSaveEvent}
          />
        )}
        {deletingEvent && (
          <DeleteConfirm
            name={deletingEvent.title}
            onConfirm={() => handleDeleteEvent(deletingEvent)}
            onCancel={() => setDeletingEvent(null)}
          />
        )}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
