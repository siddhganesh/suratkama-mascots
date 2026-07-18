/**
 * Detects the base path dynamically from the browser window location.
 * This allows the app to be deployed on any subdirectory (e.g. /suratkama%20mascots/
 * or /suratkama-mascots/) or root domain without hardcoding the path.
 */
export function getDynamicBasename(): string {
  const path = window.location.pathname
  const routes = ['/events', '/book', '/auth', '/profile', '/admin']

  for (const r of routes) {
    if (path.endsWith(r)) {
      return path.slice(0, path.length - r.length)
    }
    if (path.includes('/events/')) {
      const idx = path.indexOf('/events/')
      return path.slice(0, idx)
    }
  }

  if (path.endsWith('/')) {
    return path.slice(0, -1)
  }
  return path
}

/**
 * Resolves static asset paths (like images, videos, favicons) dynamically
 * using the detected base path.
 */
export function resolvePath(p: string): string {
  if (!p) return ''
  if (p.startsWith('http') || p.startsWith('data:')) return p
  const clean = p.startsWith('/') ? p.slice(1) : p
  const base = getDynamicBasename()
  return `${base}/${clean}`
}
