/**
 * Automatic regional pricing (Website Review v1.1, section 4.12).
 *
 * Every country sits in one of four tiers. Today's prices are the floor and
 * belong to tier D (30% of a base price); tiers C, B and A pay 50%, 75% and
 * 100% of the base. USD is the reference currency. Local prices come from
 * the review's Table 9 where it gives them, otherwise from the reference
 * rate plus a rounding rule per currency. Tier D always rounds up, so no
 * market pays less than today, and Kenya stays at KES 650 / 1,300 / 1,950.
 *
 * The price book is fixed per quarter (PRICE_BOOK_VERSION). Re-check the
 * reference rates each quarter, or sooner if a currency moves more than 10%.
 *
 * Self-contained on purpose (no path aliases) so scripts/check-price-book.mjs
 * can import it directly with Node.
 */

export const PRICE_BOOK_VERSION = '2026-Q4'

export type Tier = 'A' | 'B' | 'C' | 'D'
export type PlanKey = 'starter' | 'premium' | 'vip'
export type PackKey = 'starter' | 'popular' | 'value' | 'mega'

export const TIER_SHARE: Record<Tier, number> = { A: 1, B: 0.75, C: 0.5, D: 0.3 }

/** USD prices per tier (review Table 8). Tier D is today's price list. */
export const PLAN_USD: Record<Tier, Record<PlanKey, number>> = {
  A: { starter: 16.99, premium: 32.99, vip: 49.99 },
  B: { starter: 12.49, premium: 24.99, vip: 37.49 },
  C: { starter: 8.49, premium: 16.99, vip: 24.99 },
  D: { starter: 5, premium: 10, vip: 15 },
}
export const PACK_USD: Record<Tier, Record<PackKey, number>> = {
  A: { starter: 16.99, popular: 64.99, value: 134.99, mega: 249.99 },
  B: { starter: 12.49, popular: 49.99, value: 99.99, mega: 184.99 },
  C: { starter: 8.49, popular: 32.99, value: 64.99, mega: 124.99 },
  D: { starter: 4.99, popular: 19.99, value: 39.99, mega: 74.99 },
}

/** Today's KES charges for tier D. Must match the amounts members pay now. */
const KES_TODAY = {
  plans: { starter: 650, premium: 1300, vip: 1950 } as Record<PlanKey, number>,
  packs: { starter: 650, popular: 2600, value: 5200, mega: 9750 } as Record<PackKey, number>,
}

/* ─── Countries → tier ─────────────────────────────────────────────────
 * From World Bank income groups and price levels. Reviewed once a year.
 * Any country not listed falls back to tier A (review PR-02). */
const TIER_COUNTRIES: Record<Exclude<Tier, 'A'>, string> = {
  B: 'PL CZ SK HU RO BG HR SI EE LV LT PT GR CL UY PA CR',
  C: 'BR MX AR CO PE ZA TR MY TH CN RU KZ DO EC GT JM BW NA MU RS ME MK AL BA GE AM AZ BY MD PY JO LB IQ IR LY GA FJ',
  D: 'KE NG GH UG TZ RW ET ZM ZW MW MZ CM CI SN BJ BF ML NE TG SL LR GN CD CG AO SD SS SO DJ ER MG BI TD CF GM GW MR LS SZ ' +
     'IN ID PH EG PK BD LK NP MM KH LA VN MA TN DZ UZ KG TJ MN HT HN NI BO SV UA PG YE AF SY',
}
const TIER_OF = new Map<string, Tier>()
for (const [tier, list] of Object.entries(TIER_COUNTRIES)) for (const c of list.split(/\s+/)) TIER_OF.set(c, tier as Tier)

export function tierFor(country: string | null | undefined): Tier {
  return (country && TIER_OF.get(country.toUpperCase())) || 'A'
}

/* ─── Currencies ───────────────────────────────────────────────────── */
export type Currency = 'USD' | 'GBP' | 'EUR' | 'PLN' | 'CLP' | 'BRL' | 'MXN' | 'ZAR' | 'INR' | 'NGN' | 'KES'

const EUROZONE = 'AT BE HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES MC SM AD VA'.split(' ')
const CURRENCY_OF: Record<string, Currency> = {
  US: 'USD', GB: 'GBP', PL: 'PLN', CL: 'CLP', BR: 'BRL', MX: 'MXN', ZA: 'ZAR', IN: 'INR', NG: 'NGN', KE: 'KES',
  ...Object.fromEntries(EUROZONE.map(c => [c, 'EUR' as Currency])),
}

/** Units of currency per USD, reference rates for this price book version. */
export const REFERENCE_RATE: Record<Currency, number> = {
  USD: 1, GBP: 0.77, EUR: 0.87, PLN: 3.7, CLP: 940, BRL: 5.35, MXN: 18.4, ZAR: 17.6, INR: 88.5, NGN: 1500, KES: 130,
}

/** Round to a price that looks natural in each currency. */
function charm(currency: Currency, v: number, up: boolean): number {
  const step = (s: number) => (up ? Math.ceil(v / s) : Math.round(v / s)) * s
  switch (currency) {
    case 'USD': case 'GBP': case 'EUR': case 'PLN': return Math.max(0.99, step(1) - 0.01)
    case 'ZAR': return step(10) - 0.01
    case 'BRL': return step(1) - 0.1
    case 'MXN': return step(10) - 1
    case 'CLP': return step(1000) - 10
    case 'INR': return step(50) - 1
    case 'NGN': return step(500)
    case 'KES': return step(50)
  }
}

