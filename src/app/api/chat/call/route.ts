/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'
import { RtcTokenBuilder, RtcRole } from 'agora-token'
import { notifyIncomingCall } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channelName, conversationId, joining } = await req.json()
  if (!channelName) return NextResponse.json({ error: 'Missing channelName' }, { status: 400 })

  const appId           = process.env.NEXT_PUBLIC_AGORA_APP_ID!
  const appCert         = process.env.AGORA_APP_CERTIFICATE!
  const currentTime     = Math.floor(Date.now() / 1000)
  const privilegeExpire = currentTime + 3600

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId, appCert, channelName, 0, RtcRole.PUBLISHER, privilegeExpire, privilegeExpire
  )

  // Notify the other participant (skip when callee is joining)
  if (conversationId && !joining) {
    try {
      const convRes = await pgQuery<{ match_id: string }>(
        'SELECT match_id FROM conversations WHERE id = $1 LIMIT 1',
        [conversationId]
      )
      const conv = convRes.rows[0]

      if (conv?.match_id) {
        const matchRes = await pgQuery<{ user1_id: string; user2_id: string }>(
          'SELECT user1_id, user2_id FROM matches WHERE id = $1 LIMIT 1',
          [conv.match_id]
        )
        const match = matchRes.rows[0]

        if (match) {
          const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id
          const callerRes = await pgQuery<{ full_name: string }>(
            'SELECT full_name FROM profiles WHERE id = $1 LIMIT 1',
            [user.id]
          )
          const callerName = callerRes.rows[0]?.full_name
          if (callerName) {
            notifyIncomingCall(otherId, callerName, conversationId)
              .catch(err => console.error('[notifyCall]', err))
          }
        }
      }
    } catch (err) {
      console.error('[call notification]', err)
    }
  }

  return NextResponse.json({ token, appId, channelName })
}
