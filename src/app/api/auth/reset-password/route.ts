/**
 * POST /api/auth/reset-password
 * Validates a reset token and updates the user's password.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { pgQuery } from '@/lib/postgres'
import { hashPassword } from '@/lib/auth-server'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ success: false, message: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const tokenHash = createHash('sha256').update(token).digest('hex')

    const res = await pgQuery<{ id: string; user_id: string; expires_at: string; used: boolean }>(
      `SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token_hash = $1 LIMIT 1`,
      [tokenHash]
    )
    const record = res.rows[0]

    if (!record) {
      return NextResponse.json({ success: false, message: 'Invalid or expired reset link' }, { status: 400 })
    }
    if (record.used) {
      return NextResponse.json({ success: false, message: 'This reset link has already been used' }, { status: 400 })
    }
    if (new Date(record.expires_at) < new Date()) {
      await pgQuery(`DELETE FROM password_reset_tokens WHERE id = $1`, [record.id])
      return NextResponse.json({ success: false, message: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    // Update password and mark token used
    await Promise.all([
      pgQuery(`UPDATE app_users SET password_hash = $1 WHERE id = $2`, [passwordHash, record.user_id]),
      pgQuery(`UPDATE password_reset_tokens SET used = true WHERE id = $1`, [record.id]),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
