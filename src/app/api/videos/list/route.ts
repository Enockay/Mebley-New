import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await pgQuery<{ slot: number; cloudfront_url: string; duration_seconds: number }>(
      `SELECT slot, cloudfront_url, duration_seconds
       FROM profile_videos
       WHERE user_id = $1 AND status = 'active'
       ORDER BY slot`,
      [user.id]
    )

    return NextResponse.json({ videos: res.rows })
  } catch (err) {
    console.error('GET /api/videos/list error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
