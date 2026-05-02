import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/admin-auth'
import { pgQuery } from '@/lib/postgres'

const ALLOWED_ACTIONS = [
  'moderation_ban',
  'moderation_dismiss',
  'credits_admin_grant',
  'credits_admin_remove',
  'user_deactivate',
  'user_reactivate',
  'verification_approved',
  'verification_rejected',
] as const

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sp = request.nextUrl.searchParams
    const rawLimit = Number.parseInt(sp.get('limit') ?? '50', 10)
    const rawOffset = Number.parseInt(sp.get('offset') ?? '0', 10)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0
    const actionFilter = sp.get('action')?.trim() ?? null

    const conditions: string[] = []
    const params: unknown[] = []
    let n = 1

    if (actionFilter && (ALLOWED_ACTIONS as readonly string[]).includes(actionFilter)) {
      conditions.push(`aa.action = $${n}`)
      params.push(actionFilter)
      n++
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRes = await pgQuery<{ c: number }>(
      `
      SELECT COUNT(*)::int AS c
      FROM admin_actions aa
      ${whereSql}
      `,
      params
    )
    const total = countRes.rows[0]?.c ?? 0

    params.push(limit, offset)
    const listRes = await pgQuery<{
      id: string
      action: string
      metadata: Record<string, unknown>
      created_at: string
      actor_id: string
      actor_email: string
      target_user_id: string | null
      target_full_name: string | null
    }>(
      `
      SELECT
        aa.id,
        aa.action,
        aa.metadata,
        aa.created_at,
        aa.actor_id,
        au.email::text AS actor_email,
        aa.target_user_id,
        p.full_name AS target_full_name
      FROM admin_actions aa
      INNER JOIN app_users au ON au.id = aa.actor_id
      LEFT JOIN profiles p ON p.id = aa.target_user_id
      ${whereSql}
      ORDER BY aa.created_at DESC
      LIMIT $${n} OFFSET $${n + 1}
      `,
      params
    )

    const items = listRes.rows.map((row) => ({
      id: row.id,
      action: row.action,
      created_at: row.created_at,
      actor: { id: row.actor_id, email: row.actor_email },
      target_user:
        row.target_user_id != null
          ? {
              id: row.target_user_id,
              full_name: row.target_full_name,
            }
          : null,
      metadata: row.metadata ?? {},
    }))

    return NextResponse.json({ items, total, limit, offset })
  } catch (error) {
    console.error('[admin/actions] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
