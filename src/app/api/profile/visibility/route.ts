import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { visible } = (await request.json()) as { visible?: boolean }
    if (typeof visible !== 'boolean') {
      return NextResponse.json({ error: 'visible must be a boolean' }, { status: 400 })
    }

    await pgQuery(
      'UPDATE profiles SET visible = $1, updated_at = now() WHERE id = $2',
      [visible, user.id]
    )

    return NextResponse.json({ success: true, visible })
  } catch (error) {
    console.error('[profile/visibility] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
