/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUserFromRequest } from '@/lib/auth-server'

const sbAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { playerId, platform = 'web' } = await request.json()
    if (!playerId || typeof playerId !== 'string') {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 })
    }

    const { error } = await (sbAdmin() as any)
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
    console.error('[push/subscribe POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await (sbAdmin() as any)
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('[push/subscribe DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
