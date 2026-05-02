// src/app/api/likes/received/route.ts
// Returns profiles who liked the current user (no mutual match yet).
// Premium/VIP see the list; Starter/Free can unlock for 24h with credits (see /api/likes/received/unlock).
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'
import { hasWhoLikedYouCreditUnlock } from '@/lib/who-liked-you-unlock'

type LikerRow = {
  id:          string
  full_name:   string
  age_range:   string | null
  location:    string | null
  photos:      unknown
  bio:         string | null
  liked_at:    string
  is_stitch:   boolean
  stitch_note: string | null
}

const PAID_TIERS = ['premium', 'vip']

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Server-side tier check — prevents client-side bypass
    const planRes = await pgQuery<{ plan: string | null }>(
      'SELECT plan FROM profiles WHERE id = $1 LIMIT 1',
      [user.id]
    )
    const plan = planRes.rows[0]?.plan ?? 'free'

    const tierReveal = PAID_TIERS.includes(plan)
    const creditReveal = !tierReveal && (await hasWhoLikedYouCreditUnlock(user.id))

    if (!tierReveal && !creditReveal) {
      // Return count only for free/starter users so the UI can show an upgrade prompt
      const countRes = await pgQuery<{ n: string; latest_liked_at: string | null }>(
        `SELECT COUNT(*)::text AS n,
                MAX(l.created_at)::text AS latest_liked_at
         FROM likes l
         WHERE l.likee_id = $1
           AND NOT EXISTS (
             SELECT 1 FROM matches m
             WHERE (m.user1_id = $1 AND m.user2_id = l.liker_id)
                OR (m.user1_id = l.liker_id AND m.user2_id = $1)
           )
           AND NOT EXISTS (
             SELECT 1 FROM blocked_users b
             WHERE (b.blocker_id = $1 AND b.blocked_id = l.liker_id)
                OR (b.blocker_id = l.liker_id AND b.blocked_id = $1)
           )`,
        [user.id]
      )
      const count = parseInt(countRes.rows[0]?.n ?? '0', 10)
      const latestLikedAt = countRes.rows[0]?.latest_liked_at ?? null
      return NextResponse.json({ likers: [], count, locked: true, latest_liked_at: latestLikedAt })
    }

    // Premium/VIP — return full profiles
    const res = await pgQuery<LikerRow>(
      `SELECT
         p.id,
         p.full_name,
         p.age_range,
         p.location,
         p.photos,
         p.bio,
         l.created_at AS liked_at,
         l.is_stitch,
         l.stitch_note
       FROM likes l
       JOIN profiles p ON p.id = l.liker_id
       WHERE l.likee_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM matches m
           WHERE (m.user1_id = $1 AND m.user2_id = l.liker_id)
              OR (m.user1_id = l.liker_id AND m.user2_id = $1)
         )
         AND NOT EXISTS (
           SELECT 1 FROM blocked_users b
           WHERE (b.blocker_id = $1 AND b.blocked_id = l.liker_id)
              OR (b.blocker_id = l.liker_id AND b.blocked_id = $1)
         )
       ORDER BY l.created_at DESC
       LIMIT 50`,
      [user.id]
    )

    const latestLikedAt = res.rows[0]?.liked_at ?? null
    return NextResponse.json({
      likers: res.rows,
      count:  res.rows.length,
      locked: false,
      latest_liked_at: latestLikedAt,
    })

  } catch (err) {
    console.error('[likes/received]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
