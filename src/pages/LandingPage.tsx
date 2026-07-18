import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useRef, useEffect } from 'react'
import {
  ArrowRight, Sparkles, Star, Play,
  PawPrint, Heart, Zap, Shield, Clock
} from 'lucide-react'
import EventCard from '../components/ui/EventCard'
import { MOCK_EVENTS, PLATFORM_STATS, TESTIMONIALS, EVENT_CATEGORIES } from '../data/mockData'
import { EventCategory } from '../types'
import SEO from '../components/ui/SEO'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

// ── Category icon map ─────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, React.ElementType> = {
  Animal: PawPrint,
  Classic: Heart,
}

// ── Animated counter ──────────────────────────────────────────────────────────
function StatCard({ label, value, delay }: { label: string; value: string; delay: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="glass rounded-2xl p-6 text-center border border-brown-200/20 shadow-sm bg-white hover:shadow-md transition-all duration-300"
    >
      <div className="font-heading font-black text-3xl text-brown-600 mb-1">
        {value}
      </div>
      <div className="text-brown-700 text-sm font-medium">{label}</div>
    </motion.div>
  )
}

// ── Feature badge ─────────────────────────────────────────────────────────────
function FeatureBadge({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brown-200/50 text-sm text-brown-800 shadow-sm">
      <Icon size={14} className="text-brown-500 shrink-0" />
      <span className="font-medium">{text}</span>
    </div>
  )
}

// ── GSAP Section ──────────────────────────────────────────────────────────────
function GSAPSection({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.fromTo(el, {
        opacity: 0,
        y: 50,
      }, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={ref} id={id} className={className} style={{ opacity: 0 }}>
      {children}
    </section>
  )
}

// ── Magnetic Button ───────────────────────────────────────────────────────────
function MagneticButton({ children, className = '', to }: { children: React.ReactNode; className?: string; to: string }) {
  const ref = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      gsap.to(el, { x: x * 0.22, y: y * 0.22, duration: 0.4, ease: 'power2.out' })
    }

    const handleMouseLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' })
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <Link ref={ref} to={to} className={className} style={{ display: 'inline-flex' }}>
      {children}
    </Link>
  )
}

