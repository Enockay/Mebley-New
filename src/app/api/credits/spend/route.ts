// src/app/api/credits/spend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { pgQuery } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'

// ─── Exact credit costs from spec ────────────────────────────────────────
const MOMENT_COSTS: Record<string, number> = {
  stitch:        50,
  voice_like:    80,
  here_tonight:  80,
  night_out:     100,
  spotlight:     120,
  golden_thread: 150,
  direct_match:  300,
}

// Boost costs + duration_hours
const BOOST_CONFIG: Record<string, { credits: number; hours: number }> = {
  spotlight: { credits: 120, hours: 24  },
  quick:     { credits: 50,  hours: 6   },
  day:       { credits: 120, hours: 24  },
  weekend:   { credits: 250, hours: 72  },
  power:     { credits: 400, hours: 120 },
}

const PREMIUM_ACTION_COSTS: Record<string, number> = {
  priority_delivery:       40,
  profile_rewind:          25,
  super_intent_message:    60,
}

const MOMENT_EXPIRY_HOURS: Record<string, number> = {
  here_tonight:  6,
  night_out:     8,
  spotlight:     24,
  golden_thread: 24,
  stitch:        0,
  voice_like:    0,
  direct_match:  0,
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { product, type, receiver_id } = await req.json()

    // 2. Get cost
    const cost = type === 'boost'
      ? BOOST_CONFIG[product]?.credits
      : type === 'premium_action'
        ? PREMIUM_ACTION_COSTS[product]
        : MOMENT_COSTS[product]

    if (!cost) return NextResponse.json({ error: `Unknown product: ${product}` }, { status: 400 })

    // 3. Check wallet balance — auto-create if missing
    const walletRes = await pgQuery<{ id: string; balance: number; lifetime_spent: number }>(
      'SELECT id, balance, lifetime_spent FROM credit_wallets WHERE user_id = $1 LIMIT 1',
      [user.id]
    )
    let wallet = walletRes.rows[0] ?? null

    if (!wallet) {
      const created = await pgQuery<{ id: string; balance: number; lifetime_spent: number }>(
        `INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
         VALUES ($1, 0, 0, 0)
         ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
         RETURNING id, balance, lifetime_spent`,
        [user.id]
      )
      wallet = created.rows[0] ?? null
    }

    if (!wallet || wallet.balance < cost) {
      return NextResponse.json({
        error:   'Insufficient credits',
        balance: wallet?.balance ?? 0,
        needed:  cost,
      }, { status: 402 })
    }

    const newBalance = wallet.balance - cost

    // 4. Deduct from wallet
    await pgQuery(
      `UPDATE credit_wallets
       SET balance = $1, lifetime_spent = $2, updated_at = NOW()
       WHERE id = $3`,
      [newBalance, wallet.lifetime_spent + cost, wallet.id]
    )

    // 5. Log transaction
    const txType = type === 'boost' ? 'boost_purchase'
                 : type === 'premium_action' ? 'premium_action_spend'
                 : 'moment_spend'

    await pgQuery(
      `INSERT INTO credit_transactions
         (user_id, amount, balance_after, type, reference_type, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, -cost, newBalance, txType, type, `Spent ${cost} credits on ${product}`]
    )

    // 6. Create moment or boost record
    const now = new Date()

    if (type === 'moment') {
      const expiryHours = MOMENT_EXPIRY_HOURS[product]
      const expiresAt   = expiryHours > 0
        ? new Date(now.getTime() + expiryHours * 60 * 60 * 1000).toISOString()
        : null

      await pgQuery(
        `INSERT INTO moments
           (sender_id, receiver_id, type, credits_spent, status, expires_at)
         VALUES ($1, $2, $3, $4, 'pending', $5)`,
        [user.id, receiver_id ?? user.id, product, cost, expiresAt]
      )

    } else if (type === 'boost') {
      const config    = BOOST_CONFIG[product]
      const expiresAt = new Date(now.getTime() + config.hours * 60 * 60 * 1000).toISOString()

      await pgQuery(
        `INSERT INTO boosts
           (user_id, boost_type, credits_spent, duration_hours, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, product, cost, config.hours, expiresAt]
      )
    }

    return NextResponse.json({ ok: true, new_balance: newBalance })

  } catch (err: any) {
    console.error('[credits/spend]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
