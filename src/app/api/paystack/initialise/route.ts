// src/app/api/paystack/initialize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ─── Subscription plans — exact prices from spec ──────────────────────────
export const SUBSCRIPTION_PLANS = {
  premium_weekly:  { tier: 'premium', billing_period: 'weekly',  usd: 5.99,  label: 'Premium Weekly'  },
  premium_monthly: { tier: 'premium', billing_period: 'monthly', usd: 14.99, label: 'Premium Monthly' },
  vip_weekly:      { tier: 'vip',     billing_period: 'weekly',  usd: 11.99, label: 'VIP Weekly'      },
  vip_monthly:     { tier: 'vip',     billing_period: 'monthly', usd: 29.99, label: 'VIP Monthly'     },
} as const

// ─── Credit packs — exact prices from spec ───────────────────────────────
export const CREDIT_PACKS = {
  starter: { pack_key: 'starter', credits: 100, bonus: 0,   usd: 4.99,  label: 'Starter Pack' },
  popular: { pack_key: 'popular', credits: 300, bonus: 30,  usd: 19.99, label: 'Popular Pack' },
  value:   { pack_key: 'value',   credits: 700, bonus: 100, usd: 39.99, label: 'Value Pack'   },
  mega:    { pack_key: 'mega',    credits: 1600,bonus: 300, usd: 74.99, label: 'Mega Pack'    },
} as const

export type SubPlanKey    = keyof typeof SUBSCRIPTION_PLANS
export type CreditPackKey = keyof typeof CREDIT_PACKS

type Body =
  | { type: 'subscription'; product: SubPlanKey    }
  | { type: 'credits';      product: CreditPackKey }

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

    const db         = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const body: Body  = await req.json()
    const { type, product } = body
    const reference   = `cro_${type}_${product}_${user.id.slice(0,8)}_${Date.now()}`
    let amountCents   = 0
    let label         = ''

    // 2. Validate product + write pending record using ACTUAL column names
    if (type === 'subscription') {
      const plan = SUBSCRIPTION_PLANS[product as SubPlanKey]
      if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
      amountCents = Math.round(plan.usd * 100)
      label       = plan.label

      // DB columns: tier, billing_period, paystack_ref (added by patch SQL)
      await db.from('subscriptions').insert({
        user_id:                  user.id,
        tier:                     plan.tier,          // ✓ actual column name
        billing_period:           plan.billing_period,// ✓ actual column name
        status:                   'pending',
        paystack_ref:             reference,
        current_period_start:     new Date().toISOString(),
        current_period_end:       new Date().toISOString(), // set properly on confirm
        weekly_credits_allocated: plan.tier === 'premium' ? 50 : 150,
      })

    } else if (type === 'credits') {
      const pack = CREDIT_PACKS[product as CreditPackKey]
      if (!pack) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 })
      amountCents = Math.round(pack.usd * 100)
      label       = pack.label

      // Look up the credit_pack_id from credit_packs table
      const { data: packRow } = await db
        .from('credit_packs')
        .select('id')
        .ilike('name', pack.pack_key)
        .maybeSingle()

      // DB columns: credits_purchased, bonus_credits, amount_usd, paystack_ref (added by patch)
      await db.from('stripe_orders').insert({
        user_id:           user.id,
        stripe_session_id: reference,  // also stored here as fallback
        paystack_ref:      reference,  // ✓ added by patch SQL
        pack_key:          pack.pack_key,
        credit_pack_id:    packRow?.id ?? null,
        credits_purchased: pack.credits,  // ✓ actual column name
        bonus_credits:     pack.bonus,    // ✓ actual column name
        amount_usd:        pack.usd,      // ✓ actual column name
        status:            'pending',
      })

    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // 3. Call Paystack
    const psRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email:        user.email!,
        amount:       amountCents,
        currency:     'USD',
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/verify?ref=${reference}`,
        channels:     ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer'],
        metadata: {
          user_id: user.id,
          product,
          type,
          custom_fields: [
            { display_name: 'Product', variable_name: 'product', value: label      },
            { display_name: 'App',     variable_name: 'app',     value: 'Crotchet' },
          ],
        },
      }),
    })

    const ps = await psRes.json()
    if (!ps.status) {
      console.error('[paystack/initialize] error:', ps)
      return NextResponse.json({ error: ps.message || 'Paystack error' }, { status: 502 })
    }

    return NextResponse.json({
      authorization_url: ps.data.authorization_url,
      access_code:       ps.data.access_code,
      reference,
    })

  } catch (err: any) {
    console.error('[paystack/initialize]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
