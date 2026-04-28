/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/paystack/initialise/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pgQuery } from '@/lib/postgres'
import { getAuthUserFromRequest } from '@/lib/auth-server'

// ─── Subscription plans ───────────────────────────────────────────────────
export const SUBSCRIPTION_PLANS = {
  starter_monthly: { tier: 'starter', billing_period: 'monthly', usd: 5.00,  label: 'Starter Monthly', monthly_credits: 100 },
  premium_monthly: { tier: 'premium', billing_period: 'monthly', usd: 10.00, label: 'Premium Monthly', monthly_credits: 250 },
  vip_monthly:     { tier: 'vip',     billing_period: 'monthly', usd: 15.00, label: 'VIP Monthly',     monthly_credits: 450 },
} as const

// ─── Credit packs ─────────────────────────────────────────────────────────
export const CREDIT_PACKS = {
  starter: { pack_key: 'starter', credits: 100, bonus: 0,    usd: 4.99,  label: 'Starter Pack' },
  popular: { pack_key: 'popular', credits: 300, bonus: 30,   usd: 19.99, label: 'Popular Pack' },
  value:   { pack_key: 'value',   credits: 700, bonus: 100,  usd: 39.99, label: 'Value Pack'   },
  mega:    { pack_key: 'mega',    credits: 1600, bonus: 300, usd: 74.99, label: 'Mega Pack'    },
} as const

export type SubPlanKey    = keyof typeof SUBSCRIPTION_PLANS
export type CreditPackKey = keyof typeof CREDIT_PACKS

type Body =
  | { type: 'subscription'; product: SubPlanKey    }
  | { type: 'credits';      product: CreditPackKey }

export async function POST(req: NextRequest) {
  try {
    // 1. Auth — custom session, user.id is the primary Postgres app_users.id
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Verify the user exists in primary Postgres app_users
    //    (signup always writes there; this is a sanity check)
    const appUserRes = await pgQuery<{ id: string }>(
      'SELECT id FROM app_users WHERE id = $1 LIMIT 1',
      [user.id]
    )
    let paymentUserId = user.id

    if (!appUserRes.rows[0] && user.email) {
      // Fallback: look up by email (handles edge-case ID mismatch)
      const byEmail = await pgQuery<{ id: string }>(
        'SELECT id FROM app_users WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [user.email]
      )
      if (byEmail.rows[0]) {
        paymentUserId = byEmail.rows[0].id
      } else {
        // User doesn't exist in app_users at all — something is wrong
        console.error('[paystack/initialize] app_user not found for', user.id)
        return NextResponse.json({ error: 'User account not found' }, { status: 500 })
      }
    }

    // Supabase client — only for subscriptions (Supabase-only table)
    const sbAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body: Body = await req.json()
    const { type, product } = body
    const reference  = `cro_${type}_${product}_${paymentUserId.slice(0, 8)}_${Date.now()}`
    let amountCents  = 0
    let label        = ''

    // 3. Validate product + write pending record
    if (type === 'subscription') {
      const plan = SUBSCRIPTION_PLANS[product as SubPlanKey]
      if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
      amountCents = Math.round(plan.usd * 100)
      label       = plan.label

      // Pre-insert in Supabase (non-blocking — verify will create on-the-fly if this fails)
      const { error: subInsertError } = await sbAdmin.from('subscriptions').insert({
        user_id:                  paymentUserId,
        tier:                     plan.tier,
        billing_period:           plan.billing_period,
        status:                   'active',
        paystack_ref:             reference,
        current_period_start:     new Date().toISOString(),
        current_period_end:       new Date().toISOString(),
        weekly_credits_allocated: plan.monthly_credits,
      })

      if (subInsertError) {
        console.warn('[paystack/initialize] pre-insert subscription failed (will create on verify):',
          subInsertError.code, subInsertError.message)
      }

    } else if (type === 'credits') {
      const pack = CREDIT_PACKS[product as CreditPackKey]
      if (!pack) return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 })
      amountCents = Math.round(pack.usd * 100)
      label       = pack.label

      // stripe_orders lives in Supabase
      const { error: orderInsertError } = await (sbAdmin as any).from('stripe_orders').insert({
        user_id:           paymentUserId,
        paystack_ref:      reference,
        stripe_session_id: reference,   // NOT NULL column; reuse Paystack ref
        status:            'pending',
        credits_purchased: pack.credits,
        bonus_credits:     pack.bonus,
        amount_usd:        pack.usd,
      })

      if (orderInsertError) {
        console.error('[paystack/initialize] failed to create credit order:', orderInsertError)
        return NextResponse.json({ error: 'Could not create credit order' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // 4. Call Paystack
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
        channels:     ['card'],
        metadata: {
          user_id:      paymentUserId,
          auth_user_id: user.id,
          product,
          type,
          custom_fields: [
            { display_name: 'Product', variable_name: 'product', value: label      },
            { display_name: 'App',     variable_name: 'app',     value: 'Mebley'   },
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
