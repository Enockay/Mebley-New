/**
 * POST /api/auth/forgot-password
 * Generates a password-reset token, stores it in postgres, and emails the link via Brevo.
 *
 * SQL needed (run once):
 *   CREATE TABLE IF NOT EXISTS password_reset_tokens (
 *     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id    TEXT NOT NULL,
 *     token_hash TEXT NOT NULL,
 *     expires_at TIMESTAMPTZ NOT NULL,
 *     used       BOOLEAN NOT NULL DEFAULT false,
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
 *   );
 *   CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token_hash);
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { pgQuery } from '@/lib/postgres'

const TOKEN_TTL_MINUTES = 30

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ success: false, message: 'Valid email required' }, { status: 400 })
    }

    const safeEmail = email.trim().toLowerCase()

    // Look up user — always return success even if not found (prevents email enumeration)
    const userRes = await pgQuery<{ id: string }>(
      `SELECT id FROM app_users WHERE LOWER(email) = $1 LIMIT 1`,
      [safeEmail]
    )
    const userId = userRes.rows[0]?.id
    if (!userId) {
      return NextResponse.json({ success: true })
    }

    // Generate token — store hash only
    const rawToken  = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString()

    // Invalidate any previous tokens for this user
    await pgQuery(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [userId])

    await pgQuery(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    )

    // Send email via Brevo
    const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mebley.com'
    const resetLink   = `${appUrl}/auth/reset-password?token=${rawToken}`
    const apiKey      = process.env.BREVO_API_KEY
    const senderEmail = process.env.BREVO_SENDER_EMAIL
    const senderName  = process.env.BREVO_SENDER_NAME ?? 'Mebley'

    if (apiKey && senderEmail) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: safeEmail }],
          subject: 'Reset your Mebley password',
          htmlContent: `
            <div style="font-family:Arial,sans-serif;background:#f8f2ec;padding:24px;">
              <div style="max-width:520px;margin:0 auto;background:#fffdfb;border:1px solid #eadfd4;border-radius:16px;padding:28px;">
                <h2 style="margin:0 0 12px;color:#22161d;">Reset your password</h2>
                <p style="color:#4a3a41;margin:0 0 20px;">
                  Click the button below to set a new password. This link expires in ${TOKEN_TTL_MINUTES} minutes.
                </p>
                <a href="${resetLink}"
                   style="display:inline-block;padding:13px 28px;border-radius:999px;text-decoration:none;
                          color:#fff;background:linear-gradient(90deg,#ee5d7d,#d77b5d);font-weight:700;">
                  Reset Password
                </a>
                <p style="margin:20px 0 0;font-size:12px;color:#9a8a91;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </div>
            </div>`,
        }),
      }).catch(err => console.error('[forgot-password] email send failed:', err))
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
