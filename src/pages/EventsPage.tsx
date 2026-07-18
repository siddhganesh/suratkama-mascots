import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, X, ChevronDown, Grid3X3, List, LayoutGrid, CheckSquare } from 'lucide-react'
import EventCard from '../components/ui/EventCard'
import MascotSelector from '../components/ui/MascotSelector'
import { MOCK_EVENTS, EVENT_CATEGORIES } from '../data/mockData'
import { FilterState, EventCategory } from '../types'
import SEO from '../components/ui/SEO'

const SORT_OPTIONS = [
  { value: 'date',       label: 'Featured' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
]

const DEFAULT_FILTERS: FilterState = {
  category: 'All',
  city: '',
  priceRange: [0, 10000],
  sortBy: 'date',
  searchQuery: '',
}

const LOCAL_CAT_COLORS: Record<string, string> = {
  Animal: 'bg-brown-50 text-brown-700 border-brown-200/40',
  Classic: 'bg-amber-50 text-amber-700 border-amber-200/40',
}

export default function EventsPage() {
  const [searchParams] = useSearchParams()
  const [pageMode, setPageMode] = useState<'browse' | 'multiSelect'>('browse')
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    category: (searchParams.get('category') as EventCategory) || 'All',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortOpen, setSortOpen] = useState(false)

  // Sync URL param on mount
  useEffect(() => {
    const cat = searchParams.get('category') as EventCategory | null
    if (cat) setFilters(f => ({ ...f, category: cat }))
  }, [searchParams])

  const filtered = useMemo(() => {
    let list = [...MOCK_EVENTS]

    // Category
    if (filters.category !== 'All') {
      list = list.filter(e => e.category === filters.category)
    }

    // Search
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase()
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    // Price range
    list = list.filter(e => e.price >= filters.priceRange[0] && e.price <= filters.priceRange[1])

    // Sort
    switch (filters.sortBy) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break
      case 'price-desc': list.sort((a, b) => b.price - a.price); break
      case 'rating':     list.sort((a, b) => b.rating - a.rating); break
      default:           list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }

    return list
  }, [filters])

  const resetFilters = () => setFilters(DEFAULT_FILTERS)
  const hasActiveFilters = filters.category !== 'All' || filters.searchQuery || filters.priceRange[1] < 10000

  return (
    <div className="min-h-screen bg-cream pt-20">
      <SEO 
        title="Browse Mascot Costumes – Surat" 
        description="Hire Gorilla, Panda, Yellow Teddy, Pink Fox, Red Bunny, Brown Teddy & Black Wolf mascot costumes in Surat for parties & events."
      />
      
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="relative py-14 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-warm border-b border-brown-100">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-72 h-72 bg-brown-200/10 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="section-label mb-2 text-brown-600">Book Mascot Performers</p>
            <h1 className="font-heading font-black text-5xl text-brown-950 mb-4">Our Mascots</h1>
            <p className="text-brown-800 text-lg max-w-xl font-medium">
              Choose from {MOCK_EVENTS.length} premium mascot costumes – Gorilla, Panda, Teddy Bears, Bunny & Wolf available for your next event.
            </p>

            {/* ── Mode Toggle Tabs ─────────────────────────────────── */}
            <div className="flex items-center gap-2 mt-8 p-1 glass rounded-2xl border border-brown-200/40 bg-white/70 w-fit">
              <button
                id="tab-browse"
                onClick={() => setPageMode('browse')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  pageMode === 'browse'
                    ? 'bg-brown-500 text-white shadow-sm'
                    : 'text-brown-700 hover:text-brown-950 hover:bg-brown-50'
                }`}
              >
                <LayoutGrid size={15} />
                Browse Individual
              </button>
              <button
                id="tab-multiselect"
                onClick={() => setPageMode('multiSelect')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  pageMode === 'multiSelect'
                    ? 'bg-brown-500 text-white shadow-sm'
                    : 'text-brown-700 hover:text-brown-950 hover:bg-brown-50'
                }`}
              >
                <CheckSquare size={15} />
                Select Multiple
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white border border-amber-600 shadow-sm ml-1">
                  NEW
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-12">

        <AnimatePresence mode="wait">
          {pageMode === 'multiSelect' ? (
            <motion.div
              key="multiselect"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <MascotSelector />
            </motion.div>
          ) : (
            <motion.div
              key="browse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >

              {/* ── Toolbar ─────────────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">

                {/* Search */}
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-500" />
                  <input
                    id="events-search"
                    type="text"
                    placeholder="Search mascots, styles, or tags…"
                    value={filters.searchQuery}
                    onChange={e => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
                    className="input-field pl-11 bg-white text-brown-950 border-brown-200"
                  />
                  {filters.searchQuery && (
                    <button
                      onClick={() => setFilters(f => ({ ...f, searchQuery: '' }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-500 hover:text-brown-900 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    id="sort-dropdown-btn"
                    onClick={() => setSortOpen(o => !o)}
                    className="btn-ghost py-3 px-4 text-sm gap-2 whitespace-nowrap bg-white shadow-sm border-brown-200/50"
                  >
                    {SORT_OPTIONS.find(s => s.value === filters.sortBy)?.label}
                    <ChevronDown size={14} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {sortOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-52 glass rounded-xl overflow-hidden z-30 border border-brown-200/20 bg-white shadow-lg"
                      >
                        {SORT_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => { setFilters(f => ({ ...f, sortBy: opt.value as FilterState['sortBy'] })); setSortOpen(false) }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                              filters.sortBy === opt.value
                                ? 'bg-brown-50 text-brown-900 font-semibold'
                                : 'text-brown-700 hover:bg-brown-50/50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Filter toggle */}
                <button
                  id="filters-toggle-btn"
                  onClick={() => setShowFilters(f => !f)}
                  className={`btn-ghost py-3 px-4 text-sm gap-2 bg-white shadow-sm border-brown-200/50 ${showFilters ? 'bg-brown-50 border-brown-400' : ''}`}
                >
                  <SlidersHorizontal size={15} />
                  Filters
                  {hasActiveFilters && (
                    <span className="w-5 h-5 rounded-full bg-brown-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                      !
                    </span>
                  )}
                </button>

                {/* View mode */}
                <div className="flex glass rounded-xl p-1 gap-1 bg-white/70 border-brown-250">
                  {(['grid', 'list'] as const).map(mode => (
                    <button
                      key={mode}
                      id={`view-${mode}-btn`}
                      onClick={() => setViewMode(mode)}
                      className={`p-2.5 rounded-lg transition-all duration-200 ${
                        viewMode === mode ? 'bg-brown-500 text-white shadow-sm' : 'text-brown-700 hover:text-brown-950'
                      }`}
                    >
                      {mode === 'grid' ? <Grid3X3 size={16} /> : <List size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Filter panel ─────────────────────────────────────────── */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden mb-8"
                  >
                    <div className="glass rounded-2xl p-6 border border-brown-200/20 bg-white/90 shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-heading font-semibold text-brown-900">Filter Mascots</h3>
                        {hasActiveFilters && (
                          <button onClick={resetFilters} className="text-xs text-red-650 hover:text-red-750 flex items-center gap-1 font-semibold">
                            <X size={12} /> Reset All
                          </button>
                        )}
                      </div>

                      {/* Category pills */}
                      <div>
                        <p className="text-xs text-brown-600 mb-3 section-label font-bold">Category</p>
                        <div className="flex flex-wrap gap-2">
                          {EVENT_CATEGORIES.map(cat => {
                            const active = filters.category === cat
                            const catColorClass = LOCAL_CAT_COLORS[cat as string] || 'bg-brown-50 text-brown-700 border-brown-200/40'
                            return (
                              <button
                                key={cat}
                                onClick={() => setFilters(f => ({ ...f, category: cat }))}
                                className={`badge border transition-all duration-200 cursor-pointer ${
                                  active
                                    ? 'bg-brown-500 text-white border-brown-600 shadow-sm font-semibold'
                                    : `bg-white hover:bg-brown-50/50 ${catColorClass}`
                                }`}
                              >
                                {cat}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Price range */}
                      <div className="mt-5">
                        <p className="text-xs text-brown-600 mb-3 section-label font-bold">
                          Max Price: ₹{filters.priceRange[1].toLocaleString()} / hour
                        </p>
                        <input
                          id="price-range-slider"
                          type="range"
                          min={0}
                          max={10000}
                          step={100}
                          value={filters.priceRange[1]}
                          onChange={e => setFilters(f => ({ ...f, priceRange: [0, +e.target.value] }))}
                          className="w-full max-w-sm accent-brown-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Results count ──────────────────────────────────────── */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-brown-700 text-sm font-medium">
                  Showing <span className="text-brown-950 font-bold">{filtered.length}</span> mascots
                  {filters.category !== 'All' && (
                    <> in <span className="text-brown-600 font-bold">{filters.category}</span></>
                  )}
                </p>
                {sortOpen && <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />}
              </div>

              {/* ── Grid / List ────────────────────────────────────────── */}
              <AnimatePresence mode="wait">
                {filtered.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass rounded-2xl p-16 text-center bg-white border-brown-200/20 shadow-sm"
                  >
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="font-heading font-bold text-brown-950 text-xl mb-2">No mascots found</h3>
                    <p className="text-brown-700 mb-6 font-medium">Try adjusting your filters or search query.</p>
                    <button onClick={resetFilters} className="btn-primary">Clear Filters</button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={viewMode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={
                      viewMode === 'grid'
                        ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'flex flex-col gap-4'
                    }
                  >
                    {filtered.map((event, i) => (
                      <EventCard key={event.id} event={event} index={i} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
