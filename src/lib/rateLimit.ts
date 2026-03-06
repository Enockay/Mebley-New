// Simple in-memory rate limiter for API routes
// In production, replace with Redis (Upstash)

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  maxRequests: number   // max requests per window
  windowMs: number      // window in milliseconds
}

const CONFIGS: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 5, windowMs: 60_000 },        // 5 attempts per minute
  messages: { maxRequests: 30, windowMs: 60_000 },   // 30 messages per minute
  api: { maxRequests: 100, windowMs: 60_000 },       // 100 requests per minute
}

export function rateLimit(
  identifier: string,
  type: keyof typeof CONFIGS = 'api'
): { success: boolean; remaining: number; resetIn: number } {
  const config = CONFIGS[type]
  const now = Date.now()
  const key = `${type}:${identifier}`

  const entry = store.get(key)

  // Reset if window has passed
  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + config.windowMs })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    }
  }

  // Increment count
  entry.count++

  if (entry.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    }
  }

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  }
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) store.delete(key)
  }
}, 5 * 60_000)