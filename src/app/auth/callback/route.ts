/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * src/app/auth/callback/route.ts
 *
 * Direct Google OAuth callback — no Supabase involved.
 *
 * Flow:
 *  1. Validate CSRF state cookie
 *  2. Exchange Google auth code for tokens (direct Google API call)
 *  3. Fetch user info from Google
 *  4. Resolve or create app_user + profile in PostgreSQL
 *  5. Issue our own session (createAuthSession / setAuthCookie)
 *  6. Redirect to appropriate page
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { pgQuery } from '@/lib/postgres'
import { createAuthSession, issueSessionToken, setAuthCookie, hashPassword } from '@/lib/auth-server'
import { isAdminUser } from '@/lib/admin-auth'
import { isSafeRedirectPath } from '@/lib/safe-redirect'
import { getPublicOrigin } from '@/lib/request-origin'

// ── Whitelist of allowed post-auth redirect paths ─────────────────────────────
const ALLOWED_REDIRECT_PATHS = ['/browse', '/discover', '/setup', '/profile', '/matches', '/upgrade', '/admin']

function isAllowedRedirectPath(path: string): boolean {
  if (!isSafeRedirectPath(path)) return false
  return ALLOWED_REDIRECT_PATHS.some(a => path === a || path.startsWith(a + '/'))
}

// ── Resolve post-login destination from oauth_next cookie ─────────────────────
async function resolveDestination(params: {
  cookieStore: Awaited<ReturnType<typeof cookies>>
  appUserId:   string
  fallback:    string
}): Promise<string> {
  const raw = params.cookieStore.get('oauth_next')?.value
  if (raw) {
    try {
      const decoded = decodeURIComponent(raw)
      if (isAllowedRedirectPath(decoded)) {
        if (decoded.startsWith('/admin')) {
          const ok = await isAdminUser(params.appUserId)
          return ok ? decoded : params.fallback
        }
        return decoded
      }
    } catch { /* ignore */ }
  }
  return params.fallback
}

// ── Generate a unique username ─────────────────────────────────────────────────
async function generateUniqueUsername(baseName: string): Promise<string> {
  const cleaned = baseName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'user'

  for (let i = 0; i < 5; i++) {
    const candidate = `${cleaned}${randomBytes(3).toString('hex')}`
    const res = await pgQuery<{ username: string }>(
      `SELECT username FROM profiles WHERE username = $1 LIMIT 1`,
      [candidate]
    )
    if (!res.rows[0]) return candidate
  }
  return `${cleaned}${Date.now().toString(36)}`
}

// ── Resolve or create app_user row ────────────────────────────────────────────
// Google's sub is a numeric string (e.g. "109534428939097838400") — not a UUID.
// We look up users by email and generate a proper UUID for new accounts.
async function resolveOrCreateAppUser(_googleId: string, email: string): Promise<string> {
  const safeEmail = email.trim().toLowerCase()

  // Look up existing user by email (covers both Google and password sign-ups)
  const byEmail = await pgQuery<{ id: string }>(
    `SELECT id FROM app_users WHERE email = $1 LIMIT 1`, [safeEmail]
  )
  if (byEmail.rows[0]?.id) {
    await pgQuery(
      `UPDATE app_users SET email_verified = true, is_active = true WHERE id = $1`,
      [byEmail.rows[0].id]
    )
    return byEmail.rows[0].id
  }

  // New user — generate a proper UUID, not Google's numeric sub
  const randomPassword  = randomBytes(24).toString('hex')
  const placeholderHash = await hashPassword(randomPassword)
  const upsert = await pgQuery<{ id: string }>(
    `INSERT INTO app_users (id, email, password_hash, email_verified, is_active)
     VALUES (gen_random_uuid(), $1, $2, true, true)
     ON CONFLICT (email) DO UPDATE
       SET email_verified = true, is_active = true
     RETURNING id`,
    [safeEmail, placeholderHash]
  )
  return upsert.rows[0].id
}

// ── Grant starter credits (idempotent) ────────────────────────────────────────
async function grantStarterCredits(userId: string) {
  try {
    const inserted = await pgQuery<{ id: string }>(
      `INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
       VALUES ($1, 25, 25, 0)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING id`,
      [userId]
    )
    if ((inserted.rowCount ?? 0) > 0) {
      await pgQuery(
        `INSERT INTO credit_transactions (user_id, amount, balance_after, type, reference_type, description)
         VALUES ($1, 25, 25, 'starter_grant', 'signup', 'Welcome bonus: 25 free credits')`,
        [userId]
      )
    }
  } catch (err: any) {
    if (err?.code !== '42P01') console.error('[callback] starter credits failed:', err)
  }
}

