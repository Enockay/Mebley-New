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

    // Rate limit
    const limit = rateLimit(user.id, 'api')
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const pageLimit = parseInt(searchParams.get('limit') ?? '20')
    const offset = (page - 1) * pageLimit

    // Get current user's profile
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!myProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get already liked user IDs
    const { data: likedUsers } = await supabase
      .from('likes')
      .select('likee_id')
      .eq('liker_id', user.id)

    // Get blocked user IDs (both directions)
    const { data: blockedByMe } = await supabase
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', user.id)

    const { data: blockedMe } = await supabase
      .from('blocked_users')
      .select('blocker_id')
      .eq('blocked_id', user.id)

    // Build exclusion list
    const excludeIds = new Set<string>([
      user.id,
      ...(likedUsers?.map(l => l.likee_id) ?? []),
      ...(blockedByMe?.map(b => b.blocked_id) ?? []),
      ...(blockedMe?.map(b => b.blocker_id) ?? []),
    ])

    // Build gender filter
    const genderFilter = myProfile.gender_preference?.length > 0
      ? myProfile.gender_preference
      : ['male', 'female', 'non-binary', 'other']

    // Calculate age range from preferences
    const now = new Date()
    const minDob = myProfile.age_max
      ? new Date(now.getFullYear() - myProfile.age_max, now.getMonth(), now.getDate())
      : new Date(now.getFullYear() - 99, 0, 1)
    const maxDob = myProfile.age_min
      ? new Date(now.getFullYear() - myProfile.age_min, now.getMonth(), now.getDate())
      : new Date(now.getFullYear() - 18, 0, 1)

    // Fetch candidate profiles
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .eq('visible', true)
      .in('gender', genderFilter)
      .gte('date_of_birth', minDob.toISOString().split('T')[0])
      .lte('date_of_birth', maxDob.toISOString().split('T')[0])
      .not('id', 'in', `(${Array.from(excludeIds).join(',')})`)
      .order('last_active', { ascending: false })
      .range(offset, offset + pageLimit * 3) // fetch 3x to allow scoring

    const { data: candidates, error } = await query

    if (error) {
      console.error('Discover query error:', error)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ profiles: [], page, total: 0 })
    }

    // ─── Score each candidate ────────────────────────────────────────────────
    const scored = candidates.map(candidate => {
      let score = 0
      const reasons: string[] = []

      // 1. Location match (max 40pts)
      if (myProfile.location && candidate.location) {
        const myParts = myProfile.location.split(',').map((s: string) => s.trim().toLowerCase())
        const theirParts = candidate.location.split(',').map((s: string) => s.trim().toLowerCase())

        if (myParts[0] === theirParts[0]) {
          score += 40
          reasons.push(`Both in ${myParts[0]}`)
        } else if (myParts[myParts.length - 1] === theirParts[theirParts.length - 1]) {
          score += 20
          reasons.push(`Both in ${myParts[myParts.length - 1]}`)
        }
      }

      // 2. Interests overlap (max 30pts)
      const myInterests = new Set((myProfile.interests ?? []).map((i: string) => i.toLowerCase()))
      const sharedInterests = (candidate.interests ?? [])
        .filter((i: string) => myInterests.has(i.toLowerCase()))

      if (sharedInterests.length > 0) {
        const interestScore = Math.min(sharedInterests.length * 10, 30)
        score += interestScore
        reasons.push(`${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}: ${sharedInterests.slice(0, 2).join(', ')}`)
      }

      // 3. Relationship intent compatibility (max 20pts)
      const myIntents = new Set(myProfile.looking_for ?? [])
      const sharedIntents = (candidate.looking_for ?? [])
        .filter((i: string) => myIntents.has(i))

      if (sharedIntents.length > 0) {
        score += 20
        reasons.push(`Both looking for ${sharedIntents[0]}`)
      }

      // 4. Recently active (max 10pts)
      if (candidate.last_active) {
        const daysSinceActive = (Date.now() - new Date(candidate.last_active).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceActive < 1) {
          score += 10
          reasons.push('Active today')
        } else if (daysSinceActive < 7) {
          score += 5
          reasons.push('Active this week')
        }
      }

      // 5. Profile completeness bonus (max 10pts)
      if (candidate.profile_completeness >= 80) {
        score += 10
      } else if (candidate.profile_completeness >= 50) {
        score += 5
      }

      // Calculate age for display
      const age = candidate.date_of_birth
        ? Math.floor((Date.now() - new Date(candidate.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null

      return {
        score,
        reasons,
        profile: {
          id: candidate.id,
          username: candidate.username,
          full_name: candidate.full_name,
          age,
          gender: candidate.gender,
          bio: candidate.bio,
          location: candidate.location,
          interests: candidate.interests ?? [],
          photos: candidate.photos ?? [],
          looking_for: candidate.looking_for ?? [],
          profile_completeness: candidate.profile_completeness,
          last_active: candidate.last_active,
        }
      }
    })

    // Sort by score descending, take top pageLimit
    const sorted = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, pageLimit)

    return NextResponse.json({
      profiles: sorted,
      page,
      total: sorted.length,
    })

  } catch (error) {
    console.error('Discover error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}