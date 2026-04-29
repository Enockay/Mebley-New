/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/likes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'
import { notifyMatch, notifyLike } from '@/lib/notifications'
import { withPgClient } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'

type BasicProfileRow = {
  full_name: string
  photos: unknown[] | null
  tier: string | null
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit — max 100 likes per minute
    const limit = rateLimit(user.id, 'likes')
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many requests', resetIn: limit.resetIn },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { likeeId, stitch = false, note = '' } = body

    if (!likeeId || typeof likeeId !== 'string') {
      return NextResponse.json({ error: 'likeeId is required' }, { status: 400 })
    }

    if (likeeId === user.id) {
      return NextResponse.json({ error: 'Cannot like yourself' }, { status: 400 })
    }

    // Stitch note validation
    const isStitch   = stitch === true
    const stitchNote = isStitch ? String(note ?? '').slice(0, 280).trim() : null
    if (isStitch && !stitchNote) {
      return NextResponse.json({ error: 'A Stitch requires a personal note' }, { status: 400 })
    }

    // Fetch both profiles in parallel
    const [likerRes, likeeRes] = await Promise.all([
      withPgClient((client) =>
        client.query<BasicProfileRow>(
          'SELECT full_name, photos, tier FROM profiles WHERE id = $1 LIMIT 1',
          [user.id]
        )
      ),
      withPgClient((client) =>
        client.query<BasicProfileRow>(
          'SELECT full_name, photos, tier FROM profiles WHERE id = $1 LIMIT 1',
          [likeeId]
        )
      ),
    ])

    const likerProfile = likerRes.rows[0]
    const likeeProfile = likeeRes.rows[0]

    if (!likerProfile || !likeeProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let isMatch = false
    let conversationId: string | null = null

    const likeResult = await withPgClient(async (client) => {
      await client.query('BEGIN')
      try {
        // Insert like — on conflict update stitch fields if this is an upgrade to a Stitch
        await client.query(
          `INSERT INTO likes (liker_id, likee_id, is_stitch, stitch_note)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (liker_id, likee_id) DO UPDATE
             SET is_stitch   = EXCLUDED.is_stitch,
                 stitch_note = EXCLUDED.stitch_note`,
          [user.id, likeeId, isStitch, stitchNote]
        )

        // Check for mutual like
        const mutualRes = await client.query<{ id: string }>(
          `SELECT id FROM likes WHERE liker_id = $1 AND likee_id = $2 LIMIT 1`,
          [likeeId, user.id]
        )

        if (mutualRes.rowCount && mutualRes.rowCount > 0) {
          isMatch = true
          const [u1, u2] = user.id < likeeId ? [user.id, likeeId] : [likeeId, user.id]

          const matchRes = await client.query<{ id: string }>(
            `INSERT INTO matches (user1_id, user2_id)
             VALUES ($1, $2)
             ON CONFLICT (user1_id, user2_id)
             DO UPDATE SET user1_id = EXCLUDED.user1_id
             RETURNING id`,
            [u1, u2]
          )
          const matchId = matchRes.rows[0]?.id

          if (matchId) {
            const convoRes = await client.query<{ id: string }>(
              `INSERT INTO conversations (match_id)
               VALUES ($1)
               ON CONFLICT (match_id) DO UPDATE SET match_id = EXCLUDED.match_id
               RETURNING id`,
              [matchId]
            )
            conversationId = convoRes.rows[0]?.id ?? null
          }
        }

        await client.query('COMMIT')
        return { isMatch }
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    })

    if (likeResult.isMatch) {
      notifyMatch(
        user.id,
        likeeId,
        likerProfile.full_name,
        likeeProfile.full_name,
      ).catch(err => console.error('[notifyMatch] failed:', err))
    } else {
      const likerPhotoUrl = Array.isArray(likerProfile.photos) && likerProfile.photos.length > 0
        ? (likerProfile.photos[0] as any)?.url ?? null
        : null

      notifyLike(
        likeeId,
        likerProfile.full_name,
        likerPhotoUrl,
        likeeProfile.tier ?? 'free',
      ).catch(err => console.error('[notifyLike] failed:', err))
    }

    return NextResponse.json({
      success: true,
      isMatch,
      isStitch,
      conversationId,
      matchedProfile: isMatch ? {
        full_name: likeeProfile.full_name,
        photos:    likeeProfile.photos,
      } : null,
    }, { status: 201 })

  } catch (error) {
    console.error('POST /api/likes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
