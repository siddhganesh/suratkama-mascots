import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Star, Calendar, MapPin, Clock, ShieldCheck, 
  Heart, Share2, Play, Sparkles, Tag, X, Film
} from 'lucide-react'
import { MOCK_EVENTS } from '../data/mockData'
import SEO from '../components/ui/SEO'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [playVideo, setPlayVideo] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string, label: string } | null>(null)

  const event = MOCK_EVENTS.find(e => e.id === id)

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 text-center px-4 bg-cream">
        <h1 className="font-heading font-black text-4xl text-brown-950 mb-4">Mascot Not Found</h1>
        <p className="text-brown-800 mb-8 max-w-md font-medium">The mascot costume you are looking for does not exist or has been removed.</p>
        <Link to="/events" className="btn-primary">Browse All Mascots</Link>
      </div>
    )
  }

  const related = MOCK_EVENTS.filter(e => e.category === event.category && e.id !== event.id).slice(0, 3)

  return (
    <div className="min-h-screen bg-cream pt-16">
      <SEO 
        title={`${event.title} — Mascot costume rental in Surat`} 
        description={event.description} 
        ogImage={event.image}
      />

      {/* ── Hero image banner ────────────────────────────────── */}
      <div className="relative h-[40vh] sm:h-[55vh] overflow-hidden bg-brown-50">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/40 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 glass rounded-xl px-4 py-2 flex items-center gap-2
                     text-brown-900 text-sm hover:border-brown-400 transition-all shadow-sm"
        >
          <ArrowLeft size={15} /> Back
        </button>

        {/* Action buttons */}
        <div className="absolute top-6 right-6 flex gap-2">
          <button
            id="save-event-btn"
            onClick={() => setSaved(s => !s)}
            className={`glass rounded-xl p-2.5 transition-all shadow-sm ${saved ? 'text-rose-600 bg-white' : 'text-brown-700 hover:text-rose-600 bg-white/80'}`}
          >
            <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button
            id="share-event-btn"
            onClick={() => navigator.share?.({ title: event.title, url: window.location.href })}
            className="glass rounded-xl p-2.5 text-brown-700 hover:text-brown-950 transition-all bg-white/80 shadow-sm"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* Category + featured */}
        <div className="absolute bottom-6 left-6 flex gap-2">
          <span className="badge border bg-brown-50 text-brown-700 border-brown-200">{event.category}</span>
          {event.featured && (
            <span className="badge bg-amber-500 text-white border border-amber-600 shadow-sm">Popular</span>
          )}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-24">
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title + meta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass rounded-2xl p-8 border border-brown-200/20 bg-white shadow-sm"
            >
              <h1 className="font-heading font-black text-3xl sm:text-4xl text-brown-950 mb-5 leading-tight">
                {event.title}
              </h1>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {[
                  { Icon: Calendar, label: 'Ideal For', value: 'Birthdays, Festivals, School Events' },
                  { Icon: Clock,    label: 'Booking Slot', value: event.time },
                  { Icon: MapPin,   label: 'Service Location', value: event.location },
                  { Icon: ShieldCheck, label: 'Hygiene & Costume Standard', value: '100% Sanitized Premium Costumes' },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brown-50 border border-brown-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={16} className="text-brown-600" />
                    </div>
                    <div>
                      <p className="text-xs text-brown-500 mb-0.5 font-semibold">{label}</p>
                      <p className="text-sm text-brown-900 font-bold">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 pb-6 border-b border-brown-100">
                <div className="flex text-amber-500 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.round(event.rating) ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <span className="text-brown-950 font-bold">{event.rating}</span>
                <span className="text-brown-600 text-sm font-semibold">({event.reviewCount} reviews)</span>
              </div>

              {/* Description */}
              <div className="pt-6">
                <h2 className="font-heading font-semibold text-brown-950 text-xl mb-3">Mascot Description</h2>
                <p className="text-brown-800 leading-relaxed font-medium">{event.longDescription}</p>
              </div>

              {/* Tags */}
              <div className="mt-6 flex flex-wrap gap-2 items-center">
                <Tag size={14} className="text-brown-400 shrink-0" />
                {event.tags.map(tag => (
                  <span key={tag} className="badge bg-brown-50/50 text-brown-700 border border-brown-100 hover:border-brown-300 transition-colors cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Photo Angles & Video Showcase */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="glass rounded-2xl p-8 border border-brown-200/20 bg-white shadow-sm space-y-6"
            >
              <div>
                <h2 className="font-heading font-bold text-brown-950 text-2xl mb-2 flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-500 animate-pulse" />
                  Mascot Showcase
                </h2>
                <p className="text-brown-700 text-sm font-medium">
                  Photos from multiple angles and performance videos.
                </p>
              </div>

              {/* Angles Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {event.galleryImages ? (
                  [
                    { key: 'front', label: 'Angle Front', src: event.galleryImages.front },
                    { key: 'side', label: 'Angle Side', src: event.galleryImages.side },
                    { key: 'back', label: 'Angle Back', src: event.galleryImages.back },
                    { key: 'action', label: 'Angle Action', src: event.galleryImages.action }
                  ].map(({ key, label, src }) => (
                    <div 
                      key={key} 
                      onClick={() => setSelectedImage({ src, label })}
                      className="relative aspect-[3/4] rounded-xl overflow-hidden bg-brown-50/55 border border-brown-150 group cursor-pointer"
                    >
                      <img 
                        src={src} 
                        alt={`${event.title} - ${label}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Dark gradient overlay + hover label */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity flex items-end justify-center p-3" />
                      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white font-semibold text-xs tracking-wide bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/10 group-hover:border-brown-400 transition-all duration-300 whitespace-nowrap">
                        {label}
                      </span>
                    </div>
                  ))
                ) : (
                  [1, 2, 3, 4].map(i => (
                    <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-brown-50 border border-brown-200/50 group">
                      <div className="absolute inset-0 flex items-center justify-center text-brown-600 font-semibold text-xs">
                        Angle {i === 1 ? 'Front' : i === 2 ? 'Side' : i === 3 ? 'Back' : 'Action'}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Video preview or player */}
              {event.video ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-brown-50 border border-brown-200/50 flex items-center justify-center group shadow-inner">
                  {playVideo ? (
                    <video
                      src={event.video}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      onClick={() => setPlayVideo(true)}
                      className="absolute inset-0 cursor-pointer flex items-center justify-center"
                    >
                      <img 
                        src={event.image} 
                        alt="Video Thumbnail" 
                        className="w-full h-full object-cover brightness-75 transition-transform duration-500 group-hover:scale-103" 
                      />
                      <div className="absolute inset-0 bg-brown-500/10 pointer-events-none" />
                      <div className="z-10 w-16 h-16 rounded-full bg-brown-500 flex items-center justify-center text-white shadow-md group-hover:scale-108 transition-transform duration-300">
                        <Play size={24} fill="currentColor" className="ml-1" />
                      </div>
                      <span className="absolute bottom-4 left-4 text-xs font-semibold text-white bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 backdrop-blur-sm">
                        <Film size={12} /> Click to Play Performance Video
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-brown-50/50 border border-brown-200/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-brown-500 flex items-center gap-2">
                    <Film size={14} /> Video presentation coming soon
                  </span>
                </div>
              )}
            </motion.div>

            {/* Related mascots */}
            {related.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <h2 className="font-heading font-bold text-brown-950 text-2xl mb-4">
                  More {event.category} Mascots
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {related.slice(0, 2).map(rel => (
                    <Link key={rel.id} to={`/events/${rel.id}`}
                      className="bg-white rounded-xl p-4 flex gap-4 border border-brown-200/20
                                 hover:border-brown-400 hover:shadow-sm transition-all duration-300 group shadow-sm">
                      <img src={rel.image} alt={rel.title} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0 flex flex-col justify-between py-1">
                        <p className="text-brown-950 font-bold text-sm line-clamp-2 group-hover:text-brown-700 transition-colors">{rel.title}</p>
                        <p className="text-brown-600 text-sm font-black">{rel.currency}{rel.price.toLocaleString()}/hr</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: Booking card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:sticky lg:top-24"
          >
            <div className="glass rounded-2xl p-6 border border-brown-300/30 glow-ring space-y-5 bg-white shadow-sm">
              {/* Price */}
              <div>
                <p className="text-brown-600 text-sm mb-1 font-semibold">Hourly Service Rate</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading font-black text-4xl gradient-text">
                    {event.currency}{event.price.toLocaleString()}
                  </span>
                  <span className="text-brown-600 text-sm font-semibold">/ hour</span>
                </div>
              </div>

              <div className="divider-gradient" />

              {/* Mascot performance specs */}
              <div className="space-y-3 text-sm text-brown-800 font-semibold">
                <div className="flex justify-between border-b border-brown-100 pb-2">
                  <span className="text-brown-500">Performers</span>
                  <span className="font-bold text-brown-900">Professional Dancer</span>
                </div>
                <div className="flex justify-between border-b border-brown-100 pb-2">
                  <span className="text-brown-500">Hygiene Standard</span>
                  <span className="font-bold text-emerald-700">100% Sanitized</span>
                </div>
                <div className="flex justify-between border-b border-brown-100 pb-2">
                  <span className="text-brown-500">Ideal Slots</span>
                  <span className="font-bold text-brown-900">1 - 4 Hours</span>
                </div>
                <div className="flex justify-between border-b border-brown-100 pb-2">
                  <span className="text-brown-500">Includes</span>
                  <span className="font-bold text-brown-900">Dance Show & Photos</span>
                </div>
              </div>

              <div className="divider-gradient" />

              {/* CTA */}
              {event.isSoldOut ? (
                <button
                  disabled
                  className="w-full bg-brown-100 text-brown-400 py-3.5 px-4 rounded-xl font-bold
                             text-center border border-brown-200 cursor-not-allowed shadow-inner"
                >
                  Fully Booked / Unavailable
                </button>
              ) : (
                <Link
                  to={`/book?mascots=${event.id}`}
                  className="btn-primary w-full py-3.5 text-center font-bold text-base"
                >
                  Book Performer Now
                </Link>
              )}

              <p className="text-[11px] text-center text-brown-600 font-semibold">
                📅 Easy cancellation policy up to 48h before event.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Image Modal Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-zoom-out"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 text-white hover:text-gray-300 p-2.5 bg-white/10 rounded-full"
            >
              <X size={20} />
            </button>
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden bg-brown-950 border border-white/10"
            >
              <img
                src={selectedImage.src}
                alt={selectedImage.label}
                className="w-full h-full max-h-[75vh] object-contain"
              />
              <div className="bg-brown-950/90 p-4 border-t border-white/5 flex items-center justify-between text-white">
                <span className="font-bold text-sm tracking-wide">{selectedImage.label}</span>
                <span className="text-xs text-gray-400 font-semibold">{event.title}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
