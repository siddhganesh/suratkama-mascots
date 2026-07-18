/**
 * useRateLimit
 *
 * Tracks consecutive failed login attempts in sessionStorage to provide a
 * client-side brute-force mitigation layer. This is defence-in-depth — the
 * real throttle must live on the server (e.g., Redis + middleware).
 *
 * Behaviour:
 *   - After MAX_ATTEMPTS failures the UI locks for LOCKOUT_SECONDS seconds.
 *   - A successful login resets the counter (call `reset()`).
 *   - Lockout timer survives component remounts (sessionStorage-backed).
 */

import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY       = 'sk_rate_limit'
const MAX_ATTEMPTS      = 5
const LOCKOUT_SECONDS   = 30

interface RateLimitState {
  attempts: number
  lockedUntil: number   // epoch ms; 0 = not locked
}

function readState(): RateLimitState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as RateLimitState
  } catch { /* ignore */ }
  return { attempts: 0, lockedUntil: 0 }
}

function writeState(s: RateLimitState) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

export interface RateLimitResult {
  attempts: number
  isLocked: boolean
  lockoutSecondsLeft: number
  recordFailure: () => void
  reset: () => void
}

export function useRateLimit(): RateLimitResult {
  const [state, setState] = useState<RateLimitState>(readState)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Compute derived values
  const now              = Date.now()
  const isLocked         = state.lockedUntil > now
  const lockoutSecondsLeft = isLocked ? Math.ceil((state.lockedUntil - now) / 1000) : 0

  // Countdown tick — re-renders every second while locked
  useEffect(() => {
    if (isLocked) {
      timerRef.current = setInterval(() => {
        setState(s => {
          const updated = { ...s }
          // Once lockout expires, clear it
          if (updated.lockedUntil <= Date.now()) {
            updated.lockedUntil = 0
            updated.attempts    = 0
            writeState(updated)
          }
          return { ...updated }
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isLocked])

  const recordFailure = useCallback(() => {
    setState(prev => {
      const next: RateLimitState = {
        attempts:    prev.attempts + 1,
        lockedUntil: prev.lockedUntil,
      }
      if (next.attempts >= MAX_ATTEMPTS) {
        next.lockedUntil = Date.now() + LOCKOUT_SECONDS * 1000
      }
      writeState(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    const fresh: RateLimitState = { attempts: 0, lockedUntil: 0 }
    writeState(fresh)
    setState(fresh)
  }, [])

  return {
    attempts: state.attempts,
    isLocked,
    lockoutSecondsLeft,
    recordFailure,
    reset,
  }
}
