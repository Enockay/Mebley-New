/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { RtcTokenBuilder, RtcRole } from 'agora-token'
import { notifyIncomingCall } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channelName, conversationId, joining } = await req.json()
  if (!channelName) return NextResponse.json({ error: 'Missing channelName' }, { status: 400 })

  const appId             = process.env.NEXT_PUBLIC_AGORA_APP_ID!
  const appCert           = process.env.AGORA_APP_CERTIFICATE!
  const currentTime       = Math.floor(Date.now() / 1000)
  const privilegeExpire   = currentTime + 3600

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId, appCert, channelName, 0, RtcRole.PUBLISHER, privilegeExpire, privilegeExpire
  )

  // Send incoming call notification to the other user (skip when callee is joining)
  if (conversationId && !joining) {
    try {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: conv } = await admin
        .from('conversations')
        .select('match_id, matches(user1_id, user2_id)')
        .eq('id', conversationId)
        .single()

      if (conv) {
        const match    = conv.matches as any
        const otherId  = match.user1_id === user.id ? match.user2_id : match.user1_id
        const { data: caller } = await admin
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (caller?.full_name) {
          notifyIncomingCall(otherId, caller.full_name, conversationId)
            .catch(err => console.error('[notifyCall]', err))
        }
      }
    } catch (err) {
      console.error('[call notification]', err)
    }
  }

  return NextResponse.json({ token, appId, channelName })
}
