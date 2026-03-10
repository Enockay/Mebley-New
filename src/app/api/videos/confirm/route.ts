import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { slot, s3Key, cloudfrontUrl, durationSeconds } = body

    if (![0, 1, 2].includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
    }

    if (durationSeconds < 30 || durationSeconds > 120) {
      return NextResponse.json({
        error: 'Video must be between 30 and 120 seconds'
      }, { status: 400 })
    }

    // Cast to any — profile_videos exists in the DB but is not yet
    // present in the auto-generated Supabase TypeScript types file.
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
      }, {
        onConflict: 'user_id,slot'
      })
      .select()
      .single()

    if (error) {
      console.error('Confirm video error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If this is the intro video (slot 0), make profile visible
    // Cast to any — `visible` exists in DB but is missing from generated types
    if (slot === 0) {
      await (supabase as any)
        .from('profiles')
        .update({ visible: true })
        .eq('id', user.id)
    }

    return NextResponse.json({ video: data })

  } catch (error) {
    console.error('Confirm error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
