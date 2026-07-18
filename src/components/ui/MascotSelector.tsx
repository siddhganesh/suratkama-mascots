import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Check, ShoppingCart, Sparkles, Star, CheckCircle2, X,
  ArrowRight, Users, Package
} from 'lucide-react'
import { Event } from '../../types'
import { MOCK_EVENTS, CATEGORY_COLORS } from '../../data/mockData'

interface MascotSelectorProps {
  onClose?: () => void
  /** If provided, only these mascots are shown */
  mascots?: Event[]
}

export default function MascotSelector({ onClose, mascots }: MascotSelectorProps) {
  const navigate = useNavigate()
  const allMascots = mascots ?? MOCK_EVENTS
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hovered, setHovered] = useState<string | null>(null)

  const isAllSelected = selected.size === allMascots.length
  const isNoneSelected = selected.size === 0

  const toggleAll = () => {
    if (isAllSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allMascots.map(m => m.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedMascots = allMascots.filter(m => selected.has(m.id))
  const subtotal = selectedMascots.reduce((sum, m) => sum + m.price, 0)

  const handleBook = () => {
    if (selected.size === 0) return
    // Pass selected IDs via query string
    const ids = Array.from(selected).join(',')
    navigate(`/book?mascots=${ids}`)
  }

  return (
    <div className="relative w-full">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-label mb-1">Choose Your Performers</p>
          <h2 className="font-heading font-black text-3xl sm:text-4xl text-white">
            Select{' '}
            <span className="gradient-text">Mascots</span>
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Pick 1, 2, 3 or all — mix and match for the perfect event!
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl glass-light border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Select All toggle ──────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={toggleAll}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 ${
            isAllSelected
              ? 'bg-indigo-electric/20 border-indigo-electric text-indigo-light shadow-[0_0_20px_rgba(79,70,229,0.2)]'
              : 'glass-light border-white/10 text-gray-300 hover:border-indigo-electric/50 hover:text-white'
          }`}
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
            isAllSelected
              ? 'bg-indigo-electric border-indigo-electric'
              : 'border-gray-500'
          }`}>
            {isAllSelected && <Check size={12} strokeWidth={3} className="text-white" />}
          </div>
          <Package size={14} className="text-indigo-light" />
          Select All {allMascots.length} Mascots
          {isAllSelected && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-electric/30 text-indigo-light text-xs">
              ✓ All
            </span>
          )}
        </button>

        {!isNoneSelected && !isAllSelected && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-gray-400 text-sm"
          >
            {selected.size} of {allMascots.length} selected
          </motion.span>
        )}
      </div>

      {/* ── Mascot Grid ───────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {allMascots.map((mascot, i) => {
          const isSelected = selected.has(mascot.id)
          return (
            <motion.div
              key={mascot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              onClick={() => toggleOne(mascot.id)}
              onMouseEnter={() => setHovered(mascot.id)}
              onMouseLeave={() => setHovered(null)}
              className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 select-none ${
                isSelected
                  ? 'border-indigo-electric shadow-[0_0_25px_rgba(79,70,229,0.35)] scale-[1.02]'
                  : 'border-white/8 hover:border-indigo-electric/50 hover:scale-[1.01]'
              }`}
              style={{ background: 'rgba(31, 41, 55, 0.55)', backdropFilter: 'blur(16px)' }}
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={mascot.image}
                  alt={mascot.title}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    hovered === mascot.id ? 'scale-110' : 'scale-100'
                  }`}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep/90 via-charcoal-deep/20 to-transparent" />

                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <span className={`badge border ${CATEGORY_COLORS[mascot.category] ?? 'bg-indigo-500/20 text-indigo-300'}`}>
                    {mascot.category}
                  </span>
                </div>

                {/* Selection checkbox */}
                <div className="absolute top-3 right-3">
                  <motion.div
                    animate={{
                      scale: isSelected ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 0.25 }}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-200 ${
                      isSelected
                        ? 'bg-indigo-electric border-indigo-electric shadow-[0_0_12px_rgba(79,70,229,0.6)]'
                        : 'bg-black/40 border-white/30 backdrop-blur-sm'
                    }`}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Check size={13} strokeWidth={3} className="text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Price tag */}
                <div className="absolute bottom-3 right-3">
                  <span className="glass px-3 py-1 rounded-lg text-sm font-bold text-white shadow-lg">
                    ₹{mascot.price.toLocaleString()}/hr
                  </span>
                </div>
              </div>

              {/* Card content */}
              <div className="p-4">
                <h3 className={`font-heading font-bold text-base leading-tight mb-1 transition-colors duration-200 ${
                  isSelected ? 'text-indigo-light' : 'text-white'
                }`}>
                  {mascot.title}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">
                  {mascot.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star size={11} fill="currentColor" />
                    <span className="text-xs font-semibold text-amber-300">{mascot.rating}</span>
                    <span className="text-gray-500 text-xs">({mascot.reviewCount})</span>
                  </div>
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                      <CheckCircle2 size={12} />
                      Added
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Tap to select</span>
                  )}
                </div>
              </div>

              {/* Selected glow overlay */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, transparent 60%)',
                      border: '2px solid transparent',
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* ── Selection Summary Bar ─────────────────────────── */}
      <AnimatePresence>
        {!isNoneSelected && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            className="sticky bottom-0 left-0 right-0 z-40"
          >
            <div className="glass rounded-2xl border border-indigo-electric/30 p-5 shadow-[0_-4px_40px_rgba(79,70,229,0.2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Left: mascot avatars + info */}
              <div className="flex items-center gap-3">
                {/* Mini avatar stack */}
                <div className="flex -space-x-2">
                  {selectedMascots.slice(0, 4).map((m, idx) => (
                    <div
                      key={m.id}
                      className="w-10 h-10 rounded-full border-2 border-charcoal-deep overflow-hidden"
                      style={{ zIndex: 10 - idx }}
                    >
                      <img src={m.image} alt={m.title} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {selectedMascots.length > 4 && (
                    <div className="w-10 h-10 rounded-full border-2 border-charcoal-deep bg-indigo-electric/30 flex items-center justify-center text-xs font-bold text-indigo-light">
                      +{selectedMascots.length - 4}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-indigo-light" />
                    <span className="text-white font-semibold text-sm">
                      {selected.size} Mascot{selected.size !== 1 ? 's' : ''} Selected
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {selectedMascots.map(m => m.title).join(' · ')}
                  </p>
                </div>
              </div>

              {/* Right: Price + CTA */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none text-right sm:text-left">
                  <p className="text-gray-400 text-xs">Subtotal (per hour)</p>
                  <p className="font-heading font-black text-xl gradient-text">
                    ₹{subtotal.toLocaleString()}/hr
                  </p>
                </div>
                <button
                  onClick={handleBook}
                  className="btn-primary py-3 px-6 text-sm whitespace-nowrap"
                >
                  <ShoppingCart size={15} />
                  Book Now
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state prompt ────────────────────────────── */}
      {isNoneSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-2 py-4 text-center"
        >
          <Sparkles size={20} className="text-indigo-light/50" />
          <p className="text-gray-500 text-sm">Tap any mascot above to add it to your event!</p>
        </motion.div>
      )}
    </div>
  )
}
