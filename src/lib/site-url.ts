/** Canonical public site URL (no trailing slash). Must match how users reach production (www vs apex). */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (raw?.startsWith('http://') || raw?.startsWith('https://')) return raw
  return 'https://www.mebley.com'
}
