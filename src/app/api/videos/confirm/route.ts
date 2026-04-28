/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

const sbAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { slot, s3Key, cloudfrontUrl, durationSeconds } = await request.json()

    if (![0, 1, 2].includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
    }
    if (durationSeconds < 30 || durationSeconds > 120) {
      return NextResponse.json({ error: 'Video must be between 30 and 120 seconds' }, { status: 400 })
    }

    // profile_videos lives in Supabase
    const supabase = sbAdmin()
    const { data, error } = await (supabase as any)
      .from('profile_videos')
      .upsert({
        user_id:          user.id,
        slot,
        s3_key:           s3Key,
        cloudfront_url:   cloudfrontUrl,
        duration_seconds: durationSeconds,
        status:           'active',
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'user_id,slot' })
      .select()
      .single()

    if (error) {
      console.error('[videos/confirm]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // profiles lives in primary Postgres
    if (slot === 0) {
      await pgQuery('UPDATE profiles SET visible = TRUE WHERE id = $1', [user.id])
    }

    return NextResponse.json({ video: data })

  } catch (error) {
    console.error('[videos/confirm]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
