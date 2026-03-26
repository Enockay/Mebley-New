import 'server-only'

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

function resolveSslConfig(cs: string): false | { rejectUnauthorized: false } {
  const explicit = process.env.DATABASE_SSL?.toLowerCase().trim()
  if (explicit === 'true' || explicit === 'require') {
    return { rejectUnauthorized: false }
  }
  if (explicit === 'false' || explicit === 'disable') {
    return false
  }

  // Auto mode: enable SSL only for known managed hosts by default.
  // This avoids breaking local/docker Postgres hosts that don't support SSL.
  let host = ''
  try {
    host = new URL(cs).hostname.toLowerCase()
  } catch {
    host = ''
  }

  const managedSslHosts = [
    'supabase.co',
    'neon.tech',
    'render.com',
    'railway.app',
    'amazonaws.com',
  ]
  const shouldUseSsl = managedSslHosts.some((suffix) => host.endsWith(suffix))
  return shouldUseSsl ? { rejectUnauthorized: false } : false
}

const globalForPg = globalThis as unknown as { __mebleyPgPool?: Pool }

const pool =
  globalForPg.__mebleyPgPool ??
  new Pool({
    connectionString,
    ssl: resolveSslConfig(connectionString),
    options: '-c search_path=public',
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPg.__mebleyPgPool = pool
}

export async function pgQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> {
  return pool.query<T>(text, values)
}

export async function withPgClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

