import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rateLimit'

// ── Age range overlap helper ─────────────────────────────────────────────────
const AGE_RANGE_MAP: Record<string, [number, number]> = {
  'under_18': [0,  17],
  '18_24':    [18, 24],
  '25_34':    [25, 34],
  '35_40':    [35, 40],
  '40_50':    [40, 50],
  '50_65':    [50, 65],
  '65_plus':  [65, 99],
}

function ageRangeMatches(
  candidateRange: string,
  prefMin: number,
  prefMax: number
): boolean {
  const bounds = AGE_RANGE_MAP[candidateRange]
  if (!bounds) return false
  const [cMin, cMax] = bounds
  return cMax >= prefMin && cMin <= prefMax
}

// ── Distance scoring bands (km) ──────────────────────────────────────────────
function distanceScore(km: number): { points: number; label: string } {
  if (km <= 10)  return { points: 40, label: 'Less than 10km away' }
  if (km <= 50)  return { points: 35, label: 'Within 50km' }
  if (km <= 100) return { points: 28, label: 'Within 100km' }
  if (km <= 200) return { points: 20, label: 'Within 200km' }
  if (km <= 500) return { points: 12, label: 'Within 500km' }
  return { points: 5, label: 'Far away' }
}

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

    // ── Filter params from browse page ───────────────────────────────────────
    const filterLocation  = searchParams.get('location')?.trim()  ?? ''
    const filterIntents   = searchParams.get('intents')
    const filterInterests = searchParams.get('interests')
    const filterAgeRanges = searchParams.get('ageRanges')

    const intentList   = filterIntents   ? filterIntents.split(',').filter(Boolean)   : []
    const interestList = filterInterests ? filterInterests.split(',').filter(Boolean) : []
    const ageRangeList = filterAgeRanges ? filterAgeRanges.split(',').filter(Boolean) : []

    const { data: myProfileRaw } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!myProfileRaw) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const myProfile = myProfileRaw as any

    const myLat         = myProfile.latitude  ? parseFloat(myProfile.latitude)  : null
    const myLng         = myProfile.longitude ? parseFloat(myProfile.longitude) : null
    const myDistanceMax = myProfile.distance_max ?? 500

    // ── Liked IDs — exclude from results ─────────────────────────────────────
    const { data: likedUsers } = await supabase
      .from('likes')
      .select('likee_id')
      .eq('liker_id', user.id)

    // ── Passed IDs — exclude from results (server-side, permanent) ───────────
    // This is the key change: passes are now fetched from the DB so they
    // survive page refreshes and new sessions. Previously passes were
    // client-only and reset on every visit.
    const { data: passedUsers } = await (supabase as any)
      .from('passes')
      .select('passed_id')
      .eq('passer_id', user.id)

    // ── Blocked IDs — exclude from results ────────────────────────────────────
    const { data: blockedUsers } = await (supabase as any)
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', user.id)

    const excludeIds = new Set<string>([
      user.id,
      ...(likedUsers   ?.map((l: any) => l.likee_id)  ?? []),
      ...(passedUsers  ?.map((p: any) => p.passed_id) ?? []),
      ...(blockedUsers ?.map((b: any) => b.blocked_id) ?? []),
    ])

    // ── Gender preference filter ──────────────────────────────────────────────
    const genderFilter = myProfile.gender_preference?.length > 0
      ? myProfile.gender_preference
      : ['male', 'female', 'non-binary', 'other']

    const prefMin = myProfile.age_min ?? 18
    const prefMax = myProfile.age_max ?? 99

    // ── Base query ────────────────────────────────────────────────────────────
    let query = (supabase as any)
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .eq('visible', true)
      .in('gender', genderFilter)
      .contains('gender_preference', myProfile.gender ? [myProfile.gender] : [])
      .not('id', 'in', `(${Array.from(excludeIds).join(',')})`)
      .neq('age_range', 'under_18')
      .not('age_range', 'is', null)
      .order('last_active', { ascending: false })
      .range(offset, offset + pageLimit * 3)

    // ── Optional filters ──────────────────────────────────────────────────────
    if (filterLocation) {
      query = query.ilike('location', `%${filterLocation}%`)
    }
    if (intentList.length > 0) {
      query = query.overlaps('looking_for', intentList)
    }
    if (interestList.length > 0) {
      query = query.overlaps('interests', interestList)
    }
    if (ageRangeList.length > 0) {
      query = query.in('age_range', ageRangeList)
    }

    const { data: candidates, error } = await query

    if (error) {
      console.error('Discover query error:', error)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ profiles: [], page, total: 0 })
    }

    // ── Score + filter candidates ─────────────────────────────────────────────
    const scored = (candidates as any[])
      .filter(candidate => {
        if (candidate.age_range && !ageRangeMatches(candidate.age_range, prefMin, prefMax)) {
          return false
        }
        return true
      })
      .map(candidate => {
        let score = 0
        const reasons: string[] = []

        const candLat = candidate.latitude  ? parseFloat(candidate.latitude)  : null
        const candLng = candidate.longitude ? parseFloat(candidate.longitude) : null

        // ── 1. Location score (max 40pts) ─────────────────────────────────────
        if (myLat && myLng && candLat && candLng) {
          const R    = 6371
          const dLat = (candLat - myLat) * Math.PI / 180
          const dLng = (candLng - myLng) * Math.PI / 180
          const a    =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(myLat * Math.PI / 180) *
            Math.cos(candLat * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2
          const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

          if (km > myDistanceMax) return null

          const { points, label } = distanceScore(km)
          score += points
          reasons.push(label)

        } else if (myProfile.location && candidate.location) {
          const myParts    = myProfile.location.split(',').map((s: string) => s.trim().toLowerCase())
          const theirParts = candidate.location.split(',').map((s: string) => s.trim().toLowerCase())
          if (myParts[0] === theirParts[0]) {
            score += 30
            reasons.push(`Both in ${myParts[0]}`)
          } else if (myParts[myParts.length - 1] === theirParts[theirParts.length - 1]) {
            score += 15
            reasons.push(`Both in ${myParts[myParts.length - 1]}`)
          }
        }

        // ── 2. Shared interests (max 30pts) ───────────────────────────────────
        const myInterests     = new Set((myProfile.interests ?? []).map((i: string) => i.toLowerCase()))
        const sharedInterests = (candidate.interests ?? []).filter((i: string) => myInterests.has(i.toLowerCase()))
        if (sharedInterests.length > 0) {
          score += Math.min(sharedInterests.length * 10, 30)
          reasons.push(`${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}: ${sharedInterests.slice(0, 2).join(', ')}`)
        }

        // ── 3. Relationship intent (max 20pts) ────────────────────────────────
        const myIntents     = new Set(myProfile.looking_for ?? [])
        const sharedIntents = (candidate.looking_for ?? []).filter((i: string) => myIntents.has(i))
        if (sharedIntents.length > 0) {
          score += 20
          reasons.push(`Both looking for ${sharedIntents[0]}`)
        }

        // ── 4. Recently active (max 10pts) ────────────────────────────────────
        if (candidate.last_active) {
          const days = (Date.now() - new Date(candidate.last_active).getTime()) / 86_400_000
          if (days < 1)      { score += 10; reasons.push('Active today') }
          else if (days < 7) { score += 5;  reasons.push('Active this week') }
        }

        // ── 5. Profile completeness bonus (max 10pts) ─────────────────────────
        if (candidate.profile_completeness >= 80)      score += 10
        else if (candidate.profile_completeness >= 50) score += 5

        // ── 6. Has photos bonus (5pts) ────────────────────────────────────────
        if (Array.isArray(candidate.photos) && candidate.photos.length > 0) {
          score += 5
        }

        // ── 7. Nationality match bonus (5pts) ─────────────────────────────────
        if (
          myProfile.nationality &&
          candidate.nationality &&
          myProfile.nationality.toLowerCase().trim() === candidate.nationality.toLowerCase().trim()
        ) {
          score += 5
          reasons.push(`Both ${candidate.nationality}`)
        }

        // ── 8. Has prompts bonus (5pts) ───────────────────────────────────────
        const candidatePrompts = Array.isArray(candidate.prompts)
          ? candidate.prompts.filter(Boolean)
          : []
        if (candidatePrompts.length > 0) {
          score += 5
        }

        return {
          score,
          reasons,
          profile: {
            id:                   candidate.id,
            username:             candidate.username,
            full_name:            candidate.full_name,
            age_range:            candidate.age_range,
            gender:               candidate.gender,
            bio:                  candidate.bio,
            location:             candidate.location,
            nationality:          candidate.nationality,
            latitude:             candLat,
            longitude:            candLng,
            interests:            candidate.interests        ?? [],
            photos:               candidate.photos           ?? [],
            looking_for:          candidate.looking_for      ?? [],
            prompts:              candidatePrompts,
            profile_completeness: candidate.profile_completeness,
            last_active:          candidate.last_active,
          },
        }
      })
      .filter(Boolean)

    const sorted = scored
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, pageLimit)

    return NextResponse.json({ profiles: sorted, page, total: sorted.length })

  } catch (error) {
    console.error('Discover error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
