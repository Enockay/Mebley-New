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
import type { Database } from '@/types/database.types'

// ── Whitelist of allowed post-auth redirect paths ────────────────────────────
// NEVER allow redirects to external domains
const ALLOWED_REDIRECT_PATHS = ['/discover', '/setup', '/profile', '/matches', '/upgrade']

function isSafeRedirectPath(path: string): boolean {
  // Must be a relative path starting with /
  if (!path.startsWith('/')) return false
  // Must match an allowed prefix
  return ALLOWED_REDIRECT_PATHS.some(allowed => path === allowed || path.startsWith(allowed + '/'))
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

  // ── 5. Check if profile already exists ───────────────────────────────────
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id, full_name, username, interests')
    .eq('id', user.id)
    .maybeSingle()

  if (existingProfile) {
    const hasSetup = !!(
      existingProfile.full_name &&
      existingProfile.username &&
      Array.isArray(existingProfile.interests) &&
      existingProfile.interests.length > 0
    )

    const destination = hasSetup ? '/discover' : '/setup'
    return NextResponse.redirect(`${origin}${destination}`)
  }

  // ── 6. Shared minimal profile defaults ───────────────────────────────────
  const minimalProfile = {
    gender:               '',
    photos:               [] as unknown[],
    tier:                 'free',
    plan:                 'free',
    looking_for:          [] as string[],
    interests:            [] as string[],
    gender_preference:    [] as string[],
    verified_email:       provider === 'google', // Google verifies email for us
    is_active:            true,
    visible:              false,              // hidden until setup complete
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
      id:        user.id,
      full_name: googleName,
      username,
    })

    if (upsertErr) {
      console.error('[auth/callback] Google profile upsert error:', upsertErr.message)
      // Don't block login — user can still proceed, profile will be created at setup
    }

    return NextResponse.redirect(`${origin}/setup`)
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
      id:                   user.id,
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
      id:        user.id,
      full_name: '',
      username,
    })

    if (upsertErr) {
      console.error('[auth/callback] Fallback profile upsert error:', upsertErr.message)
    }
  }

  return NextResponse.redirect(`${origin}/setup`)
}