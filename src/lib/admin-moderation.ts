export type ModerationStatus = 'open' | 'in_review' | 'resolved' | 'dismissed'

export type AdminModerationCase = {
  case_id: string
  status: ModerationStatus
  reason: string
  details: string | null
  report_id: string
  reported_id: string
  reporter_id: string
  created_at: string
}

type CasesResponse = {
  cases: AdminModerationCase[]
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

export async function fetchCases(status: ModerationStatus): Promise<AdminModerationCase[]> {
  const res = await fetch(`/api/admin/moderation?status=${encodeURIComponent(status)}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(await parseError(res, 'Failed to load moderation cases'))
  }

  const body = (await res.json()) as CasesResponse
  return body.cases ?? []
}

export async function decideCase(input: {
  caseId: string
  decision: 'ban' | 'dismiss'
  notes?: string
}): Promise<void> {
  const res = await fetch('/api/admin/moderation', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      caseId: input.caseId,
      decision: input.decision,
      notes: input.notes?.trim() ? input.notes.trim() : undefined,
    }),
  })

  if (!res.ok) {
    throw new Error(await parseError(res, 'Failed to apply moderation decision'))
  }
}

