/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/paystack/initialize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUserFromRequest } from '@/lib/auth-server'

// ─── Subscription plans — exact prices from spec ──────────────────────────
export const SUBSCRIPTION_PLANS = {
  starter_monthly: { tier: 'starter', billing_period: 'monthly', usd: 5.00,  label: 'Starter Monthly', monthly_credits: 100 },
  premium_monthly: { tier: 'premium', billing_period: 'monthly', usd: 10.00, label: 'Premium Monthly', monthly_credits: 250 },
  vip_monthly:     { tier: 'vip',     billing_period: 'monthly', usd: 15.00, label: 'VIP Monthly',     monthly_credits: 450 },
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
    // 1. Auth (Postgres-native app session; user.id maps to app_users.id)
    const user = await getAuthUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db         = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Resolve a user id that is guaranteed to exist in Supabase public.app_users.
    // Some environments may have app-session IDs coming from a different DB cluster.
    let paymentUserId = user.id
    let hasBillingUser = false
    const { data: appUserById } = await (db as any)
      .from('app_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (appUserById?.id) {
      paymentUserId = appUserById.id
      hasBillingUser = true
    }

    if (!hasBillingUser && user.email) {
      const { data: appUserByEmail } = await (db as any)
        .from('app_users')
        .select('id')
        .ilike('email', user.email)
        .maybeSingle()
      if (appUserByEmail?.id) {
        paymentUserId = appUserByEmail.id
        hasBillingUser = true
      }
    }

    if (!hasBillingUser) {
      // Ensure FK target exists in Supabase billing DB even when auth sessions
      // are backed by a different Postgres cluster.
      const fallbackEmail = user.email?.trim().toLowerCase()
      if (!fallbackEmail) {
        return NextResponse.json({ error: 'Could not resolve billing user email' }, { status: 500 })
      }
      const { error: createBillingUserError } = await (db as any).from('app_users').insert({
        id: user.id,
        email: fallbackEmail,
        // Valid bcrypt hash placeholder; real auth remains in app session DB.
        password_hash: '$2b$12$C6UzMDM.H6dfI/f/IKcEeO5vW8sELpAo0P5PLf4KJIp4jOSAmhpN6',
        email_verified: true,
        is_active: true,
      })

      if (createBillingUserError) {
        console.error('[paystack/initialize] failed to create billing app_user:', createBillingUserError)
        return NextResponse.json({ error: 'Could not create billing user' }, { status: 500 })
      }
      paymentUserId = user.id
    }
    const body: Body  = await req.json()
    const { type, product } = body
    const reference   = `cro_${type}_${product}_${paymentUserId.slice(0,8)}_${Date.now()}`
    let amountCents   = 0
    let label         = ''

    // 2. Validate product + write pending record using ACTUAL column names
    if (type === 'subscription') {
      const plan = SUBSCRIPTION_PLANS[product as SubPlanKey]
      if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
      amountCents = Math.round(plan.usd * 100)
      label       = plan.label

      // DB columns: tier, billing_period, paystack_ref (added by patch SQL)
      const { error: subInsertError } = await db.from('subscriptions').insert({
        user_id:                  paymentUserId,
        tier:                     plan.tier,          // ✓ actual column name
        billing_period:           plan.billing_period,// ✓ actual column name
        // Some deployments restrict subscriptions.status via check constraint and do not allow "pending".
        // We use active here and let verify/webhook decide whether monthly credits were already granted.
        status:                   'active',
        paystack_ref:             reference,
        current_period_start:     new Date().toISOString(),
        current_period_end:       new Date().toISOString(), // set properly on confirm
        weekly_credits_allocated: plan.monthly_credits,
      })

      if (subInsertError) {
        console.error('[paystack/initialize] failed to create pending subscription:', subInsertError)
        return NextResponse.json({ error: 'Could not create pending subscription order' }, { status: 500 })
      }

    } else if (type === 'credits') {
      return NextResponse.json({ error: 'Direct credit packs are disabled. Choose a monthly plan.' }, { status: 400 })
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
        channels:     ['card',],
        metadata: {
          user_id: paymentUserId,
          auth_user_id: user.id,
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