/** Local plan prices given in the review's Table 9, used as-is. */
const TABLE_9: Partial<Record<Currency, Partial<Record<Tier, Record<PlanKey, number>>>>> = {
  USD: { A: { starter: 16.99, premium: 32.99, vip: 49.99 } },
  GBP: { A: { starter: 12.99, premium: 24.99, vip: 37.99 } },
  EUR: { A: { starter: 14.99, premium: 28.99, vip: 42.99 } },
  PLN: { B: { starter: 45.99, premium: 89.99, vip: 134.99 } },
  CLP: { B: { starter: 11990, premium: 22990, vip: 34990 } },
  BRL: { C: { starter: 45.9, premium: 89.9, vip: 134.9 } },
  MXN: { C: { starter: 159, premium: 309, vip: 459 } },
  ZAR: { C: { starter: 149.99, premium: 299.99, vip: 439.99 } },
  INR: { D: { starter: 449, premium: 899, vip: 1349 } },
  NGN: { D: { starter: 7500, premium: 15000, vip: 22500 } },
  KES: { D: KES_TODAY.plans },
}

export type Price = {
  /** Price shown to the visitor, in `currency`. */
  amount: number
  currency: Currency
  /** Reference price in USD for this tier. */
  usd: number
  /** What checkout charges today (Paystack account bills in KES). */
  kes: number
}

export type RegionPricing = {
  country: string | null
  tier: Tier
  currency: Currency
  version: string
  plans: Record<PlanKey, Price>
  packs: Record<PackKey, Price>
}

/** KES charged for a tier price. Tier D is today's exact list; others round to KES 10. */
function kesCharge(tier: Tier, usd: number, kind: 'plans' | 'packs', key: string): number {
  if (tier === 'D') return (KES_TODAY[kind] as Record<string, number>)[key]
  return Math.ceil((usd * REFERENCE_RATE.KES) / 10) * 10
}

function price(tier: Tier, currency: Currency, usd: number, kind: 'plans' | 'packs', key: string): Price {
  const fixed = kind === 'plans' ? TABLE_9[currency]?.[tier]?.[key as PlanKey] : undefined
  let amount = fixed ?? charm(currency, usd * REFERENCE_RATE[currency], tier === 'D')
  if (currency === 'KES' && tier === 'D') amount = (KES_TODAY[kind] as Record<string, number>)[key]
  // Floor: no market pays less than today's USD price (review PR-03).
  const floorUsd = (kind === 'plans' ? PLAN_USD.D : PACK_USD.D)[key as never] as number
  if (amount / REFERENCE_RATE[currency] < floorUsd - 0.01) amount = charm(currency, floorUsd * REFERENCE_RATE[currency], true)
  return { amount: Number(amount.toFixed(2)), currency, usd, kes: kesCharge(tier, usd, kind, key) }
}

export function regionPricing(country: string | null | undefined): RegionPricing {
  const c = country ? country.toUpperCase() : null
  const tier = tierFor(c)
  const currency: Currency = (c && CURRENCY_OF[c]) || 'USD'
  const map = <K extends string>(table: Record<K, number>, kind: 'plans' | 'packs') =>
    Object.fromEntries(Object.entries(table).map(([k, usd]) => [k, price(tier, currency, usd as number, kind, k)])) as Record<K, Price>
  return { country: c, tier, currency, version: PRICE_BOOK_VERSION, plans: map(PLAN_USD[tier], 'plans'), packs: map(PACK_USD[tier], 'packs') }
}

const NO_DECIMALS: Currency[] = ['CLP', 'NGN', 'KES', 'INR', 'MXN']

/** "KES 1,300", "GBP 24.99", "$32.99" */
export function formatPrice(p: { amount: number; currency: Currency }): string {
  if (p.amount === 0) return p.currency === 'USD' ? '$0' : `${p.currency} 0`
  const digits = NO_DECIMALS.includes(p.currency) || Number.isInteger(p.amount) ? 0 : 2
  const n = p.amount.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return p.currency === 'USD' ? `$${n}` : `${p.currency} ${n}`
}

export const formatKes = (n: number) => `KES ${n.toLocaleString('en-US')}`

/** Country names for the region selector and "Prices for ..." line. */
export const REGION_CHOICES: { code: string; name: string }[] = [
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'IE', name: 'Ireland' }, { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' },
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
  { code: 'CL', name: 'Chile' }, { code: 'BR', name: 'Brazil' }, { code: 'MX', name: 'Mexico' }, { code: 'ZA', name: 'South Africa' },
  { code: 'TR', name: 'Turkey' }, { code: 'IN', name: 'India' }, { code: 'NG', name: 'Nigeria' }, { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' }, { code: 'UG', name: 'Uganda' }, { code: 'TZ', name: 'Tanzania' }, { code: 'EG', name: 'Egypt' },
  { code: 'ID', name: 'Indonesia' }, { code: 'PH', name: 'Philippines' },
]
export function countryName(code: string | null): string {
  if (!code) return 'your region'
  const hit = REGION_CHOICES.find(r => r.code === code)
  if (hit) return hit.name
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code } catch { return code }
}

/** Headline price and the line under it, for plan cards. */
export function planPriceText(r: RegionPricing, key: 'free' | PlanKey): { amount: string; sub: string } {
  if (key === 'free') return { amount: formatPrice({ amount: 0, currency: r.currency }), sub: 'forever' }
  const p = r.plans[key]
  return {
    amount: formatPrice(p),
    sub: p.currency === 'KES' ? 'per month' : `per month, charged as ${formatKes(p.kes)}`,
  }
}

/** How members in this region usually pay, for pricing copy. */
export const paymentMethodsText = (r: RegionPricing) =>
  r.country === 'KE' ? 'Pay by card or M-Pesa.' : 'Pay by card or mobile money.'
