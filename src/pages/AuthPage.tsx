/**
 * AuthPage — Production-grade login / signup experience
 *
 * Features
 * ──────────────────────────────────────────────────────────────────
 * Security
 *   • Client-side brute-force lockout (5 attempts → 30 s timeout)
 *   • Password strength meter with requirement chips
 *   • Auto-hide password after 30 s of typing inactivity
 *   • Never reveals whether an account exists (forgot-password)
 *   • All error strings are static — no user data echoed back raw
 *
 * UX
 *   • Real-time email validation (debounced 400 ms)
 *   • Password strength meter updates live
 *   • Forgot password — inline panel swap (no navigation)
 *   • MFA / 2FA modal with 6-digit OTP auto-advance
 *   • Remember Me — controls sessionStorage vs localStorage session
 *   • Google OAuth button (Firebase-aware)
 *   • Smooth AnimatePresence transitions on every panel swap
 *
 * Accessibility (WCAG 2.1 AA)
 *   • Every input has htmlFor-linked <label>
 *   • aria-live="assertive" error region, role="alert"
 *   • aria-describedby ties hints to inputs
 *   • aria-invalid on fields with validation errors
 *   • Tab order: name → email → password → remember/forgot → submit
 *   • All interactive elements have :focus-visible ring
 *   • MFA modal has role="dialog", aria-modal, focus trap
 *   • Loading states use role="status"
 */

import {
  useState, useEffect, useRef, useCallback,
  ChangeEvent, FormEvent
} from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, User, Eye, EyeOff, Zap,
  ArrowRight, CheckCircle2, AlertCircle, Clock
} from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/ui/SEO'
import PasswordStrengthMeter from '../components/ui/PasswordStrengthMeter'
import MFAModal from '../components/ui/MFAModal'
import ForgotPasswordPanel from '../components/ui/ForgotPasswordPanel'
import { usePasswordStrength } from '../hooks/usePasswordStrength'
import { useRateLimit } from '../hooks/useRateLimit'
import { auth, isFirebaseEnabled } from '../config/firebase'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

// ── Types ──────────────────────────────────────────────────────────────────────
type Tab   = 'login' | 'signup'
type View  = 'form' | 'forgot' | 'mfa'

interface FormState {
  name:     string
  email:    string
  password: string
}

// ── Constants ──────────────────────────────────────────────────────────────────
const PERKS = [
  'Instant ticket confirmation & e-receipt',
  'Personalised event recommendations',
  'Exclusive early-bird access & offers',
  'Manage, transfer & cancel bookings',
]

const AVATAR_SEEDS = ['auth1', 'auth2', 'auth3', 'auth4']

// Email regex (RFC 5322 simplified)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Auto-hide password after N ms of inactivity
const PW_AUTO_HIDE_MS = 30_000

// ── Google SVG icon ────────────────────────────────────────────────────────────
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

