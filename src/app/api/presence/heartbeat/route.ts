import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await pgQuery('UPDATE profiles SET last_active = now() WHERE id = $1', [user.id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('presence heartbeat error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

