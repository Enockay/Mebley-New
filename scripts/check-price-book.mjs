#!/usr/bin/env node
/**
 * Checks the regional price book against the review's rules (section 4.12,
 * Table 10). Run: node scripts/check-price-book.mjs   (Node 23.6+ for .ts import)
 */
import assert from 'node:assert/strict'
import {
  PLAN_USD, PACK_USD, REFERENCE_RATE, regionPricing, tierFor, formatPrice,
} from '../src/lib/pricing.ts'

let checks = 0
const ok = (cond, msg) => { assert.ok(cond, msg); checks++ }

// PR-02: unknown countries fall back to tier A
ok(tierFor('ZZ') === 'A' && tierFor(null) === 'A', 'unknown country -> tier A')

// PR-03: Kenya stays exactly at today's prices
const ke = regionPricing('KE')
ok(ke.tier === 'D' && ke.currency === 'KES', 'Kenya is tier D in KES')
ok([ke.plans.starter, ke.plans.premium, ke.plans.vip].map(p => p.amount).join() === '650,1300,1950', 'Kenya plans 650/1300/1950')
ok([ke.packs.starter, ke.packs.popular, ke.packs.value, ke.packs.mega].map(p => p.kes).join() === '650,2600,5200,9750', 'Kenya packs charge unchanged')

// PR-03: no country pays less than today's USD prices, displayed or charged
const all = 'US GB DE FR IE CA AU AE JP PL PT GR CL UY BR MX AR ZA TR MY TH IN NG KE GH EG ID PH PK ZZ'.split(' ')
for (const c of all) {
  const r = regionPricing(c)
  for (const [k, p] of Object.entries(r.plans)) {
    ok(p.amount / REFERENCE_RATE[p.currency] >= PLAN_USD.D[k] - 0.01, `${c} ${k} plan not below floor (${formatPrice(p)})`)
    ok(p.kes / REFERENCE_RATE.KES >= PLAN_USD.D[k] - 0.01, `${c} ${k} plan KES charge not below floor`)
  }
  for (const [k, p] of Object.entries(r.packs)) {
    ok(p.amount / REFERENCE_RATE[p.currency] >= PACK_USD.D[k] - 0.01, `${c} ${k} pack not below floor (${formatPrice(p)})`)
  }
}

// Review Table 9 examples
const expect = { US: '$16.99 $32.99 $49.99', GB: 'GBP 12.99 GBP 24.99 GBP 37.99', IN: 'INR 449 INR 899 INR 1,349', NG: 'NGN 7,500 NGN 15,000 NGN 22,500', BR: 'BRL 45.90 BRL 89.90 BRL 134.90' }
for (const [c, want] of Object.entries(expect)) {
  const r = regionPricing(c)
  const got = [r.plans.starter, r.plans.premium, r.plans.vip].map(formatPrice).join(' ')
  ok(got === want, `${c}: expected "${want}", got "${got}"`)
}

// Tier shares hold for the USD base (within rounding)
for (const [tier, share] of [['A', 1], ['B', 0.75], ['C', 0.5]]) {
  for (const [k, usd] of Object.entries(PLAN_USD[tier])) {
    const base = PLAN_USD.D[k] / 0.3
    ok(Math.abs(usd - base * share) / (base * share) < 0.06, `tier ${tier} ${k} close to ${share * 100}% of base`)
  }
}

console.log(`Price book OK: ${checks} checks passed.`)
for (const c of ['US', 'GB', 'DE', 'PL', 'BR', 'ZA', 'IN', 'NG', 'KE']) {
  const r = regionPricing(c)
  console.log(c.padEnd(3), r.tier, Object.values(r.plans).map(formatPrice).join(' / ').padEnd(36), '| packs', Object.values(r.packs).map(formatPrice).join(' / '))
}