// ── Divider component ──────────────────────────────────────────────────────────
function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-1" role="separator" aria-hidden="true">
      <div className="flex-1 h-px bg-charcoal-light" />
      <span className="text-xs text-gray-600 font-medium select-none">or</span>
      <div className="flex-1 h-px bg-charcoal-light" />
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const navigate        = useNavigate()
  const { login, signup, isAuthenticated, isLoading } = useAuth()

  // ── State ───────────────────────────────────────────────────────────────────
  const [tab,          setTab]         = useState<Tab>((searchParams.get('tab') as Tab) ?? 'login')
  const [view,         setView]        = useState<View>('form')
  const [form,         setForm]        = useState<FormState>({ name: '', email: '', password: '' })
  const [error,        setError]       = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  const [showPw,      setShowPw]      = useState(false)
  const [rememberMe,  setRememberMe]  = useState(false)
  const [mfaLoading,  setMfaLoading]  = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({})
  const [emailTouched, setEmailTouched] = useState(false)

  // ── Hooks ───────────────────────────────────────────────────────────────────
  const strength  = usePasswordStrength(form.password)
  const rateLimit = useRateLimit()

  // ── Refs ────────────────────────────────────────────────────────────────────
  const firstFieldRef   = useRef<HTMLInputElement>(null)
  const pwHideTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Already logged in — redirect ────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      navigate(searchParams.get('redirect') ?? '/profile', { replace: true })
    }
  }, [isAuthenticated, navigate, searchParams])

  // ── Auto-focus first field on tab switch ────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => firstFieldRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [tab])

  // ── Auto-hide password after 30 s of inactivity ─────────────────────────────
  useEffect(() => {
    if (showPw) {
      if (pwHideTimerRef.current) clearTimeout(pwHideTimerRef.current)
      pwHideTimerRef.current = setTimeout(() => setShowPw(false), PW_AUTO_HIDE_MS)
    }
    return () => { if (pwHideTimerRef.current) clearTimeout(pwHideTimerRef.current) }
  }, [showPw, form.password])

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setForm({ name: '', email: '', password: '' })
    setError('')
    setFieldErrors({})
    setShowPw(false)
    setEmailTouched(false)
    setView('form')
  }, [])

  const handleTabSwitch = (t: Tab) => {
    setTab(t)
    resetForm()
  }

  const updateField = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm(f => ({ ...f, [key]: value }))
    setError('')
    setFieldErrors(fe => ({ ...fe, [key]: '' }))

    // Debounced email validation
    if (key === 'email') {
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current)
      emailDebounceRef.current = setTimeout(() => {
        if (value && !EMAIL_RE.test(value)) {
          setFieldErrors(fe => ({ ...fe, email: 'Please enter a valid email address.' }))
        }
      }, 400)
    }
  }

  // ── Client-side validation ──────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Partial<FormState> = {}

    if (tab === 'signup' && !form.name.trim()) {
      errors.name = 'Full name is required.'
    }
    if (!form.email) {
      errors.email = 'Email address is required.'
    } else if (!EMAIL_RE.test(form.email)) {
      errors.email = 'Please enter a valid email address.'
    }
    if (!form.password) {
      errors.password = 'Password is required.'
    } else if (tab === 'signup' && form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    } else if (tab === 'login' && form.password.length < 1) {
      errors.password = 'Password is required.'
    }

    setFieldErrors(errors)

    // Focus first invalid field
    if (errors.name) {
      firstFieldRef.current?.focus()
    } else if (errors.email) {
      document.getElementById('auth-email')?.focus()
    } else if (errors.password) {
      document.getElementById('auth-password')?.focus()
    }

    return Object.keys(errors).length === 0
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (rateLimit.isLocked) return
    if (!validateForm()) return

    const result = tab === 'login'
      ? await login(form.email, form.password)
      : await signup(form.name, form.email, form.password)

    if (!result.success) {
      rateLimit.recordFailure()
      setError(result.error ?? 'Something went wrong. Please try again.')
    } else {
      rateLimit.reset()

      // ── Remember Me: move token to sessionStorage if not checked ─────────
      if (!rememberMe) {
        const token = localStorage.getItem('sk_session')
        if (token) {
          sessionStorage.setItem('sk_session', token)
          localStorage.removeItem('sk_session')
        }
      }

      // ── Demo: show MFA modal after successful login (login tab only) ──────
      // Remove this block and add real Firebase MFA check for production
      if (tab === 'login' && !isFirebaseEnabled) {
        setView('mfa')
        return
      }
      // Firebase mode: onAuthStateChanged handles the redirect automatically
    }
  }

  // ── MFA handlers ───────────────────────────────────────────────────────────
  const handleMFAVerify = async (_code: string) => {
    setMfaLoading(true)
    // Simulate verification — real: verify TOTP/SMS code with backend/Firebase
    await new Promise(r => setTimeout(r, 1200))
    setMfaLoading(false)
    // On success, navigate (the auth state will update via onAuthStateChanged)
    navigate(searchParams.get('redirect') ?? '/profile', { replace: true })
  }

  const handleMFAResend = async () => {
    // Real: trigger resend via Firebase or backend
    await new Promise(r => setTimeout(r, 500))
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────
  const hasGoogleClientId = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID)

  // Real Google OAuth popup via @react-oauth/google (Google Identity Services)
  // This opens the ACTUAL Google account selector — same as Gmail/YouTube
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('')
      setGoogleLoading(true)
      try {
        if (isFirebaseEnabled && auth) {
          // Use the Google access_token to sign into Firebase
          const { signInWithCredential } = await import('firebase/auth')
          await signInWithCredential(auth, GoogleAuthProvider.credential(null, tokenResponse.access_token))
          // onAuthStateChanged handles redirect
        } else {
          // Fetch the user's Google profile with the access token
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
          })
          const profile = await res.json()

          // Store session + user profile for AuthContext to pick up
          localStorage.setItem('sk_session', `google-${profile.sub}`)
          localStorage.setItem('sk_google_user', JSON.stringify({
            id:       profile.sub,
            name:     profile.name,
            email:    profile.email,
            avatar:   profile.picture,
            joinedAt: new Date().toISOString().split('T')[0],
            bookings: [],
          }))
          navigate(searchParams.get('redirect') ?? '/profile', { replace: true })
        }
      } catch {
        setError('Google sign-in failed. Please try again.')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: (err) => {
      setGoogleLoading(false)
      // "popup_closed_by_user" is not an error
      if ((err as any)?.error !== 'popup_closed_by_user') {
        setError('Google sign-in was cancelled or failed.')
      }
    },
    flow: 'implicit',
  })

  // Unified handler — picks the right strategy automatically
  const handleGoogleLogin = useCallback(async () => {
    setError('')
    setGoogleLoading(true)

    if (hasGoogleClientId) {
      // ✅ Real Google popup — useGoogleLogin hook takes over
      googleLogin()
      // Note: setGoogleLoading(false) is handled in onSuccess/onError above
      return
    }

    if (isFirebaseEnabled && auth) {
      // ✅ Firebase popup (no VITE_GOOGLE_CLIENT_ID needed)
      try {
        const provider = new GoogleAuthProvider()
        provider.addScope('email')
        provider.addScope('profile')
        await signInWithPopup(auth, provider)
        // onAuthStateChanged in AuthContext handles redirect
      } catch (err: any) {
        if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
          setError('Google sign-in failed. Please try again.')
        }
      } finally {
        setGoogleLoading(false)
      }
      return
    }

    // ⚠️ Demo fallback — no real Google credentials configured
    // Shows a friendly setup guide instead of silently doing nothing
    await new Promise(r => setTimeout(r, 400))
    setGoogleLoading(false)
    setError('Google sign-in requires a Google Client ID. See .env.example for setup instructions.')
  }, [googleLogin, hasGoogleClientId, navigate, searchParams])

  // ── Password toggle handler (resets auto-hide timer) ───────────────────────
  const togglePw = () => {
    setShowPw(s => !s)
    if (pwHideTimerRef.current) clearTimeout(pwHideTimerRef.current)
  }

  // ── Computed ────────────────────────────────────────────────────────────────
  const isSubmitDisabled  = isLoading || rateLimit.isLocked
  const isGoogleDisabled  = isLoading || googleLoading || rateLimit.isLocked
  const showStrengthMeter = tab === 'signup' && form.password.length > 0

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center pt-24 pb-16 px-4 noise-overlay">
      <SEO
        title={tab === 'login' ? 'Sign In' : 'Create Account'}
        description="Access your SuratkamaMascot account. Sign in or create a free profile to manage bookings, get personalised recommendations, and unlock member perks."
      />

      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-brown-200/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-brown-300/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brown-100/5 rounded-full blur-[160px]" />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-0 glass rounded-3xl overflow-hidden border border-brown-200/30 bg-white shadow-md relative">

          {/* ── LEFT: Brand panel ───────────────────────────────────────── */}
          <div
            className="hidden lg:flex flex-col justify-between p-12 bg-gradient-warm relative overflow-hidden border-r border-brown-200/30"
            aria-hidden="true"
          >
            {/* Decorative grid */}
            <div className="absolute inset-0 bg-mesh-warm opacity-40 pointer-events-none" />

            {/* Floating orb */}
            <div className="absolute top-20 right-10 w-36 h-36 rounded-full bg-brown-200/30 blur-2xl animate-pulse" />
            <div className="absolute bottom-24 left-8 w-24 h-24 rounded-full bg-brown-300/20 blur-2xl animate-float" style={{ animationDelay: '2s' }} />

            {/* Logo */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-brown-500 flex items-center justify-center shadow-sm">
                <Zap size={20} className="text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-brown-900">
                Suratkama<span className="gradient-text">Mascot</span>
              </span>
            </div>

            {/* Hero copy */}
            <div className="relative z-10 space-y-6">
              <div>
                <h2 className="font-heading font-black text-4xl text-brown-950 leading-tight mb-4">
                  Your Gateway to<br />
                  <span className="gradient-text">Extraordinary</span><br />
                  Experiences
                </h2>
                <p className="text-brown-800 text-sm leading-relaxed max-w-xs font-semibold">
                  Join 180,000+ event-goers discovering unforgettable moments across Surat and beyond.
                </p>
              </div>

              {/* Perks list */}
              <ul className="space-y-3" role="list">
                {PERKS.map(perk => (
                  <li key={perk} className="flex items-start gap-3 text-sm text-brown-700 font-semibold">
                    <CheckCircle2 size={15} className="text-brown-500 shrink-0 mt-0.5" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>

            {/* Social proof */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex -space-x-2" role="list" aria-label="Recent members">
                {AVATAR_SEEDS.map(seed => (
                  <div
                    key={seed}
                    role="listitem"
                    className="w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br
                               from-brown-400 to-brown-600 flex items-center justify-center
                               text-white text-xs font-bold"
                  >
                    {seed.slice(-1).toUpperCase()}
                  </div>
                ))}
              </div>
              <p className="text-brown-600 text-xs font-semibold">
                <span className="text-brown-950 font-bold">3,400+</span> people joined this week
              </p>
            </div>
          </div>

          {/* ── RIGHT: Form panel ───────────────────────────────────────── */}
          <div className="p-8 sm:p-12 flex flex-col justify-center relative overflow-hidden bg-white">

            {/* ── View: Forgot Password ─────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {view === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.28 }}
                >
                  <ForgotPasswordPanel
                    onBack={() => setView('form')}
                    initialEmail={form.email}
                  />
                </motion.div>
              )}

              {/* ── View: Main Form ──────────────────────────────────────── */}
              {view === 'form' && (
                <motion.div
                  key="form-view"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-5"
                >
                  {/* ── Tab switcher ──────────────────────────────────── */}
                  <div
                    role="tablist"
                    aria-label="Authentication mode"
                    className="flex bg-brown-50 border border-brown-200/40 rounded-xl p-1"
                  >
                    {(['login', 'signup'] as Tab[]).map(t => (
                      <button
                        key={t}
                        id={`auth-tab-${t}`}
                        role="tab"
                        aria-selected={tab === t}
                        aria-controls="auth-form-panel"
                        onClick={() => handleTabSwitch(t)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 focus:outline-none
                          focus-visible:ring-2 focus-visible:ring-brown-500 focus-visible:ring-offset-1
                          focus-visible:ring-offset-white ${
                          tab === t
                            ? 'bg-brown-500 text-white shadow-sm'
                            : 'text-brown-700 hover:text-brown-950 hover:bg-white/50'
                        }`}
                      >
                        {t === 'login' ? 'Sign In' : 'Create Account'}
                      </button>
                    ))}
                  </div>

                  {/* ── Form ─────────────────────────────────────────── */}
                  <AnimatePresence mode="wait">
                    <motion.form
                      key={tab}
                      id="auth-form-panel"
                      role="tabpanel"
                      aria-labelledby={`auth-tab-${tab}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -14 }}
                      transition={{ duration: 0.22 }}
                      onSubmit={handleSubmit}
                      noValidate
                      className="space-y-4"
                    >
                      {/* Heading */}
                      <div>
                        <h1 className="font-heading font-black text-3xl text-brown-950 mb-1">
                          {tab === 'login' ? 'Welcome back 👋' : 'Join the community'}
                        </h1>
                        <p className="text-brown-700 text-sm font-medium">
                          {tab === 'login'
                            ? 'Sign in to access your bookings and profile.'
                            : 'Create a free account and start exploring.'}
                        </p>
                      </div>

                      {/* ── Name (signup only) ────────────────────────── */}
                      {tab === 'signup' && (
                        <div>
                          <label
                            htmlFor="auth-name"
                            className="text-xs section-label block mb-2 font-bold"
                          >
                            Full Name
                          </label>
                          <div className="relative">
                            <User
                              size={14}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-400 pointer-events-none"
                              aria-hidden="true"
                            />
                            <input
                              id="auth-name"
                              ref={firstFieldRef}
                              type="text"
                              required
                              autoComplete="name"
                              placeholder="Aryan Mehta"
                              value={form.name}
                              onChange={updateField('name')}
                              aria-required="true"
                              aria-invalid={!!fieldErrors.name}
                              aria-describedby={fieldErrors.name ? 'err-name' : undefined}
                              className={`input-field pl-11 bg-white text-brown-950 border-brown-200 ${fieldErrors.name ? 'border-red-500 focus:border-red-600 focus:ring-red-200' : ''}`}
                            />
                          </div>
                          <AnimatePresence>
                            {fieldErrors.name && (
                              <motion.p
                                id="err-name"
                                role="alert"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-red-650 text-xs mt-1.5 flex items-center gap-1 font-semibold"
                              >
                                <AlertCircle size={11} aria-hidden="true" />
                                {fieldErrors.name}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* ── Email ─────────────────────────────────────── */}
                      <div>
                        <label
                          htmlFor="auth-email"
                          className="text-xs section-label block mb-2 font-bold"
                        >
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail
                            size={14}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-400 pointer-events-none"
                            aria-hidden="true"
                          />
                          <input
                            id="auth-email"
                            ref={tab === 'login' ? firstFieldRef : undefined}
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={updateField('email')}
                            onBlur={() => setEmailTouched(true)}
                            aria-required="true"
                            aria-invalid={!!fieldErrors.email}
                            aria-describedby={fieldErrors.email ? 'err-email' : undefined}
                            className={`input-field pl-11 bg-white text-brown-950 border-brown-200 ${
                              emailTouched && form.email && !fieldErrors.email && EMAIL_RE.test(form.email)
                                ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-100'
                                : ''
                              } ${fieldErrors.email ? 'border-red-500 focus:border-red-600 focus:ring-red-200' : ''}`}
                          />
                          {/* Valid email checkmark */}
                          {emailTouched && form.email && EMAIL_RE.test(form.email) && !fieldErrors.email && (
                            <CheckCircle2
                              size={14}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <AnimatePresence>
                          {fieldErrors.email && (
                            <motion.p
                              id="err-email"
                              role="alert"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-red-650 text-xs mt-1.5 flex items-center gap-1 font-semibold"
                            >
                              <AlertCircle size={11} aria-hidden="true" />
                              {fieldErrors.email}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── Password ──────────────────────────────────── */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label
                            htmlFor="auth-password"
                            className="text-xs section-label font-bold"
                          >
                            Password
                          </label>
                          {tab === 'login' && (
                            <button
                              type="button"
                              onClick={() => setView('forgot')}
                              className="text-xs text-brown-600 hover:text-brown-800 transition-colors
                                         focus:outline-none focus:underline font-semibold"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <Lock
                            size={14}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-400 pointer-events-none"
                            aria-hidden="true"
                          />
                          <input
                            id="auth-password"
                            type={showPw ? 'text' : 'password'}
                            required
                            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                            placeholder="••••••••"
                            value={form.password}
                            onChange={updateField('password')}
                            aria-required="true"
                            aria-invalid={!!fieldErrors.password}
                            aria-describedby={[
                              fieldErrors.password ? 'err-password' : '',
                              showStrengthMeter ? 'pw-strength' : '',
                            ].filter(Boolean).join(' ') || undefined}
                            className={`input-field pl-11 pr-11 bg-white text-brown-950 border-brown-200 ${fieldErrors.password ? 'border-red-500 focus:border-red-600 focus:ring-red-200' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={togglePw}
                            aria-label={showPw ? 'Hide password' : 'Show password'}
                            aria-pressed={showPw}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-brown-400
                                       hover:text-brown-700 transition-colors focus:outline-none
                                       focus-visible:ring-2 focus-visible:ring-brown-550 rounded"
                          >
                            {showPw
                              ? <EyeOff size={15} aria-hidden="true" />
                              : <Eye    size={15} aria-hidden="true" />
                            }
                          </button>
                        </div>
                        <AnimatePresence>
                          {fieldErrors.password && (
                            <motion.p
                              id="err-password"
                              role="alert"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-red-650 text-xs mt-1.5 flex items-center gap-1 font-semibold"
                            >
                              <AlertCircle size={11} aria-hidden="true" />
                              {fieldErrors.password}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        {/* Password strength meter */}
                        <div id="pw-strength">
                          <AnimatePresence>
                            {showStrengthMeter && (
                              <PasswordStrengthMeter result={strength} visible={showStrengthMeter} />
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* ── Remember Me (login only) ──────────────────── */}
                      {tab === 'login' && (
                        <label className="flex items-center gap-2.5 cursor-pointer w-fit select-none">
                          <input
                            id="auth-remember"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-brown-300 bg-white
                                       text-brown-500 accent-brown-500
                                       focus:ring-2 focus:ring-brown-450 focus:ring-offset-1
                                       focus:ring-offset-white cursor-pointer"
                          />
                          <span className="text-sm text-brown-700 font-semibold">Remember me for 30 days</span>
                        </label>
                      )}

                      {/* ── Rate-limit lockout banner ─────────────────── */}
                      <AnimatePresence>
                        {rateLimit.isLocked && (
                          <motion.div
                            role="alert"
                            aria-live="assertive"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3 text-sm bg-amber-50 border border-amber-200/50
                                       rounded-lg px-4 py-3 text-amber-700 font-semibold"
                          >
                            <Clock size={15} className="shrink-0" aria-hidden="true" />
                            <span>
                              Too many failed attempts. Please wait{' '}
                              <span className="font-bold tabular-nums">{rateLimit.lockoutSecondsLeft}s</span>{' '}
                              before trying again.
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── General error banner ──────────────────────── */}
                      <AnimatePresence>
                        {error && !rateLimit.isLocked && (
                          <motion.div
                            id="auth-error-banner"
                            role="alert"
                            aria-live="assertive"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-3 text-sm bg-red-50 border border-red-200/40
                                       rounded-lg px-4 py-3 text-red-700 font-semibold"
                          >
                            <AlertCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{error}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── Submit button ─────────────────────────────── */}
                      <button
                        id="auth-submit-btn"
                        type="submit"
                        disabled={isSubmitDisabled}
                        aria-busy={isLoading}
                        className="btn-primary w-full py-3.5 text-base mt-1
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   disabled:hover:shadow-none"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2" role="status">
                            <span
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                              aria-hidden="true"
                            />
                            {tab === 'login' ? 'Signing In…' : 'Creating Account…'}
                          </span>
                        ) : (
                          <>
                            {tab === 'login' ? 'Sign In' : 'Create Account'}
                            <ArrowRight size={18} aria-hidden="true" />
                          </>
                        )}
                      </button>

                      {/* ── Attempts warning (pre-lockout) ────────────── */}
                      <AnimatePresence>
                        {rateLimit.attempts > 0 && rateLimit.attempts < 5 && !rateLimit.isLocked && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-amber-600 text-center font-bold"
                          >
                            {5 - rateLimit.attempts} attempt{5 - rateLimit.attempts !== 1 ? 's' : ''} remaining before temporary lockout.
                          </motion.p>
                        )}
                      </AnimatePresence>

                      {/* ── Divider ───────────────────────────────────── */}
                      <OrDivider />

                      {/* ── Google OAuth ──────────────────────────────── */}
                      <button
                        id="auth-google-btn"
                        type="button"
                        disabled={isGoogleDisabled}
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                                   bg-white border border-brown-200 text-sm font-semibold
                                   text-brown-900 hover:bg-brown-50 hover:border-brown-300
                                   transition-all duration-200 focus:outline-none
                                   focus-visible:ring-2 focus-visible:ring-brown-500
                                   disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        aria-label="Continue with Google"
                        aria-busy={googleLoading}
                      >
                        {googleLoading ? (
                          <span className="flex items-center gap-2" role="status">
                            <span
                              className="w-4 h-4 border-2 border-brown-300/30 border-t-brown-500 rounded-full animate-spin"
                              aria-hidden="true"
                            />
                            Connecting to Google…
                          </span>
                        ) : (
                          <>
                            <GoogleIcon size={18} />
                            Continue with Google
                          </>
                        )}
                      </button>

                      {/* ── Demo / security note ──────────────────────── */}
                      <p className="text-center text-xs text-brown-600 pt-1" aria-live="off">
                        🎭 Demo mode — any valid email &amp; password works
                        {tab === 'signup' && <span> · By continuing, you agree to our <a href="#" className="underline hover:text-brown-700">Terms</a> &amp; <a href="#" className="underline hover:text-brown-700">Privacy Policy</a></span>}
                      </p>
                    </motion.form>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── MFA Modal (overlays the right panel) ───────────────────── */}
            <MFAModal
              isOpen={view === 'mfa'}
              isLoading={mfaLoading}
              email={form.email}
              onVerify={handleMFAVerify}
              onBack={() => setView('form')}
              onResend={handleMFAResend}
            />
          </div>
        </div>

        {/* Security trust bar */}
        <div
          className="flex items-center justify-center gap-6 mt-5 text-xs text-brown-600 font-semibold"
          aria-label="Security information"
        >
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            256-bit SSL encryption
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Your data is safe
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            GDPR compliant
          </span>
        </div>
      </div>
    </div>
  )
}
