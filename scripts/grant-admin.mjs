import process from 'node:process'
import path from 'node:path'
import dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

function getArg(name) {
  const idx = process.argv.findIndex((a) => a === name)
  if (idx === -1) return null
  return process.argv[idx + 1] ?? null
}

async function main() {
  const email = getArg('--email')
  if (!email) {
    console.error('Usage: npm run grant:admin -- --email you@example.com')
    process.exit(1)
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  })

  try {
    const userRes = await pool.query(
      `SELECT id, email::text AS email FROM app_users WHERE LOWER(email::text) = LOWER($1) LIMIT 1`,
      [email]
    )
    const user = userRes.rows[0]
    if (!user) {
      console.error(`User not found for email: ${email}`)
      process.exit(1)
    }

    await pool.query(
      `
      INSERT INTO user_roles (user_id, role)
      VALUES ($1, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING
      `,
      [user.id]
    )

    console.log(`Admin role granted to ${user.email} (${user.id})`)
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Failed to grant admin role:', error)
  process.exit(1)
})

