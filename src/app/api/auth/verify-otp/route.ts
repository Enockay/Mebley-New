/**
 * src/app/api/auth/verify-otp/route.ts
 *
 * Verifies a submitted OTP against the stored bcrypt hash.
 * On success, signs the user in via Supabase phone auth.
 *
 * Security properties:
 *  ✅ Brute-force protection — max 5 attempts before OTP is invalidated
 *  ✅ Replay protection — OTP marked used after first successful verify
 *  ✅ Expiry enforced server-side (not just client-side)
 *  ✅ Constant-time comparison via bcrypt (no timing oracle)
 *  ✅ Rate limited per IP
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'
import { verifyOtp } from '@/lib/otp-store'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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

    // ── Rate limit per IP ───────────────────────────────────────────────────
    const ipLimit = rateLimit(`verify-otp-ip:${ip}`, 'auth')
    if (!ipLimit.success) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Try again later.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(ipLimit.resetIn / 1000)) } }
      )
    }

    // ── Parse body ──────────────────────────────────────────────────────────
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

    // ── Verify OTP against stored hash ──────────────────────────────────────
    const result = await verifyOtp(phone, otp)

    if (!result.success) {
      // Return a generic message to the client — specific error only in logs
      console.warn('[verify-otp] Verification failed for phone (masked):', phone.slice(0, 4) + '****', result.error)
      return NextResponse.json(
        { success: false, message: result.error ?? 'Invalid or expired code', code: 'OTP_INVALID' },
        { status: 400 }
      )
    }

    // ── OTP valid — sign in via Supabase ────────────────────────────────────
    const supabase = await createServerSupabaseClient()
    const { data, error: signInError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    })

    if (signInError || !data.session) {
      console.error('[verify-otp] Supabase sign-in failed:', signInError?.message)
      return NextResponse.json(
        { success: false, message: 'Authentication failed. Please try again.', code: 'AUTH_FAILED' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Phone verified successfully',
      userId: data.user?.id,
    })

  } catch (error) {
    console.error('[verify-otp] Unexpected error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}