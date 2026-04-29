import { NextRequest, NextResponse } from 'next/server'
import { pgQuery } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'

type TxRow = {
  id:             string
  amount:         number
  balance_after:  number
  type:           string
  description:    string | null
  created_at:     string
}

type WalletRow = { balance: number; lifetime_earned: number; lifetime_spent: number }

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [txRes, walletRes] = await Promise.all([
      pgQuery<TxRow>(
        `SELECT id, amount, balance_after, type, description, created_at
         FROM credit_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [user.id]
      ),
      pgQuery<WalletRow>(
        `SELECT balance, lifetime_earned, lifetime_spent
         FROM credit_wallets WHERE user_id = $1 LIMIT 1`,
        [user.id]
      ),
    ])

    return NextResponse.json({
      transactions:    txRes.rows,
      balance:         walletRes.rows[0]?.balance         ?? 0,
      lifetime_earned: walletRes.rows[0]?.lifetime_earned ?? 0,
      lifetime_spent:  walletRes.rows[0]?.lifetime_spent  ?? 0,
    })

  } catch (err) {
    console.error('[credits/transactions]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
