/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'
import { pgQuery } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'

type DiscoverProfileRow = {
  id: string
  username: string
  full_name: string
  age_range: string | null
  gender: string
  bio: string | null
  location: string | null
  nationality: string | null
  latitude: number | null
  longitude: number | null
  interests: string[] | null
  photos: unknown[] | null
  looking_for: string[] | null
  prompts: unknown[] | null
  profile_completeness: number | null
  last_active: string | null
  age_min: number | null
  age_max: number | null
  distance_max: number | null
  gender_preference: string[] | null
}

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
    const user = await getAuthUserFromRequest(request)

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

    const myProfileRes = await pgQuery<DiscoverProfileRow>(
      'SELECT * FROM profiles WHERE id = $1 LIMIT 1',
      [user.id]
    )
    const myProfileRaw = myProfileRes.rows[0]
    if (!myProfileRaw) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const myProfile = myProfileRaw as any

    const myLat         = myProfile.latitude  ? parseFloat(myProfile.latitude)  : null
    const myLng         = myProfile.longitude ? parseFloat(myProfile.longitude) : null
    const myDistanceMax = myProfile.distance_max ?? 500

    // ── Passed IDs — exclude from results (server-side, permanent) ───────────
    // This is the key change: passes are now fetched from the DB so they
    // survive page refreshes and new sessions. Previously passes were
    // client-only and reset on every visit.
    const passedUsersRes = await pgQuery<{ passed_id: string }>(
      'SELECT passed_id FROM passes WHERE passer_id = $1',
      [user.id]
    )

    // ── Blocked IDs — exclude from results ────────────────────────────────────
    const blockedUsersRes = await pgQuery<{ blocked_id: string }>(
      'SELECT blocked_id FROM blocked_users WHERE blocker_id = $1',
      [user.id]
    )

    // ── Already matched/chatted IDs — exclude from discover ───────────────────
    const matchedUsersRes = await pgQuery<{ other_id: string }>(
      `
      SELECT CASE WHEN user1_id = $1 THEN user2_id ELSE user1_id END AS other_id
      FROM matches
      WHERE user1_id = $1 OR user2_id = $1
      `,
      [user.id]
    )

    const excludeIds = new Set<string>([
      user.id,
      ...passedUsersRes.rows.map((p) => p.passed_id),
      ...blockedUsersRes.rows.map((b) => b.blocked_id),
      ...matchedUsersRes.rows.map((m) => m.other_id),
    ])

    // ── Gender preference filter ──────────────────────────────────────────────
    const genderFilter = myProfile.gender_preference?.length > 0
      ? myProfile.gender_preference
      : ['male', 'female', 'non-binary', 'other']

    const prefMin = myProfile.age_min ?? 18
    const prefMax = myProfile.age_max ?? 99

    // ── Base query ────────────────────────────────────────────────────────────
    const sqlParams: unknown[] = []
    const bind = (value: unknown): string => {
      sqlParams.push(value)
      return `$${sqlParams.length}`
    }

    const where: string[] = [
      'p.is_active = true',
      'p.visible = true',
      'au.is_active = true',
      `p.gender = ANY(${bind(genderFilter)}::text[])`,
      'p.age_range IS NOT NULL',
      "p.age_range <> 'under_18'",
      `NOT (p.id = ANY(${bind(Array.from(excludeIds))}::uuid[]))`,
    ]

    if (myProfile.gender) {
      where.push(`p.gender_preference @> ${bind([myProfile.gender])}::text[]`)
    }
    if (filterLocation) {
      where.push(`p.location ILIKE ${bind(`%${filterLocation}%`)}`)
    }
    if (intentList.length > 0) {
      where.push(`p.looking_for && ${bind(intentList)}::text[]`)
    }
    if (interestList.length > 0) {
      where.push(`p.interests && ${bind(interestList)}::text[]`)
    }
    if (ageRangeList.length > 0) {
      where.push(`p.age_range = ANY(${bind(ageRangeList)}::text[])`)
    }

    const candidatesRes = await pgQuery<DiscoverProfileRow>(
      `
      SELECT p.*
      FROM profiles p
      JOIN app_users au ON au.id = p.id
      WHERE ${where.join(' AND ')}
      ORDER BY p.last_active DESC NULLS LAST
      OFFSET ${bind(offset)}
      LIMIT ${bind(pageLimit * 3)}
      `,
      sqlParams
    )
    const candidates = candidatesRes.rows

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
            photo_verified:       (candidate as any).photo_verified ?? false,
            voice_note_url:       (candidate as any).voice_note_url ?? null,
          },
        }
      })
      .filter(Boolean)

    // Spotlight boost: bump spotlighted profiles to top, then sort by score
    const sorted = scored
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, pageLimit)

    // ── Batch flag queries (here_tonight + spotlight) ─────────────────────────
    const sortedIds = sorted.map((s: any) => s.profile.id)
    let hereTonightSet = new Set<string>()
    let spotlightSet   = new Set<string>()
    const likeCountMap = new Map<string, number>()

    if (sortedIds.length > 0) {
      const [htRes, spotRes, likeRes] = await Promise.all([
        pgQuery<{ sender_id: string }>(
          `SELECT DISTINCT sender_id FROM moments
           WHERE type = 'here_tonight' AND expires_at > NOW() AND sender_id = ANY($1::uuid[])`,
          [sortedIds]
        ),
        pgQuery<{ user_id: string }>(
          `SELECT DISTINCT user_id FROM boosts
           WHERE boost_type = 'spotlight' AND expires_at > NOW() AND user_id = ANY($1::uuid[])`,
          [sortedIds]
        ),
        pgQuery<{ likee_id: string; n: string }>(
          `SELECT likee_id, COUNT(*)::text AS n
           FROM likes
           WHERE likee_id = ANY($1::uuid[])
           GROUP BY likee_id`,
          [sortedIds]
        ),
      ])
      hereTonightSet = new Set(htRes.rows.map(r => r.sender_id))
      spotlightSet   = new Set(spotRes.rows.map(r => r.user_id))
      for (const row of likeRes.rows) {
        likeCountMap.set(row.likee_id, parseInt(row.n, 10))
      }
    }

    // Re-sort: spotlight profiles first (they paid for visibility), then by score
    const withFlags = sorted
      .map((s: any) => ({
        ...s,
        profile: {
          ...s.profile,
          here_tonight: hereTonightSet.has(s.profile.id),
          spotlight:    spotlightSet.has(s.profile.id),
          received_likes_count: likeCountMap.get(s.profile.id) ?? 0,
        },
      }))
      .sort((a: any, b: any) => {
        if (a.profile.spotlight && !b.profile.spotlight) return -1
        if (!a.profile.spotlight && b.profile.spotlight) return 1
        return b.score - a.score
      })

    return NextResponse.json({ profiles: withFlags, page, total: withFlags.length })

  } catch (error) {
    console.error('Discover error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
