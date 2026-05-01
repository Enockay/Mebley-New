/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { playerId, platform = 'web' } = await request.json()
    if (!playerId || typeof playerId !== 'string') {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 })
    }

    await pgQuery(
      `INSERT INTO push_subscriptions (user_id, onesignal_player_id, platform, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, platform) DO UPDATE
         SET onesignal_player_id = EXCLUDED.onesignal_player_id,
             updated_at = NOW()`,
      [user.id, playerId, platform]
    )

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

    await pgQuery(`DELETE FROM push_subscriptions WHERE user_id = $1`, [user.id])

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[push/subscribe DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
