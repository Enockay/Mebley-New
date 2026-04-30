export type ConsistencyIssue = {
  id: string
  entity_type: string
  entity_id: string
  source: string
  severity: 'warning' | 'critical'
  details: Record<string, unknown>
  resolved: boolean
  created_at: string
  resolved_at: string | null
}

export type PaystackFulfillment = {
  reference: string
  status: string
  fulfillment_type: string | null
  last_error: string | null
  attempts: number
  created_at: string
  updated_at: string
  fulfilled_at: string | null
}

type ErrorBody = { error?: string }

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const b = (await res.json()) as ErrorBody
    return b?.error ?? fallback
  } catch {
    return fallback
  }
}

export async function fetchConsistencyIssues(params: {
  resolved?: boolean
  severity?: string
  limit?: number
  offset?: number
}): Promise<{ issues: ConsistencyIssue[]; total: number }> {
  const url = new URL('/api/admin/ops/issues', location.origin)
  url.searchParams.set('resolved', String(params.resolved ?? false))
  if (params.severity) url.searchParams.set('severity', params.severity)
  if (params.limit != null) url.searchParams.set('limit', String(params.limit))
  if (params.offset != null) url.searchParams.set('offset', String(params.offset))

  const res = await fetch(url.toString(), { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to load consistency issues'))
  return res.json() as Promise<{ issues: ConsistencyIssue[]; total: number }>
}

export async function resolveConsistencyIssue(id: string): Promise<void> {
  const res = await fetch('/api/admin/ops/issues', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to resolve issue'))
}

export async function fetchFulfillments(params: {
  status?: string
  limit?: number
  offset?: number
}): Promise<{ fulfillments: PaystackFulfillment[]; total: number }> {
  const url = new URL('/api/admin/ops/fulfillments', location.origin)
  if (params.status) url.searchParams.set('status', params.status)
  if (params.limit != null) url.searchParams.set('limit', String(params.limit))
  if (params.offset != null) url.searchParams.set('offset', String(params.offset))

  const res = await fetch(url.toString(), { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to load fulfillments'))
  return res.json() as Promise<{ fulfillments: PaystackFulfillment[]; total: number }>
}
