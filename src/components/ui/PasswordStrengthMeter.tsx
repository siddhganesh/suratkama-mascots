import type { PasswordStrengthResult } from '../../hooks/usePasswordStrength'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

interface Props {
  result: PasswordStrengthResult
  visible: boolean
}

const LABELS: Record<number, string> = {
  0: '',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
}

const LABEL_COLORS: Record<number, string> = {
  0: 'text-gray-500',
  1: 'text-red-400',
  2: 'text-amber-400',
  3: 'text-yellow-400',
  4: 'text-emerald-400',
}

const REQUIREMENTS = [
  { key: 'minLength' as const,  label: 'At least 8 characters' },
  { key: 'uppercase' as const,  label: 'One uppercase letter' },
  { key: 'number'   as const,   label: 'One number' },
  { key: 'special'  as const,   label: 'One special character (!@#…)' },
]

export default function PasswordStrengthMeter({ result, visible }: Props) {
  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
      aria-live="polite"
      aria-label={`Password strength: ${LABELS[result.score]}`}
    >
      <div className="pt-2 space-y-2">
        {/* Strength bars */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 flex-1" role="presentation">
            {[1, 2, 3, 4].map(level => (
              <div
                key={level}
                className="h-1.5 flex-1 rounded-full bg-charcoal-light overflow-hidden"
              >
                <motion.div
                  className={`h-full rounded-full ${result.score >= level ? result.color : 'bg-transparent'}`}
                  initial={{ width: 0 }}
                  animate={{ width: result.score >= level ? '100%' : '0%' }}
                  transition={{ duration: 0.3, delay: (level - 1) * 0.05 }}
                />
              </div>
            ))}
          </div>
          {result.score > 0 && (
            <span className={`text-xs font-semibold shrink-0 w-14 text-right ${LABEL_COLORS[result.score]}`}>
              {LABELS[result.score]}
            </span>
          )}
        </div>

        {/* Requirement chips */}
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
          {REQUIREMENTS.map(({ key, label }) => {
            const met = result.requirements[key]
            return (
              <li
                key={key}
                className={`flex items-center gap-1.5 text-[11px] transition-colors duration-200 ${
                  met ? 'text-emerald-400' : 'text-gray-500'
                }`}
              >
                {met
                  ? <Check size={10} className="shrink-0" aria-hidden="true" />
                  : <X    size={10} className="shrink-0" aria-hidden="true" />
                }
                <span>{label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </motion.div>
  )
}
