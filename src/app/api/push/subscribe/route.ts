/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/push/subscribe/route.ts
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
    const { playerId, platform = 'web' } = body

    if (!playerId || typeof playerId !== 'string') {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 })
    }

    // Upsert — one row per user per platform
    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .upsert(
        {
          user_id:             user.id,
          onesignal_player_id: playerId,
          platform,
          updated_at:          new Date().toISOString(),
        },
        { onConflict: 'user_id,platform' }
      )

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('POST /api/push/subscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('DELETE /api/push/subscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
