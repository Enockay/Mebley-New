/**
 * src/lib/otp-store.ts
 *
 * Persistent OTP store backed by Supabase.
 *
 * Replaces the in-memory Map in send-otp/route.ts which had these problems:
 *  - Lost all OTPs on every server restart or new serverless invocation
 *  - Broken across multiple instances (Vercel runs many instances in parallel)
 *  - Exported the entire store so any importing file could read all OTPs
 *  - No brute-force lockout (attacker could guess 6-digit OTP in ≤1M tries)
 *
 * This module requires a `otp_verifications` table in Supabase.
 * Run the SQL migration below before using this module.
 *
 * ── SQL migration ────────────────────────────────────────────────────────────
 *
 * create table if not exists otp_verifications (
 *   id          uuid primary key default gen_random_uuid(),
 *   phone       text not null,
 *   otp_hash    text not null,          -- bcrypt hash, never store plain OTP
 *   expires_at  timestamptz not null,
 *   attempts    int not null default 0, -- brute-force counter
 *   verified    boolean not null default false,
 *   created_at  timestamptz not null default now()
 * );
 *
 * -- Auto-delete expired rows (Supabase pg_cron or just let cleanup fn handle it)
 * create index if not exists idx_otp_phone on otp_verifications(phone);
 * create index if not exists idx_otp_expires on otp_verifications(expires_at);
 *
 * -- RLS: this table should ONLY be accessible via the service role key
 * alter table otp_verifications enable row level security;
 * -- No RLS policies — access only via admin client (service role bypasses RLS)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createAdminSupabaseClient } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'

const OTP_TTL_MINUTES = 10
const MAX_VERIFY_ATTEMPTS = 5   // lockout after 5 wrong guesses
const BCRYPT_ROUNDS = 10        // fast enough for OTP UX, secure enough

// ── Generate a cryptographically secure 6-digit OTP ─────────────────────────
// crypto.randomInt is CSPRNG — unlike Math.random() which is not
export function generateOtp(): string {
  return randomInt(100_000, 999_999).toString()
}

// ── Store a new OTP for a phone number ───────────────────────────────────────
// Deletes any existing pending OTP for this phone first (no stale codes)
export async function storeOtp(phone: string, otp: string): Promise<void> {
  const admin = createAdminSupabaseClient()

  // Delete any previous OTPs for this phone
  await admin
    .from('otp_verifications')
    .delete()
    .eq('phone', phone)

  // Hash the OTP — never store plain text
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS)
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()

  const { error } = await admin
    .from('otp_verifications')
    .insert({ phone, otp_hash: otpHash, expires_at: expiresAt })

  if (error) {
    throw new Error(`Failed to store OTP: ${error.message}`)
  }
}

// ── Verify an OTP submitted by a user ────────────────────────────────────────
export async function verifyOtp(
  phone: string,
  submittedOtp: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminSupabaseClient()

  const { data: record, error } = await admin
    .from('otp_verifications')
    .select('id, otp_hash, expires_at, attempts, verified')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !record) {
    return { success: false, error: 'No OTP found for this number' }
  }

  // Already used
  if (record.verified) {
    return { success: false, error: 'OTP has already been used' }
  }

  // Expired
  if (new Date(record.expires_at) < new Date()) {
    await admin.from('otp_verifications').delete().eq('id', record.id)
    return { success: false, error: 'OTP has expired' }
  }

  // Brute-force lockout
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await admin.from('otp_verifications').delete().eq('id', record.id)
    return { success: false, error: 'Too many attempts. Please request a new code.' }
  }

  // Increment attempt counter before checking — prevents timing attacks
  await admin
    .from('otp_verifications')
    .update({ attempts: record.attempts + 1 })
    .eq('id', record.id)

  // Constant-time comparison via bcrypt
  const isValid = await bcrypt.compare(submittedOtp, record.otp_hash)

  if (!isValid) {
    return { success: false, error: 'Invalid code' }
  }

  // Mark as verified so it cannot be replayed
  await admin
    .from('otp_verifications')
    .update({ verified: true })
    .eq('id', record.id)

  return { success: true }
}

// ── Cleanup expired OTPs (call from a cron or on each send) ─────────────────
export async function cleanupExpiredOtps(): Promise<void> {
  const admin = createAdminSupabaseClient()
  await admin
    .from('otp_verifications')
    .delete()
    .lt('expires_at', new Date().toISOString())
}