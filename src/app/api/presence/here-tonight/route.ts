import { NextRequest, NextResponse } from 'next/server'
import { pgQuery } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const targetId = searchParams.get('userId') ?? user.id

  const res = await pgQuery<{ expires_at: string }>(
    `SELECT expires_at FROM moments
     WHERE sender_id = $1 AND type = 'here_tonight' AND expires_at > NOW()
     ORDER BY expires_at DESC LIMIT 1`,
    [targetId]
  )
  const row = res.rows[0] ?? null

  return NextResponse.json({
    active:    !!row,
    expiresAt: row?.expires_at ?? null,
  })
}
