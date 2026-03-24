import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, issueSessionToken, createAuthSession, setAuthCookie } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as { email?: string; password?: string }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existing = await pgQuery<{ id: string }>(
      'SELECT id FROM app_users WHERE lower(email::text) = lower($1) LIMIT 1',
      [normalizedEmail]
    )
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json(
        { error: 'Account already exists. Please sign in with this email.' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)
    const userInsert = await pgQuery<{ id: string; email: string }>(
      `
      INSERT INTO app_users (email, password_hash, email_verified)
      VALUES ($1, $2, false)
      RETURNING id, email::text AS email
      `,
      [normalizedEmail, passwordHash]
    )
    const user = userInsert.rows[0]

    await pgQuery(
      `
      INSERT INTO profiles (
        id, username, full_name, gender, photos, tier, "plan", looking_for, interests,
        gender_preference, verified_email, is_active, visible, distance_max, profile_completeness
      )
      VALUES (
        $1, $2, '', '', '{}', 'free', 'free', '{}', '{}',
        '{}', false, true, true, 500, 10
      )
      ON CONFLICT (id) DO NOTHING
      `,
      [user.id, `user_${user.id.replace(/-/g, '').slice(0, 10)}`]
    )

    const token = issueSessionToken()
    const { expiresAt } = await createAuthSession({
      userId: user.id,
      token,
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    })

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email } }, { status: 201 })
    setAuthCookie(response, token, expiresAt)
    return response
  } catch (error) {
    console.error('[auth/signup] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

