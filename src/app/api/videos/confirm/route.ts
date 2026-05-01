/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { slot, s3Key, cloudfrontUrl, durationSeconds, thumbnailUrl } = await request.json()

    if (![0, 1, 2].includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
    }
    if (durationSeconds < 30 || durationSeconds > 120) {
      return NextResponse.json({ error: 'Video must be between 30 and 120 seconds' }, { status: 400 })
    }

    const res = await pgQuery<Record<string, any>>(
      `INSERT INTO profile_videos
         (user_id, slot, s3_key, cloudfront_url, duration_seconds, thumbnail_url, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
       ON CONFLICT (user_id, slot) DO UPDATE
         SET s3_key           = EXCLUDED.s3_key,
             cloudfront_url   = EXCLUDED.cloudfront_url,
             duration_seconds = EXCLUDED.duration_seconds,
             thumbnail_url    = COALESCE(EXCLUDED.thumbnail_url, profile_videos.thumbnail_url),
             status           = 'active',
             updated_at       = NOW()
       RETURNING *`,
      [user.id, slot, s3Key, cloudfrontUrl, durationSeconds, thumbnailUrl ?? null]
    )

    const video = res.rows[0]
    if (!video) {
      return NextResponse.json({ error: 'Failed to save video record' }, { status: 500 })
    }

    if (slot === 0) {
      await pgQuery('UPDATE profiles SET visible = TRUE WHERE id = $1', [user.id])
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.error('[videos/confirm]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
