export type AdminOverviewStats = {
  users: {
    total: number
    active: number
    today: number
    this_week: number
    verified: number
  }
  moderation: {
    open: number
    in_review: number
    resolved: number
    dismissed: number
  }
  credits: {
    total_balance: number
    wallets: number
  }
  ops: {
    open_critical: number
    open_warning: number
  }
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

export async function fetchAdminOverview(): Promise<AdminOverviewStats> {
  const res = await fetch('/api/admin/overview', { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to load overview'))
  return res.json() as Promise<AdminOverviewStats>
}
