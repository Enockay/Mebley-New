const CDN_BASE = process.env.NEXT_PUBLIC_CDN_URL ?? ''

/** Returns a CloudFront URL for a static public asset (e.g. "/hero-bg.png" → CDN + "/static/hero-bg.png"). Falls back to the local path if CDN is not configured. */
export function cdnUrl(path: string): string {
  if (!CDN_BASE) return path
  return `${CDN_BASE}/static${path}`
}
