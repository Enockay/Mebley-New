// src/app/api/credits/spend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

// Boost costs + duration_hours — using ACTUAL boosts table columns
const BOOST_CONFIG: Record<string, { credits: number; hours: number }> = {
  quick:   { credits: 50,  hours: 6   },
  day:     { credits: 120, hours: 24  },
  weekend: { credits: 250, hours: 72  },
  power:   { credits: 400, hours: 120 },
}

// Moment expiry hours
const MOMENT_EXPIRY_HOURS: Record<string, number> = {
  here_tonight:  6,
  night_out:     8,
  spotlight:     24,
  golden_thread: 24,
  stitch:        0,   // no expiry — action is instant
  voice_like:    0,
  direct_match:  0,
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const cookieStore  = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { product, type, receiver_id } = await req.json()
    // type: 'moment' | 'boost'

    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // 2. Get cost
    const cost = type === 'boost'
      ? BOOST_CONFIG[product]?.credits
      : MOMENT_COSTS[product]

    if (!cost) return NextResponse.json({ error: `Unknown product: ${product}` }, { status: 400 })

    // 3. Check wallet balance — ACTUAL column names
    const { data: wallet } = await db
      .from('credit_wallets')
      .select('id, balance, lifetime_spent')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!wallet || wallet.balance < cost) {
      return NextResponse.json({
        error:   'Insufficient credits',
        balance: wallet?.balance ?? 0,
        needed:  cost,
      }, { status: 402 })
    }

    const newBalance = wallet.balance - cost

    // 4. Deduct from wallet
    await db.from('credit_wallets').update({
      balance:        newBalance,
      lifetime_spent: wallet.lifetime_spent + cost,  // ✓ actual column
      updated_at:     new Date().toISOString(),
    }).eq('id', wallet.id)

    // 5. Log transaction — ACTUAL column names
    await db.from('credit_transactions').insert({
      user_id:        user.id,
      amount:         -cost,           // negative = debit
      balance_after:  newBalance,      // ✓ actual column
      type:           type === 'boost' ? 'boost_purchase' : 'moment_spend',
      reference_type: type,            // ✓ actual column
      description:    `Spent ${cost} credits on ${product}`,  // ✓ actual column
    })

    // 6. Create moment or boost record — ACTUAL column names
    const now = new Date()

    if (type === 'moment') {
      const expiryHours = MOMENT_EXPIRY_HOURS[product]
      const expiresAt   = expiryHours > 0
        ? new Date(now.getTime() + expiryHours * 60 * 60 * 1000).toISOString()
        : null

      // moments table: sender_id + receiver_id (not user_id)
      await db.from('moments').insert({
        sender_id:    user.id,           // ✓ actual column
        receiver_id:  receiver_id ?? user.id, // pass receiver from client
        type:         product,           // ✓ actual column
        credits_spent: cost,             // ✓ actual column
        status:       'pending',
        expires_at:   expiresAt,         // ✓ actual column
      })

    } else if (type === 'boost') {
      const config = BOOST_CONFIG[product]
      const expiresAt = new Date(now.getTime() + config.hours * 60 * 60 * 1000).toISOString()

      // boosts table: duration_hours (not type column)
      await db.from('boosts').insert({
        user_id:       user.id,          // ✓ actual column
        credits_spent: cost,             // ✓ actual column
        duration_hours: config.hours,   // ✓ actual column (no 'type' col in boosts)
        activated_at:  now.toISOString(),// ✓ actual column
        expires_at:    expiresAt,        // ✓ actual column
        status:        'active',
      })
    }

    return NextResponse.json({ ok: true, new_balance: newBalance })

  } catch (err: any) {
    console.error('[credits/spend]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
