import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID ?? ''

// ── Google Analytics 4 — inject only when Measurement ID is configured ────────
if (GA_ID && GA_ID !== 'G-XXXXXXXXXX') {
  // Load gtag script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  // Init gtag
  const inline = document.createElement('script')
  inline.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}', { send_page_view: true });
  `
  document.head.appendChild(inline)

  console.log(`📊 Google Analytics 4 initialised (${GA_ID})`)
} else {
  // Provide a no-op gtag so calls from components never throw
  (window as any).gtag = (..._args: any[]) => {}
}

// ── Expose a typed helper so pages can fire custom events ─────────────────────
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof (window as any).gtag === 'function') {
    ;(window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    })
  }
}

// GitHub Pages SPA base path — must match vite.config.ts base
const BASE_PATH = '/suratkama-mascots'

// GoogleOAuthProvider crashes if clientId is empty — only wrap when configured
const AppWithProviders = GOOGLE_CLIENT_ID
  ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter basename={BASE_PATH}>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
  : (
    <BrowserRouter basename={BASE_PATH}>
      <App />
    </BrowserRouter>
  )

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {AppWithProviders}
  </React.StrictMode>,
)

