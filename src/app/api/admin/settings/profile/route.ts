import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/admin-auth'
import { pgQuery } from '@/lib/postgres'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const row = await pgQuery<{
      email: string
      full_name: string | null
      username: string | null
      bio: string | null
    }>(
      `
      SELECT
        au.email::text AS email,
        p.full_name,
        p.username,
        p.bio
      FROM app_users au
      LEFT JOIN profiles p ON p.id = au.id
      WHERE au.id = $1
      LIMIT 1
      `,
      [admin.id]
    )

    const r = row.rows[0]
    if (!r) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({
      email: r.email,
      profile: r.full_name != null || r.username != null || r.bio != null
        ? {
            full_name: r.full_name ?? '',
            username: r.username ?? '',
            bio: r.bio ?? '',
          }
        : null,
    })
  } catch (error) {
    console.error('[admin/settings/profile GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      full_name?: unknown
      username?: unknown
      bio?: unknown
    }

    const full_name =
      typeof body.full_name === 'string' ? body.full_name.trim().slice(0, 120) : undefined
    const username =
      typeof body.username === 'string' ? body.username.trim().slice(0, 60) : undefined
    const bio = typeof body.bio === 'string' ? body.bio.trim().slice(0, 2000) : undefined

    const updates: string[] = []
    const vals: unknown[] = []
    let n = 1

    if (full_name !== undefined) {
      if (!full_name) {
        return NextResponse.json({ error: 'Full name cannot be empty' }, { status: 400 })
      }
      updates.push(`full_name = $${n}`)
      vals.push(full_name)
      n++
    }
    if (username !== undefined) {
      if (!username) {
        return NextResponse.json({ error: 'Username cannot be empty' }, { status: 400 })
      }
      updates.push(`username = $${n}`)
      vals.push(username)
      n++
    }
    if (bio !== undefined) {
      updates.push(`bio = $${n}`)
      vals.push(bio)
      n++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const exists = await pgQuery<{ id: string }>(
      'SELECT id FROM profiles WHERE id = $1 LIMIT 1',
      [admin.id]
    )
    if (!exists.rows[0]) {
      return NextResponse.json(
        {
          error: 'No profile yet. Complete onboarding in the app, then return here.',
          code: 'NO_PROFILE',
        },
        { status: 409 }
      )
    }

    if (username !== undefined) {
      const clash = await pgQuery<{ id: string }>(
        `
        SELECT id FROM profiles
        WHERE username = $1 AND id <> $2::uuid
        LIMIT 1
        `,
        [username, admin.id]
      )
      if (clash.rows[0]) {
        return NextResponse.json({ error: 'That username is already taken' }, { status: 409 })
      }
    }

    await pgQuery(
      `
      UPDATE profiles
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${vals.length + 1}::uuid
      `,
      [...vals, admin.id]
    )

    const fresh = await pgQuery<{
      full_name: string | null
      username: string | null
      bio: string | null
    }>(
      `SELECT full_name, username, bio FROM profiles WHERE id = $1 LIMIT 1`,
      [admin.id]
    )

    const p = fresh.rows[0]
    return NextResponse.json({
      profile: {
        full_name: p?.full_name ?? '',
        username: p?.username ?? '',
        bio: p?.bio ?? '',
      },
    })
  } catch (error) {
    console.error('[admin/settings/profile PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
