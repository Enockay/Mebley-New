import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

// GET — fetch unread count + most recent 30 notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [notifRes, countRes] = await Promise.all([
      pgQuery<{
        id: string
        type: string
        title: string
        body: string | null
        data: Record<string, unknown>
        actor_id: string | null
        read_at: string | null
        created_at: string
        actor_username: string | null
        actor_photo: string | null
      }>(
        `
        SELECT
          n.id, n.type, n.title, n.body, n.data, n.actor_id, n.read_at, n.created_at,
          p.username  AS actor_username,
          (p.photos->0->>'url') AS actor_photo
        FROM user_notifications n
        LEFT JOIN profiles p ON p.id = n.actor_id
        WHERE n.user_id = $1
        ORDER BY n.created_at DESC
        LIMIT 30
        `,
        [user.id]
      ),
      pgQuery<{ count: string }>(
        `SELECT COUNT(*) AS count FROM user_notifications WHERE user_id = $1 AND read_at IS NULL`,
        [user.id]
      ),
    ])

    return NextResponse.json({
      notifications: notifRes.rows,
      unreadCount: parseInt(countRes.rows[0]?.count ?? '0', 10),
    })
  } catch (err) {
    console.error('[GET /api/notifications]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — mark notifications as read (body: { ids?: string[] } — omit for "mark all")
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids : undefined

    if (ids && ids.length > 0) {
      await pgQuery(
        `UPDATE user_notifications SET read_at = NOW()
         WHERE user_id = $1 AND id = ANY($2::uuid[]) AND read_at IS NULL`,
        [user.id, ids]
      )
    } else {
      await pgQuery(
        `UPDATE user_notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
        [user.id]
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/notifications]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
