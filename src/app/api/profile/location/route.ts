import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { latitude, longitude } = await request.json()
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'latitude and longitude required' }, { status: 400 })
    }

    await pgQuery(
      `UPDATE profiles SET latitude = $1, longitude = $2, updated_at = NOW() WHERE id = $3`,
      [latitude, longitude, user.id]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/profile/location error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
