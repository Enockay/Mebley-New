import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { pgQuery } from '@/lib/postgres'

const SESSION_COOKIE = 'app_session'
const SESSION_DAYS = 30

export type AuthUser = {
  id: string
  email: string
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash)
}

export function issueSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createAuthSession(params: {
  userId: string
  token: string
  userAgent?: string | null
  ipAddress?: string | null
}) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await pgQuery(
    `
    INSERT INTO auth_sessions (user_id, token_hash, user_agent, ip_address, expires_at)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [params.userId, sha256(params.token), params.userAgent ?? null, params.ipAddress ?? null, expiresAt]
  )
  return { expiresAt }
}

export function setAuthCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })
}

export async function getAuthUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null

  const res = await pgQuery<AuthUser>(
    `
    SELECT u.id, u.email::text AS email
    FROM auth_sessions s
    JOIN app_users u ON u.id = s.user_id
    WHERE s.token_hash = $1
      AND s.expires_at > now()
      AND u.is_active = true
    LIMIT 1
    `,
    [sha256(token)]
  )
  return res.rows[0] ?? null
}

export async function revokeSessionFromRequest(request: NextRequest): Promise<void> {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return
  await pgQuery('DELETE FROM auth_sessions WHERE token_hash = $1', [sha256(token)])
}

