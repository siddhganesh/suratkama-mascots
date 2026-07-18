import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Star, ArrowRight, Zap, CheckCircle } from 'lucide-react'
import { Event } from '../../types'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'

interface EventCardProps {
  event: Event
  index?: number
}

// Adapt category colors mapping locally if needed, but let's make it look warm
const LOCAL_CAT_COLORS: Record<string, string> = {
  Animal: 'bg-brown-50 text-brown-700 border-brown-200/40',
  Classic: 'bg-amber-50 text-amber-700 border-amber-200/40',
}

export default function EventCard({ event, index = 0 }: EventCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // GSAP 3D tilt effect
  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5

      gsap.to(el, {
        rotateX: -y * 8,
        rotateY: x * 8,
        transformPerspective: 800,
        duration: 0.4,
        ease: 'power2.out',
      })

      // Shine effect
      const shine = el.querySelector('.card-shine') as HTMLElement
      if (shine) {
        gsap.to(shine, {
          opacity: 0.15,
          x: x * 40,
          y: y * 40,
          duration: 0.4,
        })
      }
    }

    const handleMouseLeave = () => {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
      })
      const shine = el.querySelector('.card-shine') as HTMLElement
      if (shine) {
        gsap.to(shine, { opacity: 0, duration: 0.4 })
      }
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  const categoryColorClass = LOCAL_CAT_COLORS[event.category] || 'bg-brown-50 text-brown-700 border-brown-200/40'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 800 }}
    >
      <div ref={cardRef} style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
        <Link to={`/events/${event.id}`} className="block h-full group">
          <div className="glass rounded-2xl overflow-hidden h-full flex flex-col border border-brown-200/20 bg-white
                          group-hover:border-brown-400/50 transition-all duration-400
                          group-hover:shadow-[0_15px_35px_rgba(192,125,53,0.08)]
                          relative">

            {/* Shine overlay for 3D tilt */}
            <div
              className="card-shine absolute inset-0 z-20 pointer-events-none rounded-2xl opacity-0"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(192,125,53,0.1), transparent 70%)',
              }}
            />

            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-brown-50">
              <img
                src={event.image}
                alt={event.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Badges row */}
              <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                <span className={`badge border ${categoryColorClass}`}>
                  {event.category}
                </span>
                <div className="flex flex-col items-end gap-1">
                  {event.featured && (
                    <span className="badge bg-amber-500 text-white border border-amber-600 shadow-sm">
                      <Zap size={10} className="fill-current" /> Popular
                    </span>
                  )}
                  {event.isSoldOut && (
                    <span className="badge bg-red-650 text-white border border-red-700 shadow-sm">
                      Fully Booked
                    </span>
                  )}
                </div>
              </div>

              {/* Price tag */}
              <div className="absolute bottom-3 right-3">
                <span className="glass px-3 py-1.5 rounded-lg text-sm font-bold text-brown-900 border border-brown-200 shadow-md bg-white/90">
                  {event.currency}{event.price.toLocaleString()}/hr
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-5 gap-3 bg-white">

              {/* Title */}
              <h3 className="font-heading font-semibold text-brown-950 text-lg leading-tight
                             group-hover:text-brown-650 transition-colors duration-200 line-clamp-2">
                {event.title}
              </h3>

              {/* Meta */}
              <div className="flex flex-col gap-1.5 text-brown-700 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-brown-500 shrink-0" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-brown-500 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>

              {/* Rating + sanitised */}
              <div className="flex items-center justify-between text-xs text-brown-600">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={12} fill="currentColor" />
                  <span className="font-semibold text-brown-900">{event.rating}</span>
                  <span className="text-brown-500">({event.reviewCount} reviews)</span>
                </div>
                <span className="text-brown-600 flex items-center gap-1">
                  <CheckCircle size={10} className="text-emerald-650" /> Sanitized
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {event.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] bg-brown-50/50 border border-brown-100 text-brown-700 px-2 py-0.5 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-auto pt-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-brown-600
                                group-hover:text-brown-800 transition-colors duration-200">
                  {event.isSoldOut ? 'View Details' : 'Book Performer'}
                  <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-200" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  )
}
