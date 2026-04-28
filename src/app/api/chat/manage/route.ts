// src/app/api/chat/manage/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, conversationId, targetUserId } = await req.json()
  // action: 'pin' | 'unpin' | 'mute' | 'unmute' | 'archive' | 'unarchive' | 'block'

  if (action === 'block' && targetUserId) {
    await pgQuery(
      `INSERT INTO blocked_users (blocker_id, blocked_id, reason)
       VALUES ($1, $2, 'blocked from chat')
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
      [user.id, targetUserId]
    )
    return NextResponse.json({ ok: true, action: 'block' })
  }

  if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })

  const convRes = await pgQuery<{
    is_pinned_by:   string[]
    is_muted_by:    string[]
    is_archived_by: string[]
  }>(
    'SELECT is_pinned_by, is_muted_by, is_archived_by FROM conversations WHERE id = $1 LIMIT 1',
    [conversationId]
  )
  const conv = convRes.rows[0]
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const uid = user.id
  const toggle = (arr: string[], add: boolean) =>
    add ? [...new Set([...arr, uid])] : arr.filter(id => id !== uid)

  let col   = ''
  let value: string[] = []

  if (action === 'pin')       { col = 'is_pinned_by';   value = toggle(conv.is_pinned_by   ?? [], true)  }
  if (action === 'unpin')     { col = 'is_pinned_by';   value = toggle(conv.is_pinned_by   ?? [], false) }
  if (action === 'mute')      { col = 'is_muted_by';    value = toggle(conv.is_muted_by    ?? [], true)  }
  if (action === 'unmute')    { col = 'is_muted_by';    value = toggle(conv.is_muted_by    ?? [], false) }
  if (action === 'archive')   { col = 'is_archived_by'; value = toggle(conv.is_archived_by ?? [], true)  }
  if (action === 'unarchive') { col = 'is_archived_by'; value = toggle(conv.is_archived_by ?? [], false) }

  if (!col) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  await pgQuery(
    `UPDATE conversations SET "${col}" = $1 WHERE id = $2`,
    [value, conversationId]
  )

  return NextResponse.json({ ok: true, action })
}
