/**
 * src/lib/rateLimit.ts
 *
 * In-memory rate limiter for API routes.
 *
 * Changes vs original:
 *  ✅ Added 'otp' config — 3 OTPs per phone per 10 minutes
 *  ✅ Added 'verify' config — 5 verify attempts per minute
 *  ✅ Added helper to get real client IP from Next.js request headers
 *
 * ⚠️  PRODUCTION NOTE:
 *  This in-memory store works for a single-instance server but will NOT work
 *  correctly on Vercel or any platform that runs multiple serverless instances,
 *  because each instance has its own memory.
 *
 *  For production, replace this with Upstash Redis:
 *  https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 *
 *  The interface of this module is intentionally compatible with Upstash's
 *  ratelimit SDK so the swap is a one-file change.
 */

interface RateLimitEntry {
  count:     number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  maxRequests: number
  windowMs:    number
}

const CONFIGS: Record<string, RateLimitConfig> = {
  auth:     { maxRequests: 5,   windowMs: 60_000       },  // 5 attempts / min
  otp:      { maxRequests: 3,   windowMs: 10 * 60_000  },  // 3 OTPs / 10 min per phone
  verify:   { maxRequests: 5,   windowMs: 60_000       },  // 5 verify attempts / min
  messages: { maxRequests: 30,  windowMs: 60_000       },  // 30 messages / min
  api:      { maxRequests: 100, windowMs: 60_000       },  // 100 requests / min
  likes:    { maxRequests: 100, windowMs: 60_000       },  // 100 likes / min
}

export function rateLimit(
  identifier: string,
  type: keyof typeof CONFIGS = 'api'
): { success: boolean; remaining: number; resetIn: number } {
  const config = CONFIGS[type]
  const now    = Date.now()
  const key    = `${type}:${identifier}`
  const entry  = store.get(key)

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + config.windowMs })
    return { success: true, remaining: config.maxRequests - 1, resetIn: config.windowMs }
  }

  entry.count++

  if (entry.count > config.maxRequests) {
    return { success: false, remaining: 0, resetIn: entry.resetTime - now }
  }

  return { success: true, remaining: config.maxRequests - entry.count, resetIn: entry.resetTime - now }
}

// ── Extract real client IP from Next.js request ───────────────────────────────
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

// ── Cleanup expired entries every 5 minutes ───────────────────────────────────
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) store.delete(key)
  }
}, 5 * 60_000)