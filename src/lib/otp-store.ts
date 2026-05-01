/**
 * src/lib/otp-store.ts
 *
 * Persistent OTP store backed by PostgreSQL (pgQuery).
 *
 * SQL migration — run once:
 *
 *   CREATE TABLE IF NOT EXISTS otp_verifications (
 *     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     phone      TEXT NOT NULL,
 *     otp_hash   TEXT NOT NULL,
 *     expires_at TIMESTAMPTZ NOT NULL,
 *     attempts   INT NOT NULL DEFAULT 0,
 *     verified   BOOLEAN NOT NULL DEFAULT false,
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
 *   );
 *   CREATE INDEX IF NOT EXISTS idx_otp_phone    ON otp_verifications(phone);
 *   CREATE INDEX IF NOT EXISTS idx_otp_expires  ON otp_verifications(expires_at);
 */

import { pgQuery } from '@/lib/postgres'
import bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'

const OTP_TTL_MINUTES     = 10
const MAX_VERIFY_ATTEMPTS = 5
const BCRYPT_ROUNDS       = 10

export function generateOtp(): string {
  return randomInt(100_000, 999_999).toString()
}

export async function storeOtp(phone: string, otp: string): Promise<void> {
  await pgQuery(`DELETE FROM otp_verifications WHERE phone = $1`, [phone])

  const otpHash   = await bcrypt.hash(otp, BCRYPT_ROUNDS)
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()

  const { rowCount } = await pgQuery(
    `INSERT INTO otp_verifications (phone, otp_hash, expires_at) VALUES ($1, $2, $3)`,
    [phone, otpHash, expiresAt]
  )
  if (!rowCount) throw new Error('Failed to store OTP')
}

export async function verifyOtp(
  phone: string,
  submittedOtp: string
): Promise<{ success: boolean; error?: string }> {
  const res = await pgQuery<{
    id: string; otp_hash: string; expires_at: string; attempts: number; verified: boolean
  }>(
    `SELECT id, otp_hash, expires_at, attempts, verified
     FROM otp_verifications
     WHERE phone = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone]
  )
  const record = res.rows[0] ?? null

  if (!record) return { success: false, error: 'No OTP found for this number' }
  if (record.verified) return { success: false, error: 'OTP has already been used' }

  if (new Date(record.expires_at) < new Date()) {
    await pgQuery(`DELETE FROM otp_verifications WHERE id = $1`, [record.id])
    return { success: false, error: 'OTP has expired' }
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await pgQuery(`DELETE FROM otp_verifications WHERE id = $1`, [record.id])
    return { success: false, error: 'Too many attempts. Please request a new code.' }
  }

  await pgQuery(
    `UPDATE otp_verifications SET attempts = $1 WHERE id = $2`,
    [record.attempts + 1, record.id]
  )

  const isValid = await bcrypt.compare(submittedOtp, record.otp_hash)
  if (!isValid) return { success: false, error: 'Invalid code' }

  await pgQuery(`UPDATE otp_verifications SET verified = true WHERE id = $1`, [record.id])
  return { success: true }
}

export async function cleanupExpiredOtps(): Promise<void> {
  await pgQuery(`DELETE FROM otp_verifications WHERE expires_at < NOW()`)
}
