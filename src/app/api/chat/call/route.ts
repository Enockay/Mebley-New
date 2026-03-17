import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channelName } = await req.json()
  if (!channelName) return NextResponse.json({ error: 'Missing channelName' }, { status: 400 })

  const appId       = process.env.NEXT_PUBLIC_AGORA_APP_ID!
  const appCert     = process.env.AGORA_APP_CERTIFICATE!
  const expireTime  = 3600 // 1 hour
  const currentTime = Math.floor(Date.now() / 1000)
  const privilegeExpire = currentTime + expireTime

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId, appCert, channelName, 0, RtcRole.PUBLISHER, privilegeExpire, privilegeExpire
  )

  return NextResponse.json({ token, appId, channelName })
}
