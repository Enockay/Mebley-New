// src/app/api/cron/subscription-check/route.ts
// Call daily via Vercel Cron or any external scheduler.
// Protected by CRON_SECRET env var — hit with ?secret=<value>
import { NextRequest, NextResponse } from 'next/server'
import { pgQuery } from '@/lib/postgres'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
    ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { rows: expiredSubs } = await pgQuery<{
      id: string; user_id: string; tier: string; current_period_end: string
    }>(
      `SELECT id, user_id, tier, current_period_end
       FROM subscriptions
       WHERE status = 'active' AND current_period_end < NOW()`
    )

    if (expiredSubs.length === 0) {
      return NextResponse.json({ ok: true, expired: 0 })
    }

    let processed = 0
    const failed: string[] = []

    for (const sub of expiredSubs) {
      try {
        await pgQuery(`UPDATE subscriptions SET status = 'expired' WHERE id = $1`, [sub.id])
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
