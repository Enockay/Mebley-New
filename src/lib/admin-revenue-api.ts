export type StripeDayBucket = { date: string; revenue_usd: number; orders: number }

export type AdminRevenueResponse = {
  period_days: number
  stripe_orders: null | {
    total_usd: number
    order_count: number
    by_day: StripeDayBucket[]
    source: string
  }
  credit_transactions_by_type: {
    type: string
    tx_count: number
    credits_sum: number
  }[]
  credits_granted_from_credit_purchase: number
  note?: string
}

export async function fetchAdminRevenue(days = 30): Promise<AdminRevenueResponse> {
  const res = await fetch(`/api/admin/revenue?days=${days}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'Failed to load revenue')
  }
  return body as AdminRevenueResponse
}
