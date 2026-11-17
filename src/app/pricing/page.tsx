/**
 * Public pricing page (review P2). Visible without an account; signed-in
 * members buy from /upgrade. Prices mirror PaywallModal via site-facts.ts.
 */
import type { Metadata } from 'next'
import MarketingShell from '@/components/Marketing/MarketingShell'
import Icon from '@/components/Marketing/Icon'
import { CREDIT_COSTS, CREDIT_PACKS, PLANS, kesLabel, usd } from '@/lib/site-facts'

export const metadata: Metadata = {
  title: 'Pricing: Free, Starter, Premium and VIP Plans',
  description:
    'Mebley is free to join. Compare Starter, Premium and VIP monthly plans and credit prices in US dollars. Pay by card or M-Pesa and cancel any time.',
  alternates: { canonical: '/pricing' },
  openGraph: { title: 'Mebley Pricing', url: '/pricing', images: ['/opengraph-image'] },
}


export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="mk-page-hero">
        <div className="mk-container">
          <p className="mk-label" style={{ margin: 0 }}>Pricing</p>
          <h1 className="mk-hero-title" style={{ maxWidth: 820 }}>Free to join. Clear prices when you want more.</h1>
          <p className="mk-lead" style={{ margin: 0 }}>
            Everything you need to meet someone is free. Plans add monthly credits and extra tools. Prices are in US dollars.
          </p>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="plans-title">
        <div className="mk-container">
          <h2 id="plans-title" className="mk-sr">Monthly plans</h2>
          <div className="mk-plans mk-plans--4">
            {PLANS.map(p => {
              const featured = 'featured' in p && p.featured
              return (
                <div key={p.key} className={`mk-card mk-plan${featured ? ' mk-plan--featured' : ''}`}>
                  {featured ? <span className="mk-plan__badge">Most chosen</span> : null}
                  <h3 className="mk-h3">{p.name}</h3>
                  <div className="mk-plan__price">
                    <span className="mk-plan__amount">{usd(p.usd)}</span>
                    <span className="mk-plan__alt">{p.kes > 0 ? `per month, billed as ${kesLabel(p.kes)}` : 'forever'}</span>
                  </div>
                  <p className="mk-small" style={{ margin: 0 }}>{p.tagline}</p>
                  <ul>
                    {p.features.map(f => <li key={f}><Icon name="check" size={20} />{f}</li>)}
                  </ul>
                  <a
                    href={p.kes === 0 ? '/auth' : '/auth?redirectTo=/upgrade'}
                    className={`mk-btn ${featured ? 'mk-btn--primary' : 'mk-btn--secondary'}`}
                  >
                    {p.kes === 0 ? 'Join free' : `Choose ${p.name}`}
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
              Credits come with every paid plan and can also be bought in packs. You only spend them on the actions below.
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
              <caption className="mk-sr">Credit packs</caption>
              <thead><tr><th scope="col">Pack</th><th scope="col">Credits</th><th scope="col">Price</th><th scope="col">Billed as</th></tr></thead>
              <tbody>
                {CREDIT_PACKS.map(c => (
                  <tr key={c.name}>
                    <th scope="row">{c.name}</th>
                    <td>{c.credits.toLocaleString('en-US')}{c.bonus ? ` + ${c.bonus} bonus` : ''}</td>
                    <td>{usd(c.usd)}</td>
                    <td>{kesLabel(c.kes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="billing-title">
        <div className="mk-container mk-prose">
          <h2 id="billing-title" className="mk-h2">Billing, renewal and cancelling</h2>
          <ul>
            <li><strong>How you pay.</strong> Payments are processed by Paystack. Pay by card or mobile money, including M-Pesa.</li>
            <li><strong>Currency.</strong> Prices are shown in US dollars. Payments are billed as the Kenyan shilling (KES) amount shown with each price, so your bank or mobile money provider converts it if your account is in another currency and may add a fee.</li>
            <li><strong>Monthly plans.</strong> Plans run for one month from purchase. Cancel any time; when a plan ends your account returns to Free and keeps your profile, matches and conversations.</li>
            <li><strong>Deleting your data.</strong> Deleting your account removes your personal data within 30 days. See <a href="/privacy">our privacy policy</a>.</li>
            <li><strong>Questions about a charge?</strong> <a href="/contact">Contact us</a> and include your payment reference.</li>
          </ul>
          <div className="mk-callout" style={{ marginBlockStart: 16 }}>
            <Icon name="globe" />
            <p>Local currency prices and more payment methods for other regions are on the way.</p>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
