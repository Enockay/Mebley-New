/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'
import { pgQuery } from '@/lib/postgres'

type FulfillmentResult =
  | { ok: true; type: 'subscription'; tier: string; alreadyFulfilled?: boolean }
  | { ok: true; type: 'credits'; credits: number; alreadyFulfilled?: boolean }
  | { ok: false; reason: string }

const SUBSCRIPTION_PLAN_DEFS: Record<string, { tier: string; billing_period: string; monthly_credits: number }> = {
  starter_monthly: { tier: 'starter', billing_period: 'monthly', monthly_credits: 100 },
  premium_monthly: { tier: 'premium', billing_period: 'monthly', monthly_credits: 250 },
  vip_monthly: { tier: 'vip', billing_period: 'monthly', monthly_credits: 450 },
}

const PLAN_CREDITS: Record<string, number> = {
  starter: 100,
  premium: 250,
  vip: 450,
}

function sbAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function addCredits(
  userId: string,
  amount: number,
  refType: string,
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

async function markProcessing(reference: string): Promise<'acquired' | 'completed'> {
  const upsert = await pgQuery<{ status: string }>(
    `
    INSERT INTO paystack_fulfillments (reference, status, attempts, updated_at)
    VALUES ($1, 'processing', 1, NOW())
    ON CONFLICT (reference) DO UPDATE
      SET attempts = paystack_fulfillments.attempts + 1,
          updated_at = NOW()
    RETURNING status
    `,
    [reference]
  )

  const row = upsert.rows[0]
  if (row?.status === 'completed') return 'completed'
  return 'acquired'
}

async function markCompleted(reference: string, type: string) {
  await pgQuery(
    `
    UPDATE paystack_fulfillments
    SET status = 'completed',
        fulfillment_type = $2,
        last_error = NULL,
        fulfilled_at = NOW(),
        updated_at = NOW()
    WHERE reference = $1
    `,
    [reference, type]
  )
}

async function markFailed(reference: string, reason: string) {
  await pgQuery(
    `
    UPDATE paystack_fulfillments
    SET status = 'failed',
        last_error = $2,
        updated_at = NOW()
    WHERE reference = $1
    `,
    [reference, reason.slice(0, 400)]
  )
}

export async function fulfillPaystackReference(
  reference: string,
  paystackMeta?: Record<string, any>
): Promise<FulfillmentResult> {
  const lock = await markProcessing(reference)
  if (lock === 'completed') {
    return { ok: true, type: 'credits', credits: 0, alreadyFulfilled: true }
  }

  const supabase = sbAdmin()

  try {
    const { data: existingActiveSub } = await supabase
      .from('subscriptions')
      .select('id, tier, weekly_credits_last_reset')
      .eq('paystack_ref', reference)
      .eq('status', 'active')
      .maybeSingle()

    if (existingActiveSub?.weekly_credits_last_reset) {
      await markCompleted(reference, 'subscription')
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
      await markCompleted(reference, 'credits')
      return { ok: true, type: 'credits', credits: total, alreadyFulfilled: true }
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paystack_ref', reference)
      .maybeSingle()

    if (sub) {
      if (sub.weekly_credits_last_reset) {
        await markCompleted(reference, 'subscription')
        return { ok: true, type: 'subscription', tier: sub.tier, alreadyFulfilled: true }
      }

      const now = new Date()
      const periodEnd = new Date(now)
      if (sub.billing_period === 'weekly') periodEnd.setDate(periodEnd.getDate() + 7)
      else periodEnd.setMonth(periodEnd.getMonth() + 1)

      await (supabase as any).from('subscriptions').update({
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        weekly_credits_last_reset: now.toISOString(),
      }).eq('id', sub.id)

      await pgQuery(
        `UPDATE profiles SET plan = $1, plan_expires = $2 WHERE id = $3`,
        [sub.tier, periodEnd.toISOString(), sub.user_id]
      )

      const planCredits = PLAN_CREDITS[sub.tier] ?? 0
      if (planCredits > 0) {
        await addCredits(sub.user_id, planCredits, 'subscription_grant', `${sub.tier} monthly credits`)
      }

      await markCompleted(reference, 'subscription')
      return { ok: true, type: 'subscription', tier: sub.tier }
    }

    if (paystackMeta?.type === 'subscription') {
      const planDef = SUBSCRIPTION_PLAN_DEFS[paystackMeta.product as string]
      const userId = paystackMeta.user_id as string
      if (planDef && userId) {
        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setMonth(periodEnd.getMonth() + 1)

        await (supabase as any).from('subscriptions').upsert({
          user_id: userId,
          tier: planDef.tier,
          billing_period: planDef.billing_period,
          status: 'active',
          paystack_ref: reference,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          weekly_credits_last_reset: now.toISOString(),
          weekly_credits_allocated: planDef.monthly_credits,
        }, { onConflict: 'paystack_ref' })

        await pgQuery(
          `UPDATE profiles SET plan = $1, plan_expires = $2 WHERE id = $3`,
          [planDef.tier, periodEnd.toISOString(), userId]
        )

        const planCredits = PLAN_CREDITS[planDef.tier] ?? 0
        if (planCredits > 0) {
          await addCredits(userId, planCredits, 'subscription_grant', `${planDef.tier} monthly credits`)
        }

        await markCompleted(reference, 'subscription')
        return { ok: true, type: 'subscription', tier: planDef.tier }
      }
    }

    const { data: order } = await supabase
      .from('stripe_orders')
      .select('*')
      .or(`paystack_ref.eq.${reference},stripe_session_id.eq.${reference}`)
      .eq('status', 'pending')
      .maybeSingle()

    if (order) {
      const totalCredits = (order.credits_purchased ?? 0) + (order.bonus_credits ?? 0)
      await (supabase as any).from('stripe_orders').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', order.id)

      await addCredits(
        order.user_id,
        totalCredits,
        'credit_purchase',
        `Purchased ${order.credits_purchased} credits (+${order.bonus_credits} bonus)`
      )

      await markCompleted(reference, 'credits')
      return { ok: true, type: 'credits', credits: totalCredits }
    }

    await markFailed(reference, 'No pending record found')
    return { ok: false, reason: `No pending record found for reference: ${reference}` }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown fulfillment error'
    await markFailed(reference, msg)
    throw error
  }
}

