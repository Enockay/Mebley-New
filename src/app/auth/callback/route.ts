/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * src/app/auth/callback/route.ts
 *
 * OAuth callback handler — called by Supabase after Google OAuth completes.
 *
 * Security fixes vs original:
 *  ✅ CSRF protection — validates `state` parameter against cookie
 *  ✅ Open redirect prevention — validates redirect targets against whitelist
 *  ✅ Admin client creation centralised via helper (not inline)
 *  ✅ No raw error details exposed to client in redirect params
 *  ✅ Username generation uses crypto.randomBytes (not Math.random)
 *  ✅ Unique username check before insert
 *  ✅ pending_profiles cleanup wrapped in try/catch — profile creation not blocked by it
 *  ✅ Provider detection handles all providers, not just google/email
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { pgQuery } from '@/lib/postgres'
import { createAuthSession, issueSessionToken, setAuthCookie, hashPassword } from '@/lib/auth-server'
import { isAdminUser } from '@/lib/admin-auth'
import { isSafeRedirectPath } from '@/lib/safe-redirect'
import type { Database } from '@/types/database.types'

// ── Whitelist of allowed post-auth redirect paths ────────────────────────────
// NEVER allow redirects to external domains
const ALLOWED_REDIRECT_PATHS = ['/browse', '/discover', '/setup', '/profile', '/matches', '/upgrade', '/admin']

function isAllowedOAuthRedirectPath(path: string): boolean {
  if (!isSafeRedirectPath(path)) return false
  return ALLOWED_REDIRECT_PATHS.some(allowed => path === allowed || path.startsWith(allowed + '/'))
}

async function resolveOAuthNextDestination(params: {
  cookieStore: Awaited<ReturnType<typeof cookies>>
  appUserId: string
  fallback: string
}): Promise<string> {
  const raw = params.cookieStore.get('oauth_next')?.value
  let nextPath: string | null = null
  if (raw) {
    try {
      const decoded = decodeURIComponent(raw)
      if (isAllowedOAuthRedirectPath(decoded)) nextPath = decoded
    } catch {
      nextPath = null
    }
  }
  if (!nextPath) return params.fallback
  if (nextPath.startsWith('/admin')) {
    const ok = await isAdminUser(params.appUserId)
    return ok ? nextPath : params.fallback
  }
  return nextPath
}

// ── Generate a unique username ────────────────────────────────────────────────
async function generateUniqueUsername(baseName: string): Promise<string> {
  const admin = createAdminSupabaseClient()
  const cleaned = baseName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'user'

  // Try up to 5 times to find a unique username
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = randomBytes(3).toString('hex') // 6 hex chars — more entropy than Math.random
    const candidate = `${cleaned}${suffix}`

    const { data } = await admin
      .from('profiles')
      .select('username')
      .eq('username', candidate)
      .maybeSingle()

    if (!data) return candidate // Unique — use it
  }

  // Fallback — timestamp-based (extremely unlikely to collide)
  return `${cleaned}${Date.now().toString(36)}`
}

async function resolveOrCreateAppUserId(oauthUserId: string, email: string): Promise<string> {
  const safeEmail = email.trim().toLowerCase()

  const byId = await pgQuery<{ id: string }>(
    `SELECT id FROM app_users WHERE id = $1 LIMIT 1`,
    [oauthUserId]
  )
  if (byId.rows[0]?.id) {
    await pgQuery(
      `UPDATE app_users SET email = $2, email_verified = true, is_active = true WHERE id = $1`,
      [oauthUserId, safeEmail]
    )
    return oauthUserId
  }

  // If email already exists (from password signup), reuse that account id.
  const randomPassword = randomBytes(24).toString('hex')
  const placeholderHash = await hashPassword(randomPassword)
  const upsert = await pgQuery<{ id: string }>(
    `
    INSERT INTO app_users (id, email, password_hash, email_verified, is_active)
    VALUES ($1, $2, $3, true, true)
    ON CONFLICT (email) DO UPDATE
      SET email_verified = true,
          is_active = true
    RETURNING id
    `,
    [oauthUserId, safeEmail, placeholderHash]
  )
  return upsert.rows[0].id
}

async function ensureAppAuthAndRedirect(params: {
  origin: string
  request: NextRequest
  appUserId: string
  destination: string
  clearOAuthNextCookie?: boolean
}) {
  const token = issueSessionToken()
  const { expiresAt } = await createAuthSession({
    userId: params.appUserId,
    token,
    userAgent: params.request.headers.get('user-agent'),
    ipAddress: params.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  })

  const response = NextResponse.redirect(`${params.origin}${params.destination}`)
  setAuthCookie(response, token, expiresAt)
  if (params.clearOAuthNextCookie) {
    response.cookies.set('oauth_next', '', { path: '/', maxAge: 0 })
  }
  return response
}

