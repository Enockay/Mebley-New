import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie, revokeSessionFromRequest } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    await revokeSessionFromRequest(request)
    const response = NextResponse.json({ success: true })
    clearAuthCookie(response)
    return response
  } catch (error) {
    console.error('[auth/signout] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