// ── How It Works Step ─────────────────────────────────────────────────────────
function HowStep({ number, title, description, delay }: { number: string; title: string; description: string; delay: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group bg-white rounded-2xl p-8 border border-brown-200/20 relative overflow-hidden
                 hover:border-brown-400/50 transition-all duration-400
                 hover:shadow-[0_15px_35px_rgba(192,125,53,0.08)]"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-brown-200/5 rounded-full blur-3xl
                      group-hover:bg-brown-200/10 transition-colors duration-700" />
      <div className="relative z-10">
        <div className="text-5xl font-black text-brown-300/30 mb-4 font-heading group-hover:text-brown-500/40 transition-colors duration-300">
          {number}
        </div>
        <h3 className="text-xl font-bold text-brown-900 mb-2 group-hover:text-brown-600 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-brown-700 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const featured = MOCK_EVENTS.filter(e => e.featured).slice(0, 4)
  const categories = EVENT_CATEGORIES.filter(c => c !== 'All') as EventCategory[]
  const heroRef = useRef<HTMLDivElement>(null)
  const floatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Floating particles
      gsap.to('.hero-particle', {
        y: '-=15',
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: { each: 0.4, from: 'random' },
      })

      // Scroll indicator bounce
      gsap.to('.scroll-indicator', {
        y: 8,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="min-h-screen bg-cream noise-overlay">
      <SEO
        title="SuratKama Mascots — #1 Dancing Mascot Costume Booking in Surat"
        description="Book premium dancing mascot costumes in Surat — Gorilla, Panda, Teddy Bears, Pink Fox, Bunny Rabbit & Black Wolf. Professional performers for birthdays, corporate events & parties. Sanitized, energetic. ₹2,000/hr onwards."
        canonical="https://suratkamamascots.com/"
        keywords="mascot costume booking surat, dancing mascot surat, gorilla costume surat, panda mascot booking surat, teddy bear costume surat, birthday mascot surat, event mascot gujarat"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Dancing Mascot Costume Booking",
          "provider": {
            "@type": "LocalBusiness",
            "name": "SuratKama Mascots",
            "address": { "@type": "PostalAddress", "addressLocality": "Surat", "addressRegion": "Gujarat", "addressCountry": "IN" }
          },
          "areaServed": "Surat, Gujarat",
          "serviceType": "Mascot Costume Rental & Performance",
          "offers": {
            "@type": "AggregateOffer",
            "lowPrice": "2000",
            "highPrice": "5000",
            "priceCurrency": "INR",
            "offerCount": "7"
          },
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "bestRating": "5", "ratingCount": "127" }
        }}
      />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-gradient-warm">

        {/* Ambient warm glow orbs */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brown-200/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-brown-300/10 rounded-full blur-[120px]" />
        </div>

        {/* Fine warm mesh pattern overlay */}
        <div className="absolute inset-0 bg-mesh-warm opacity-70 z-[2] pointer-events-none" />

        {/* Floating mascot particles */}
        <div className="absolute inset-0 z-[3] pointer-events-none select-none" ref={floatRef}>
          {['🦍', '🐼', '🐻', '🦊', '🐰', '⭐', '✨', '🎉'].map((emoji, i) => (
            <div
              key={i}
              className="hero-particle absolute text-2xl opacity-30"
              style={{
                left: `${10 + (i * 12) % 85}%`,
                top: `${15 + (i * 17) % 65}%`,
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 w-full">
          <div className="max-w-3xl mx-auto text-center">
            <div className="space-y-8">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <span className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full
                                 text-brown-700 text-sm font-semibold border border-brown-200/60
                                 shadow-sm">
                  <Sparkles size={14} className="text-amber-500 animate-pulse" />
                  Surat's #1 Dancing Mascot Costume Booking Studio
                  <Sparkles size={14} className="text-amber-500 animate-pulse" />
                </span>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="font-heading font-black text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-brown-950 leading-[1.05]">
                  Book Premium{' '}
                  <span className="gradient-text">Mascot</span>
                  <br />
                  <span className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl opacity-90">
                    Costumes
                  </span>{' '}
                  <span className="text-brown-600 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl">
                    For Events
                  </span>
                </h1>
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="text-brown-800 text-lg leading-relaxed max-w-xl mx-auto font-medium"
              >
                7 premium mascot costumes — Gorilla, Panda, Teddy Bears, Bunny Rabbit, Pink Fox & Black Wolf.
                Sanitized, professional performers across <span className="text-brown-950 font-bold">Surat & nearby</span>.
              </motion.p>

              {/* Feature badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="flex flex-wrap gap-2 justify-center"
              >
                <FeatureBadge icon={Shield} text="Sanitized Costumes" />
                <FeatureBadge icon={Star} text="450+ Happy Families" />
                <FeatureBadge icon={Clock} text="Available 7 Days" />
                <FeatureBadge icon={Zap} text="Instant Booking" />
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="flex flex-wrap gap-4 justify-center"
              >
                <MagneticButton to="/events" className="btn-primary text-base px-8 py-4 shadow-md hover:shadow-lg">
                  Browse Mascots <ArrowRight size={18} />
                </MagneticButton>
                <MagneticButton to="/events" className="btn-ghost text-base px-8 py-4 bg-white/70">
                  <Play size={16} fill="currentColor" /> Watch Mascots Dance
                </MagneticButton>
              </motion.div>

              {/* Trust info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex items-center gap-4 justify-center pt-2"
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <img
                      key={i}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`}
                      alt="user"
                      className="w-9 h-9 rounded-full border-2 border-white bg-brown-50"
                    />
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex text-amber-500 text-xs gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                  </div>
                  <span className="text-brown-700 text-xs font-semibold">Loved by 450+ families & event hosts in Surat</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="scroll-indicator flex flex-col items-center gap-2 mt-16 text-brown-400 text-xs"
          >
            <span className="uppercase tracking-widest text-[10px] font-bold">Scroll to explore</span>
            <div className="w-5 h-8 rounded-full border border-brown-300 flex items-start justify-center pt-1.5 bg-white/80">
              <div className="w-1 h-2 bg-brown-500 rounded-full animate-bounce" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <GSAPSection className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 -mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {PLATFORM_STATS.map((stat, i) => (
              <StatCard key={stat.label} {...stat} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </GSAPSection>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <GSAPSection className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white border-y border-brown-100">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-label mb-3 text-brown-600"
            >
              Booking Process
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading font-bold text-4xl sm:text-5xl text-brown-950"
            >
              Book in <span className="gradient-text">3 Easy Steps</span>
            </motion.h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <HowStep
              number="01"
              title="Select Your Mascot"
              description="Choose from our 7 premium mascot costumes – animals, classic bears, or fierce characters. Preview photos & videos."
              delay={0}
            />
            <HowStep
              number="02"
              title="Book Date & Hours"
              description="Pick your date, time, and how many hours you want the mascot to perform at your event."
              delay={0.15}
            />
            <HowStep
              number="03"
              title="Enjoy The Performance"
              description="Our professional performers arrive early, do customized routines, and assist with cake cutting & photos."
              delay={0.3}
            />
          </div>
        </div>
      </GSAPSection>

      {/* ── FEATURED EVENTS ───────────────────────────────────────────────── */}
      <GSAPSection className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="section-label mb-2 text-brown-600"
              >
                Top Performers
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="font-heading font-bold text-4xl sm:text-5xl text-brown-950"
              >
                Featured <span className="gradient-text">Costumes</span>
              </motion.h2>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Link to="/events" className="btn-ghost text-sm py-2 px-4 hidden sm:flex bg-white shadow-sm border-brown-200">
                View All Mascots <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((event, i) => <EventCard key={event.id} event={event} index={i} />)}
          </div>
          <div className="mt-8 sm:hidden">
            <Link to="/events" className="btn-ghost w-full justify-center bg-white shadow-sm">View All Mascots <ArrowRight size={14} /></Link>
          </div>
        </div>
      </GSAPSection>

      {/* ── CATEGORIES ────────────────────────────────────────────────────── */}
      <GSAPSection className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-y border-brown-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="section-label mb-3 text-brown-600"
            >
              Browse By Theme
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading font-bold text-4xl sm:text-5xl text-brown-950"
            >
              Costume <span className="gradient-text">Categories</span>
            </motion.h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 max-w-xl mx-auto gap-6">
            {categories.map((cat, i) => {
              const Icon = CAT_ICONS[cat] ?? Sparkles
              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={`/events?category=${cat}`}
                    className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 text-center
                               hover:border-brown-400 hover:shadow-md
                               transition-all duration-450 border border-brown-200/30 group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-brown-50 flex items-center justify-center
                                    group-hover:bg-brown-100 group-hover:scale-105 transition-all duration-300
                                    shadow-sm border border-brown-100">
                      <Icon size={26} className="text-brown-600" />
                    </div>
                    <span className="font-heading font-bold text-brown-900">{cat}</span>
                    <span className="text-brown-500 text-xs font-semibold">
                      {MOCK_EVENTS.filter(e => e.category === cat).length} costume{MOCK_EVENTS.filter(e => e.category === cat).length !== 1 ? 's' : ''}
                    </span>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </GSAPSection>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <GSAPSection className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="section-label mb-3 text-brown-600"
            >
              What Hosts Say
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading font-bold text-4xl sm:text-5xl text-brown-950"
            >
              Loved By <span className="gradient-text">Parents & Planners</span>
            </motion.h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(192,125,53,0.06)' }}
                className="bg-white rounded-2xl p-6 border border-brown-200/20 transition-all duration-300 group shadow-sm"
              >
                <div className="flex text-amber-500 gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
                </div>
                <p className="text-brown-800 text-sm leading-relaxed mb-5 font-medium">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full border border-brown-200/60"
                  />
                  <div>
                    <p className="text-brown-950 font-bold text-sm">{t.name}</p>
                    <p className="text-brown-500 text-xs font-semibold">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </GSAPSection>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <GSAPSection className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-brown-100">
        <div className="max-w-4xl mx-auto">
          <motion.div
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.3 }}
            className="relative bg-gradient-warm rounded-3xl p-14 text-center overflow-hidden border border-brown-300/30 shadow-md"
          >
            {/* Ambient glows */}
            <div className="absolute -top-32 -right-32 w-72 h-72 bg-brown-200/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-brown-300/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <span className="section-label mb-4 block text-brown-600">Ready to book?</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="font-heading font-black text-4xl sm:text-5xl text-brown-950 mb-4"
              >
                Bring The Ultimate
                <br />
                <span className="gradient-text">Dance Party To Your Event</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-brown-700 text-lg mb-10 max-w-lg mx-auto font-medium"
              >
                Secure your favourite dancing mascot costumes early to avoid busy season booking clashes.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4 justify-center"
              >
                <MagneticButton to="/events" className="btn-primary text-base px-10 py-4 shadow-sm">
                  Browse Mascots <ArrowRight size={18} />
                </MagneticButton>
                <MagneticButton to="/book" className="btn-ghost text-base px-10 py-4 bg-white/80 border-brown-350">
                  Book A Performer Now
                </MagneticButton>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </GSAPSection>
    </div>
  )
}
