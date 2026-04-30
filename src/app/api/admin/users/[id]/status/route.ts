import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/admin-auth'
import { withPgClient } from '@/lib/postgres'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body as { action?: string }
    if (!action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json({ error: 'action must be "activate" or "deactivate"' }, { status: 400 })
    }

    const { id: userId } = await params
    const isActive = action === 'activate'

    await withPgClient(async (client) => {
      await client.query('BEGIN')
      try {
        const check = await client.query<{ id: string }>(
          'SELECT id FROM app_users WHERE id = $1 LIMIT 1',
          [userId]
        )
        if (!check.rows[0]) throw new Error('NOT_FOUND')

        await client.query(
          'UPDATE app_users SET is_active = $1, updated_at = NOW() WHERE id = $2',
          [isActive, userId]
        )
        await client.query(
          'UPDATE profiles SET is_active = $1, visible = $2, updated_at = NOW() WHERE id = $3',
          [isActive, isActive, userId]
        )
        await client.query(
          `INSERT INTO admin_actions (actor_id, action, target_user_id, metadata)
           VALUES ($1, $2, $3, $4::jsonb)`,
          [
            admin.id,
            isActive ? 'user_reactivate' : 'user_deactivate',
            userId,
            JSON.stringify({ action }),
          ]
        )

        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    console.error('[admin/users/status] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
