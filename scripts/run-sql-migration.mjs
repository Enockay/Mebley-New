import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

function resolveSsl() {
  const v = process.env.DATABASE_SSL?.toLowerCase().trim()
  if (v === 'true' || v === 'require') return { rejectUnauthorized: false }
  if (v === 'false' || v === 'disable') return false
  return false
}

async function runSingleMigration(pool, sqlPath) {
  const sql = await fs.readFile(sqlPath, 'utf8')
  await pool.query(sql)
  console.log(`Migration applied successfully: ${sqlPath}`)
}

async function runAllMigrations(pool) {
  const migrationsDir = path.resolve(process.cwd(), 'migrations')
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true })
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith('.sql'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b))

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  for (const filename of files) {
    const already = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1',
      [filename]
    )
    if (already.rowCount && already.rowCount > 0) {
      continue
    }

    const sqlPath = path.join(migrationsDir, filename)
    const sql = await fs.readFile(sqlPath, 'utf8')

    await pool.query('BEGIN')
    try {
      await pool.query(sql)
      await pool.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
        [filename]
      )
      await pool.query('COMMIT')
      console.log(`Applied: ${filename}`)
    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  }
}

async function main() {
  const fileArg = process.argv[2]
  const runAll = fileArg === '--all' || !fileArg

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString,
    ssl: resolveSsl(),
  })

  try {
    if (runAll) {
      await runAllMigrations(pool)
      console.log('All pending migrations applied.')
    } else {
      const sqlPath = path.resolve(process.cwd(), fileArg)
      await runSingleMigration(pool, sqlPath)
    }
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})

