import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/admin-auth'
import { withPgClient } from '@/lib/postgres'

const MAX_GRANT = 500_000

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUserFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
    const mode = body.mode === 'remove' ? 'remove' : body.mode === 'add' ? 'add' : null
    const rawAmount = Number(body.amount)
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : ''

    if (!userId || !mode) {
      return NextResponse.json({ error: 'userId and mode (add | remove) are required' }, { status: 400 })
    }
    if (!Number.isFinite(rawAmount) || rawAmount <= 0 || !Number.isInteger(rawAmount)) {
      return NextResponse.json({ error: 'amount must be a positive integer' }, { status: 400 })
    }
    if (!reason) {
      return NextResponse.json({ error: 'reason is required (internal note)' }, { status: 400 })
    }

    const amount = rawAmount
    if (mode === 'add' && amount > MAX_GRANT) {
      return NextResponse.json({ error: `Grant cannot exceed ${MAX_GRANT} credits` }, { status: 400 })
    }

    const result = await withPgClient(async (client) => {
      await client.query('BEGIN')

      const uRes = await client.query<{ id: string }>('SELECT id FROM app_users WHERE id = $1 LIMIT 1', [userId])
      if (!uRes.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false as const, code: 'NOT_FOUND' as const }
      }

      const wRes = await client.query<{
        id: string
        balance: number
        lifetime_earned: number
        lifetime_spent: number
      }>(
        `SELECT id, balance, lifetime_earned, lifetime_spent FROM credit_wallets WHERE user_id = $1 LIMIT 1`,
        [userId]
      )
      let wallet = wRes.rows[0] ?? null

      if (!wallet) {
        const ins = await client.query<{
          id: string
          balance: number
          lifetime_earned: number
          lifetime_spent: number
        }>(
          `
          INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
          VALUES ($1, 0, 0, 0)
          RETURNING id, balance, lifetime_earned, lifetime_spent
          `,
          [userId]
        )
        wallet = ins.rows[0] ?? null
      }

      if (!wallet) {
        await client.query('ROLLBACK')
        return { ok: false as const, code: 'WALLET' as const }
      }

      let newBalance: number
      let delta: number
      let txType: string
      let description: string

      if (mode === 'add') {
        delta = amount
        newBalance = wallet.balance + amount
        const newEarned = wallet.lifetime_earned + amount
        txType = 'admin_grant'
        description = `Admin grant (+${amount}). ${reason}`
        await client.query(
          `UPDATE credit_wallets
           SET balance = $1, lifetime_earned = $2, updated_at = NOW()
           WHERE id = $3`,
          [newBalance, newEarned, wallet.id]
        )
      } else {
        if (amount > wallet.balance) {
          await client.query('ROLLBACK')
          return {
            ok: false as const,
            code: 'INSUFFICIENT' as const,
            balance: wallet.balance,
          }
        }
        delta = -amount
        newBalance = wallet.balance - amount
        const newEarned = Math.max(0, wallet.lifetime_earned - amount)
        txType = 'admin_refund'
        description = `Admin removal (−${amount}). ${reason}`
        await client.query(
          `UPDATE credit_wallets
           SET balance = $1, lifetime_earned = $2, updated_at = NOW()
           WHERE id = $3`,
          [newBalance, newEarned, wallet.id]
        )
      }

      await client.query(
        `
        INSERT INTO credit_transactions
          (user_id, amount, balance_after, type, reference_type, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [userId, delta, newBalance, txType, 'admin', `${description} [by admin ${admin.id}]`]
      )

      await client.query(
        `
        INSERT INTO admin_actions (actor_id, action, target_user_id, metadata)
        VALUES ($1, $2, $3, $4::jsonb)
        `,
        [
          admin.id,
          mode === 'add' ? 'credits_admin_grant' : 'credits_admin_remove',
          userId,
          JSON.stringify({
            amount,
            mode,
            reason,
            balance_after: newBalance,
          }),
        ]
      )

      await client.query('COMMIT')
      return {
        ok: true as const,
        balance: newBalance,
        delta,
        txType,
      }
    })

    if (!result.ok) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      if (result.code === 'INSUFFICIENT') {
        return NextResponse.json(
          {
            error: 'Cannot remove more credits than current balance',
            balance: result.balance,
          },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: 'Wallet error' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      balance: result.balance,
      delta: result.delta,
      txType: result.txType,
    })
  } catch (error: unknown) {
    console.error('[admin/credits/adjust]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
