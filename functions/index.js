/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   SuratKama Mascots — Firebase Cloud Functions                  ║
 * ║   Triggers on new booking → sends SMS to client + owner        ║
 * ║                                                                  ║
 * ║   SMS Provider: Fast2SMS (free credits on signup, ₹0.15/SMS)   ║
 * ║   Email Backup: Nodemailer via Gmail (100% free)                ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * SETUP (one-time, run in terminal):
 *   firebase functions:config:set fast2sms.key="YOUR_FAST2SMS_API_KEY"
 *   firebase functions:config:set gmail.user="your.gmail@gmail.com"
 *   firebase functions:config:set gmail.pass="your_16_char_app_password"
 *   firebase functions:config:set owner.phone="6353046419"
 *   firebase functions:config:set owner.email="your_email@gmail.com"
 *
 * DEPLOY:
 *   cd functions && npm install
 *   firebase deploy --only functions
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { setGlobalOptions }  = require('firebase-functions/v2')
const { defineSecret }      = require('firebase-functions/params')
const admin                 = require('firebase-admin')
const axios                 = require('axios')
const nodemailer            = require('nodemailer')

// Initialize Firebase Admin
admin.initializeApp()

// ── Set region to closest (Mumbai = asia-south1) for low latency ────────────
setGlobalOptions({ region: 'asia-south1', maxInstances: 10 })

// ── Secret parameters (stored encrypted in Firebase) ─────────────────────────
const fast2smsKey   = defineSecret('FAST2SMS_KEY')
const gmailUser     = defineSecret('GMAIL_USER')
const gmailPass     = defineSecret('GMAIL_PASS')
const ownerPhone    = defineSecret('OWNER_PHONE')
const ownerEmail    = defineSecret('OWNER_EMAIL')

// ── Helper: Format time for display ──────────────────────────────────────────
function formatHour(h) {
  if (h === 12) return '12:00 PM'
  if (h > 12)   return `${h - 12}:00 PM`
  return `${h}:00 AM`
}

// ── Helper: Format date for display ──────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

// ── Helper: Send SMS via Fast2SMS ─────────────────────────────────────────────
async function sendSMS(apiKey, phone, message) {
  try {
    // Clean phone number (remove +91, spaces, dashes)
    const cleanPhone = String(phone).replace(/[\s\-+]/g, '').replace(/^91/, '')

    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route:    'q',          // Quick SMS (no DLT needed for small volumes)
        message:  message,
        language: 'english',
        flash:    0,
        numbers:  cleanPhone,
      },
      {
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    )

    if (response.data?.return === true) {
      console.log(`✅ SMS sent to ${cleanPhone}:`, response.data)
      return { success: true }
    } else {
      console.warn(`⚠️ SMS API returned false for ${cleanPhone}:`, response.data)
      return { success: false, error: response.data?.message }
    }
  } catch (err) {
    console.error(`❌ SMS send error to ${phone}:`, err.message)
    return { success: false, error: err.message }
  }
}

