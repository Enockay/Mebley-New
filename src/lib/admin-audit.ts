export type AdminAuditActor = {
  id: string
  email: string
}

export type AdminAuditTargetUser = {
  id: string
  full_name: string | null
}

export type AdminAuditMetadata = {
  caseId?: string
  reportId?: string
  decision?: string
  notes?: string | null
}

export type AdminAuditEntry = {
  id: string
  action: string
  created_at: string
  actor: AdminAuditActor
  target_user: AdminAuditTargetUser | null
  metadata: AdminAuditMetadata
}

type AuditResponse = {
  items: AdminAuditEntry[]
  total: number
  limit: number
  offset: number
}

type ErrorResponse = {
  error?: string
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as ErrorResponse
    if (body?.error) return body.error
    return fallback
  } catch {
    return fallback
  }
}

export type AdminAuditAction =
  | 'moderation_ban'
  | 'moderation_dismiss'
  | 'credits_admin_grant'
  | 'credits_admin_remove'
  | 'user_deactivate'
  | 'user_reactivate'

export async function fetchAdminAuditLog(params: {
  limit?: number
  offset?: number
  action?: AdminAuditAction
}): Promise<AuditResponse> {
  const search = new URLSearchParams()
  if (params.limit != null) search.set('limit', String(params.limit))
  if (params.offset != null) search.set('offset', String(params.offset))
  if (params.action) search.set('action', params.action)

  const res = await fetch(`/api/admin/actions?${search.toString()}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(await parseError(res, 'Failed to load audit log'))
  }

  return (await res.json()) as AuditResponse
}
