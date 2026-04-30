/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'
import { pgQuery, withPgClient } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'

// ── POST /api/moderation ──────────────────────────────────────────────────────
// Body: { action: 'block' | 'report' | 'block_and_report', targetId, reason, details? }
//
// block            → inserts into blocked_users only
// report           → inserts into reports only
// block_and_report → inserts into both in a single request

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)

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
    await withPgClient(async (client) => {
      await client.query('BEGIN')
      try {
        if (action === 'block' || action === 'block_and_report') {
          await client.query(
            `
            INSERT INTO blocked_users (blocker_id, blocked_id, reason)
            VALUES ($1, $2, $3)
            ON CONFLICT (blocker_id, blocked_id)
            DO UPDATE SET reason = EXCLUDED.reason
            `,
            [user.id, targetId, reason ?? 'blocked']
          )
        }

        if (action === 'report' || action === 'block_and_report') {
          const reportRes = await client.query<{ id: string }>(
            `
            INSERT INTO reports (reporter_id, reported_id, reason, details)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (reporter_id, reported_id, reason)
            DO UPDATE SET details = EXCLUDED.details
            RETURNING id
            `,
            [user.id, targetId, reason, details ?? null]
          )

          const reportId = reportRes.rows[0]?.id
          if (reportId) {
            await client.query(
              `
              INSERT INTO moderation_cases (report_id, status)
              VALUES ($1, 'open')
              ON CONFLICT (report_id) DO NOTHING
              `,
              [reportId]
            )
          }
        }
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    })

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
    const user = await getAuthUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const type = request.nextUrl.searchParams.get('type') ?? 'blocked'
    if (type === 'blocked') {
      const blockedRes = await pgQuery<{ blocked_id: string }>(
        'SELECT blocked_id FROM blocked_users WHERE blocker_id = $1',
        [user.id]
      )
      const blockedIds = blockedRes.rows.map((r) => r.blocked_id)
      return NextResponse.json({ blockedIds })
    }
    return NextResponse.json({ error: 'Unsupported type' }, { status: 400 })

  } catch (error) {
    console.error('[Moderation] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
