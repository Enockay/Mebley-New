/**
 * Set app_users.password_hash for a given email (bcrypt cost 12, matches auth-server).
 *
 * Usage:
 *   SET_PASSWORD='your-new-password' npm run set:password -- --email superadmin@mebley.com
 *
 * Or (shows up in shell history — avoid on shared machines):
 *   npm run set:password -- --email superadmin@mebley.com --password 'your-new-password'
 */

import process from 'node:process'
import path from 'node:path'
import dotenv from 'dotenv'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

function getArg(name) {
  const idx = process.argv.findIndex((a) => a === name)
  if (idx === -1) return null
  return process.argv[idx + 1] ?? null
}

function resolveSsl() {
  const v = process.env.DATABASE_SSL?.toLowerCase().trim()
  if (v === 'true' || v === 'require') return { rejectUnauthorized: false }
  if (v === 'false' || v === 'disable') return false
  return false
}

async function main() {
  const email = getArg('--email')
  const plainArg = getArg('--password')
  const plainEnv = process.env.SET_PASSWORD
  const plain = plainArg ?? plainEnv

  if (!email) {
    console.error('Usage: SET_PASSWORD=... npm run set:password -- --email you@example.com')
    console.error('   or: npm run set:password -- --email you@example.com --password ...')
    process.exit(1)
  }
  if (!plain) {
    console.error('Provide SET_PASSWORD env var or --password (prefer SET_PASSWORD to avoid shell history).')
    process.exit(1)
  }
  if (plain.length < 8) {
    console.error('Password must be at least 8 characters (same rule as reset-password API).')
    process.exit(1)
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const pool = new Pool({ connectionString, ssl: resolveSsl() })

  try {
    const hash = await bcrypt.hash(plain, 12)
    const res = await pool.query(
      `UPDATE app_users SET password_hash = $1 WHERE LOWER(email::text) = LOWER($2::text) RETURNING id, email::text AS email`,
      [hash, email]
    )
    if (res.rowCount === 0) {
      console.error(`No app_users row for email: ${email}`)
      process.exit(1)
    }
    console.log(`Password updated for ${res.rows[0].email} (${res.rows[0].id})`)
    console.log('Ensure this account has admin role: npm run grant:admin -- --email ...')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('set-password failed:', err)
  process.exit(1)
})
