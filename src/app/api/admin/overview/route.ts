import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/admin-auth'
import { pgQuery } from '@/lib/postgres'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [usersRes, casesRes, creditsRes, consistencyRes] = await Promise.all([
      pgQuery<{
        total: string
        active: string
        today: string
        this_week: string
        verified: string
      }>(`
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE is_active = true)::text AS active,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')::text AS today,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS this_week,
          COUNT(*) FILTER (WHERE email_verified = true)::text AS verified
        FROM app_users
      `),

      pgQuery<{ status: string; count: string }>(`
        SELECT status, COUNT(*)::text AS count
        FROM moderation_cases
        GROUP BY status
      `),

      pgQuery<{ total_balance: string; wallets: string }>(`
        SELECT
          COALESCE(SUM(balance), 0)::text AS total_balance,
          COUNT(*)::text AS wallets
        FROM credit_wallets
      `),

      pgQuery<{ open_critical: string; open_warning: string }>(`
        SELECT
          COUNT(*) FILTER (WHERE resolved = false AND severity = 'critical')::text AS open_critical,
          COUNT(*) FILTER (WHERE resolved = false AND severity = 'warning')::text AS open_warning
        FROM consistency_issues
      `),
    ])

    const users = usersRes.rows[0]
    const casesByStatus: Record<string, number> = {}
    for (const row of casesRes.rows) {
      casesByStatus[row.status] = parseInt(row.count, 10)
    }
    const credits = creditsRes.rows[0]
    const ops = consistencyRes.rows[0]

    return NextResponse.json({
      users: {
        total:     parseInt(users?.total ?? '0', 10),
        active:    parseInt(users?.active ?? '0', 10),
        today:     parseInt(users?.today ?? '0', 10),
        this_week: parseInt(users?.this_week ?? '0', 10),
        verified:  parseInt(users?.verified ?? '0', 10),
      },
      moderation: {
        open:       casesByStatus['open'] ?? 0,
        in_review:  casesByStatus['in_review'] ?? 0,
        resolved:   casesByStatus['resolved'] ?? 0,
        dismissed:  casesByStatus['dismissed'] ?? 0,
      },
      credits: {
        total_balance: parseInt(credits?.total_balance ?? '0', 10),
        wallets:       parseInt(credits?.wallets ?? '0', 10),
      },
      ops: {
        open_critical: parseInt(ops?.open_critical ?? '0', 10),
        open_warning:  parseInt(ops?.open_warning ?? '0', 10),
      },
    })
  } catch (error) {
    console.error('[admin/overview] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
