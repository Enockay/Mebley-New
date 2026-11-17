/**
 * Public pricing page (review P2, 4.12). Visible without an account; signed-in
 * members buy from /upgrade. Prices are regional: the visitor's country sets
 * the tier and currency automatically (src/lib/pricing.ts). Plan features
 * come from site-facts.ts.
 */
import type { Metadata } from 'next'
import MarketingShell from '@/components/Marketing/MarketingShell'
import Icon from '@/components/Marketing/Icon'
import RegionPicker from '@/components/Marketing/RegionPicker'
import { CREDIT_COSTS, CREDIT_PACKS, PLANS } from '@/lib/site-facts'
import { countryName, formatKes, formatPrice, paymentMethodsText, planPriceText } from '@/lib/pricing'
import { displayedPricing } from '@/lib/pricing-server'

export const metadata: Metadata = {
  title: 'Pricing: Free, Starter, Premium and VIP Plans',
  description:
    'Mebley is free to join. Compare Starter, Premium and VIP monthly plans and credit packs, priced for your country in your own currency. Cancel any time.',
  alternates: { canonical: '/pricing' },
  openGraph: { title: 'Mebley Pricing', url: '/pricing', images: ['/opengraph-image'] },
}

export default async function PricingPage() {
  const { pricing: r, detected, chosen } = await displayedPricing()
  const where = countryName(r.country)
  const chargesKes = r.currency !== 'KES'

  return (
    <MarketingShell>
      <section className="mk-page-hero">
        <div className="mk-container">
          <p className="mk-label" style={{ margin: 0 }}>Pricing</p>
          <h1 className="mk-hero-title" style={{ maxWidth: 820 }}>Free to join. Clear prices when you want more.</h1>
          <p className="mk-lead" style={{ margin: 0 }}>
            Everything you need to meet someone is free. Plans add monthly credits and extra tools.
          </p>
          <div className="mk-region-bar">
            <p style={{ margin: 0 }}>
              <Icon name="globe" size={20} /> Prices for <strong>{where}</strong> in {r.currency}.{' '}
              {chosen ? 'You chose this region to compare. Checkout charges the price for your location.' : 'Set automatically from your location.'}
            </p>
            <RegionPicker current={r.country} detected={detected} />
          </div>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="plans-title">
        <div className="mk-container">
          <h2 id="plans-title" className="mk-sr">Monthly plans</h2>
          <div className="mk-plans mk-plans--4">
            {PLANS.map(p => {
              const featured = 'featured' in p && p.featured
              const price = planPriceText(r, p.key)
              return (
                <div key={p.key} className={`mk-card mk-plan${featured ? ' mk-plan--featured' : ''}`}>
                  {featured ? <span className="mk-plan__badge">Most chosen</span> : null}
                  <h3 className="mk-h3">{p.name}</h3>
                  <div className="mk-plan__price">
                    <span className="mk-plan__amount">{price.amount}</span>
                    <span className="mk-plan__alt">{price.sub}</span>
                  </div>
                  <p className="mk-small" style={{ margin: 0 }}>{p.tagline}</p>
                  <ul>
                    {p.features.map(f => <li key={f}><Icon name="check" size={20} />{f}</li>)}
                  </ul>
                  <a
                    href={p.key === 'free' ? '/auth' : '/auth?redirectTo=/upgrade'}
                    className={`mk-btn ${featured ? 'mk-btn--primary' : 'mk-btn--secondary'}`}
                  >
                    {p.key === 'free' ? 'Join free' : `Choose ${p.name}`}
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mk-section mk-section--alt" aria-labelledby="credits-title">
        <div className="mk-container" style={{ display: 'grid', gap: 48 }}>
          <div className="mk-section-head" style={{ marginBlockEnd: 0 }}>
            <p className="mk-label" style={{ margin: 0 }}>Credits</p>
            <h2 id="credits-title" className="mk-h2">What credits are used for</h2>
            <p className="mk-lead" style={{ margin: 0 }}>
              Credits come with every paid plan and can also be bought in packs. What credits buy is the same in every country; only the price of a pack changes.
            </p>
          </div>
          <div className="mk-table-wrap">
            <table className="mk-table">
              <caption className="mk-sr">Credit cost of each action</caption>
              <thead><tr><th scope="col">Action</th><th scope="col">Credits</th><th scope="col">Notes</th></tr></thead>
              <tbody>
                {CREDIT_COSTS.map(c => (
                  <tr key={c.item}><th scope="row">{c.item}</th><td>{c.credits}</td><td>{c.note || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mk-table-wrap">
            <table className="mk-table">
              <caption className="mk-sr">Credit packs for {where}</caption>
              <thead>
                <tr>
                  <th scope="col">Pack</th><th scope="col">Credits</th><th scope="col">Price</th>
                  {chargesKes ? <th scope="col">Charged as</th> : null}
                </tr>
              </thead>
              <tbody>
                {CREDIT_PACKS.map(c => (
                  <tr key={c.key}>
                    <th scope="row">{c.name}</th>
                    <td>{c.credits.toLocaleString('en-US')}{c.bonus ? ` + ${c.bonus} bonus` : ''}</td>
                    <td>{formatPrice(r.packs[c.key])}</td>
                    {chargesKes ? <td>{formatKes(r.packs[c.key].kes)}</td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="billing-title">
        <div className="mk-container mk-prose">
          <h2 id="billing-title" className="mk-h2">How prices work</h2>
          <ul>
            <li><strong>Priced for your country.</strong> Mebley sets prices by region so they are fair where you live. We use your location to choose the price; checkout shows the exact amount before you pay.</li>
            <li><strong>How you pay.</strong> Payments are processed by Paystack. {paymentMethodsText(r)}</li>
            <li>
              <strong>Currency.</strong>{' '}
              {chargesKes
                ? `Payments are currently charged in Kenyan shillings (KES), shown above as "Charged as". Your bank converts it and may add a fee. Charging in ${r.currency} is on the way.`
                : 'You are charged in Kenyan shillings (KES), the amounts shown above.'}
            </li>
            <li><strong>Your price stays the same.</strong> Plans keep their price for as long as you stay subscribed. Credits you have bought keep their value. We give at least 30 days&rsquo; notice of any price change.</li>
            <li><strong>Monthly plans.</strong> Plans run for one month from purchase. Cancel any time; when a plan ends your account returns to Free and keeps your profile, matches and conversations.</li>
            <li><strong>Deleting your data.</strong> Deleting your account removes your personal data within 30 days. See <a href="/privacy">our privacy policy</a>.</li>
            <li><strong>Questions about a charge?</strong> <a href="/contact">Contact us</a> and include your payment reference.</li>
          </ul>
        </div>
      </section>
    </MarketingShell>
  )
}
