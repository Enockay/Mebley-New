// src/app/api/cron/subscription-check/route.ts
// Call daily via Vercel Cron or any external scheduler.
// Protected by CRON_SECRET env var — hit with ?secret=<value>
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pgQuery } from '@/lib/postgres'

const sbAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // Auth check — require CRON_SECRET query param or Authorization header
  const secret = req.nextUrl.searchParams.get('secret')
    ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = sbAdmin()

    // All active subscriptions whose billing period has ended
    const { data: expiredSubs, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, tier, current_period_end')
      .eq('status', 'active')
      .lt('current_period_end', new Date().toISOString())

    if (error) {
      console.error('[cron/subscription-check] query error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!expiredSubs || expiredSubs.length === 0) {
      return NextResponse.json({ ok: true, expired: 0 })
    }

    let processed = 0
    const failed: string[] = []

    for (const sub of expiredSubs) {
      try {
        // Mark expired in Supabase
        await (supabase as any)
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', sub.id)

        // Revert profile to free in primary Postgres
        await pgQuery(
          `UPDATE profiles SET plan = 'free', plan_expires = NULL WHERE id = $1`,
          [sub.user_id]
        )

        processed++
      } catch (err) {
        console.error(`[cron/subscription-check] failed for ${sub.user_id}:`, err)
        failed.push(sub.user_id)
      }
    }

    console.log(`[cron/subscription-check] processed ${processed}/${expiredSubs.length}`)

    return NextResponse.json({
      ok:      true,
      expired: processed,
      total:   expiredSubs.length,
      ...(failed.length > 0 && { failed }),
    })

  } catch (err) {
    console.error('[cron/subscription-check]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
