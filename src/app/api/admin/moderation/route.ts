import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/admin-auth'
import { withPgClient, pgQuery } from '@/lib/postgres'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = request.nextUrl.searchParams.get('status') ?? 'open'
    const list = await pgQuery<{
      case_id: string
      status: string
      reason: string
      details: string | null
      report_id: string
      reported_id: string
      reporter_id: string
      created_at: string
    }>(
      `
      SELECT
        mc.id AS case_id,
        mc.status,
        r.reason,
        r.details,
        r.id AS report_id,
        r.reported_id,
        r.reporter_id,
        r.created_at
      FROM moderation_cases mc
      JOIN reports r ON r.id = mc.report_id
      WHERE mc.status = $1
      ORDER BY r.created_at DESC
      LIMIT 200
      `,
      [status]
    )

    return NextResponse.json({ cases: list.rows })
  } catch (error) {
    console.error('[admin/moderation] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseId, decision, notes } = await request.json()
    if (!caseId || !decision) {
      return NextResponse.json({ error: 'caseId and decision are required' }, { status: 400 })
    }
    if (!['ban', 'dismiss'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
    }

    await withPgClient(async (client) => {
      await client.query('BEGIN')
      try {
        const caseRes = await client.query<{ reported_id: string; report_id: string; status: string }>(
          `
          SELECT r.reported_id, r.id AS report_id, mc.status
          FROM moderation_cases mc
          JOIN reports r ON r.id = mc.report_id
          WHERE mc.id = $1
          LIMIT 1
          `,
          [caseId]
        )
        const currentCase = caseRes.rows[0]
        if (!currentCase) {
          throw new Error('NOT_FOUND')
        }
        if (currentCase.status === 'resolved' || currentCase.status === 'dismissed') {
          await client.query('COMMIT')
          return
        }

        if (decision === 'ban') {
          await client.query(
            `UPDATE app_users SET is_active = false, updated_at = NOW() WHERE id = $1`,
            [currentCase.reported_id]
          )
          await client.query(
            `UPDATE profiles SET is_active = false, visible = false, updated_at = NOW() WHERE id = $1`,
            [currentCase.reported_id]
          )
          await client.query(
            `
            UPDATE moderation_cases
            SET status = 'resolved',
                assigned_to = $2,
                resolution_notes = $3,
                resolved_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
            `,
            [caseId, admin.id, notes ?? null]
          )
        } else {
          await client.query(
            `
            UPDATE moderation_cases
            SET status = 'dismissed',
                assigned_to = $2,
                resolution_notes = $3,
                resolved_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
            `,
            [caseId, admin.id, notes ?? null]
          )
        }

        await client.query(
          `
          INSERT INTO admin_actions (actor_id, action, target_user_id, metadata)
          VALUES ($1, $2, $3, $4::jsonb)
          `,
          [
            admin.id,
            decision === 'ban' ? 'moderation_ban' : 'moderation_dismiss',
            currentCase.reported_id,
            JSON.stringify({
              caseId,
              reportId: currentCase.report_id,
              decision,
              notes: notes ?? null,
            }),
          ]
        )

        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }
    console.error('[admin/moderation] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

