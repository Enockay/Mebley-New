import { NextRequest, NextResponse } from 'next/server'

const BREVO_API   = 'https://api.brevo.com/v3/smtp/email'
const SUPPORT_TO  = 'support@mebley.com'
const SAFETY_TO   = 'safety@mebley.com'

const CATEGORY_ROUTING: Record<string, string> = {
  'Safety or reporting': SAFETY_TO,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, category, message } = body ?? {}

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }
    if (message.trim().length < 10) {
      return NextResponse.json({ error: 'Message is too short.' }, { status: 400 })
    }

    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      console.error('[contact] BREVO_API_KEY not set')
      return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 })
    }

    const toAddress = CATEGORY_ROUTING[category] ?? SUPPORT_TO

    const brevoPayload = {
      sender:  { name: process.env.BREVO_SENDER_NAME ?? 'Mebley', email: process.env.BREVO_SENDER_EMAIL ?? 'no-reply@mebley.com' },
      to:      [{ email: toAddress, name: 'Mebley Support' }],
      replyTo: { email, name },
      subject: `[Contact] ${category || 'General'} — ${name}`,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
          <h2 style="margin:0 0 16px">New contact form submission</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#666;width:120px"><strong>Name</strong></td><td>${escHtml(name)}</td></tr>
            <tr><td style="padding:8px 0;color:#666"><strong>Email</strong></td><td><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td></tr>
            <tr><td style="padding:8px 0;color:#666"><strong>Category</strong></td><td>${escHtml(category || '—')}</td></tr>
          </table>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
          <p style="white-space:pre-wrap;line-height:1.6">${escHtml(message)}</p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
          <p style="font-size:12px;color:#999">Sent via mebley.com/contact</p>
        </div>`,
    }

    const brevoRes = await fetch(BREVO_API, {
      method:  'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body:    JSON.stringify(brevoPayload),
    })

    if (!brevoRes.ok) {
      const errText = await brevoRes.text()
      console.error('[contact] Brevo error', brevoRes.status, errText)
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[contact] unexpected error', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
