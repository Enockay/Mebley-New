import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUserFromRequest } from '@/lib/auth-server'

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

// GET /api/presence/here-tonight?userId=<id>  (userId optional — defaults to self)
export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const targetId = searchParams.get('userId') ?? user.id

  const { data } = await admin()
    .from('moments')
    .select('expires_at')
    .eq('sender_id', targetId)
    .eq('type', 'here_tonight')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    active: !!data,
    expiresAt: data?.expires_at ?? null,
  })
}
