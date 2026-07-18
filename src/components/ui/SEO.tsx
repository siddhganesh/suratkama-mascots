import { useEffect } from 'react'

interface SEOProps {
  title: string
  description?: string
  ogImage?: string
  ogType?: string
  canonical?: string
  noIndex?: boolean
  keywords?: string
  structuredData?: object
}

const SITE_NAME = 'SuratKama Mascots'
const BASE_URL = 'https://suratkamamascots.com'
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`

// Helper to set or create a meta tag
function setMeta(selector: string, value: string) {
  let el = document.querySelector(selector) as HTMLMetaElement | null
  if (el) {
    el.setAttribute('content', value)
  } else {
    el = document.createElement('meta')
    const [attrKey, attrVal] = selector.includes('[property')
      ? ['property', selector.match(/property="([^"]+)"/)?.[1] ?? '']
      : ['name', selector.match(/name="([^"]+)"/)?.[1] ?? '']
    el.setAttribute(attrKey, attrVal)
    el.setAttribute('content', value)
    document.head.appendChild(el)
  }
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (el) {
    el.href = href
  } else {
    el = document.createElement('link')
    el.rel = rel
    el.href = href
    document.head.appendChild(el)
  }
}

export function SEO({
  title,
  description,
  ogImage,
  ogType = 'website',
  canonical,
  noIndex = false,
  keywords,
  structuredData,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`
    const img = ogImage || DEFAULT_OG_IMAGE

    // ── Document title ──────────────────────────────────────────────────
    document.title = fullTitle

    // ── Primary meta ────────────────────────────────────────────────────
    if (description) {
      setMeta('meta[name="description"]', description)
    }
    if (keywords) {
      setMeta('meta[name="keywords"]', keywords)
    }
    setMeta(
      'meta[name="robots"]',
      noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large'
    )

    // ── Canonical ───────────────────────────────────────────────────────
    if (canonical) {
      setLink('canonical', canonical)
    }

    // ── Open Graph ──────────────────────────────────────────────────────
    setMeta('meta[property="og:title"]', fullTitle)
    if (description) setMeta('meta[property="og:description"]', description)
    setMeta('meta[property="og:image"]', img)
    setMeta('meta[property="og:type"]', ogType)
    setMeta('meta[property="og:url"]', canonical || BASE_URL)
    setMeta('meta[property="og:site_name"]', SITE_NAME)

    // ── Twitter Card ────────────────────────────────────────────────────
    setMeta('meta[name="twitter:title"]', fullTitle)
    if (description) setMeta('meta[name="twitter:description"]', description)
    setMeta('meta[name="twitter:image"]', img)
    setMeta('meta[name="twitter:card"]', 'summary_large_image')

    // ── Structured Data (JSON-LD) ───────────────────────────────────────
    if (structuredData) {
      const id = 'seo-structured-data'
      let script = document.getElementById(id) as HTMLScriptElement | null
      if (!script) {
        script = document.createElement('script')
        script.id = id
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(structuredData)
    }
  }, [title, description, ogImage, ogType, canonical, noIndex, keywords, structuredData])

  return null
}

export default SEO
