// src/app/api/likes/received/route.ts
// Returns profiles who liked the current user but there's no mutual match yet.
// Requires Premium tier — checked server-side to prevent client bypass.
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

type LikerRow = {
  id:        string
  full_name: string
  age_range: string | null
  location:  string | null
  photos:    unknown
  bio:       string | null
  liked_at:  string
}

const PAID_TIERS = ['premium', 'vip']

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Server-side tier check — prevents client-side bypass
    const planRes = await pgQuery<{ plan: string | null }>(
      'SELECT plan FROM profiles WHERE id = $1 LIMIT 1',
      [user.id]
    )
    const plan = planRes.rows[0]?.plan ?? 'free'

    if (!PAID_TIERS.includes(plan)) {
      // Return count only for free/starter users so the UI can show an upgrade prompt
      const countRes = await pgQuery<{ n: string }>(
        `SELECT COUNT(*) AS n
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
      return NextResponse.json({ likers: [], count, locked: true })
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
         l.created_at AS liked_at
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

    return NextResponse.json({ likers: res.rows, count: res.rows.length, locked: false })

  } catch (err) {
    console.error('[likes/received]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
