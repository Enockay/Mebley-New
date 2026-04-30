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
    const resolved = sp.get('resolved') === 'true'
    const severity = sp.get('severity')?.trim() ?? ''
    const rawLimit = parseInt(sp.get('limit') ?? '100', 10)
    const rawOffset = parseInt(sp.get('offset') ?? '0', 10)
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 100 : rawLimit), 200)
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset)

    const conditions: string[] = [`resolved = $1`]
    const params: unknown[] = [resolved]
    let n = 2

    if (severity === 'critical' || severity === 'warning') {
      conditions.push(`severity = $${n}`)
      params.push(severity)
      n++
    }

    const where = `WHERE ${conditions.join(' AND ')}`

    const [listRes, countRes] = await Promise.all([
      pgQuery<{
        id: string
        entity_type: string
        entity_id: string
        source: string
        severity: string
        details: Record<string, unknown>
        resolved: boolean
        created_at: string
        resolved_at: string | null
      }>(
        `SELECT id, entity_type, entity_id, source, severity, details, resolved, created_at, resolved_at
         FROM consistency_issues
         ${where}
         ORDER BY created_at DESC
         LIMIT $${n} OFFSET $${n + 1}`,
        [...params, limit, offset]
      ),
      pgQuery<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM consistency_issues ${where}`,
        params
      ),
    ])

    return NextResponse.json({
      issues: listRes.rows,
      total: parseInt(countRes.rows[0]?.count ?? '0', 10),
      limit,
      offset,
    })
  } catch (error) {
    console.error('[admin/ops/issues] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = (await request.json()) as { id?: string }
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const res = await pgQuery<{ id: string }>(
      `UPDATE consistency_issues
       SET resolved = true, resolved_at = NOW()
       WHERE id = $1 AND resolved = false
       RETURNING id`,
      [id]
    )

    if (!res.rows[0]) {
      return NextResponse.json({ error: 'Issue not found or already resolved' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin/ops/issues] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
