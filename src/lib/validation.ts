// Zod validation schemas for all API inputs

// ─── Message validation ───────────────────────────────────────────────────────
export function validateMessage(content: unknown): {
  valid: boolean
  error?: string
  sanitized?: string
} {
  if (typeof content !== 'string') {
    return { valid: false, error: 'Message must be a string' }
  }

  const trimmed = content.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' }
  }

  if (trimmed.length > 2000) {
    return { valid: false, error: 'Message cannot exceed 2000 characters' }
  }

  // Basic XSS prevention — strip script tags
  const sanitized = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')

  return { valid: true, sanitized }
}

// ─── Profile validation ───────────────────────────────────────────────────────
export function validateProfile(data: unknown): {
  valid: boolean
  errors: string[]
  sanitized?: Record<string, unknown>
} {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Invalid profile data'] }
  }

  const profile = data as Record<string, unknown>
  const errors: string[] = []

  if (profile.bio && typeof profile.bio === 'string' && profile.bio.length > 500) {
    errors.push('Bio cannot exceed 500 characters')
  }

  if (profile.username) {
    const username = String(profile.username)
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      errors.push('Username must be 3-30 characters, letters, numbers and underscores only')
    }
  }

  if (profile.full_name) {
    const name = String(profile.full_name)
    if (name.length < 2 || name.length > 100) {
      errors.push('Full name must be 2-100 characters')
    }
  }

  if (profile.interests && Array.isArray(profile.interests)) {
    if (profile.interests.length > 20) {
      errors.push('Cannot have more than 20 interests')
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, errors: [], sanitized: profile }
}

// ─── Auth validation ──────────────────────────────────────────────────────────
export function validateAuthInput(email: unknown, password: unknown): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email address')
  }

  if (typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (typeof password === 'string' && password.length > 128) {
    errors.push('Password too long')
  }

  return { valid: errors.length === 0, errors }
}