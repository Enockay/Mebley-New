import type { NextRequest } from 'next/server'

function canonicalAppUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, '') ?? ''
  if (!raw || !/^https?:\/\//i.test(raw)) return null
  return raw
}

function isLoopbackForwardedHost(host: string): boolean {
  const h = host.split(':')[0]?.toLowerCase() ?? ''
  return h === 'localhost' || h.startsWith('127.')
}

/**
 * Origin the browser sees (https://www.mebley.com), not the internal URL
 * (http://localhost:3000) Next.js often has behind Docker / a reverse proxy.
 *
 * Important: many proxies forward X-Forwarded-Host: localhost:3000 toward the app.
 * If we trust that before NEXT_PUBLIC_APP_URL, OAuth redirects break in production.
 */
export function getPublicOrigin(request: NextRequest): string {
  const fromEnv = canonicalAppUrl()

  if (process.env.NODE_ENV === 'production' && fromEnv) {
    return fromEnv
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? 'https'
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0].trim()
    if (host && !isLoopbackForwardedHost(host)) {
      return `${forwardedProto}://${host}`
    }
  }

  return new URL(request.url).origin
}
