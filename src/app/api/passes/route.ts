/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// ── POST /api/passes ──────────────────────────────────────────────────────────
// Body: { passedId: string }
// Records a permanent pass. Idempotent — passing the same person twice is fine.

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { passedId } = await request.json()

    if (!passedId) {
      return NextResponse.json({ error: 'passedId is required' }, { status: 400 })
    }
    if (passedId === user.id) {
      return NextResponse.json({ error: 'Cannot pass yourself' }, { status: 400 })
    }

    const { error } = await (supabase as any)
      .from('passes')
      .upsert(
        { passer_id: user.id, passed_id: passedId },
        { onConflict: 'passer_id,passed_id' }
      )

    if (error) {
      console.error('[Passes] insert error:', error)
      return NextResponse.json({ error: 'Failed to record pass' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[Passes] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── GET /api/passes ───────────────────────────────────────────────────────────
// Returns all passed profile IDs for the current user.
// Called on browse page mount to seed the passedIds exclusion set.

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await (supabase as any)
      .from('passes')
      .select('passed_id')
      .eq('passer_id', user.id)

    if (error) {
      console.error('[Passes] GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch passes' }, { status: 500 })
    }

    const passedIds = (data ?? []).map((r: any) => r.passed_id)
    return NextResponse.json({ passedIds })

  } catch (error) {
    console.error('[Passes] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
