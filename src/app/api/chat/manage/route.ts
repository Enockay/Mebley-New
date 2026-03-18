// src/app/api/chat/manage/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, conversationId, targetUserId } = await req.json()
  // action: 'pin' | 'unpin' | 'mute' | 'unmute' | 'archive' | 'unarchive' | 'block'

  const admin = db()

  if (action === 'block' && targetUserId) {
    const { error } = await admin.from('blocked_users').insert({
      blocker_id: user.id,
      blocked_id: targetUserId,
      reason:     'blocked from chat',
    })
    if (error && !error.message.includes('duplicate')) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, action: 'block' })
  }

  if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })

  const { data: conv } = await admin
    .from('conversations')
    .select('is_pinned_by, is_muted_by, is_archived_by')
    .eq('id', conversationId)
    .single()

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const uid = user.id

  const toggle = (arr: string[], add: boolean) =>
    add ? [...new Set([...arr, uid])] : arr.filter((id: string) => id !== uid)

  let update: Record<string, string[]> = {}

  if (action === 'pin')      update = { is_pinned_by:   toggle(conv.is_pinned_by   ?? [], true)  }
  if (action === 'unpin')    update = { is_pinned_by:   toggle(conv.is_pinned_by   ?? [], false) }
  if (action === 'mute')     update = { is_muted_by:    toggle(conv.is_muted_by    ?? [], true)  }
  if (action === 'unmute')   update = { is_muted_by:    toggle(conv.is_muted_by    ?? [], false) }
  if (action === 'archive')  update = { is_archived_by: toggle(conv.is_archived_by ?? [], true)  }
  if (action === 'unarchive')update = { is_archived_by: toggle(conv.is_archived_by ?? [], false) }

  const { error } = await admin.from('conversations').update(update).eq('id', conversationId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, action })
}
