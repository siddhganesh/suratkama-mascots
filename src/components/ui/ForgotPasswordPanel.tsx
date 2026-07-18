/**
 * ForgotPasswordPanel
 *
 * Inline forgot-password flow rendered inside the auth card right column.
 * No navigation required — slides in over the form via AnimatePresence.
 *
 * States:
 *   idle    → email input + "Send Reset Link" CTA
 *   loading → spinner
 *   success → envelope animation + instructions
 *
 * A11y:
 *   - aria-live region announces success / error
 *   - Back button restores focus to the login form trigger
 *   - role="status" on success message
 */

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, SendHorizonal, MailCheck } from 'lucide-react'
import { auth, isFirebaseEnabled } from '../../config/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'

interface Props {
  onBack: () => void
  /** Optional initial email pre-filled from the login form */
  initialEmail?: string
}

type PanelState = 'idle' | 'loading' | 'success' | 'error'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function ForgotPasswordPanel({ onBack, initialEmail = '' }: Props) {
  const [email, setEmail]         = useState(initialEmail)
  const [panelState, setPanelState] = useState<PanelState>('idle')
  const [errorMsg, setErrorMsg]   = useState('')
  const backBtnRef = useRef<HTMLButtonElement>(null)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    setPanelState('loading')

    try {
      if (isFirebaseEnabled && auth) {
        await sendPasswordResetEmail(auth, email)
      } else {
        // Mock — simulate network delay
        await new Promise(r => setTimeout(r, 1200))
      }
      setPanelState('success')
    } catch (err: any) {
      // Firebase: auth/user-not-found still shows success (security best practice
      // — don't reveal whether an account exists)
      setPanelState('success')
    }
  }

  return (
    <motion.div
      key="forgot-panel"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28 }}
      className="space-y-6"
    >
      {/* Back button */}
      <button
        ref={backBtnRef}
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white
                   transition-colors focus:outline-none focus:underline -mt-1"
        aria-label="Back to sign in"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to sign in
      </button>

      {/* Heading */}
      <div>
        <h2 className="font-heading font-black text-3xl text-white mb-1">
          Reset Password
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Enter your account email and we'll send a secure reset link.
        </p>
      </div>

      {/* aria-live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {panelState === 'success' && 'Password reset email sent successfully.'}
        {panelState === 'error' && errorMsg}
      </div>

      <AnimatePresence mode="wait">
        {panelState === 'success' ? (
          /* ── Success state ─────────────────────────── */
          <motion.div
            key="success"
            role="status"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-4 space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25
                            flex items-center justify-center
                            shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <MailCheck size={30} className="text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg mb-1">Check your inbox!</p>
              <p className="text-gray-400 text-sm max-w-xs">
                If <span className="text-indigo-light">{email}</span> is linked to an account,
                you'll receive a reset link within a minute.
              </p>
            </div>
            <p className="text-xs text-gray-600">
              Don't see it? Check your spam folder.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="btn-ghost text-sm px-5 py-2.5"
            >
              Back to Sign In
            </button>
          </motion.div>

        ) : (
          /* ── Idle / loading form ────────────────────── */
          <motion.form
            key="form"
            onSubmit={handleSend}
            className="space-y-4"
            noValidate
          >
            <div>
              <label
                htmlFor="forgot-email"
                className="text-xs section-label block mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-hidden="true"
                />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrorMsg('') }}
                  disabled={panelState === 'loading'}
                  aria-describedby={errorMsg ? 'forgot-error' : undefined}
                  aria-invalid={!!errorMsg}
                  className="input-field pl-11"
                />
              </div>

              {/* Inline error */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.p
                    id="forgot-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-xs mt-1.5"
                  >
                    {errorMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <button
              id="forgot-submit-btn"
              type="submit"
              disabled={panelState === 'loading' || !email}
              className="btn-primary w-full py-3.5 text-base"
            >
              {panelState === 'loading' ? (
                <span className="flex items-center gap-2" role="status">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending…
                </span>
              ) : (
                <>
                  <SendHorizonal size={17} aria-hidden="true" />
                  Send Reset Link
                </>
              )}
            </button>

            <p className="text-xs text-gray-600 text-center">
              For security, reset links expire after 1 hour.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
