import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/admin-auth'
import { pgQuery } from '@/lib/postgres'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sp = request.nextUrl.searchParams
    const status = sp.get('status')?.trim() ?? ''
    const rawLimit = parseInt(sp.get('limit') ?? '100', 10)
    const rawOffset = parseInt(sp.get('offset') ?? '0', 10)
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 100 : rawLimit), 200)
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset)

    const VALID_STATUSES = ['processing', 'fulfilled', 'failed']
    const conditions: string[] = []
    const params: unknown[] = []
    let n = 1

    if (VALID_STATUSES.includes(status)) {
      conditions.push(`status = $${n}`)
      params.push(status)
      n++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [listRes, countRes] = await Promise.all([
      pgQuery<{
        reference: string
        status: string
        fulfillment_type: string | null
        last_error: string | null
        attempts: number
        created_at: string
        updated_at: string
        fulfilled_at: string | null
      }>(
        `SELECT reference, status, fulfillment_type, last_error, attempts, created_at, updated_at, fulfilled_at
         FROM paystack_fulfillments
         ${where}
         ORDER BY updated_at DESC
         LIMIT $${n} OFFSET $${n + 1}`,
        [...params, limit, offset]
      ),
      pgQuery<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM paystack_fulfillments ${where}`,
        params
      ),
    ])

    return NextResponse.json({
      fulfillments: listRes.rows,
      total: parseInt(countRes.rows[0]?.count ?? '0', 10),
      limit,
      offset,
    })
  } catch (error) {
    console.error('[admin/ops/fulfillments] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