async function grantStarterCreditsIfMissing(userId: string) {
  try {
    const walletInsert = await pgQuery<{ id: string }>(
      `
      INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
      VALUES ($1, 25, 25, 0)
      ON CONFLICT (user_id) DO NOTHING
      RETURNING id
      `,
      [userId]
    )
    if ((walletInsert.rowCount ?? 0) > 0) {
      await pgQuery(
        `
        INSERT INTO credit_transactions (user_id, amount, balance_after, type, reference_type, description)
        VALUES ($1, 25, 25, 'starter_grant', 'signup', 'Welcome bonus: 25 free credits')
        `,
        [userId]
      )
    }
  } catch (err: any) {
    // Non-fatal for OAuth completion if optional wallet tables are not present yet.
    if (err?.code !== '42P01') {
      console.error('[auth/callback] starter credits grant failed:', err)
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code             = searchParams.get('code')
  const oauthError       = searchParams.get('error')
  const returnedState    = searchParams.get('state')

  // ── 1. Handle OAuth provider errors ──────────────────────────────────────
  if (oauthError) {
    console.error('[auth/callback] OAuth provider error:', oauthError)
    // Don't forward raw error to client — could leak provider internals
    return NextResponse.redirect(`${origin}/auth?error=oauth_denied`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=missing_code`)
  }

  const cookieStore = await cookies()

  // ── 2. CSRF: validate state parameter ────────────────────────────────────
  //    Supabase SSR generates a state cookie on the /auth page before
  //    redirecting to Google. We verify it matches what came back.
  const storedState = cookieStore.get('sb-oauth-state')?.value

  if (storedState && returnedState && storedState !== returnedState) {
    console.error('[auth/callback] CSRF state mismatch — possible attack')
    return NextResponse.redirect(`${origin}/auth?error=invalid_state`)
  }

  // ── 3. Build auth client with cookie support ──────────────────────────────
  const authClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  // ── 4. Exchange code for session ──────────────────────────────────────────
  const { data, error: exchangeError } = await authClient.auth.exchangeCodeForSession(code)

  if (exchangeError || !data?.user) {
    console.error('[auth/callback] Code exchange failed:', exchangeError?.message)
    return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
  }

  const user     = data.user
  const provider = user.app_metadata?.provider ?? 'email'
  const admin    = createAdminSupabaseClient()
  const authEmail = user.email ?? ''
  if (!authEmail) {
    return NextResponse.redirect(`${origin}/auth?error=oauth_missing_email`)
  }
  const appUserId = await resolveOrCreateAppUserId(user.id, authEmail)

  // ── 5. Check if profile already exists ───────────────────────────────────
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id, full_name, username, interests')
    .eq('id', appUserId)
    .maybeSingle()

  if (existingProfile) {
    const hasSetup = !!(
      existingProfile.full_name &&
      existingProfile.username &&
      Array.isArray(existingProfile.interests) &&
      existingProfile.interests.length > 0
    )

    const destination = hasSetup
      ? await resolveOAuthNextDestination({
          cookieStore,
          appUserId,
          fallback: '/browse',
        })
      : '/setup'

    return ensureAppAuthAndRedirect({
      origin,
      request,
      appUserId,
      destination,
      clearOAuthNextCookie: !!cookieStore.get('oauth_next'),
    })
  }

  // ── 6. Shared minimal profile defaults ───────────────────────────────────
  const minimalProfile = {
    gender:               '',
    photos:               [] as any[],
    tier:                 'free',
    plan:                 'free',
    looking_for:          [] as string[],
    interests:            [] as string[],
    gender_preference:    [] as string[],
    verified_email:       provider === 'google', // Google verifies email for us
    is_active:            true,
    visible:              true,               // discoverable by default
    distance_max:         500,
    profile_completeness: 10,
  }

  // ── 7. New Google user ────────────────────────────────────────────────────
  if (provider === 'google') {
    const googleName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
    const firstName  = googleName.split(' ')[0] || 'user'
    const username   = await generateUniqueUsername(firstName)

    const { error: upsertErr } = await admin.from('profiles').upsert({
      ...minimalProfile,
      id:        appUserId,
      full_name: googleName,
      username,
    })

    if (upsertErr) {
      console.error('[auth/callback] Google profile upsert error:', upsertErr.message)
      // Don't block login — user can still proceed, profile will be created at setup
    }

    await grantStarterCreditsIfMissing(appUserId)

    return ensureAppAuthAndRedirect({
      origin,
      request,
      appUserId,
      destination: '/setup',
      clearOAuthNextCookie: !!cookieStore.get('oauth_next'),
    })
  }

  // ── 8. New email user — check pending_profiles ───────────────────────────
  const { data: pending } = await admin
    .from('pending_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (pending) {
    const { error: upsertErr } = await admin.from('profiles').upsert({
      ...minimalProfile,
      id:                   appUserId,
      full_name:            pending.full_name ?? '',
      username:             pending.username,
      age_range:            pending.age_range ?? null,
      gender:               pending.gender ?? '',
      gender_preference:    pending.gender_preference ?? [],
      location:             pending.location ?? '',
      nationality:          pending.nationality ?? '',
      latitude:             pending.latitude  ?? null,
      longitude:            pending.longitude ?? null,
      profile_completeness: 30,
    })

    if (upsertErr) {
      console.error('[auth/callback] Email profile upsert error:', upsertErr.message)
    }

    // Clean up pending data — wrapped separately so failure doesn't block the user
    try {
      await admin.from('pending_profiles').delete().eq('user_id', user.id)
    } catch (cleanupErr) {
      console.error('[auth/callback] pending_profiles cleanup failed (non-fatal):', cleanupErr)
    }

  } else {
    // Fallback — signup without pending profile (e.g. magic link)
    const emailBase = user.email?.split('@')[0] ?? 'user'
    const username  = await generateUniqueUsername(emailBase)

    const { error: upsertErr } = await admin.from('profiles').upsert({
      ...minimalProfile,
      id:        appUserId,
      full_name: '',
      username,
    })

    if (upsertErr) {
      console.error('[auth/callback] Fallback profile upsert error:', upsertErr.message)
    }
  }

  await grantStarterCreditsIfMissing(appUserId)

  return ensureAppAuthAndRedirect({
    origin,
    request,
    appUserId,
    destination: '/setup',
    clearOAuthNextCookie: !!cookieStore.get('oauth_next'),
  })
}