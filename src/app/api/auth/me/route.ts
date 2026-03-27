import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ user: null, profile: null, creditBalance: 0 }, { status: 200 })
    }

    const profileRes = await pgQuery('SELECT * FROM profiles WHERE id = $1 LIMIT 1', [user.id])

    let creditBalance = 0
    try {
      const walletRes = await pgQuery<{ balance: number }>(
        'SELECT balance FROM credit_wallets WHERE user_id = $1 LIMIT 1',
        [user.id]
      )
      creditBalance = walletRes.rows[0]?.balance ?? 0
    } catch (walletError: any) {
      // Allow auth/me to work even before optional wallet tables are migrated.
      if (walletError?.code !== '42P01') {
        throw walletError
      }
    }

    // Billing writes can happen in the Supabase-backed DB. If local PG lookup is zero,
    // resolve by id/email there and use that wallet balance so UI reflects purchases.
    if (creditBalance <= 0) {
      try {
        const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        let billingUserId = user.id

        const { data: appUserById } = await (db as any)
          .from('app_users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!appUserById && user.email) {
          const { data: appUserByEmail } = await (db as any)
            .from('app_users')
            .select('id')
            .ilike('email', user.email)
            .maybeSingle()
          if (appUserByEmail?.id) billingUserId = appUserByEmail.id
        }

        const { data: wallet } = await (db as any)
          .from('credit_wallets')
          .select('balance')
          .eq('user_id', billingUserId)
          .maybeSingle()

        creditBalance = wallet?.balance ?? creditBalance
      } catch {
        // Non-fatal: keep PG-derived balance.
      }
    }

    return NextResponse.json({
      user,
      profile: profileRes.rows[0] ?? null,
      creditBalance,
    })
  } catch (error) {
    console.error('[auth/me] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

