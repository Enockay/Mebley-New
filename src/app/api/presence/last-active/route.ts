import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const res = await pgQuery<{ last_active: string | null }>(
      'SELECT last_active FROM profiles WHERE id = $1 LIMIT 1',
      [userId]
    )
    const row = res.rows[0]
    return NextResponse.json({ lastActive: row?.last_active ?? null })
  } catch (err) {
    console.error('presence last-active error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

