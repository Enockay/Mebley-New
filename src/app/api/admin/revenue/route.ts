import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/admin-auth'
import { pgQuery } from '@/lib/postgres'

type DayBucket = { date: string; revenue_usd: number; orders: number }

function bucketOrders(rows: { amount_usd: number; completed_at: string | null }[]): DayBucket[] {
  const map = new Map<string, { revenue_usd: number; orders: number }>()
  for (const row of rows) {
    if (!row.completed_at) continue
    const d = new Date(row.completed_at)
    const key = d.toISOString().slice(0, 10)
    const prev = map.get(key) ?? { revenue_usd: 0, orders: 0 }
    prev.revenue_usd += Number(row.amount_usd) || 0
    prev.orders += 1
    map.set(key, prev)
  }
  const keys = [...map.keys()].sort((a, b) => b.localeCompare(a))
  return keys.map((date) => ({
    date,
    revenue_usd: Math.round((map.get(date)!.revenue_usd + Number.EPSILON) * 100) / 100,
    orders: map.get(date)!.orders,
  }))
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const daysParam = request.nextUrl.searchParams.get('days')
    const days = Math.min(Math.max(Number.parseInt(daysParam ?? '30', 10) || 30, 1), 365)
    const since = new Date(Date.now() - days * 86400000).toISOString()

    let stripeSummary: {
      total_usd: number
      order_count: number
      by_day: DayBucket[]
    } | null = null

    try {
      const ordersRes = await pgQuery<{ amount_usd: number; completed_at: string | null }>(
        `SELECT amount_usd, completed_at FROM stripe_orders
         WHERE status = 'completed' AND completed_at >= $1
         ORDER BY completed_at DESC LIMIT 8000`,
        [since]
      )
      const rows = ordersRes.rows
      const total_usd = rows.reduce((s, r) => s + (Number(r.amount_usd) || 0), 0)
      stripeSummary = {
        total_usd:   Math.round((total_usd + Number.EPSILON) * 100) / 100,
        order_count: rows.length,
        by_day:      bucketOrders(rows),
      }
    } catch (err) {
      console.warn('[admin/revenue] stripe_orders read:', err)
    }

    const movementRes = await pgQuery<{ type: string; tx_count: string; credits_sum: string }>(
      `
      SELECT
        type,
        COUNT(*)::text AS tx_count,
        COALESCE(SUM(amount), 0)::text AS credits_sum
      FROM credit_transactions
      WHERE created_at >= NOW() - ($1::integer * INTERVAL '1 day')
      GROUP BY type
      ORDER BY type
      `,
      [days]
    )

    const movement = movementRes.rows.map((r) => ({
      type: r.type,
      tx_count: Number.parseInt(r.tx_count, 10),
      credits_sum: Number.parseInt(r.credits_sum, 10),
    }))

    const purchaseCreditsRes = await pgQuery<{ n: string }>(
      `
      SELECT COALESCE(SUM(amount), 0)::text AS n
      FROM credit_transactions
      WHERE created_at >= NOW() - ($1::integer * INTERVAL '1 day')
        AND type = 'credit_purchase'
        AND amount > 0
      `,
      [days]
    )
    const credits_from_purchases = Number.parseInt(purchaseCreditsRes.rows[0]?.n ?? '0', 10)

    return NextResponse.json({
      period_days: days,
      stripe_orders: stripeSummary,
      credit_transactions_by_type: movement,
      credits_granted_from_credit_purchase: credits_from_purchases,
      note: stripeSummary == null ? 'Could not read stripe_orders from database.' : undefined,
    })
  } catch (error) {
    console.error('[admin/revenue]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
