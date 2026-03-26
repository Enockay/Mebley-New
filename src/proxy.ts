/**
 * src/proxy.ts
 *
 * Next.js 16 proxy (replaces middleware.ts).
 * Export must be named `proxy`, not `middleware`.
 *
 * Responsibilities:
 *  1. Protect private routes — redirect unauthenticated users to /auth
 *  3. Redirect authenticated users away from /auth → /browse
 *  4. Profile-setup gate — incomplete profiles go to /setup
 *  5. Protect all API routes (except public ones) — return 401 JSON
 *  6. Apply security headers on every response
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

// ── Route classification ──────────────────────────────────────────────────────

/** Pages that anyone can visit without a session */
const PUBLIC_PAGE_ROUTES = ['/', '/auth', '/privacy', '/terms']

/** API routes that do NOT require authentication */
const PUBLIC_API_PREFIXES = [
  '/api/auth/',   // send-otp, verify-otp, callback
  '/api/health',
]

/** After login, users who haven't finished setup can only visit these pages */
const SETUP_ALLOWED_PAGES = ['/setup', '/auth']

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGE_ROUTES.some(
    r => pathname === r || (r !== '/' && pathname.startsWith(r + '/'))
  )
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

function applySecurityHeaders(response: NextResponse, request?: NextRequest): NextResponse {
  // Allow same-origin framing so we can embed internal pages in right-side panels.
  // Keep it strict by default, but permit SAMEORIGIN which is equivalent to frame-ancestors 'self'.
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  )
  // Relax frame-ancestors for same-origin embedding. If needed later we can tighten
  // by checking request?.nextUrl for specific routes/params.
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com https://onesignal.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://*.amazonaws.com https://*.cloudfront.net https://*.giphy.com https://*.giphyusercontent.com https://media.tenor.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.twilio.com https://onesignal.com https://*.amazonaws.com https://*.cloudfront.net https://api.giphy.com https://tenor.googleapis.com",
      "frame-ancestors 'self'",
    ].join('; ')
  )
  return response
}

// ── Main proxy function ───────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const authResponse = NextResponse.next({ request })
  const user = await getAuthUserFromRequest(request)

  // ── 4. Public API routes — skip auth, apply headers only ────────────────
  if (isApiRoute(pathname)) {
    if (isPublicApi(pathname)) {
      return applySecurityHeaders(authResponse, request)
    }

    // All other API routes require authentication
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      )
    }

    return applySecurityHeaders(authResponse, request)
  }

  // ── 5. Root path handling ────────────────────────────────────────────────
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/browse', request.url))
    }
    return applySecurityHeaders(authResponse, request)
  }

  // ── 6. Public pages — redirect authed users away from /auth ─────────────
  if (isPublicPage(pathname)) {
    if (user && pathname === '/auth') {
      return NextResponse.redirect(new URL('/browse', request.url))
    }
    return applySecurityHeaders(authResponse)
  }

  // ── 7. No session — redirect to login, preserving intended destination ───
  if (!user) {
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ── 8. Session exists — enforce profile setup gate ───────────────────────
  //    Only fetch the minimum fields needed to check completeness.
  //    Skip this check for /setup itself to avoid an infinite redirect loop.
  if (!SETUP_ALLOWED_PAGES.includes(pathname)) {
    const profileRes = await pgQuery<{ full_name: string | null; username: string | null; interests: string[] | null }>(
      'SELECT full_name, username, interests FROM profiles WHERE id = $1 LIMIT 1',
      [user.id]
    )
    const profile = profileRes.rows[0]

    const hasCompletedSetup = !!(
      profile?.full_name &&
      profile?.username &&
      Array.isArray(profile?.interests) &&
      profile.interests.length > 0
    )

    if (!hasCompletedSetup) {
      return NextResponse.redirect(new URL('/setup', request.url))
    }
  }

  // ── 9. User is on /setup but already completed it — send to browse ─────
  if (pathname === '/setup') {
    const profileRes = await pgQuery<{ full_name: string | null; username: string | null; interests: string[] | null }>(
      'SELECT full_name, username, interests FROM profiles WHERE id = $1 LIMIT 1',
      [user.id]
    )
    const profile = profileRes.rows[0]

    const hasCompletedSetup = !!(
      profile?.full_name &&
      profile?.username &&
      Array.isArray(profile?.interests) &&
      profile.interests.length > 0
    )

    if (hasCompletedSetup) {
      return NextResponse.redirect(new URL('/browse', request.url))
    }
  }

  // ── 10. All checks passed ─────────────────────────────────────────────────
  return applySecurityHeaders(authResponse, request)
}

// ── Matcher — which paths this proxy runs on ──────────────────────────────────
// Excludes Next.js internals and static assets for performance
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}