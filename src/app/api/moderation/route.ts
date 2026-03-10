import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rateLimit'

// ── POST /api/moderation ──────────────────────────────────────────────────────
// Body: { action: 'block' | 'report' | 'block_and_report', targetId, reason, details? }
//
// block            → inserts into blocked_users only
// report           → inserts into reports only
// block_and_report → inserts into both in a single request

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = rateLimit(user.id, 'api')
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { action, targetId, reason, details } = await request.json()

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!action || !targetId) {
      return NextResponse.json({ error: 'action and targetId are required' }, { status: 400 })
    }
    if (!['block', 'report', 'block_and_report'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    if (targetId === user.id) {
      return NextResponse.json({ error: 'Cannot block or report yourself' }, { status: 400 })
    }
    if ((action === 'report' || action === 'block_and_report') && !reason) {
      return NextResponse.json({ error: 'reason is required for reports' }, { status: 400 })
    }

    // ── Block ─────────────────────────────────────────────────────────────────
    if (action === 'block' || action === 'block_and_report') {
      const { error: blockError } = await (supabase as any)
        .from('blocked_users')
        .upsert(
          {
            blocker_id: user.id,
            blocked_id: targetId,
            reason:     reason ?? 'blocked',
          },
          { onConflict: 'blocker_id,blocked_id' }
        )

      if (blockError) {
        console.error('[Moderation] block error:', blockError)
        return NextResponse.json({ error: 'Failed to block user' }, { status: 500 })
      }
    }

    // ── Report ────────────────────────────────────────────────────────────────
    if (action === 'report' || action === 'block_and_report') {
      const { error: reportError } = await (supabase as any)
        .from('reports')
        .upsert(
          {
            reporter_id: user.id,
            reported_id: targetId,
            reason,
            details: details ?? null,
          },
          { onConflict: 'reporter_id,reported_id,reason' }
        )

      if (reportError) {
        console.error('[Moderation] report error:', reportError)
        return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, action })

  } catch (error) {
    console.error('[Moderation] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── GET /api/moderation?type=blocked ─────────────────────────────────────────
// Returns the current user's blocked user IDs so the client can filter them
// out of discovery results immediately on load.

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await (supabase as any)
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch blocked users' }, { status: 500 })
    }

    const blockedIds = (data ?? []).map((r: any) => r.blocked_id)
    return NextResponse.json({ blockedIds })

  } catch (error) {
    console.error('[Moderation] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
