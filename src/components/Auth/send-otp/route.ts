import { NextRequest, NextResponse } from 'next/server'

// In-memory OTP store — replace with Redis in production
// Key: phone (E.164), Value: { otp, expires }
const otpStore = new Map<string, { otp: string; expires: number }>()

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutes

    otpStore.set(phone, { otp, expires })

    // Send via Twilio SMS
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken  = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: 'SMS service not configured' }, { status: 500 })
    }

    const body = new URLSearchParams({
      To:   phone,
      From: fromNumber,
      Body: `Your Crotchet verification code is: ${otp}. Valid for 10 minutes.`,
    })

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    )

    if (!response.ok) {
      const err = await response.json()
      console.error('Twilio error:', err)
      return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Export store so verify route can access it (same process in dev)
export { otpStore }
