/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/paystack/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Weekly credits per tier (from spec) ──────────────────────────────────
const PLAN_CREDITS: Record<string, number> = {
  starter: 100,
  premium: 250,
  vip: 450,
}

// ─── Add credits to wallet — handles upsert + lifetime tracking ───────────
async function addCredits(
  supabase: any,
  userId: string,
  amount: number,
  refType: string,
  description: string
) {
  // Get or create wallet
  const { data: wallet } = await supabase
    .from('credit_wallets')
    .select('id, balance, lifetime_earned')
    .eq('user_id', userId)
    .maybeSingle() as { data: { id: string; balance: number; lifetime_earned: number } | null }

  const newBalance = (wallet?.balance ?? 0) + amount

  if (wallet) {
    await (supabase as any).from('credit_wallets').update({
      balance:         newBalance,
      lifetime_earned: wallet.lifetime_earned + amount,
      updated_at:      new Date().toISOString(),
    }).eq('id', wallet.id)
  } else {
    await (supabase as any).from('credit_wallets').insert({
      user_id:         userId,
      balance:         amount,
      lifetime_earned: amount,
      lifetime_spent:  0,
    })
  }

  // Log transaction — using ACTUAL column names from DB
  await (supabase as any).from('credit_transactions').insert({
    user_id:        userId,
    amount,
    balance_after:  newBalance,   // ✓ actual column
    type:           refType,      // ✓ actual column
    reference_type: refType,      // ✓ actual column
    description,                  // ✓ actual column
  })
}

// ─── Fulfill a confirmed Paystack payment ─────────────────────────────────
async function fulfill(reference: string) {
  const supabase = db()

  // Idempotency: if this reference was already fulfilled, treat as success.
  const { data: existingActiveSub } = await supabase
    .from('subscriptions')
    .select('id, tier')
    .eq('paystack_ref', reference)
    .eq('status', 'active')
    .maybeSingle()

  if (existingActiveSub) {
    return { ok: true, type: 'subscription', tier: existingActiveSub.tier, alreadyFulfilled: true }
  }

  const { data: existingCompletedOrder } = await supabase
    .from('stripe_orders')
    .select('id, credits_purchased, bonus_credits')
    .or(`paystack_ref.eq.${reference},stripe_session_id.eq.${reference}`)
    .eq('status', 'completed')
    .maybeSingle()

  if (existingCompletedOrder) {
    const totalCredits = (existingCompletedOrder.credits_purchased ?? 0) + (existingCompletedOrder.bonus_credits ?? 0)
    return { ok: true, type: 'credits', credits: totalCredits, alreadyFulfilled: true }
  }

  // ── Subscription ─────────────────────────────────────────────────────────
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paystack_ref', reference)
    .eq('status', 'pending')
    .maybeSingle()

  if (sub) {
    const now       = new Date()
    const periodEnd = new Date(now)
    if (sub.billing_period === 'weekly') periodEnd.setDate(periodEnd.getDate() + 7)
    else                                 periodEnd.setMonth(periodEnd.getMonth() + 1)

    // Activate subscription — ACTUAL column names
    await (supabase as any).from('subscriptions').update({
      status:                   'active',
      current_period_start:     now.toISOString(),
      current_period_end:       periodEnd.toISOString(),
      weekly_credits_last_reset: now.toISOString(),
    }).eq('id', sub.id)

    // Upgrade profile plan
    await (supabase as any).from('profiles').update({
      plan:         sub.tier,              // profiles.plan added by patch SQL
      plan_expires: periodEnd.toISOString(),
    }).eq('id', sub.user_id)

    // Grant first week's credits
    const planCredits = PLAN_CREDITS[sub.tier] ?? 0
    if (planCredits > 0) {
      await addCredits(supabase, sub.user_id, planCredits, 'subscription_grant',
        `${sub.tier} monthly credits`)
    }

    return { ok: true, type: 'subscription', tier: sub.tier }
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
      status:       'completed',       // ✓ actual column
      completed_at: new Date().toISOString(), // ✓ actual column
    }).eq('id', order.id)

    await addCredits(supabase, order.user_id, totalCredits, 'credit_purchase',
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
    // Verify with Paystack
    const res  = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })
    const data = await res.json()

    if (!data.status || data.data?.status !== 'success') {
      console.error('[paystack/verify GET] not success:', data)
      return NextResponse.redirect(`${appBase}/upgrade?error=payment_failed`)
    }

    const result = await fulfill(ref)
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

    // Verify HMAC signature
    const sig  = req.headers.get('x-paystack-signature') ?? ''
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest('hex')

    if (hash !== sig) {
      console.error('[paystack webhook] bad signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event    = JSON.parse(rawBody)
    const { event: type, data } = event
    const reference: string | null = data?.reference ?? null

    if (type === 'charge.success' && reference) {
      await fulfill(reference)
    }

    // Subscription cancelled or payment failed — downgrade to free
    if ((type === 'subscription.disable' || type === 'invoice.payment_failed') && reference) {
      const supabase = db()
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('paystack_ref', reference)
        .maybeSingle()

      if (sub) {
        await (supabase as any).from('subscriptions').update({ status: 'cancelled' }).eq('paystack_ref', reference)
        await (supabase as any).from('profiles').update({ plan: 'free', plan_expires: null }).eq('id', sub.user_id)
      }
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[paystack webhook POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
