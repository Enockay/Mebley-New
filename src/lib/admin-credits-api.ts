export type AdminCreditsUser = {
  id: string
  email: string
  is_active: boolean
  full_name: string | null
  username: string | null
}

export type AdminCreditsWallet = {
  balance: number
  lifetime_earned: number
  lifetime_spent: number
}

export type AdminCreditsTx = {
  id: string
  amount: number
  balance_after: number
  type: string
  reference_type: string | null
  description: string | null
  created_at: string
}

export async function adminLookupCredits(q: string): Promise<{
  user: AdminCreditsUser
  wallet: AdminCreditsWallet
  transactions: AdminCreditsTx[]
}> {
  const res = await fetch(`/api/admin/credits/lookup?q=${encodeURIComponent(q.trim())}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'Lookup failed')
  }
  return body
}

export async function adminAdjustCredits(input: {
  userId: string
  mode: 'add' | 'remove'
  amount: number
  reason: string
}): Promise<{ balance: number; delta: number; txType: string }> {
  const res = await fetch('/api/admin/credits/adjust', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'Adjust failed')
  }
  return body
}
