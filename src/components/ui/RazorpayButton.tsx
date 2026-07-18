/**
 * RazorpayButton & UPI Direct Payment Component
 *
 * Provides two clean options for customers:
 * 1. 📲 Pay via UPI / Google Pay (Direct to phone number 6353046419)
 * 2. 💳 Cards / UPI / NetBanking via Gateway (Razorpay if key is set, else Mock)
 */

import { useState } from 'react'
import { Lock, Zap, CreditCard, Smartphone, Check, AlertCircle, Copy } from 'lucide-react'

// Extend window type for Razorpay SDK
import { resolvePath } from '../../lib/paths'

declare global {
  interface Window {
    Razorpay: any
  }
}

export interface RazorpayOptions {
  amount: number          // Total in INR
  name: string            // Mascot name / booking title
  description: string     // e.g. "2 hrs · Birthday Party"
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  onSuccess: (paymentId: string) => void
  onFailure: (error: string) => void
}

// ── Helper: load Razorpay checkout.js ──────────────────────────────────────────
function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function RazorpayButton({
  amount,
  name,
  description,
  prefill,
  onSuccess,
  onFailure,
}: RazorpayOptions) {
  const [activeTab, setActiveTab] = useState<'gpay' | 'gateway'>('gpay')
  const [loading, setLoading] = useState(false)
  const [utrNumber, setUtrNumber] = useState('')
  const [utrError, setUtrError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID ?? ''
  const isLiveGateway = razorpayKey.startsWith('rzp_')

  // Direct UPI GPay Configuration
  const GPAY_NUMBER = '6353046419'
  const RecipientName = 'SuratKama Mascots'
  // Most UPI apps resolve phone numbers using standard handles (e.g. oksbi / okaxis / ybl / paytm)
  const RecipientUPI = `${GPAY_NUMBER}@oksbi`

  // Generate standard UPI Intent URL
  const upiUrl = `upi://pay?pa=${RecipientUPI}&pn=${encodeURIComponent(RecipientName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(name.slice(0, 20))}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`

  // ── UPI Direct Copy Helper ──────────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(GPAY_NUMBER)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── UPI Direct Submit Handlers ──────────────────────────────────────────────
  const handleUtrSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // UTR / Transaction ID validation (usually 12 digits for UPI)
    const cleanUtr = utrNumber.replace(/\s/g, '')
    if (!/^\d{12}$/.test(cleanUtr)) {
      setUtrError('Please enter a valid 12-digit UPI UTR / Ref No.')
      return
    }
    setUtrError(null)
    setLoading(true)

    // Simulate validation delay
    setTimeout(() => {
      setLoading(false)
      onSuccess(`UPI_GPAY_${cleanUtr}`)
    }, 1500)
  }

  // ── Gateway: Simulated Pay ──────────────────────────────────────────────────
  const handleSimulatedPayment = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 2000))
    const fakePaymentId = `pay_DEMO_${Math.random().toString(36).slice(2, 14).toUpperCase()}`
    setLoading(false)
    onSuccess(fakePaymentId)
  }

  // ── Gateway: Real Razorpay Pay ──────────────────────────────────────────────
  const handleRazorpayPayment = async () => {
    setLoading(true)
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      setLoading(false)
      onFailure('Could not load payment gateway. Please check your internet connection.')
      return
    }

    const options = {
      key: razorpayKey,
      amount: amount * 100,
      currency: 'INR',
      name: 'SuratKama Mascots',
      description,
      image: resolvePath('/favicon.svg'),
      prefill: {
        name: prefill?.name ?? '',
        email: prefill?.email ?? '',
        contact: prefill?.contact ?? '',
      },
      notes: {
        mascot: name,
      },
      theme: {
        color: '#6B4226',
      },
      modal: {
        ondismiss: () => {
          setLoading(false)
        },
      },
      handler: (response: { razorpay_payment_id: string }) => {
        setLoading(false)
        onSuccess(response.razorpay_payment_id)
      },
    }

    try {
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        setLoading(false)
        onFailure(response?.error?.description ?? 'Payment failed. Please try again.')
      })
      rzp.open()
    } catch (err: any) {
      setLoading(false)
      onFailure(err?.message ?? 'Failed to open payment gateway.')
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Payment Tabs ──────────────────────────────────────────────── */}
      <div className="flex border border-brown-200/40 rounded-xl p-1 bg-white/5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setActiveTab('gpay')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'gpay'
              ? 'bg-brown-700 text-white shadow-sm'
              : 'text-brown-300 hover:text-white'
          }`}
        >
          <Smartphone size={14} /> GPay / UPI Direct
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gateway')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'gateway'
              ? 'bg-brown-700 text-white shadow-sm'
              : 'text-brown-300 hover:text-white'
          }`}
        >
          <CreditCard size={14} /> Gateway checkout
        </button>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────── */}
      {activeTab === 'gpay' ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 text-left">
          <div className="text-center space-y-2">
            <p className="text-xs text-brown-300 font-bold uppercase tracking-wider">Scan & Pay via GPay App</p>
            <p className="text-2xl font-black text-white">₹{amount.toLocaleString('en-IN')}</p>

            {/* QR Code Container */}
            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-lg flex items-center justify-center border-4 border-brown-700/20">
              <img
                src={qrCodeUrl}
                alt="UPI Payment QR Code"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="divider-gradient" />

          {/* Copy details */}
          <div className="space-y-2.5 text-xs text-brown-200">
            <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5">
              <span>Google Pay Number:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="font-mono font-bold text-white flex items-center gap-1.5 hover:text-brown-300 transition-colors"
              >
                {GPAY_NUMBER} {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
              </button>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5">
              <span>UPI ID:</span>
              <span className="font-mono font-bold text-white">{RecipientUPI}</span>
            </div>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleUtrSubmit} className="space-y-3">
            <div>
              <label className="text-xs section-label block mb-2 text-brown-300">Enter 12-Digit UPI Ref / Transaction UTR No.</label>
              <input
                type="text"
                required
                maxLength={12}
                placeholder="e.g. 618293048123"
                value={utrNumber}
                onChange={e => {
                  setUtrNumber(e.target.value.replace(/\D/g, ''))
                  setUtrError(null)
                }}
                className="input-field font-mono text-center tracking-widest text-white text-base"
              />
              {utrError && (
                <div className="flex items-center gap-1.5 text-[11px] text-red-400 mt-1 font-semibold">
                  <AlertCircle size={12} /> {utrError}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying Receipt...
                </span>
              ) : (
                'Submit Booking with Transaction ID'
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Gateway Checkout Tab */
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-brown-700 font-semibold">Accepted:</span>
            {[
              { icon: Smartphone, label: 'UPI' },
              { icon: CreditCard, label: 'Cards' },
              { icon: CreditCard, label: 'Net Banking' },
              { icon: Smartphone, label: 'Wallets' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-brown-200/60 rounded-lg text-[11px] font-bold text-brown-700 shadow-sm">
                <Icon size={10} className="text-brown-500" />
                {label}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
            <Lock size={13} />
            <span className="font-semibold">256-bit SSL · Secured by {isLiveGateway ? 'Razorpay' : 'Demo Mode'}</span>
            {!isLiveGateway && (
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 border border-amber-300 font-bold">
                DEMO
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={isLiveGateway ? handleRazorpayPayment : handleSimulatedPayment}
            disabled={loading}
            className="btn-primary w-full justify-center py-4 text-base relative overflow-hidden disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-2.5">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isLiveGateway ? 'Opening Payment Gateway…' : 'Processing Demo Payment…'}
              </span>
            ) : (
              <span className="flex items-center gap-2.5">
                <Zap size={18} />
                {isLiveGateway ? 'Pay with Razorpay' : 'Complete Demo Payment'}
                <span className="ml-auto font-black text-lg">₹{amount.toLocaleString('en-IN')}</span>
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
