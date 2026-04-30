import { NextRequest } from 'next/server'
import { getAuthUserFromRequest, type AuthUser } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

export async function hasRole(userId: string, role: 'admin' | 'moderator'): Promise<boolean> {
  const res = await pgQuery<{ id: string }>(
    `
    SELECT id
    FROM user_roles
    WHERE user_id = $1
      AND role = $2
    LIMIT 1
    `,
    [userId, role]
  )
  return !!res.rows[0]
}

export async function isAdminUser(userId: string): Promise<boolean> {
  return hasRole(userId, 'admin')
}

export async function getAdminUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const user = await getAuthUserFromRequest(request)
  if (!user) return null

  const isAdmin = await isAdminUser(user.id)
  return isAdmin ? user : null
}

