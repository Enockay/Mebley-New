/**
 * src/proxy.ts
 *
 * Next.js 16 proxy (replaces middleware.ts).
 * Export must be named `proxy`, not `middleware`.
 *
 * Responsibilities:
 *  1. Refresh Supabase session cookie on every request
 *  2. Protect private routes — redirect unauthenticated users to /auth
 *  3. Redirect authenticated users away from /auth → /discover
 *  4. Profile-setup gate — incomplete profiles go to /setup
 *  5. Protect all API routes (except public ones) — return 401 JSON
 *  6. Apply security headers on every response
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

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

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  )
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com https://onesignal.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.twilio.com https://onesignal.com",
      "frame-ancestors 'none'",
    ].join('; ')
  )
  return response
}

// ── Main proxy function ───────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Create a mutable response to carry refreshed cookies ─────────────
  let supabaseResponse = NextResponse.next({ request })

  // ── 2. Initialise Supabase — reads + writes session cookies ─────────────
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ── 3. Validate session server-side — MUST happen before any redirect ────
  //    getUser() makes a network call to Supabase to verify the JWT.
  //    Never use getSession() here — it only reads from the cookie, no verification.
  const { data: { user } } = await supabase.auth.getUser()

  // ── 4. Public API routes — skip auth, apply headers only ────────────────
  if (isApiRoute(pathname)) {
    if (isPublicApi(pathname)) {
      return applySecurityHeaders(supabaseResponse)
    }

    // All other API routes require authentication
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      )
    }

    return applySecurityHeaders(supabaseResponse)
  }

  // ── 5. Root path handling ────────────────────────────────────────────────
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/discover', request.url))
    }
    return applySecurityHeaders(supabaseResponse)
  }

  // ── 6. Public pages — redirect authed users away from /auth ─────────────
  if (isPublicPage(pathname)) {
    if (user && pathname === '/auth') {
      return NextResponse.redirect(new URL('/discover', request.url))
    }
    return applySecurityHeaders(supabaseResponse)
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username, interests')
      .eq('id', user.id)
      .maybeSingle()

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

  // ── 9. User is on /setup but already completed it — send to discover ─────
  if (pathname === '/setup') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username, interests')
      .eq('id', user.id)
      .maybeSingle()

    const hasCompletedSetup = !!(
      profile?.full_name &&
      profile?.username &&
      Array.isArray(profile?.interests) &&
      profile.interests.length > 0
    )

    if (hasCompletedSetup) {
      return NextResponse.redirect(new URL('/discover', request.url))
    }
  }

  // ── 10. All checks passed ─────────────────────────────────────────────────
  return applySecurityHeaders(supabaseResponse)
}

// ── Matcher — which paths this proxy runs on ──────────────────────────────────
// Excludes Next.js internals and static assets for performance
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}