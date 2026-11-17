/**
 * Works out which country's prices to show and charge (review 4.12, PR-01, PR-05).
 *
 * The country comes from the CDN or host's geolocation header. Set up one of:
 *   - CloudFront: forward the CloudFront-Viewer-Country header to the origin
 *   - Cloudflare: cf-ipcountry (on by default)
 *   - Vercel: x-vercel-ip-country (automatic)
 * If no header arrives at all, PRICING_DEFAULT_COUNTRY is used (default KE,
 * which keeps today's prices) so a missing header never raises prices.
 *
 * A visitor can pick another region to view prices (cookie mb_region). That
 * changes what is displayed only; checkout always uses the detected country.
 */
import { cookies, headers } from 'next/headers'
import { regionPricing, type RegionPricing } from '@/lib/pricing'

const GEO_HEADERS = ['cloudfront-viewer-country', 'cf-ipcountry', 'x-vercel-ip-country', 'x-country-code']
export const REGION_COOKIE = 'mb_region'
const DEFAULT_COUNTRY = (process.env.PRICING_DEFAULT_COUNTRY || 'KE').toUpperCase()

const valid = (c: string | null | undefined) => (c && /^[A-Za-z]{2}$/.test(c) ? c.toUpperCase() : null)

/** Detected country from request headers. Unknown values (XX, T1) become null, i.e. tier A. */
export function countryFromHeaders(h: Headers): string | null {
  for (const name of GEO_HEADERS) {
    const v = h.get(name)
    if (v !== null) return v === 'XX' || v === 'T1' ? null : valid(v)
  }
  return DEFAULT_COUNTRY
}

/** Prices checkout will charge for this request. */
export async function chargedPricing(): Promise<RegionPricing> {
  return regionPricing(countryFromHeaders(await headers()))
}

/** Prices to display: the visitor's chosen region if they picked one, else detected. */
export async function displayedPricing(): Promise<{ pricing: RegionPricing; detected: string | null; chosen: boolean }> {
  const detected = countryFromHeaders(await headers())
  const picked = valid((await cookies()).get(REGION_COOKIE)?.value)
  return { pricing: regionPricing(picked ?? detected), detected, chosen: Boolean(picked && picked !== detected) }
}
