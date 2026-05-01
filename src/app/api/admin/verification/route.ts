import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/admin-auth'
import { pgQuery } from '@/lib/postgres'

type VerifRow = {
  user_id: string
  username: string | null
  full_name: string | null
  email: string
  photo_verified: boolean
  verification_submitted_at: string | null
  verification_notes: string | null
  photos: { slot: number; url: string }[]
  created_at: string
}

// GET — list users who have submitted verification
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? 'pending' // pending | approved | all

    let whereClause = 'p.verification_submitted_at IS NOT NULL'
    if (status === 'pending')  whereClause += ' AND p.photo_verified = false'
    if (status === 'approved') whereClause += ' AND p.photo_verified = true'

    const res = await pgQuery<VerifRow>(
      `
      SELECT
        p.id                         AS user_id,
        p.username,
        p.full_name,
        u.email,
        p.photo_verified,
        p.verification_submitted_at,
        p.verification_notes,
        COALESCE(p.photos, '[]'::jsonb) AS photos,
        u.created_at
      FROM profiles p
      JOIN app_users u ON u.id = p.id
      WHERE ${whereClause}
      ORDER BY p.verification_submitted_at DESC
      LIMIT 100
      `,
      []
    )

    return NextResponse.json({ submissions: res.rows })
  } catch (err) {
    console.error('[GET /api/admin/verification]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — approve or reject a user's verification
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { userId, action, notes } = body as { userId: string; action: 'approve' | 'reject'; notes?: string }

    if (!userId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'userId and action (approve|reject) required' }, { status: 400 })
    }

    const verified = action === 'approve'

    await pgQuery(
      `UPDATE profiles SET photo_verified = $2, verification_notes = $3, updated_at = NOW() WHERE id = $1`,
      [userId, verified, notes ?? null]
    )

    await pgQuery(
      `INSERT INTO admin_actions (actor_id, action, target_user_id, metadata)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [admin.id, verified ? 'verification_approved' : 'verification_rejected', userId, JSON.stringify({ notes: notes ?? null })]
    )

    return NextResponse.json({ ok: true, verified })
  } catch (err) {
    console.error('[POST /api/admin/verification]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
