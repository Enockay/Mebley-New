import type { Metadata } from 'next'
import MarketingShell from '@/components/Marketing/MarketingShell'
import Icon from '@/components/Marketing/Icon'
import { FAQS, faqJsonLd } from '@/components/Marketing/faq-data'

export const metadata: Metadata = {
  title: 'FAQ: Cost, Safety, Verification and Your Data',
  description:
    'Answers about Mebley: what it costs, who can join, how verification works, what happens to your voice note, how to pay, cancel or delete your account.',
  alternates: { canonical: '/faq' },
  openGraph: { title: 'Mebley FAQ', url: '/faq', images: ['/opengraph-image'] },
}

export default function FaqPage() {
  return (
    <MarketingShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', ...faqJsonLd() }) }}
      />
      <section className="mk-page-hero">
        <div className="mk-container">
          <p className="mk-label" style={{ margin: 0 }}>Help</p>
          <h1 className="mk-hero-title">Frequently asked questions</h1>
          <p className="mk-lead" style={{ margin: 0 }}>
            Cost, eligibility, safety and your data. Can&rsquo;t find an answer? <a href="/contact" style={{ color: 'var(--coral-200)' }}>Contact us</a>.
          </p>
        </div>
      </section>
      <section className="mk-section">
        <div className="mk-container">
          <div className="mk-faq">
            {FAQS.map((f, i) => (
              <details key={f.q} open={i === 0}>
                <summary>{f.q}<Icon name="plus" size={22} /></summary>
                <div>
                  {f.a.map(p => <p key={p}>{p}</p>)}
                  {f.link ? <p><a href={f.link.href}>{f.link.label}</a></p> : null}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
