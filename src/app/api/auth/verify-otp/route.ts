import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'
import { verifyOtp } from '@/lib/otp-store'

const E164_REGEX = /^\+[1-9]\d{7,14}$/

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    // ── Rate limit per IP ─────────────────────────────────────────────────────
    const ipLimit = rateLimit(`verify-otp-ip:${ip}`, 'auth')
    if (!ipLimit.success) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Try again later.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(ipLimit.resetIn / 1000)) } }
      )
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', code: 'INVALID_BODY' },
        { status: 400 }
      )
    }

    const { phone, otp } = body as Record<string, unknown>

    if (typeof phone !== 'string' || !E164_REGEX.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number', code: 'INVALID_PHONE' },
        { status: 400 }
      )
    }

    if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: 'OTP must be a 6-digit code', code: 'INVALID_OTP_FORMAT' },
        { status: 400 }
      )
    }

    // ── Verify OTP against stored hash ────────────────────────────────────────
    const result = await verifyOtp(phone, otp)

    if (!result.success) {
      console.warn('[verify-otp] Failed for phone (masked):', phone.slice(0, 4) + '****', result.error)
      return NextResponse.json(
        { success: false, message: result.error ?? 'Invalid or expired code', code: 'OTP_INVALID' },
        { status: 400 }
      )
    }

    // OTP is valid — caller is responsible for next step (e.g. mark phone verified on profile)
    return NextResponse.json({ success: true, message: 'Phone verified successfully' })

  } catch (error) {
    console.error('[verify-otp] Unexpected error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
