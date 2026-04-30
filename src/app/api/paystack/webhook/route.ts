/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/paystack/webhook/route.ts
// Dedicated Paystack webhook endpoint — configure this URL in Paystack dashboard
// Handles: charge.success, invoice.payment_success (renewal), subscription.disable, invoice.payment_failed
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pgQuery } from '@/lib/postgres'
import crypto from 'crypto'
import { fulfillPaystackReference } from '@/lib/paystack-fulfillment'

const sbAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_CREDITS: Record<string, number> = {
  starter: 100,
  premium: 250,
  vip:     450,
}

async function addCredits(userId: string, amount: number, refType: string, description: string) {
  const walletRes = await pgQuery<{ id: string; balance: number; lifetime_earned: number }>(
    'SELECT id, balance, lifetime_earned FROM credit_wallets WHERE user_id = $1 LIMIT 1',
    [userId]
  )
  const wallet = walletRes.rows[0] ?? null
  const newBalance = (wallet?.balance ?? 0) + amount

  if (wallet) {
    await pgQuery(
      `UPDATE credit_wallets SET balance = $1, lifetime_earned = $2, updated_at = NOW() WHERE id = $3`,
      [newBalance, wallet.lifetime_earned + amount, wallet.id]
    )
  } else {
    await pgQuery(
      `INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
       VALUES ($1, $2, $3, 0)
       ON CONFLICT (user_id) DO UPDATE
         SET balance        = credit_wallets.balance        + EXCLUDED.balance,
             lifetime_earned= credit_wallets.lifetime_earned+ EXCLUDED.lifetime_earned,
             updated_at     = NOW()`,
      [userId, amount, amount]
    )
  }

  await pgQuery(
    `INSERT INTO credit_transactions (user_id, amount, balance_after, type, reference_type, description)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [userId, amount, newBalance, refType, refType, description]
  )
}

// ── charge.success — initial purchase OR manual re-subscribe ──────────────
async function handleChargeSuccess(data: Record<string, any>) {
  const reference = data?.reference
  if (!reference) return
  await fulfillPaystackReference(reference, data?.metadata)
}

// ── invoice.payment_success — Paystack recurring subscription renewal ──────
async function handleRenewal(data: Record<string, any>) {
  // Paystack sends this when a recurring plan charge succeeds.
  // data.subscription.subscription_code, data.transaction.reference, data.customer.email
  const transactionRef  = data?.transaction?.reference
  const customerEmail   = data?.customer?.email
  if (!transactionRef || !customerEmail) return

  const supabase = sbAdmin()

  // Resolve user by email
  const userRes = await pgQuery<{ id: string }>(
    `SELECT au.id FROM app_users au WHERE LOWER(au.email) = LOWER($1) LIMIT 1`,
    [customerEmail]
  )
  const userId = userRes.rows[0]?.id
  if (!userId) return

  // Idempotency: already applied this renewal ref?
  const { data: existingRef } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('paystack_ref', transactionRef)
    .maybeSingle()
  if (existingRef) return

  // Find the current active subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .maybeSingle()
  if (!sub) return

  const now       = new Date()
  const periodEnd = new Date(now)
  if (sub.billing_period === 'weekly') periodEnd.setDate(periodEnd.getDate() + 7)
  else                                  periodEnd.setMonth(periodEnd.getMonth() + 1)

  await (supabase as any).from('subscriptions').update({
    current_period_start:      now.toISOString(),
    current_period_end:        periodEnd.toISOString(),
    weekly_credits_last_reset: now.toISOString(),
    paystack_ref:              transactionRef,
  }).eq('id', sub.id)

  await pgQuery(`UPDATE profiles SET plan_expires = $1 WHERE id = $2`,
    [periodEnd.toISOString(), userId])

  const credits = PLAN_CREDITS[sub.tier] ?? 0
  if (credits > 0) await addCredits(userId, credits, 'subscription_renewal', `${sub.tier} plan renewal`)
}

// ── subscription.disable | invoice.payment_failed — cancel & downgrade ────
async function handleCancellation(data: Record<string, any>) {
  const reference = data?.reference
  if (!reference) return

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

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const sig     = req.headers.get('x-paystack-signature') ?? ''
    const hash    = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest('hex')

    if (hash !== sig) {
      console.error('[paystack/webhook] invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event         = JSON.parse(rawBody)
    const { event: type, data } = event

    console.log('[paystack/webhook] received:', type)

    switch (type) {
      case 'charge.success':
        await handleChargeSuccess(data)
        break
      case 'invoice.payment_success':
        await handleRenewal(data)
        break
      case 'subscription.disable':
      case 'invoice.payment_failed':
        await handleCancellation(data)
        break
      default:
        // Acknowledge unhandled events — Paystack retries if we return non-2xx
        break
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[paystack/webhook] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
