import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth-server'
import { pgQuery } from '@/lib/postgres'
import {
  WHO_LIKED_YOU_UNLOCK_CREDITS,
  WHO_LIKED_YOU_UNLOCK_REF,
} from '@/lib/who-liked-you-unlock.constants'
import { hasWhoLikedYouCreditUnlock } from '@/lib/who-liked-you-unlock'

const PAID_TIERS = ['premium', 'vip']

/** Spend credits to reveal Liked Me for 24h (Premium/VIP skip — already included). */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const planRes = await pgQuery<{ plan: string | null }>(
      'SELECT plan FROM profiles WHERE id = $1 LIMIT 1',
      [user.id]
    )
    const plan = planRes.rows[0]?.plan ?? 'free'

    if (PAID_TIERS.includes(plan)) {
      return NextResponse.json({ unlocked: true, balance: null, usedCredits: 0, reason: 'premium' })
    }

    if (await hasWhoLikedYouCreditUnlock(user.id)) {
      return NextResponse.json({ unlocked: true, balance: null, usedCredits: 0, reason: 'already_unlocked' })
    }

    const walletRes = await pgQuery<{ id: string; balance: number; lifetime_spent: number }>(
      'SELECT id, balance, lifetime_spent FROM credit_wallets WHERE user_id = $1 LIMIT 1',
      [user.id]
    )
    const wallet = walletRes.rows[0] ?? null
    const bal      = wallet?.balance ?? 0

    if (!wallet || bal < WHO_LIKED_YOU_UNLOCK_CREDITS) {
      return NextResponse.json(
        {
          error:   'Insufficient credits',
          balance: bal,
          needed:  WHO_LIKED_YOU_UNLOCK_CREDITS,
        },
        { status: 402 }
      )
    }

    const cost       = WHO_LIKED_YOU_UNLOCK_CREDITS
    const newBalance = bal - cost

    await pgQuery(
      `UPDATE credit_wallets
       SET balance = $1, lifetime_spent = $2, updated_at = NOW()
       WHERE id = $3`,
      [newBalance, wallet.lifetime_spent + cost, wallet.id]
    )

    await pgQuery(
      `INSERT INTO credit_transactions
         (user_id, amount, balance_after, type, reference_type, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.id,
        -cost,
        newBalance,
        'premium_action_spend',
        WHO_LIKED_YOU_UNLOCK_REF,
        `Unlocked “Liked Me” for 24h (${cost} credits)`,
      ]
    )

    return NextResponse.json({
      unlocked:    true,
      balance:     newBalance,
      usedCredits: cost,
      reason:      'purchased',
    })
  } catch (err) {
    console.error('[likes/received/unlock]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