// ── Helper: Send Email via Gmail ─────────────────────────────────────────────
async function sendEmail(gmailUserVal, gmailPassVal, to, subject, html) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUserVal,
        pass: gmailPassVal,  // 16-char Gmail App Password
      },
    })

    await transporter.sendMail({
      from: `"SuratKama Mascots 🎭" <${gmailUserVal}>`,
      to,
      subject,
      html,
    })

    console.log(`✅ Email sent to ${to}`)
    return { success: true }
  } catch (err) {
    console.error(`❌ Email send error to ${to}:`, err.message)
    return { success: false, error: err.message }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN TRIGGER: New Booking Created → Send Notifications
// ══════════════════════════════════════════════════════════════════════════════
exports.onBookingCreated = onDocumentCreated(
  {
    document:  'bookings/{bookingId}',
    secrets:   [fast2smsKey, gmailUser, gmailPass, ownerPhone, ownerEmail],
  },
  async (event) => {
    const booking = event.data?.data()
    if (!booking) {
      console.error('No booking data found in event')
      return null
    }

    const {
      userName       = 'Customer',
      userPhone      = '',
      userEmail      = '',
      mascotIds      = [],
      eventTitle     = 'Mascot Performance',
      bookingDate    = '',
      startHour      = 10,
      endHour        = 12,
      functionType   = 'Event',
      venueAddress   = 'Surat',
      totalPrice     = 0,
      confirmationCode = '',
      razorpayPaymentId = '',
    } = booking

    const timeSlot   = `${formatHour(startHour)} – ${formatHour(endHour)}`
    const dateStr    = bookingDate ? formatDate(bookingDate) : bookingDate
    const mascotName = eventTitle || (Array.isArray(mascotIds) ? mascotIds.join(', ') : 'Mascot')
    const amountStr  = `₹${Number(totalPrice).toLocaleString('en-IN')}`

    // ── 1. SMS TO CLIENT ──────────────────────────────────────────────────────
    const clientSMS = [
      '🎭 SuratKama Mascots',
      `Booking CONFIRMED! ✅`,
      `Code: ${confirmationCode}`,
      `Mascot: ${mascotName}`,
      `Date: ${dateStr}`,
      `Time: ${timeSlot}`,
      `Venue: ${venueAddress.substring(0, 80)}`,
      `Function: ${functionType}`,
      `Total Paid: ${amountStr}`,
      `For queries: +91 6353046419`,
      `Thank you! 🎉`,
    ].join('\n')

    // ── 2. SMS TO OWNER (6353046419) ──────────────────────────────────────────
    const ownerSMS = [
      '🚨 NEW BOOKING ALERT!',
      `━━━━━━━━━━━━━━━━━━━━`,
      `From: ${userName}`,
      `Phone: ${userPhone || 'Not provided'}`,
      `Email: ${userEmail || 'Not provided'}`,
      `Mascot: ${mascotName}`,
      `Date: ${dateStr}`,
      `Time: ${timeSlot}`,
      `Function: ${functionType}`,
      `Venue: ${venueAddress.substring(0, 100)}`,
      `Amount: ${amountStr}`,
      `Conf Code: ${confirmationCode}`,
      razorpayPaymentId ? `Payment ID: ${razorpayPaymentId}` : '',
    ].filter(Boolean).join('\n')

    const apiKey       = fast2smsKey.value()
    const ownerPhoneNo = ownerPhone.value() || '6353046419'
    const ownerEmailAddr = ownerEmail.value()
    const gmailUserVal = gmailUser.value()
    const gmailPassVal = gmailPass.value()

    // ── Send notifications in parallel ───────────────────────────────────────
    const tasks = []

    // SMS to client (if phone provided)
    if (userPhone && apiKey) {
      tasks.push(sendSMS(apiKey, userPhone, clientSMS))
    }

    // SMS to owner
    if (apiKey) {
      tasks.push(sendSMS(apiKey, ownerPhoneNo, ownerSMS))
    }

    // Email to client (if email provided)
    if (userEmail && gmailUserVal && gmailPassVal) {
      const clientEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; background: #f4f0eb; margin: 0; padding: 20px; }
            .card { background: white; border-radius: 16px; padding: 32px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { font-size: 48px; margin-bottom: 8px; }
            .title { color: #6B4226; font-size: 24px; font-weight: 900; margin: 0; }
            .badge { display: inline-block; background: #22c55e; color: white; padding: 6px 16px; border-radius: 999px; font-weight: 700; font-size: 14px; margin: 8px 0; }
            .code-box { background: #f9f5f1; border: 2px dashed #D97706; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; }
            .code { font-size: 22px; font-weight: 900; color: #6B4226; letter-spacing: 2px; font-family: monospace; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0e8de; }
            .detail-label { color: #9a7b5e; font-size: 13px; }
            .detail-value { color: #2d1a0a; font-weight: 700; font-size: 13px; text-align: right; max-width: 250px; }
            .total-row { display: flex; justify-content: space-between; padding: 16px 0; }
            .total-label { font-weight: 700; color: #2d1a0a; font-size: 16px; }
            .total-value { font-weight: 900; color: #6B4226; font-size: 20px; }
            .footer { text-align: center; margin-top: 24px; color: #9a7b5e; font-size: 12px; }
            .contact { background: #f9f5f1; border-radius: 10px; padding: 12px; text-align: center; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">🎭</div>
              <h1 class="title">SuratKama Mascots</h1>
              <div class="badge">✅ Booking Confirmed!</div>
            </div>

            <p style="color: #5a3a22; text-align: center; margin-bottom: 20px;">
              Dear <strong>${userName}</strong>, your mascot booking is confirmed! 🎉<br>
              We can't wait to make your event unforgettable!
            </p>

            <div class="code-box">
              <p style="margin: 0 0 4px; color: #9a7b5e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Confirmation Code</p>
              <div class="code">${confirmationCode}</div>
              <p style="margin: 4px 0 0; color: #9a7b5e; font-size: 11px;">Keep this code safe for reference</p>
            </div>

            <div>
              <div class="detail-row"><span class="detail-label">Mascot(s)</span><span class="detail-value">${mascotName}</span></div>
              <div class="detail-row"><span class="detail-label">Event Date</span><span class="detail-value">${dateStr}</span></div>
              <div class="detail-row"><span class="detail-label">Time Slot</span><span class="detail-value">${timeSlot}</span></div>
              <div class="detail-row"><span class="detail-label">Function Type</span><span class="detail-value">${functionType}</span></div>
              <div class="detail-row"><span class="detail-label">Venue</span><span class="detail-value">${venueAddress}</span></div>
              ${razorpayPaymentId ? `<div class="detail-row"><span class="detail-label">Payment ID</span><span class="detail-value" style="font-family: monospace; font-size: 11px;">${razorpayPaymentId}</span></div>` : ''}
              <div class="total-row"><span class="total-label">Total Paid</span><span class="total-value">${amountStr}</span></div>
            </div>

            <div class="contact">
              <p style="margin: 0; color: #6B4226; font-weight: 700;">Need Help? Contact Us</p>
              <p style="margin: 4px 0 0; color: #9a7b5e; font-size: 13px;">📱 WhatsApp / Call: <strong>+91 6353046419</strong></p>
              <p style="margin: 2px 0 0; color: #9a7b5e; font-size: 13px;">📍 Surat, Gujarat</p>
            </div>

            <div class="footer">
              <p>© 2025 SuratKama Mascots — Premium Mascot Bookings in Surat</p>
              <p>Please do not reply to this email. For queries, WhatsApp us.</p>
            </div>
          </div>
        </body>
        </html>
      `
      tasks.push(sendEmail(
        gmailUserVal,
        gmailPassVal,
        userEmail,
        `🎭 Booking Confirmed! ${confirmationCode} — SuratKama Mascots`,
        clientEmailHtml
      ))
    }

    // Email to owner
    if (ownerEmailAddr && gmailUserVal && gmailPassVal) {
      const ownerEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #1a0a2e; margin: 0; padding: 20px; }
            .card { background: white; border-radius: 16px; padding: 32px; max-width: 500px; margin: 0 auto; }
            .header { background: #6B4226; color: white; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0e8de; }
            .label { color: #666; font-size: 13px; }
            .value { font-weight: 700; color: #1a0a2e; font-size: 13px; max-width: 280px; text-align: right; }
            .total { background: #f9f5f1; border-radius: 10px; padding: 16px; display: flex; justify-content: space-between; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h2 style="margin: 0;">🚨 New Booking Alert!</h2>
              <p style="margin: 4px 0 0; opacity: 0.9;">Code: ${confirmationCode}</p>
            </div>
            <div class="row"><span class="label">Customer Name</span><span class="value">${userName}</span></div>
            <div class="row"><span class="label">Phone</span><span class="value">${userPhone || 'Not provided'}</span></div>
            <div class="row"><span class="label">Email</span><span class="value">${userEmail || 'Not provided'}</span></div>
            <div class="row"><span class="label">Mascot(s)</span><span class="value">${mascotName}</span></div>
            <div class="row"><span class="label">Date</span><span class="value">${dateStr}</span></div>
            <div class="row"><span class="label">Time</span><span class="value">${timeSlot}</span></div>
            <div class="row"><span class="label">Function</span><span class="value">${functionType}</span></div>
            <div class="row"><span class="label">Venue</span><span class="value">${venueAddress}</span></div>
            ${razorpayPaymentId ? `<div class="row"><span class="label">Payment ID</span><span class="value" style="font-family: monospace; font-size: 11px;">${razorpayPaymentId}</span></div>` : ''}
            <div class="total">
              <span style="font-weight: 700; color: #1a0a2e;">Total Received</span>
              <span style="font-weight: 900; color: #6B4226; font-size: 20px;">${amountStr}</span>
            </div>
          </div>
        </body>
        </html>
      `
      tasks.push(sendEmail(
        gmailUserVal,
        gmailPassVal,
        ownerEmailAddr,
        `🚨 New Booking: ${mascotName} on ${dateStr} — ${amountStr}`,
        ownerEmailHtml
      ))
    }

    // ── Execute all notification tasks ────────────────────────────────────────
    const results = await Promise.allSettled(tasks)
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`Task ${i} failed:`, result.reason)
      }
    })

    // ── Log notification to Firestore ─────────────────────────────────────────
    try {
      await admin.firestore().collection('notifications').add({
        bookingId:        event.params.bookingId,
        confirmationCode,
        smsSentToClient:  !!userPhone,
        smsSentToOwner:   true,
        emailSentToClient: !!userEmail,
        sentAt:           admin.firestore.FieldValue.serverTimestamp(),
      })
    } catch (e) {
      console.warn('Could not log notification:', e.message)
    }

    console.log(`🎉 All notifications dispatched for booking ${confirmationCode}`)
    return null
  }
)
