/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/paystack/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pgQuery } from '@/lib/postgres'
import crypto from 'crypto'

// Supabase client — only for subscriptions + stripe_orders (Supabase-only tables)
const sbAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Plan definitions (mirrors initialise/route.ts) ──────────────────────
const SUBSCRIPTION_PLAN_DEFS: Record<string, { tier: string; billing_period: string; monthly_credits: number }> = {
  starter_monthly: { tier: 'starter', billing_period: 'monthly', monthly_credits: 100 },
  premium_monthly: { tier: 'premium', billing_period: 'monthly', monthly_credits: 250 },
  vip_monthly:     { tier: 'vip',     billing_period: 'monthly', monthly_credits: 450 },
}

const PLAN_CREDITS: Record<string, number> = {
  starter: 100,
  premium: 250,
  vip:     450,
}

// ─── Add credits — always writes to primary Postgres ─────────────────────
async function addCredits(
  userId:      string,
  amount:      number,
  refType:     string,
  description: string
) {
  const walletRes = await pgQuery<{ id: string; balance: number; lifetime_earned: number }>(
    'SELECT id, balance, lifetime_earned FROM credit_wallets WHERE user_id = $1 LIMIT 1',
    [userId]
  )
  const wallet = walletRes.rows[0] ?? null
  const newBalance = (wallet?.balance ?? 0) + amount

  if (wallet) {
    await pgQuery(
      `UPDATE credit_wallets
       SET balance = $1, lifetime_earned = $2, updated_at = NOW()
       WHERE id = $3`,
      [newBalance, wallet.lifetime_earned + amount, wallet.id]
    )
  } else {
    await pgQuery(
      `INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
       VALUES ($1, $2, $3, 0)
       ON CONFLICT (user_id) DO UPDATE
         SET balance = credit_wallets.balance + EXCLUDED.balance,
             lifetime_earned = credit_wallets.lifetime_earned + EXCLUDED.lifetime_earned,
             updated_at = NOW()`,
      [userId, amount, amount]
    )
  }

  await pgQuery(
    `INSERT INTO credit_transactions
       (user_id, amount, balance_after, type, reference_type, description)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, amount, newBalance, refType, refType, description]
  )
}

// ─── Fulfill a confirmed Paystack payment ─────────────────────────────────
async function fulfill(reference: string, paystackMeta?: Record<string, any>) {
  const supabase = sbAdmin()

  // Idempotency checks
  const { data: existingActiveSub } = await supabase
    .from('subscriptions')
    .select('id, tier, weekly_credits_last_reset')
    .eq('paystack_ref', reference)
    .eq('status', 'active')
    .maybeSingle()

  if (existingActiveSub?.weekly_credits_last_reset) {
    return { ok: true, type: 'subscription', tier: existingActiveSub.tier, alreadyFulfilled: true }
  }

  const { data: existingCompletedOrder } = await supabase
    .from('stripe_orders')
    .select('id, credits_purchased, bonus_credits')
    .or(`paystack_ref.eq.${reference},stripe_session_id.eq.${reference}`)
    .eq('status', 'completed')
    .maybeSingle()

  if (existingCompletedOrder) {
    const total = (existingCompletedOrder.credits_purchased ?? 0) + (existingCompletedOrder.bonus_credits ?? 0)
    return { ok: true, type: 'credits', credits: total, alreadyFulfilled: true }
  }

  // ── Subscription ─────────────────────────────────────────────────────────
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paystack_ref', reference)
    .maybeSingle()

  if (sub) {
    if (sub.weekly_credits_last_reset) {
      return { ok: true, type: 'subscription', tier: sub.tier, alreadyFulfilled: true }
    }

    const now       = new Date()
    const periodEnd = new Date(now)
    if (sub.billing_period === 'weekly') periodEnd.setDate(periodEnd.getDate() + 7)
    else                                 periodEnd.setMonth(periodEnd.getMonth() + 1)

    await (supabase as any).from('subscriptions').update({
      status:                    'active',
      current_period_start:      now.toISOString(),
      current_period_end:        periodEnd.toISOString(),
      weekly_credits_last_reset: now.toISOString(),
    }).eq('id', sub.id)

    // profiles lives in primary Postgres
    await pgQuery(
      `UPDATE profiles SET plan = $1, plan_expires = $2 WHERE id = $3`,
      [sub.tier, periodEnd.toISOString(), sub.user_id]
    )

    const planCredits = PLAN_CREDITS[sub.tier] ?? 0
    if (planCredits > 0) {
      await addCredits(sub.user_id, planCredits, 'subscription_grant', `${sub.tier} monthly credits`)
    }

    return { ok: true, type: 'subscription', tier: sub.tier }
  }

  // ── Subscription fallback: pre-insert may have failed (e.g. tier constraint) ──
  if (paystackMeta?.type === 'subscription') {
    const planDef = SUBSCRIPTION_PLAN_DEFS[paystackMeta.product as string]
    const userId  = paystackMeta.user_id as string
    if (planDef && userId) {
      const now       = new Date()
      const periodEnd = new Date(now)
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      await (supabase as any).from('subscriptions').insert({
        user_id:                   userId,
        tier:                      planDef.tier,
        billing_period:            planDef.billing_period,
        status:                    'active',
        paystack_ref:              reference,
        current_period_start:      now.toISOString(),
        current_period_end:        periodEnd.toISOString(),
        weekly_credits_last_reset: now.toISOString(),
        weekly_credits_allocated:  planDef.monthly_credits,
      })

      await pgQuery(
        `UPDATE profiles SET plan = $1, plan_expires = $2 WHERE id = $3`,
        [planDef.tier, periodEnd.toISOString(), userId]
      )

      const planCredits = PLAN_CREDITS[planDef.tier] ?? 0
      if (planCredits > 0) {
        await addCredits(userId, planCredits, 'subscription_grant', `${planDef.tier} monthly credits`)
      }

      return { ok: true, type: 'subscription', tier: planDef.tier }
    }
  }

  // ── Credit pack purchase ──────────────────────────────────────────────────
  const { data: order } = await supabase
    .from('stripe_orders')
    .select('*')
    .or(`paystack_ref.eq.${reference},stripe_session_id.eq.${reference}`)
    .eq('status', 'pending')
    .maybeSingle()

  if (order) {
    const totalCredits = (order.credits_purchased ?? 0) + (order.bonus_credits ?? 0)

    await (supabase as any).from('stripe_orders').update({
      status:       'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', order.id)

    await addCredits(order.user_id, totalCredits, 'credit_purchase',
      `Purchased ${order.credits_purchased} credits (+${order.bonus_credits} bonus)`)

    return { ok: true, type: 'credits', credits: totalCredits }
  }

  return { ok: false, reason: 'No pending record found for reference: ' + reference }
}

// ─── GET — browser redirect back from Paystack ────────────────────────────
export async function GET(req: NextRequest) {
  const ref     = req.nextUrl.searchParams.get('ref')
  const appBase = process.env.NEXT_PUBLIC_APP_URL!

  if (!ref) return NextResponse.redirect(`${appBase}/upgrade?error=missing_ref`)

  try {
    const res  = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })
    const data = await res.json()

    if (!data.status || data.data?.status !== 'success') {
      console.error('[paystack/verify GET] not success:', data)
      return NextResponse.redirect(`${appBase}/upgrade?error=payment_failed`)
    }

    const result = await fulfill(ref, data.data?.metadata)
    if (!result.ok) {
      console.error('[paystack/verify GET] fulfill failed:', result)
      return NextResponse.redirect(`${appBase}/upgrade?error=fulfillment_failed`)
    }

    return NextResponse.redirect(`${appBase}/upgrade?success=1&type=${result.type}`)

  } catch (err) {
    console.error('[paystack/verify GET]', err)
    return NextResponse.redirect(`${appBase}/upgrade?error=server_error`)
  }
}

// ─── POST — Paystack webhook ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    const sig  = req.headers.get('x-paystack-signature') ?? ''
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest('hex')

    if (hash !== sig) {
      console.error('[paystack webhook] bad signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    const { event: type, data } = event
    const reference: string | null = data?.reference ?? null

    if (type === 'charge.success' && reference) {
      await fulfill(reference, data?.metadata)
    }

    if ((type === 'subscription.disable' || type === 'invoice.payment_failed') && reference) {
      const supabase = sbAdmin()
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('paystack_ref', reference)
        .maybeSingle()

      if (sub) {
        await (supabase as any).from('subscriptions').update({ status: 'cancelled' }).eq('paystack_ref', reference)
        await pgQuery(`UPDATE profiles SET plan = 'free', plan_expires = NULL WHERE id = $1`, [sub.user_id])
      }
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[paystack webhook POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
