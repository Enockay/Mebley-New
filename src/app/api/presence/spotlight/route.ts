import { NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request as any)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await pgQuery<{ expires_at: string }>(
      `SELECT expires_at FROM boosts
       WHERE user_id = $1 AND boost_type = 'spotlight' AND expires_at > NOW()
       ORDER BY expires_at DESC LIMIT 1`,
      [user.id]
    )
    const row = res.rows[0]
    return NextResponse.json({
      active:    !!row,
      expiresAt: row?.expires_at ?? null,
    })
  } catch (err) {
    console.error('[spotlight/status]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
