/**
 * useSlotAvailability — Calendar Slot Locking Hook
 *
 * Checks whether selected mascot(s) are available for a given
 * date + time slot. Works in both Firebase and Mock/localStorage modes.
 *
 * Usage:
 *   const { isAvailable, bookedSlots, isLoading } = useSlotAvailability({
 *     mascotIds: ['mascot-001'],
 *     date: '2026-08-15',
 *     startHour: 14,       // 2 PM (24-hr)
 *     durationHours: 2,    // ends at 4 PM
 *   })
 */

import { useState, useEffect, useCallback } from 'react'
import { db, isFirebaseEnabled } from '../config/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export interface TimeSlot {
  mascotId: string
  mascotTitle: string
  date: string
  startHour: number   // 0–23
  endHour: number     // 0–23
  status: 'confirmed' | 'pending' | 'cancelled'
  confirmationCode?: string
}

interface UseSlotAvailabilityParams {
  mascotIds: string[]
  date: string          // 'YYYY-MM-DD'
  startHour: number     // 0–23
  durationHours: number // 1–8
}

interface UseSlotAvailabilityResult {
  isAvailable: boolean
  conflictingSlots: TimeSlot[]
  isLoading: boolean
  refetch: () => void
}

// ── Helper: check if two time ranges overlap ───────────────────────────────────
function hasOverlap(
  aStart: number, aEnd: number,
  bStart: number, bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd
}

export function useSlotAvailability({
  mascotIds,
  date,
  startHour,
  durationHours,
}: UseSlotAvailabilityParams): UseSlotAvailabilityResult {
  const [isLoading, setIsLoading] = useState(false)
  const [conflictingSlots, setConflictingSlots] = useState<TimeSlot[]>([])

  const endHour = startHour + durationHours

  const fetchSlots = useCallback(async () => {
    if (!date || mascotIds.length === 0) return

    setIsLoading(true)
    let existingBookings: TimeSlot[] = []

    if (isFirebaseEnabled && db) {
      // ── Firebase mode: query bookings for this date ──────────────────────
      try {
        const bookingsRef = collection(db, 'bookings')
        const q = query(
          bookingsRef,
          where('bookingDate', '==', date),
          where('status', '!=', 'cancelled')
        )
        const snap = await getDocs(q)
        existingBookings = snap.docs.flatMap(d => {
          const data = d.data()
          // A booking may have multiple mascot IDs (comma-separated or array)
          const ids: string[] = Array.isArray(data.mascotIds)
            ? data.mascotIds
            : (data.mascotIds ?? data.eventId ?? '').split(',').filter(Boolean)

          return ids.map((mid: string) => ({
            mascotId: mid,
            mascotTitle: data.eventTitle ?? '',
            date: data.bookingDate ?? '',
            startHour: data.startHour ?? 10,
            endHour: data.endHour ?? 12,
            status: data.status ?? 'pending',
            confirmationCode: data.confirmationCode,
          }))
        })
      } catch (err) {
        console.error('useSlotAvailability: Firestore query error', err)
      }
    } else {
      // ── Mock mode: read from localStorage ───────────────────────────────
      try {
        const stored = localStorage.getItem('sk_bookings')
        const localBookings = stored ? JSON.parse(stored) : []
        existingBookings = localBookings.flatMap((b: any) => {
          if (!b.bookingDate || b.bookingDate !== date) return []
          if (b.status === 'cancelled') return []
          const ids: string[] = Array.isArray(b.mascotIds)
            ? b.mascotIds
            : (b.mascotIds ?? b.eventId ?? '').split(',').filter(Boolean)

          return ids.map((mid: string) => ({
            mascotId: mid,
            mascotTitle: b.eventTitle ?? '',
            date: b.bookingDate,
            startHour: b.startHour ?? 10,
            endHour: b.endHour ?? 12,
            status: b.status ?? 'pending',
            confirmationCode: b.confirmationCode,
          }))
        })
      } catch (err) {
        console.error('useSlotAvailability: localStorage read error', err)
      }
    }

    // ── Filter: find conflicts for requested mascot IDs + time range ─────
    const conflicts = existingBookings.filter(slot =>
      mascotIds.includes(slot.mascotId) &&
      hasOverlap(startHour, endHour, slot.startHour, slot.endHour)
    )

    setConflictingSlots(conflicts)
    setIsLoading(false)
  }, [date, mascotIds, startHour, endHour])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  return {
    isAvailable: conflictingSlots.length === 0,
    conflictingSlots,
    isLoading,
    refetch: fetchSlots,
  }
}

// ── Helper: get booked dates for a mascot (used by inline calendar) ───────────
export async function getBookedDatesForMascot(mascotId: string): Promise<string[]> {
  const dates: string[] = []

  if (isFirebaseEnabled && db) {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('mascotIds', 'array-contains', mascotId),
        where('status', '!=', 'cancelled')
      )
      const snap = await getDocs(q)
      snap.docs.forEach(d => {
        const date = d.data().bookingDate
        if (date && !dates.includes(date)) dates.push(date)
      })
    } catch (err) {
      console.error('getBookedDates error:', err)
    }
  } else {
    try {
      const stored = localStorage.getItem('sk_bookings')
      const localBookings = stored ? JSON.parse(stored) : []
      localBookings.forEach((b: any) => {
        if (b.bookingDate && b.status !== 'cancelled') {
          const ids: string[] = Array.isArray(b.mascotIds)
            ? b.mascotIds
            : (b.mascotIds ?? '').split(',').filter(Boolean)
          if (ids.includes(mascotId) && !dates.includes(b.bookingDate)) {
            dates.push(b.bookingDate)
          }
        }
      })
    } catch { /* ignore */ }
  }

  return dates
}
