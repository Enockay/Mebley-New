import { NextRequest, NextResponse } from 'next/server'
import { createAuthSession, issueSessionToken, setAuthCookie, verifyPassword } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as { email?: string; password?: string }
    if (!email || !isValidEmail(email) || !password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
    }

    const res = await pgQuery<{ id: string; email: string; password_hash: string }>(
      `
      SELECT id, email::text AS email, password_hash
      FROM app_users
      WHERE email = $1 AND is_active = true
      LIMIT 1
      `,
      [email]
    )
    const user = res.rows[0]
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const ok = await verifyPassword(password, user.password_hash)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = issueSessionToken()
    const { expiresAt } = await createAuthSession({
      userId: user.id,
      token,
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    })

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email } })
    setAuthCookie(response, token, expiresAt)
    return response
  } catch (error) {
    console.error('[auth/signin] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

