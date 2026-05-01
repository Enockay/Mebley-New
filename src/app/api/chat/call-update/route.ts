import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

type CallStatus = 'answered' | 'missed' | 'declined' | 'ended'

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channelName, status, durationSeconds } = await req.json() as {
    channelName:      string
    status:           CallStatus
    durationSeconds?: number
  }

  if (!channelName || !status) {
    return NextResponse.json({ error: 'channelName and status are required' }, { status: 400 })
  }

  const VALID: CallStatus[] = ['answered', 'missed', 'declined', 'ended']
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const isTerminal = ['missed', 'declined', 'ended'].includes(status)

  await pgQuery(
    `UPDATE call_history
     SET
       status           = $1,
       answered_at      = CASE WHEN $2::boolean THEN $3::timestamptz ELSE answered_at END,
       ended_at         = CASE WHEN $4::boolean THEN $3::timestamptz ELSE ended_at END,
       duration_seconds = CASE WHEN $5 IS NOT NULL THEN $5::int ELSE duration_seconds END
     WHERE channel_name = $6
       AND (caller_id = $7 OR callee_id = $7)
       AND started_at > NOW() - INTERVAL '4 hours'`,
    [
      status,
      status === 'answered',
      now,
      isTerminal,
      durationSeconds ?? null,
      channelName,
      user.id,
    ]
  )

  return NextResponse.json({ success: true })
}
