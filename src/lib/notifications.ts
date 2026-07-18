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
 * Sends booking notifications (SMS + Email) directly from the browser using standard fetch API.
 * This acts as a 100% free backup if the Firebase project is on the free Spark plan
 * (which doesn't support deploying backend Cloud Functions).
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

  const amountStr = `₹${totalPrice.toLocaleString('en-IN')}`
  const ownerPhoneNo = '6353046419'

  // SMS text templates
  const clientSMS = `🎭 SuratKama Mascots\nBooking CONFIRMED! ✅\nCode: ${confirmationCode}\nMascot: ${mascotNames}\nDate: ${date}\nTime: ${timeSlot}\nVenue: ${venueAddress}\nTotal Paid: ${amountStr}\nFor queries: +91 6353046419\nThank you! 🎉`
  const ownerSMS = `🚨 NEW BOOKING ALERT!\n━━━━━━━━━━━━━━━━━━━━\nFrom: ${userName}\nPhone: ${userPhone || 'N/A'}\nMascot: ${mascotNames}\nDate: ${date}\nTime: ${timeSlot}\nVenue: ${venueAddress}\nAmount: ${amountStr}\nCode: ${confirmationCode}\nPayment ID: ${paymentId}`

  // ── 1. Fast2SMS Integration (Direct HTTP Trigger via CORS Proxy) ───────────
  const fast2smsApiKey = import.meta.env.VITE_FAST2SMS_KEY ?? ''
  if (fast2smsApiKey) {
    try {
      const cleanClientPhone = userPhone.replace(/[\s\-+]/g, '').replace(/^91/, '')
      const cleanOwnerPhone = ownerPhoneNo.replace(/[\s\-+]/g, '').replace(/^91/, '')

      // Send to Client
      if (cleanClientPhone) {
        const clientUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsApiKey}&route=q&message=${encodeURIComponent(clientSMS)}&language=english&flash=0&numbers=${cleanClientPhone}`
        await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(clientUrl)}`)
        console.log('✅ Client SMS notification sent successfully!')
      }

      // Send to Owner
      const ownerUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsApiKey}&route=q&message=${encodeURIComponent(ownerSMS)}&language=english&flash=0&numbers=${cleanOwnerPhone}`
      await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(ownerUrl)}`)
      console.log('✅ Owner SMS notification sent successfully!')
    } catch (err: any) {
      console.error('❌ Failed to dispatch SMS via frontend:', err.message)
    }
  }

  // ── 2. EmailJS Integration (Free client-side emails without credentials) ────
  const emailjsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID ?? ''
  const emailjsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? ''
  const emailjsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? ''

  if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: emailjsServiceId,
          template_id: emailjsTemplateId,
          user_id: emailjsPublicKey,
          template_params: {
            to_name: userName,
            to_email: userEmail,
            mascot_name: mascotNames,
            booking_date: date,
            time_slot: timeSlot,
            venue_address: venueAddress,
            function_type: functionType,
            total_price: amountStr,
            confirmation_code: confirmationCode,
            payment_id: paymentId,
          }
        })
      })
      if (response.ok) {
        console.log('✅ Confirmation email sent successfully via EmailJS!')
      } else {
        const text = await response.text()
        console.warn('⚠️ EmailJS responded with error:', text)
      }
    } catch (err: any) {
      console.error('❌ Failed to dispatch email via EmailJS:', err.message)
    }
  }
}
