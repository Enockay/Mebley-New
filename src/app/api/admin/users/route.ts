import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/admin-auth'
import { pgQuery } from '@/lib/postgres'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sp = request.nextUrl.searchParams
    const q = sp.get('q')?.trim() ?? ''
    const rawLimit = parseInt(sp.get('limit') ?? '50', 10)
    const rawOffset = parseInt(sp.get('offset') ?? '0', 10)
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 50 : rawLimit), 100)
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset)

    type UserRow = {
      id: string
      email: string
      is_active: boolean
      email_verified: boolean
      created_at: string
      full_name: string | null
      username: string | null
      tier: string | null
      last_active: string | null
      credit_balance: number | null
      bio: string | null
      gender: string | null
      age_range: string | null
      location: string | null
      nationality: string | null
      interests: string[]
      looking_for: string[]
      photos: unknown
      prompts: unknown
      profile_completeness: number | null
      visibility: string | null
      visible: boolean | null
      gender_preference: string[] | null
      plan: string | null
      plan_expires: string | null
      likes_received: string
      likes_sent: string
      matches_count: string
    }

    const baseSelect = `
      SELECT
        u.id,
        u.email::text AS email,
        u.is_active,
        u.email_verified,
        u.created_at,
        p.full_name,
        p.username,
        p.tier,
        p.last_active,
        cw.balance AS credit_balance,
        p.bio,
        p.gender,
        p.age_range,
        p.location,
        p.nationality,
        COALESCE(p.interests, '{}') AS interests,
        COALESCE(p.looking_for, '{}') AS looking_for,
        COALESCE(p.photos, '[]'::jsonb) AS photos,
        COALESCE(p.prompts, '[]'::jsonb) AS prompts,
        p.profile_completeness,
        p.visibility,
        p.visible,
        p.gender_preference,
        p.plan,
        p.plan_expires,
        (SELECT COUNT(*)::text FROM likes WHERE likee_id = u.id) AS likes_received,
        (SELECT COUNT(*)::text FROM likes WHERE liker_id = u.id) AS likes_sent,
        (SELECT COUNT(*)::text FROM matches WHERE user1_id = u.id OR user2_id = u.id) AS matches_count
      FROM app_users u
      LEFT JOIN profiles p ON p.id = u.id
      LEFT JOIN credit_wallets cw ON cw.user_id = u.id
    `

    let users: UserRow[]
    let total: number

    if (q) {
      const like = `%${q.toLowerCase()}%`
      const res = await pgQuery<UserRow>(
        `${baseSelect}
        WHERE LOWER(u.email::text) LIKE $1
           OR LOWER(p.username) LIKE $1
           OR LOWER(p.full_name) LIKE $1
        ORDER BY u.created_at DESC
        LIMIT $2 OFFSET $3`,
        [like, limit, offset]
      )
      users = res.rows

      const countRes = await pgQuery<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM app_users u
         LEFT JOIN profiles p ON p.id = u.id
         WHERE LOWER(u.email::text) LIKE $1
            OR LOWER(p.username) LIKE $1
            OR LOWER(p.full_name) LIKE $1`,
        [like]
      )
      total = parseInt(countRes.rows[0]?.count ?? '0', 10)
    } else {
      const res = await pgQuery<UserRow>(
        `${baseSelect}
        ORDER BY u.created_at DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      )
      users = res.rows

      const countRes = await pgQuery<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM app_users'
      )
      total = parseInt(countRes.rows[0]?.count ?? '0', 10)
    }

    const normalized = users.map((u) => ({
      ...u,
      likes_received: parseInt(u.likes_received ?? '0', 10),
      likes_sent: parseInt(u.likes_sent ?? '0', 10),
      matches_count: parseInt(u.matches_count ?? '0', 10),
    }))

    return NextResponse.json({ users: normalized, total, limit, offset })
  } catch (error) {
    console.error('[admin/users] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
