export type AdminUser = {
  id: string
  email: string
  is_active: boolean
  email_verified: boolean
  created_at: string
  full_name: string | null
  username: string | null
  tier: string | null
  last_active: string | null
  credit_balance: number | null
}

type UsersResponse = {
  users: AdminUser[]
  total: number
  limit: number
  offset: number
}

type ErrorBody = { error?: string }

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as ErrorBody
    return body?.error ?? fallback
  } catch {
    return fallback
  }
}

export async function fetchAdminUsers(params: {
  q?: string
  limit?: number
  offset?: number
}): Promise<UsersResponse> {
  const url = new URL('/api/admin/users', location.origin)
  if (params.q) url.searchParams.set('q', params.q)
  if (params.limit != null) url.searchParams.set('limit', String(params.limit))
  if (params.offset != null) url.searchParams.set('offset', String(params.offset))

  const res = await fetch(url.toString(), { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to load users'))
  return res.json() as Promise<UsersResponse>
}

export async function setAdminUserStatus(
  userId: string,
  action: 'activate' | 'deactivate'
): Promise<void> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to update user status'))
}
