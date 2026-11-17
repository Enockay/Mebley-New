/**
 * src/lib/site-facts.ts
 *
 * Single source of truth for facts shown on the public website.
 *
 * The November 2026 review (T1) asked that every figure be sourced and dated,
 * and that anything unverifiable be removed. Optional fields below are left
 * null on purpose: the UI only renders them once a real, sourced value is
 * filled in. Do not add figures here that cannot be backed up.
 */

export type SourcedFigure = {
  value: string
  label: string
  /** e.g. "November 2026" — shown next to the figure */
  asOf: string
  /** Link that substantiates the figure (store listing, report, etc.) */
  sourceUrl?: string
}

export const SITE_FACTS = {
  /** Legal entity shown in the footer, structured data and legal pages. */
  legalName: 'Mebley Inc.',
  /** Registered address. TODO(client): fill in before launch; footer shows it once set. */
  registeredAddress: null as string | null,
  supportEmail: 'support@mebley.com' as string | null,

  /** Number of countries Mebley is open in. Used once in visible copy, not repeated. */
  countries: '40+',

  /** Verified member count. TODO(client): set with an as-of date, e.g. { value: '12,400', label: 'members', asOf: 'November 2026' } */
  members: null as SourcedFigure | null,
  /** Store or review-platform rating. Only set when it links to a public listing. */
  rating: null as (SourcedFigure & { reviewCount: number }) | null,

  /**
   * Product demo (Phase 3), rendered by scripts/render-media.mjs from /studio.
   * Paths are under public/ and go through cdnUrl(). When set, the home page
   * shows the video in How it works and the hero button links to it.
   * Bump `demoVideoVersion` after re-rendering: the CDN caches files for a year.
   */
  demoVideoUrl: '/video/mebley-demo.webm' as string | null,
  demoPosterUrl: '/video/mebley-demo-poster.jpg',
  demoVideoVersion: 1,
  /** Length shown in the button label and structured data. */
  demoVideoSeconds: 53,
  /** Native app store listings. Mebley currently runs in the browser as a web app. */
  appStoreUrl: null as string | null,
  playStoreUrl: null as string | null,

  /** Must match the footer links exactly (review issue S1). */
  social: [
    { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61589535176918' },
    { label: 'X', href: 'https://x.com/Mebley_Dating' },
    { label: 'Instagram', href: 'https://www.instagram.com/mebleysite/' },
  ],
} as const

/** Product facts taken from the codebase; safe to state publicly. */
export const PRODUCT_FACTS = {
  voiceNoteSeconds: 30,
  dataDeletionDays: 30,
  messageRetentionDays: 90,
  minimumAge: 18,
}

/** Prices mirror src/components/Paystack/PaywallModal.tsx. Keep in sync. */
/**
 * Display helpers. Prices are shown in US dollars first. Checkout currently
 * bills the KES amount (src/app/api/paystack/initialise/route.ts), so the KES
 * figure is always shown alongside as "billed as".
 */
export const usd = (n: number) => (n === 0 ? '$0' : `$${Number.isInteger(n) ? n : n.toFixed(2)}`)
export const kesLabel = (n: number) => `KES ${n.toLocaleString('en-US')}`

export const PLANS = [
  {
    key: 'free',
    name: 'Free',
    kes: 0,
    usd: 0,
    tagline: 'Everything you need to start',
    features: [
      'Profile with photos and a 30 second voice note',
      'Selfie verification badge',
      'Browse, like and match',
      'Message your mutual matches',
      'Block and report in every chat',
    ],
  },
  {
    key: 'starter',
    name: 'Starter',
    kes: 650,
    usd: 5,
    tagline: 'Credits for Stitches and Moments',
    features: [
      'Everything in Free',
      '100 credits every month',
      'Spend credits on Stitches, Spotlight and Boosts',
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    kes: 1300,
    usd: 10,
    tagline: 'The full Mebley experience',
    featured: true,
    features: [
      'Everything in Starter',
      '250 credits every month',
      'See who liked you',
      'Unlimited likes',
      'Read receipts and advanced filters',
      'Priority in Discover',
      'One Quick Boost every month',
    ],
  },
  {
    key: 'vip',
    name: 'VIP',
    kes: 1950,
    usd: 15,
    tagline: 'Maximum visibility',
    features: [
      'Everything in Premium',
      '450 credits every month',
      'One Day Boost every month',
      'VIP badge on your profile',
    ],
  },
] as const

/** Credit prices, mirrored from src/lib/*.constants.ts and PaywallModal. */
export const CREDIT_COSTS = [
  { item: 'Stitch that becomes a match', credits: 10, note: 'Charged to each person only when the Stitch is mutual' },
  { item: 'See who liked you (single unlock)', credits: 5, note: 'Included free on Premium and VIP' },
  { item: 'Message someone from Discover before matching', credits: 20, note: '' },
  { item: 'Spotlight, 24 hours at the top of Discover', credits: 120, note: 'Visibly marked with a glowing ring' },
  { item: 'Golden Thread, gold border for 24 hours', credits: 150, note: '' },
  { item: 'Direct Match request with a note', credits: 300, note: '' },
  { item: 'Boosts, 6 hours to 5 days', credits: '50 to 400', note: '' },
] as const

export const CREDIT_PACKS = [
  { key: 'starter', name: 'Starter Pack', credits: 100, bonus: 0, kes: 650, usd: 4.99 },
  { key: 'popular', name: 'Popular Pack', credits: 300, bonus: 30, kes: 2600, usd: 19.99 },
  { key: 'value', name: 'Value Pack', credits: 700, bonus: 100, kes: 5200, usd: 39.99 },
  { key: 'mega', name: 'Mega Pack', credits: 1600, bonus: 300, kes: 9750, usd: 74.99 },
] as const
