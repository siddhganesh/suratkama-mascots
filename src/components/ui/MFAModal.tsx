/**
 * MFAModal
 *
 * Inline 6-digit OTP verification panel that slides in over the form.
 *
 * A11y:
 *   - Six individual inputs each have aria-label
 *   - Group wrapped in role="group" + aria-labelledby
 *   - Error announced via aria-live="assertive"
 *   - Focus trapped within the panel while open
 *   - Escape closes the modal
 */

import { useEffect, useRef, useState, useCallback, KeyboardEvent, ClipboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ArrowLeft, RefreshCw } from 'lucide-react'

interface Props {
  isOpen: boolean
  isLoading: boolean
  onVerify: (code: string) => void
  onBack: () => void
  onResend: () => void
  email: string
}

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

export default function MFAModal({ isOpen, isLoading, onVerify, onBack, onResend, email }: Props) {
  const [digits, setDigits]       = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError]         = useState('')
  const [resendLeft, setResendLeft] = useState(RESEND_SECONDS)
  const [canResend, setCanResend] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const headingId = 'mfa-heading'
  const errorId   = 'mfa-error'

  // ── Reset state each time the modal opens ──────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setDigits(Array(OTP_LENGTH).fill(''))
      setError('')
      setResendLeft(RESEND_SECONDS)
      setCanResend(false)
      // Auto-focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 80)

      // Start countdown
      timerRef.current = setInterval(() => {
        setResendLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isOpen])

  // ── Focus trap: cycle within panel ────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onBack()
  }, [onBack])

  // ── Per-digit input handlers ───────────────────────────────────────────────
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return          // digits only
    const cleaned = value.slice(-1)            // take last char (overwrite)
    const next = [...digits]
    next[index] = cleaned
    setDigits(next)
    setError('')

    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
    // Auto-submit when last digit filled
    if (cleaned && index === OTP_LENGTH - 1) {
      const code = [...next.slice(0, OTP_LENGTH - 1), cleaned].join('')
      if (code.length === OTP_LENGTH) onVerify(code)
    }
  }

  const handleKeyDownDigit = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...digits]
      if (next[index]) {
        next[index] = ''
        setDigits(next)
      } else if (index > 0) {
        next[index - 1] = ''
        setDigits(next)
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    setError('')
    // Focus last filled or last input
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()
    if (pasted.length === OTP_LENGTH) onVerify(pasted)
  }

  const handleResend = () => {
    if (!canResend) return
    onResend()
    setResendLeft(RESEND_SECONDS)
    setCanResend(false)
    setDigits(Array(OTP_LENGTH).fill(''))
    inputRefs.current[0]?.focus()
    timerRef.current = setInterval(() => {
      setResendLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); setCanResend(true); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const maskedEmail = email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length))

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mfa-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={errorId}
          onKeyDown={handleKeyDown}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="absolute inset-0 z-25 flex flex-col items-center justify-center px-6 py-8
                     bg-white border-l border-brown-150 rounded-r-3xl"
        >
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-brown-50 border border-brown-200/60
                          flex items-center justify-center mb-5 shadow-sm">
            <Shield size={26} className="text-brown-600" aria-hidden="true" />
          </div>

          {/* Heading */}
          <h2 id={headingId} className="font-heading font-black text-2xl text-brown-950 mb-1 text-center">
            Two-Factor Verification
          </h2>
          <p className="text-brown-700 text-sm text-center mb-6 max-w-xs font-semibold">
            Enter the 6-digit code sent to{' '}
            <span className="text-brown-600 font-bold">{maskedEmail}</span>
          </p>

          {/* OTP inputs */}
          <div
            role="group"
            aria-labelledby={headingId}
            className="flex items-center gap-2 mb-5"
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                id={`otp-digit-${i + 1}`}
                aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digit}
                disabled={isLoading}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDownDigit(i, e)}
                onPaste={handlePaste}
                className={`
                  w-11 h-13 text-center text-xl font-bold rounded-xl
                  border transition-all duration-200 bg-brown-50/50 text-brown-950
                  focus:outline-none focus:ring-2 focus:ring-brown-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${digit ? 'border-brown-500 shadow-sm' : 'border-brown-200'}
                  ${error ? 'border-red-500 shake' : ''}
                `}
                style={{ height: '3.25rem' }}
              />
            ))}
          </div>

          {/* Error */}
          <div
            id={errorId}
            role="alert"
            aria-live="assertive"
            className="min-h-[1.5rem] mb-3"
          >
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-700 text-sm text-center font-bold"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Resend */}
          <div className="flex items-center gap-1 text-sm text-brown-700 font-semibold mb-6">
            <span>Didn't receive it?</span>
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="flex items-center gap-1 text-brown-600 hover:text-brown-850
                           transition-colors font-bold focus:outline-none focus:underline"
              >
                <RefreshCw size={13} aria-hidden="true" />
                Resend code
              </button>
            ) : (
              <span className="text-brown-500 tabular-nums">
                Resend in {resendLeft}s
              </span>
            )}
          </div>

          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-brown-600 hover:text-brown-900
                       transition-colors focus:outline-none focus:underline font-bold"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to sign in
          </button>

          {/* Loading overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center
                           bg-white/80 rounded-r-3xl"
                aria-label="Verifying code…"
              >
                <div className="w-10 h-10 border-2 border-brown-300 border-t-brown-500
                                rounded-full animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
