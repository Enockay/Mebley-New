/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { pgQuery } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'

// ── POST /api/passes ──────────────────────────────────────────────────────────
// Body: { passedId: string }
// Records a permanent pass. Idempotent — passing the same person twice is fine.

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { passedId } = await request.json()

    if (!passedId) {
      return NextResponse.json({ error: 'passedId is required' }, { status: 400 })
    }
    if (passedId === user.id) {
      return NextResponse.json({ error: 'Cannot pass yourself' }, { status: 400 })
    }

    await pgQuery(
      `
      INSERT INTO passes (passer_id, passed_id)
      VALUES ($1, $2)
      ON CONFLICT (passer_id, passed_id) DO NOTHING
      `,
      [user.id, passedId]
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[Passes] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── GET /api/passes ───────────────────────────────────────────────────────────
// Returns all passed profile IDs for the current user.
// Called on browse page mount to seed the passedIds exclusion set.

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const passRes = await pgQuery<{ passed_id: string }>(
      'SELECT passed_id FROM passes WHERE passer_id = $1',
      [user.id]
    )
    const passedIds = passRes.rows.map((r) => r.passed_id)
    return NextResponse.json({ passedIds })

  } catch (error) {
    console.error('[Passes] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
