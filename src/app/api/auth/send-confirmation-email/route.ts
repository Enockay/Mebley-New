import { NextRequest, NextResponse } from 'next/server'

type SendBody = {
  email?: string
  kind?: 'signup' | 'resend'
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const { email, kind = 'signup' } = (await req.json()) as SendBody

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ success: false, message: 'Valid email is required' }, { status: 400 })
    }

    const apiKey = process.env.BREVO_API_KEY
    const senderEmail = process.env.BREVO_SENDER_EMAIL
    const senderName = process.env.BREVO_SENDER_NAME || 'Mebley'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mebley.com'

    if (!apiKey || !senderEmail) {
      return NextResponse.json(
        { success: false, message: 'Email service is not configured' },
        { status: 503 }
      )
    }

    const subject =
      kind === 'resend'
        ? 'Mebley: Confirm your email address'
        : 'Welcome to Mebley - Confirm your email'

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;background:#f8f2ec;padding:24px;color:#22161d;">
        <div style="max-width:560px;margin:0 auto;background:#fffdfb;border:1px solid #eadfd4;border-radius:16px;padding:24px;">
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">Welcome to Mebley</h1>
          <p style="margin:0 0 14px;color:#4a3a41;">
            We received your ${kind === 'resend' ? 'request to resend your confirmation' : 'new account signup'}.
          </p>
          <p style="margin:0 0 20px;color:#4a3a41;">
            Use the button below to return to Mebley and complete your sign-in. If you didn't request this, you can safely ignore it.
          </p>
          <a href="${appUrl}/auth"
             style="display:inline-block;padding:12px 18px;border-radius:999px;text-decoration:none;color:#fff;background:linear-gradient(90deg,#ee5d7d,#d77b5d);font-weight:700;">
            Return to Mebley
          </a>
        </div>
      </div>
    `

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email }],
        subject,
        htmlContent,
      }),
    })

    if (!brevoRes.ok) {
      const details = await brevoRes.text()
      return NextResponse.json(
        { success: false, message: 'Failed to send via Brevo', details },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Unexpected server error', error: String(err) },
      { status: 500 }
    )
  }
}

