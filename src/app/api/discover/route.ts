import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = rateLimit(user.id, 'api')
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const page      = parseInt(searchParams.get('page')  ?? '1')
    const pageLimit = parseInt(searchParams.get('limit') ?? '20')
    const offset    = (page - 1) * pageLimit

    // Fetch as unknown first, then cast — avoids generated-types gaps
    const { data: myProfileRaw } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!myProfileRaw) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Cast to any so we can access columns that exist in DB but may be
    // missing from the auto-generated Supabase types (e.g. gender_preference,
    // age_min, age_max, visible, is_active)
    const myProfile = myProfileRaw as any

    // Already-liked IDs
    const { data: likedUsers } = await supabase
      .from('likes')
      .select('likee_id')
      .eq('liker_id', user.id)

    const excludeIds = new Set<string>([
      user.id,
      ...(likedUsers?.map((l: any) => l.likee_id) ?? []),
    ])

    // Gender filter
    const genderFilter = myProfile.gender_preference?.length > 0
      ? myProfile.gender_preference
      : ['male', 'female', 'non-binary', 'other']

    // Age range → date_of_birth range
    const now    = new Date()
    const minDob = myProfile.age_max
      ? new Date(now.getFullYear() - myProfile.age_max, now.getMonth(), now.getDate())
      : new Date(now.getFullYear() - 99, 0, 1)
    const maxDob = myProfile.age_min
      ? new Date(now.getFullYear() - myProfile.age_min, now.getMonth(), now.getDate())
      : new Date(now.getFullYear() - 18, 0, 1)

    const { data: candidates, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .eq('visible', true)
      .in('gender', genderFilter)
      .gte('date_of_birth', minDob.toISOString().split('T')[0])
      .lte('date_of_birth', maxDob.toISOString().split('T')[0])
      .not('id', 'in', `(${Array.from(excludeIds).join(',')})`)
      .order('last_active', { ascending: false })
      .range(offset, offset + pageLimit * 3)

    if (error) {
      console.error('Discover query error:', error)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ profiles: [], page, total: 0 })
    }

    // ── Score candidates ─────────────────────────────────────────────────────
    const scored = (candidates as any[]).map(candidate => {
      let score = 0
      const reasons: string[] = []

      // 1. Location match (max 40pts)
      if (myProfile.location && candidate.location) {
        const myParts    = myProfile.location.split(',').map((s: string) => s.trim().toLowerCase())
        const theirParts = candidate.location.split(',').map((s: string) => s.trim().toLowerCase())
        if (myParts[0] === theirParts[0]) {
          score += 40
          reasons.push(`Both in ${myParts[0]}`)
        } else if (myParts[myParts.length - 1] === theirParts[theirParts.length - 1]) {
          score += 20
          reasons.push(`Both in ${myParts[myParts.length - 1]}`)
        }
      }

      // 2. Shared interests (max 30pts)
      const myInterests     = new Set((myProfile.interests ?? []).map((i: string) => i.toLowerCase()))
      const sharedInterests = (candidate.interests ?? []).filter((i: string) => myInterests.has(i.toLowerCase()))
      if (sharedInterests.length > 0) {
        score += Math.min(sharedInterests.length * 10, 30)
        reasons.push(`${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}: ${sharedInterests.slice(0, 2).join(', ')}`)
      }

      // 3. Relationship intent (max 20pts)
      const myIntents     = new Set(myProfile.looking_for ?? [])
      const sharedIntents = (candidate.looking_for ?? []).filter((i: string) => myIntents.has(i))
      if (sharedIntents.length > 0) {
        score += 20
        reasons.push(`Both looking for ${sharedIntents[0]}`)
      }

      // 4. Recently active (max 10pts)
      if (candidate.last_active) {
        const days = (Date.now() - new Date(candidate.last_active).getTime()) / 86_400_000
        if (days < 1)      { score += 10; reasons.push('Active today') }
        else if (days < 7) { score += 5;  reasons.push('Active this week') }
      }

      // 5. Profile completeness bonus (max 10pts)
      if (candidate.profile_completeness >= 80)      score += 10
      else if (candidate.profile_completeness >= 50) score += 5

      const age = candidate.date_of_birth
        ? Math.floor((Date.now() - new Date(candidate.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null

      return {
        score,
        reasons,
        profile: {
          id:                   candidate.id,
          username:             candidate.username,
          full_name:            candidate.full_name,
          age,
          gender:               candidate.gender,
          bio:                  candidate.bio,
          location:             candidate.location,
          interests:            candidate.interests   ?? [],
          photos:               candidate.photos      ?? [],
          looking_for:          candidate.looking_for ?? [],
          profile_completeness: candidate.profile_completeness,
          last_active:          candidate.last_active,
        },
      }
    })

    const sorted = scored.sort((a, b) => b.score - a.score).slice(0, pageLimit)

    return NextResponse.json({ profiles: sorted, page, total: sorted.length })

  } catch (error) {
    console.error('Discover error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
