/**
 * usePasswordStrength
 *
 * Zero-dependency password strength hook.
 * Returns a numeric score 0–4 and individual requirement flags.
 *
 * Scoring:
 *   0 → empty / too short
 *   1 → Weak    (only 1-2 criteria)
 *   2 → Fair    (2-3 criteria)
 *   3 → Good    (3 criteria)
 *   4 → Strong  (all 4 + length ≥ 12)
 */

export interface PasswordRequirements {
  minLength: boolean   // ≥ 8 characters
  uppercase: boolean   // at least one A-Z
  number: boolean      // at least one 0-9
  special: boolean     // at least one special char
  longEnough: boolean  // ≥ 12 characters (bonus)
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4
  label: 'Empty' | 'Weak' | 'Fair' | 'Good' | 'Strong'
  requirements: PasswordRequirements
  /** Tailwind colour token for the strength bar */
  color: string
  /** Progress percentage for the strength bar (0-100) */
  percent: number
}

const SPECIAL_RE = /[^A-Za-z0-9]/
const UPPER_RE   = /[A-Z]/
const NUMBER_RE  = /[0-9]/

export function getPasswordStrength(password: string): PasswordStrengthResult {
  const requirements: PasswordRequirements = {
    minLength:  password.length >= 8,
    uppercase:  UPPER_RE.test(password),
    number:     NUMBER_RE.test(password),
    special:    SPECIAL_RE.test(password),
    longEnough: password.length >= 12,
  }

  if (!password) {
    return { score: 0, label: 'Empty', requirements, color: 'bg-gray-700', percent: 0 }
  }

  const coreCount = [
    requirements.minLength,
    requirements.uppercase,
    requirements.number,
    requirements.special,
  ].filter(Boolean).length

  // Bonus for extra length
  const bonus = requirements.longEnough ? 1 : 0
  const total  = coreCount + bonus

  if (total <= 1) return { score: 1, label: 'Weak',   requirements, color: 'bg-red-500',    percent: 20 }
  if (total === 2) return { score: 2, label: 'Fair',   requirements, color: 'bg-amber-400',  percent: 45 }
  if (total === 3) return { score: 3, label: 'Good',   requirements, color: 'bg-yellow-400', percent: 68 }
  return              { score: 4, label: 'Strong',  requirements, color: 'bg-emerald-400', percent: 100 }
}

import { useMemo } from 'react'

export function usePasswordStrength(password: string): PasswordStrengthResult {
  return useMemo(() => getPasswordStrength(password), [password])
}
