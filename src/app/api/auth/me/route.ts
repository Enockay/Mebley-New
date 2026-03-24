import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'

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

