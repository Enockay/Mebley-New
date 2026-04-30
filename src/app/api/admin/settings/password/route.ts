import { NextRequest, NextResponse } from 'next/server'
import {
  AUTH_SESSION_COOKIE_NAME,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from '@/lib/auth-server'
import { getAdminUserFromRequest } from '@/lib/admin-auth'
import { withPgClient } from '@/lib/postgres'

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      currentPassword?: unknown
      newPassword?: unknown
    }

    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'New password must differ from current' }, { status: 400 })
    }

    const rawToken = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value ?? ''
    if (!rawToken) {
      return NextResponse.json({ error: 'Session missing' }, { status: 401 })
    }
    const tokenHash = hashSessionToken(rawToken)

    const userRes = await withPgClient(async (client) => {
      await client.query('BEGIN')
      const ur = await client.query<{ password_hash: string }>(
        'SELECT password_hash FROM app_users WHERE id = $1 LIMIT 1 FOR UPDATE',
        [admin.id]
      )
      const row = ur.rows[0]
      if (!row) {
        await client.query('ROLLBACK')
        return { ok: false as const, code: 'NOT_FOUND' as const }
      }

      const ok = await verifyPassword(currentPassword, row.password_hash)
      if (!ok) {
        await client.query('ROLLBACK')
        return { ok: false as const, code: 'BAD_CURRENT' as const }
      }

      const nextHash = await hashPassword(newPassword)
      await client.query(
        `UPDATE app_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [nextHash, admin.id]
      )

      await client.query(
        `DELETE FROM auth_sessions WHERE user_id = $1 AND token_hash <> $2`,
        [admin.id, tokenHash]
      )

      await client.query('COMMIT')
      return { ok: true as const }
    })

    if (!userRes.ok) {
      if (userRes.code === 'NOT_FOUND') {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin/settings/password]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
