/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('[Auth callback] error param:', error)
    return NextResponse.redirect(`${origin}/auth?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=no_code`)
  }

  const cookieStore = await cookies()

  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { cookieStore.delete({ name, ...options }) },
      },
    }
  )

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error: exchangeError } = await authClient.auth.exchangeCodeForSession(code)

  if (exchangeError || !data.user) {
    console.error('[Auth callback] exchange error:', exchangeError)
    return NextResponse.redirect(`${origin}/auth?error=oauth_failed`)
  }

  const user     = data.user
  const provider = user.app_metadata?.provider ?? 'email'

  // ── Check if profile already exists ──────────────────────────────────────
  const { data: existingProfile } = await db
    .from('profiles')
    .select('id, full_name, username, interests')
    .eq('id', user.id)
    .single()

  if (existingProfile) {
    const hasSetup = !!(
      existingProfile.full_name &&
      existingProfile.username &&
      (existingProfile.interests as string[])?.length > 0
    )
    return NextResponse.redirect(`${origin}${hasSetup ? '/discover' : '/setup'}`)
  }

  // ── Shared minimal defaults — satisfies ALL not-null constraints ──────────
  const minimalProfile = {
    gender:            '',
    photos:            [] as any[],
    tier:              'free',
    plan:              'free',
    looking_for:       [] as string[],
    interests:         [] as string[],
    gender_preference: [] as string[],
    verified_email:    true,
    is_active:         true,
    visible:           false,
    distance_max:      500,
    profile_completeness: 10,
  }

  // ── New Google user ───────────────────────────────────────────────────────
  if (provider === 'google') {
    const googleName   = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
    const firstName    = googleName.split(' ')[0] || 'user'
    const baseUsername = firstName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)
    const username     = `${baseUsername}${Math.random().toString(36).slice(2, 6)}`

    const { error: upsertErr } = await db.from('profiles').upsert({
      ...minimalProfile,
      id:        user.id,
      full_name: googleName,
      username,
      profile_completeness: 10,
    })

    if (upsertErr) console.error('[callback] Google upsert error:', upsertErr.message)
    return NextResponse.redirect(`${origin}/setup`)
  }

  // ── New email user — check pending_profiles ───────────────────────────────
  const { data: pending } = await db
    .from('pending_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (pending) {
    const { error: upsertErr } = await db.from('profiles').upsert({
      ...minimalProfile,
      id:                user.id,
      full_name:         pending.full_name ?? '',
      username:          pending.username,
      age_range:         pending.age_range ?? null,
      gender:            pending.gender ?? '',
      gender_preference: pending.gender_preference ?? [],
      location:          pending.location ?? '',
      nationality:       pending.nationality ?? '',
      latitude:          pending.latitude  ?? null,
      longitude:         pending.longitude ?? null,
      profile_completeness: 30,
    })

    if (upsertErr) console.error('[callback] email upsert error:', upsertErr.message)

    await db.from('pending_profiles').delete().eq('user_id', user.id)

  } else {
    // Fallback — no pending data
    const emailName = user.email?.split('@')[0] ?? 'user'
    const username  = `${emailName.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 12)}${Math.random().toString(36).slice(2, 6)}`

    const { error: upsertErr } = await db.from('profiles').upsert({
      ...minimalProfile,
      id:        user.id,
      full_name: '',
      username,
    })

    if (upsertErr) console.error('[callback] fallback upsert error:', upsertErr.message)
  }

  return NextResponse.redirect(`${origin}/setup`)
}