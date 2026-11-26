/**
 * Website origin that hosts Vercel APIs. Never append /api here.
 */
export function websiteApiOrigin(raw = import.meta.env.VITE_WEBSITE_API_URL) {
  let origin = String(raw || '').trim()

  // In Node/functions environment (e.g. injected via Vercel service binding)
  if (!origin && typeof process !== 'undefined' && process.env?.WEBSITE_URL) {
    origin = String(process.env.WEBSITE_URL).trim()
  }

  // When deployed together on Vercel or same domain, browser origin is the website origin
  if (!origin && typeof window !== 'undefined' && window.location?.origin) {
    origin = window.location.origin
  }

  return origin.replace(/\/$/, '').replace(/\/api$/i, '')
}

export function websiteApiUrl(path) {
  const origin = websiteApiOrigin()
  const suffix = String(path || '').replace(/^\/+/, '')
  if (!origin) return `/${suffix}`
  return `${origin}/${suffix}`
}
