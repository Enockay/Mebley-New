/**
 * Regional pricing check after payment (review 4.12, PR-05 and PR-11).
 *
 * Paystack's hosted checkout does not reveal the card's country before the
 * member pays, so the tier is chosen from the visitor's location and then
 * checked here against the country of the card that actually paid. A payment
 * from a higher tier country is logged as a mismatch for the monthly report.
 * Moving the check before payment needs a processor that exposes the card
 * country first (for example a merchant of record).
 */
import { tierFor, type Tier } from '@/lib/pricing'

const RANK: Record<Tier, number> = { D: 0, C: 1, B: 2, A: 3 }

type PaystackTx = {
  metadata?: { pricing_country?: string | null; pricing_tier?: Tier; price_book?: string } | null
  authorization?: { country_code?: string | null; channel?: string | null } | null
}

export function logPricingCountryCheck(reference: string, tx: PaystackTx | undefined): void {
  const charged = tx?.metadata?.pricing_tier
  const payCountry = tx?.authorization?.country_code?.toUpperCase() || null
  if (!charged || !payCountry) return
  const payTier = tierFor(payCountry)
  const entry = {
    reference,
    location_country: tx?.metadata?.pricing_country ?? null,
    charged_tier: charged,
    payment_country: payCountry,
    payment_tier: payTier,
    channel: tx?.authorization?.channel ?? null,
    price_book: tx?.metadata?.price_book ?? null,
  }
  if (RANK[payTier] > RANK[charged]) console.warn('[pricing] tier mismatch: paid from a higher tier country', entry)
  else console.info('[pricing] tier check ok', entry)
}
