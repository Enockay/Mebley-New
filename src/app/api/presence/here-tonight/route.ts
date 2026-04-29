import { NextRequest, NextResponse } from 'next/server'
import { pgQuery, withPgClient } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'

const COST         = 80
const EXPIRY_HOURS = 6

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const targetId = searchParams.get('userId') ?? user.id

  const res = await pgQuery<{ expires_at: string }>(
    `SELECT expires_at FROM moments
     WHERE sender_id = $1 AND type = 'here_tonight' AND expires_at > NOW()
     ORDER BY expires_at DESC LIMIT 1`,
    [targetId]
  )
  const row = res.rows[0] ?? null
  return NextResponse.json({ active: !!row, expiresAt: row?.expires_at ?? null })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await withPgClient(async client => {
      await client.query('BEGIN')

      // Get or create wallet
      const wRes = await client.query<{ id: string; balance: number; lifetime_spent: number }>(
        `INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
         VALUES ($1, 0, 0, 0)
         ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
         RETURNING id, balance, lifetime_spent`,
        [user.id]
      )
      const wallet = wRes.rows[0]
      if (!wallet || wallet.balance < COST) {
        await client.query('ROLLBACK')
        return { error: 'Insufficient credits', balance: wallet?.balance ?? 0, needed: COST, status: 402 }
      }

      const newBalance  = wallet.balance - COST
      const expiresAt   = new Date(Date.now() + EXPIRY_HOURS * 3600000).toISOString()

      await client.query(
        `UPDATE credit_wallets SET balance=$1, lifetime_spent=$2, updated_at=NOW() WHERE id=$3`,
        [newBalance, wallet.lifetime_spent + COST, wallet.id]
      )
      await client.query(
        `INSERT INTO credit_transactions (user_id, amount, balance_after, type, reference_type, description)
         VALUES ($1,$2,$3,'moment_spend','moment','Spent 80 credits on Here Tonight')`,
        [user.id, -COST, newBalance]
      )
      await client.query(
        `INSERT INTO moments (sender_id, receiver_id, type, credits_spent, status, expires_at)
         VALUES ($1,$1,'here_tonight',$2,'pending',$3)`,
        [user.id, COST, expiresAt]
      )

      await client.query('COMMIT')
      return { ok: true, new_balance: newBalance, expiresAt }
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error, balance: result.balance, needed: result.needed }, { status: result.status as number })
    }

    // Re-fetch canonical status
    const statusRes = await pgQuery<{ expires_at: string }>(
      `SELECT expires_at FROM moments
       WHERE sender_id=$1 AND type='here_tonight' AND expires_at>NOW()
       ORDER BY expires_at DESC LIMIT 1`,
      [user.id]
    )
    const row = statusRes.rows[0] ?? null
    return NextResponse.json({ ok: true, active: !!row, expiresAt: row?.expires_at ?? null, new_balance: result.new_balance })

  } catch (err) {
    console.error('[here-tonight POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
