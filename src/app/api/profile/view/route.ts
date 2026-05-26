import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { withPgClient, pgQuery } from '@/lib/postgres'
import { notifyProfileView } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const viewedId: string = body?.viewedId
    if (!viewedId || typeof viewedId !== 'string') {
      return NextResponse.json({ error: 'viewedId is required' }, { status: 400 })
    }
    if (viewedId === user.id) {
      return NextResponse.json({ ok: true }) // ignore self-views
    }

    // Upsert the view; record whether this is the first view (no previous row)
    const upsertRes = await pgQuery<{ is_new: boolean }>(
      `
      INSERT INTO profile_views (viewer_id, viewed_id)
      VALUES ($1, $2)
      ON CONFLICT (viewer_id, viewed_id)
        DO UPDATE SET created_at = NOW()
      RETURNING (xmax = 0) AS is_new
      `,
      [user.id, viewedId]
    )
    const isNew: boolean = upsertRes.rows[0]?.is_new ?? false

    if (!isNew) {
      // Already notified this viewer before — only notify once per viewer
      return NextResponse.json({ ok: true })
    }

    // Fetch viewer name + photo for the notification
    const viewerRes = await pgQuery<{ full_name: string | null; photos: unknown }>(
      `SELECT full_name, photos FROM profiles WHERE id = $1`,
      [user.id]
    )
    const viewer = viewerRes.rows[0]
    if (!viewer) return NextResponse.json({ ok: true })

    const viewerName  = viewer.full_name ?? 'Someone'
    const viewerPhoto = Array.isArray(viewer.photos) && viewer.photos.length > 0
      ? (viewer.photos[0] as Record<string, string>)?.url ?? null
      : null

    // Insert in-app notification for the viewed user
    await withPgClient(async (client) => {
      // Avoid duplicate notification if one was already sent in the last 24 h
      const recent = await client.query<{ id: string }>(
        `SELECT id FROM user_notifications
         WHERE user_id = $1 AND type = 'profile_view' AND actor_id = $2
           AND created_at > NOW() - INTERVAL '24 hours'
         LIMIT 1`,
        [viewedId, user.id]
      )
      if (recent.rows.length > 0) return

      await client.query(
        `INSERT INTO user_notifications (user_id, type, title, body, actor_id, data)
         VALUES ($1, 'profile_view', $2, $3, $4, $5)`,
        [
          viewedId,
          `${viewerName} viewed your profile`,
          'Tap to see who checked you out',
          user.id,
          JSON.stringify({ viewerId: user.id }),
        ]
      )
    })

    // Fire-and-forget push notification
    notifyProfileView(viewedId, viewerName, user.id, viewerPhoto).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/profile/view]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