// ── Issue session and redirect ────────────────────────────────────────────────
async function redirectWithSession(params: {
  origin:               string
  request:              NextRequest
  appUserId:            string
  destination:          string
  clearOAuthNextCookie: boolean
}) {
  const token = issueSessionToken()
  const { expiresAt } = await createAuthSession({
    userId:    params.appUserId,
    token,
    userAgent: params.request.headers.get('user-agent'),
    ipAddress: params.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  })

  const response = NextResponse.redirect(`${params.origin}${params.destination}`)
  setAuthCookie(response, token, expiresAt)
  if (params.clearOAuthNextCookie) {
    response.cookies.set('oauth_next', '', { path: '/', maxAge: 0 })
  }
  response.cookies.set('google_oauth_state', '', { path: '/', maxAge: 0 })
  return response
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = getPublicOrigin(request)
  const code          = searchParams.get('code')
  const returnedState = searchParams.get('state')
  const oauthError    = searchParams.get('error')

  if (oauthError) {
    console.error('[callback] Google OAuth error:', oauthError)
    return NextResponse.redirect(`${origin}/auth?error=oauth_denied`)
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=missing_code`)
  }

  const cookieStore = await cookies()

  // ── 1. CSRF validation ──────────────────────────────────────────────────────
  const storedState = cookieStore.get('google_oauth_state')?.value
  if (storedState && returnedState && storedState !== returnedState) {
    console.error('[callback] CSRF state mismatch')
    return NextResponse.redirect(`${origin}/auth?error=invalid_state`)
  }

  // ── 2. Exchange code for tokens directly with Google ───────────────────────
  let googleUser: { sub: string; email: string; name: string; email_verified: boolean }
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  `${origin}/auth/callback`,
        grant_type:    'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('[callback] Google token exchange failed:', err)
      return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
    }

    const tokens = await tokenRes.json()

    // Fetch user info using the access token
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userRes.ok) {
      console.error('[callback] Google userinfo fetch failed')
      return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
    }

    googleUser = await userRes.json()
  } catch (err) {
    console.error('[callback] Google exchange error:', err)
    return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
  }

  if (!googleUser.email) {
    return NextResponse.redirect(`${origin}/auth?error=oauth_missing_email`)
  }

  // ── 3. Resolve or create user in our database ──────────────────────────────
  const appUserId = await resolveOrCreateAppUser(googleUser.sub, googleUser.email)

  // ── 4. Check if profile already set up ────────────────────────────────────
  const profileRes = await pgQuery<{ id: string; full_name: string; username: string; interests: unknown[] | null }>(
    `SELECT id, full_name, username, interests FROM profiles WHERE id = $1 LIMIT 1`,
    [appUserId]
  )
  const existingProfile = profileRes.rows[0] ?? null

  if (existingProfile) {
    const hasSetup = !!(
      existingProfile.full_name &&
      existingProfile.username &&
      Array.isArray(existingProfile.interests) &&
      existingProfile.interests.length > 0
    )
    const destination = hasSetup
      ? await resolveDestination({ cookieStore, appUserId, fallback: '/browse' })
      : '/setup'

    return redirectWithSession({
      origin, request, appUserId, destination,
      clearOAuthNextCookie: !!cookieStore.get('oauth_next'),
    })
  }

  // ── 5. New user — create minimal profile ──────────────────────────────────
  const firstName = (googleUser.name ?? '').split(' ')[0] || 'user'
  const username  = await generateUniqueUsername(firstName)

  try {
    await pgQuery(
      `INSERT INTO profiles
         (id, full_name, username, gender, photos, tier, plan,
          looking_for, interests, gender_preference,
          verified_email, is_active, visible, distance_max, profile_completeness)
       VALUES ($1,$2,$3,'','{}','free','free','{}','{}','{}', $4, true, true, 500, 10)
       ON CONFLICT (id) DO UPDATE
         SET full_name      = EXCLUDED.full_name,
             username       = COALESCE(NULLIF(profiles.username,''), EXCLUDED.username),
             verified_email = EXCLUDED.verified_email`,
      [appUserId, googleUser.name ?? '', username, googleUser.email_verified ?? true]
    )
  } catch (err: any) {
    console.error('[callback] profile upsert error:', err.message)
  }

  await grantStarterCredits(appUserId)

  return redirectWithSession({
    origin, request, appUserId, destination: '/setup',
    clearOAuthNextCookie: !!cookieStore.get('oauth_next'),
  })
}
