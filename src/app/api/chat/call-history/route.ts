import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url   = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30'), 50)

  const result = await pgQuery<{
    id:               string
    conversation_id:  string
    channel_name:     string
    call_type:        string
    status:           string
    started_at:       string
    answered_at:      string | null
    ended_at:         string | null
    duration_seconds: number | null
    caller_id:        string
    callee_id:        string
    caller_name:      string
    caller_photos:    unknown
    callee_name:      string
    callee_photos:    unknown
  }>(
    `SELECT
       ch.id, ch.conversation_id, ch.channel_name,
       ch.call_type, ch.status,
       ch.started_at, ch.answered_at, ch.ended_at, ch.duration_seconds,
       ch.caller_id, ch.callee_id,
       pc.full_name  AS caller_name,
       pc.photos     AS caller_photos,
       pp.full_name  AS callee_name,
       pp.photos     AS callee_photos
     FROM call_history ch
     JOIN profiles pc ON pc.id = ch.caller_id
     JOIN profiles pp ON pp.id = ch.callee_id
     WHERE ch.caller_id = $1 OR ch.callee_id = $1
     ORDER BY ch.started_at DESC
     LIMIT $2`,
    [user.id, limit]
  )

  return NextResponse.json({ calls: result.rows })
}
