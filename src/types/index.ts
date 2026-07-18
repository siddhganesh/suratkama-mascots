// ── Shared type definitions ──────────────────────────────────────────────────

export interface Event {
  id: string
  title: string
  category: EventCategory
  date: string
  time: string
  location: string
  city: string
  price: number
  currency: string
  image: string
  video?: string
  description: string
  longDescription: string
  organizer: string
  capacity: number
  booked: number
  tags: string[]
  featured: boolean
  rating: number
  reviewCount: number
  isSoldOut: boolean
  galleryImages?: {
    front: string
    back: string
    side: string
    action: string
  }
}

export type EventCategory =
  | 'Animal'
  | 'Classic'

export interface Booking {
  id: string
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
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  joinedAt: string
  bookings: Booking[]
  isAdmin?: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface FilterState {
  category: EventCategory | 'All'
  city: string
  priceRange: [number, number]
  sortBy: 'date' | 'price-asc' | 'price-desc' | 'rating'
  searchQuery: string
}
