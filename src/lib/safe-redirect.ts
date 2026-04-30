/**
 * Client-safe relative redirect targets only (open-redirect prevention baseline).
 */
export function isSafeRedirectPath(value: string | null | undefined): value is string {
  if (!value) return false
  if (!value.startsWith('/')) return false
  if (value.startsWith('//')) return false
  if (value.startsWith('/api/')) return false
  return true
}
