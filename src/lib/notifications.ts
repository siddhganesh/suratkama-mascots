import emailjs from '@emailjs/browser'

interface SendNotificationOptions {
  userName: string
  userPhone: string
  userEmail: string
  mascotNames: string
  date: string
  timeSlot: string
  venueAddress: string
  functionType: string
  totalPrice: number
  confirmationCode: string
  paymentId: string
}

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   SuratKama Mascots — EmailJS Notification System               ║
 * ║   100% FREE — 200 emails/month via emailjs.com                  ║
 * ║                                                                  ║
 * ║   Sends 2 emails on every booking:                              ║
 * ║     1. Client  → Booking confirmation with all details          ║
 * ║     2. Owner   → New booking alert with customer info           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
export async function sendFrontendNotifications(options: SendNotificationOptions) {
  const {
    userName,
    userPhone,
    userEmail,
    mascotNames,
    date,
    timeSlot,
    venueAddress,
    functionType,
    totalPrice,
    confirmationCode,
    paymentId,
  } = options

  const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID  ?? ''
  const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  ?? ''
  const clientTpl  = import.meta.env.VITE_EMAILJS_TEMPLATE_CLIENT ?? ''
  const ownerTpl   = import.meta.env.VITE_EMAILJS_TEMPLATE_OWNER  ?? ''
  const ownerEmail = import.meta.env.VITE_OWNER_EMAIL ?? 'siddhganesh09@gmail.com'

  if (!serviceId || !publicKey) {
    console.warn('⚠️ EmailJS keys not configured — skipping email notifications.')
    return
  }

  // Initialise once (safe to call multiple times)
  emailjs.init({ publicKey })

  const amountStr = `₹${totalPrice.toLocaleString('en-IN')}`

  // ── Shared template params ────────────────────────────────────────────────────
  const sharedParams = {
    mascot_name:       mascotNames,
    booking_date:      date,
    time_slot:         timeSlot,
    venue_address:     venueAddress,
    function_type:     functionType,
    total_price:       amountStr,
    confirmation_code: confirmationCode,
    payment_id:        paymentId || 'N/A',
  }

  const tasks: Promise<void>[] = []

  // ── 1. Email to CLIENT ────────────────────────────────────────────────────────
  if (userEmail && clientTpl) {
    tasks.push(
      emailjs.send(serviceId, clientTpl, {
        ...sharedParams,
        to_name:  userName,
        to_email: userEmail,
        customer_phone: userPhone || 'Not provided',
      })
      .then(() => console.log('✅ Confirmation email sent to client:', userEmail))
      .catch((err) => console.error('❌ Client email failed:', err?.text ?? err))
    )
  }

  // ── 2. Alert email to OWNER ───────────────────────────────────────────────────
  if (ownerTpl) {
    tasks.push(
      emailjs.send(serviceId, ownerTpl, {
        ...sharedParams,
        to_name:        'SuratKama Owner',
        to_email:       ownerEmail,
        customer_name:  userName,
        customer_phone: userPhone || 'Not provided',
        customer_email: userEmail || 'Not provided',
      })
      .then(() => console.log('✅ New booking alert sent to owner:', ownerEmail))
      .catch((err) => console.error('❌ Owner email failed:', err?.text ?? err))
    )
  }

  await Promise.allSettled(tasks)
  console.log(`🎉 All notifications dispatched for booking ${confirmationCode}`)
}
