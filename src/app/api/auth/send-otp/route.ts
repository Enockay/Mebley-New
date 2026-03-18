/**
 * src/app/api/auth/send-otp/route.ts
 *
 * Sends a one-time password via Twilio SMS.
 *
 * Security fixes vs the original:
 *  ✅ Moved from /components/ to /app/api/ (was unreachable before)
 *  ✅ Rate limited — 3 OTPs per phone per 10 minutes (Twilio cost protection)
 *  ✅ Per-IP rate limit — prevents one IP from burning OTPs for many numbers
 *  ✅ OTP generated with crypto.randomInt (CSPRNG, not Math.random)
 *  ✅ OTP stored as bcrypt hash in Supabase — not plain text in memory
 *  ✅ Phone number validated strictly before any Twilio call
 *  ✅ No OTP value ever logged — error logs show Twilio status only
 *  ✅ Consistent response shape regardless of success/failure
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'
import { generateOtp, storeOtp, cleanupExpiredOtps } from '@/lib/otp-store'

// Strict E.164 phone format: +[country code][number], 8-15 digits total
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

    // ── 1. Per-IP rate limit — prevents one IP hitting many phone numbers ───
    const ipLimit = rateLimit(`otp-ip:${ip}`, 'auth')
    if (!ipLimit.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMITED',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(ipLimit.resetIn / 1000)) },
        }
      )
    }

    // ── 2. Parse and validate body ──────────────────────────────────────────
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', code: 'INVALID_BODY' },
        { status: 400 }
      )
    }

    const { phone } = body as Record<string, unknown>

    if (typeof phone !== 'string' || !E164_REGEX.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Phone number must be in E.164 format (e.g. +254712345678)',
          code: 'INVALID_PHONE',
        },
        { status: 400 }
      )
    }

    // ── 3. Per-phone rate limit — 3 OTPs per phone per 10 minutes ──────────
    //    Prevents someone from spamming a specific victim's number
    const phoneLimit = rateLimit(`otp-phone:${phone}`, 'otp')
    if (!phoneLimit.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many codes sent to this number. Please wait before requesting another.',
          code: 'PHONE_RATE_LIMITED',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(phoneLimit.resetIn / 1000)) },
        }
      )
    }

    // ── 4. Validate Twilio config before generating OTP ────────────────────
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken  = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      console.error('[send-otp] Twilio environment variables not configured')
      return NextResponse.json(
        { success: false, message: 'SMS service unavailable', code: 'SMS_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    // ── 5. Generate cryptographically secure OTP ───────────────────────────
    const otp = generateOtp()

    // ── 6. Persist OTP as bcrypt hash in Supabase ──────────────────────────
    await storeOtp(phone, otp)

    // ── 7. Cleanup expired OTPs (non-blocking housekeeping) ─────────────────
    cleanupExpiredOtps().catch(err =>
      console.error('[send-otp] cleanup error (non-fatal):', err)
    )

    // ── 8. Send SMS via Twilio ──────────────────────────────────────────────
    const smsBody = new URLSearchParams({
      To:   phone,
      From: fromNumber,
      Body: `Your Crotchet verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
    })

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: smsBody.toString(),
      }
    )

    if (!twilioResponse.ok) {
      // Log Twilio error code/message but NEVER log the OTP itself
      const twilioErr = await twilioResponse.json().catch(() => ({}))
      console.error('[send-otp] Twilio error — status:', twilioResponse.status, 'code:', (twilioErr as any)?.code)
      return NextResponse.json(
        { success: false, message: 'Failed to send SMS. Please try again.', code: 'SMS_FAILED' },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, message: 'Verification code sent' })

  } catch (error) {
    console.error('[send-otp] Unexpected error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}