/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import {
  hashPassword, issueSessionToken,
  createAuthSession, setAuthCookie,
} from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'
import { rateLimit } from '@/lib/rateLimit'

const E164 = /^\+[1-9]\d{7,14}$/

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

async function consumeVerifiedOtp(phone: string): Promise<boolean> {
  const res = await pgQuery<{ id: string }>(
    `SELECT id FROM otp_verifications
     WHERE phone = $1 AND verified = true AND expires_at > NOW()
     LIMIT 1`,
    [phone]
  )
  const record = res.rows[0]
  if (!record) return false
  await pgQuery(`DELETE FROM otp_verifications WHERE id = $1`, [record.id])
  return true
}

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const limit = rateLimit(`phone-auth:${ip}`, 'auth')
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { phone, action, email, password } = body as {
    phone: string
    action: 'check' | 'login' | 'signup'
    email?: string
    password?: string
  }

  if (!phone || !E164.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  // ── check: does an account with this phone already exist? ────────────────
  if (action === 'check') {
    const r = await pgQuery<{ id: string }>(
      'SELECT id FROM app_users WHERE phone = $1 LIMIT 1',
      [phone]
    )
    return NextResponse.json({ exists: (r.rowCount ?? 0) > 0 })
  }

  // ── login: sign in existing account via phone ─────────────────────────────
  if (action === 'login') {
    const verified = await consumeVerifiedOtp(phone)
    if (!verified) {
      return NextResponse.json(
        { error: 'Phone verification expired. Please request a new code.' },
        { status: 401 }
      )
    }

    const r = await pgQuery<{ id: string; email: string; is_admin: boolean }>(
      `SELECT u.id, u.email::text AS email,
              COALESCE(p.is_admin, false) AS is_admin
       FROM app_users u
       LEFT JOIN profiles p ON p.id = u.id
       WHERE u.phone = $1
         AND u.is_active = true
       LIMIT 1`,
      [phone]
    )
    const user = r.rows[0]
    if (!user) {
      return NextResponse.json(
        { error: 'No account found for this phone number', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const token = issueSessionToken()
    const { expiresAt } = await createAuthSession({
      userId: user.id, token,
      userAgent: req.headers.get('user-agent'),
      ipAddress: ip,
    })

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, isAdmin: user.is_admin },
    })
    setAuthCookie(res, token, expiresAt)
    return res
  }

  // ── signup: create new account via phone + email + password ──────────────
  if (action === 'signup') {
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const verified = await consumeVerifiedOtp(phone)
    if (!verified) {
      return NextResponse.json(
        { error: 'Phone verification expired. Please start again.' },
        { status: 401 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    const emailTaken = await pgQuery<{ id: string }>(
      'SELECT id FROM app_users WHERE lower(email::text) = lower($1) LIMIT 1',
      [normalizedEmail]
    )
    if ((emailTaken.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in instead.' },
        { status: 409 }
      )
    }

    const phoneTaken = await pgQuery<{ id: string }>(
      'SELECT id FROM app_users WHERE phone = $1 LIMIT 1',
      [phone]
    )
    if ((phoneTaken.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'This phone number is already linked to an account.', code: 'PHONE_EXISTS' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)
    const userInsert = await pgQuery<{ id: string; email: string }>(
      `INSERT INTO app_users (email, password_hash, phone, email_verified)
       VALUES ($1, $2, $3, false)
       RETURNING id, email::text AS email`,
      [normalizedEmail, passwordHash, phone]
    )
    const user = userInsert.rows[0]

    await pgQuery(
      `INSERT INTO profiles (
         id, username, full_name, gender, photos, tier, "plan",
         looking_for, interests, gender_preference,
         verified_email, is_active, visible, distance_max, profile_completeness
       ) VALUES (
         $1, $2, '', '', '{}', 'free', 'free', '{}', '{}',
         '{}', false, true, true, 500, 10
       ) ON CONFLICT (id) DO NOTHING`,
      [user.id, `user_${user.id.replace(/-/g, '').slice(0, 10)}`]
    )

    const walletInsert = await pgQuery<{ id: string }>(
      `INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
       VALUES ($1, 25, 25, 0)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING id`,
      [user.id]
    )
    if ((walletInsert.rowCount ?? 0) > 0) {
      await pgQuery(
        `INSERT INTO credit_transactions
           (user_id, amount, balance_after, type, reference_type, description)
         VALUES ($1, 25, 25, 'starter_grant', 'signup', 'Welcome bonus: 25 free credits')`,
        [user.id]
      )
    }

    const token = issueSessionToken()
    const { expiresAt } = await createAuthSession({
      userId: user.id, token,
      userAgent: req.headers.get('user-agent'),
      ipAddress: ip,
    })

    const res = NextResponse.json(
      { success: true, user: { id: user.id, email: user.email } },
      { status: 201 }
    )
    setAuthCookie(res, token, expiresAt)
    return res
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
