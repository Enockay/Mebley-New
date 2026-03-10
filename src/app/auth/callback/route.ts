// src/app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
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

  const supabase = createServerClient(
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

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !data.user) {
    console.error('[Auth callback] exchange error:', exchangeError)
    return NextResponse.redirect(`${origin}/auth?error=oauth_failed`)
  }

  const user     = data.user
  const provider = user.app_metadata?.provider ?? 'email'

  // ── Check if profile already exists ────────────────────────────────────────
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, full_name, username, interests')
    .eq('id', user.id)
    .single()

  // ── Returning user ──────────────────────────────────────────────────────────
  if (existingProfile) {
    const hasSetup = !!(
      existingProfile.full_name &&
      existingProfile.username &&
      (existingProfile.interests as string[])?.length > 0
    )
    return NextResponse.redirect(`${origin}${hasSetup ? '/discover' : '/setup'}`)
  }

  // ── New Google user ─────────────────────────────────────────────────────────
  if (provider === 'google') {
    const googleName   = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
    const firstName    = googleName.split(' ')[0] || 'user'
    const baseUsername = firstName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)
    const username     = `${baseUsername}${Math.random().toString(36).slice(2, 6)}`

    await supabase.from('profiles').upsert({
      id:                   user.id,
      full_name:            googleName,
      username,
      looking_for:          [],
      interests:            [],
      gender_preference:    [],
      verified_email:       true,
      is_active:            true,
      visible:              false,
      distance_max:         500,
      profile_completeness: 10,
    })

    return NextResponse.redirect(`${origin}/setup`)
  }

  // ── New email user — retrieve pending profile data saved during signup ──────
  const { data: pending } = await (supabase as any)
    .from('pending_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (pending) {
    await (supabase as any).from('profiles').upsert({
      id:                user.id,
      full_name:         pending.full_name,
      username:          pending.username,
      age_range:         pending.age_range,
      gender:            pending.gender,
      gender_preference: pending.gender_preference ?? [],
      location:          pending.location,
      nationality:       pending.nationality,
      latitude:          pending.latitude  ?? null,
      longitude:         pending.longitude ?? null,
      looking_for:       [],
      interests:         [],
      verified_email:    true,
      is_active:         true,
      visible:           false,
      distance_max:      500,
      profile_completeness: 30,
    })

    // Clean up pending data
    await (supabase as any).from('pending_profiles').delete().eq('user_id', user.id)
  } else {
    // Fallback — pending data missing, create minimal profile
    const emailName = user.email?.split('@')[0] ?? 'user'
    const username  = `${emailName.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 12)}${Math.random().toString(36).slice(2, 6)}`

    await supabase.from('profiles').upsert({
      id:                   user.id,
      full_name:            '',
      username,
      looking_for:          [],
      interests:            [],
      gender_preference:    [],
      verified_email:       true,
      is_active:            true,
      visible:              false,
      distance_max:         500,
      profile_completeness: 10,
    })
  }

  return NextResponse.redirect(`${origin}/setup`)
}
