/**
 * Public home page.
 *
 * Implements the November 2026 website review: product visible in the hero
 * (P1), sourced proof strip (T1), feature cards with icons and interface
 * fragments (4.6), how it works with phone screens, merged Safety and values
 * section (V4), stories, pricing summary (P2), FAQ, final call to action with
 * new photography (V3), and the shared header/footer. Server-rendered; no
 * content waits on animation (A4, M2).
 */
import type { Metadata } from 'next'
import MarketingShell from '@/components/Marketing/MarketingShell'
import Icon, { type IconName } from '@/components/Marketing/Icon'
import ResponsiveImage, { type ImageName } from '@/components/Marketing/ResponsiveImage'
import {
  ChatScreen, PhoneFrame, RecordScreen, StitchScreen, VoiceFragment, Waveform,
} from '@/components/Marketing/PhoneScreens'
import { FAQS, faqJsonLd } from '@/components/Marketing/faq-data'
import { PLANS, PRODUCT_FACTS, SITE_FACTS } from '@/lib/site-facts'
import { countryName, formatPrice, paymentMethodsText, planPriceText, type RegionPricing } from '@/lib/pricing'
import { displayedPricing } from '@/lib/pricing-server'
import { getSiteUrl } from '@/lib/site-url'
import { cdnUrl } from '@/lib/cdn'
import DemoVideo from '@/components/Marketing/DemoVideo'

const demo = SITE_FACTS.demoVideoUrl
  ? {
      src: `${cdnUrl(SITE_FACTS.demoVideoUrl)}?v=${SITE_FACTS.demoVideoVersion}`,
      poster: `${cdnUrl(SITE_FACTS.demoPosterUrl)}?v=${SITE_FACTS.demoVideoVersion}`,
    }
  : null

export const metadata: Metadata = {
  title: { absolute: 'Mebley: Voice First Dating App for Real Connections' },
  description:
    "Hear someone's voice before you match. Send a Stitch, a like with a personal note, and meet people ranked by shared values. Free to join, selfie verified, 18+.",
  alternates: { canonical: '/' },
}

/* ── Content ──────────────────────────────────────────────────────── */

const FEATURES: { icon: IconName; title: string; sub: string; desc: string; frag: React.ReactNode }[] = [
  {
    icon: 'stitch',
    title: 'The Stitch',
    sub: 'A like with a personal note',
    desc: 'A Stitch tells someone why you noticed them before you ever say hello.',
    frag: (
      <div className="mk-frag">
        <Icon name="stitch" size={20} />
        <span>&ldquo;Your jazz Sundays sound perfect&hellip;&rdquo;</span>
      </div>
    ),
  },
  {
    icon: 'mic',
    title: 'Voice Notes',
    sub: '30 second clip on every profile',
    desc: 'Hear warmth, humour and how someone speaks before you decide to match.',
    frag: <VoiceFragment />,
  },
  {
    icon: 'spotlight',
    title: 'Spotlight',
    sub: '24 hours at the top of Discover',
    desc: 'A glowing ring on your card for a day, clearly marked so everyone knows it is a Spotlight.',
    frag: (
      <div className="mk-frag">
        <span style={{ width: 32, height: 32, borderRadius: '50%', boxShadow: '0 0 0 2px var(--champagne-400), 0 0 16px rgba(233,196,106,0.6)', display: 'inline-block', flexShrink: 0, overflow: 'hidden' }}>
          <ResponsiveImage name="profile-amara" alt="" sizes="32px" />
        </span>
        <span>Spotlight on for 23 h</span>
      </div>
    ),
  },
  {
    icon: 'moon',
    title: 'Here Tonight',
    sub: 'Live presence when you are out',
    desc: 'Switch it on when you are free tonight and appear to people nearby who are too.',
    frag: (
      <div className="mk-frag">
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 0 4px rgba(20,163,139,0.2)', flexShrink: 0 }} />
        <span>Here Tonight · Westlands</span>
      </div>
    ),
  },
  {
    icon: 'globe',
    title: 'Global Match',
    sub: `Members in ${SITE_FACTS.countries} countries`,
    desc: 'Meet people at home or across borders, from Nairobi and Lagos to Mumbai, Dubai and London.',
    frag: (
      <div className="mk-frag">
        <Icon name="globe" size={20} />
        <span>Showing: Nairobi and worldwide</span>
      </div>
    ),
  },
  {
    icon: 'target',
    title: 'Intent Score',
    sub: 'Ranked by shared values',
    desc: 'Your feed is ordered by values, relationship intentions and how people actually behave on Mebley.',
    frag: (
      <div className="mk-frag">
        <Icon name="target" size={20} />
        <span>Long term · Faith · Family first</span>
      </div>
    ),
  },
]

const STEPS = [
  { title: 'Build your story', desc: 'Add photos, a 30 second voice note and prompts that show the real you.', screen: <RecordScreen />, label: 'Sample screen: recording a 30 second voice note, 18 seconds recorded' },
  { title: 'Send a Stitch', desc: 'Like someone with a personal note that tells them why you noticed them.', screen: <StitchScreen />, label: 'Sample screen: writing a Stitch note to Amara' },
  { title: 'Talk for real', desc: 'When it is mutual, start a conversation with text and voice messages.', screen: <ChatScreen />, label: 'Sample screen: a conversation with Amara that started from a Stitch' },
]

const SAFETY: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'verified', title: 'Selfie verification', desc: 'A quick selfie is compared with your main photo. Verified profiles carry a badge.' },
  { icon: 'flag', title: 'Block and report everywhere', desc: 'Every profile and chat has Block and Report, reviewed by our moderation team.' },
  { icon: 'lock', title: 'Your voice stays yours', desc: `Re-record or remove your voice note any time. Delete your account and your data is gone within ${PRODUCT_FACTS.dataDeletionDays} days.` },
  { icon: 'shield', title: 'Adults only', desc: `Mebley is for people aged ${PRODUCT_FACTS.minimumAge} and over. Under-18 accounts are removed.` },
]

const STORIES: { q: string; name: string; city: string; tag: string; img: ImageName }[] = [
  { q: 'I sent a Stitch and she replied within minutes. We met for coffee two days later. The intentionality is real.', name: 'Amara K.', city: 'Nairobi', tag: 'Matched in Nairobi', img: 'story-1' },
  { q: "Hearing someone's laugh before a first date changes everything. No other app feels like this.", name: 'Priya S.', city: 'Mumbai', tag: 'Matched across cities', img: 'story-2' },
  { q: 'His voice note made me stop scrolling. Within a week we were on a rooftop in Paris.', name: 'Zainab A.', city: 'Dubai', tag: 'Matched with Remi, Paris', img: 'story-3' },
]

const HOME_PLANS = PLANS.filter(p => p.key === 'free' || p.key === 'premium' || p.key === 'vip')

/* ── Structured data (FAQ + app) ──────────────────────────────────── */
function jsonLd(region: RegionPricing) {
  const site = getSiteUrl()
  const app: Record<string, unknown> = {
    '@type': 'WebApplication',
    name: 'Mebley',
    url: site,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any (web browser)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: region.currency, description: 'Free to join; optional monthly plans' },
    featureList: FEATURES.map(f => `${f.title}: ${f.sub}`),
  }
  if (SITE_FACTS.rating) {
    app.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: SITE_FACTS.rating.value,
      reviewCount: SITE_FACTS.rating.reviewCount,
      bestRating: '5',
    }
  }
  const graph: unknown[] = [app, faqJsonLd(FAQS.slice(0, 6))]
  if (demo) {
    const abs = (u: string) => (u.startsWith('http') ? u : `${site}${u}`)
    graph.push({
      '@type': 'VideoObject',
      name: 'Mebley in under a minute',
      description: 'How Mebley works: voice notes on every profile, recording your own, sending a Stitch, chatting after a match, and reporting or blocking.',
      thumbnailUrl: abs(demo.poster),
      contentUrl: abs(demo.src),
      uploadDate: '2026-11-17',
      duration: `PT${SITE_FACTS.demoVideoSeconds}S`,
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default async function HomePage() {
  const { pricing: region } = await displayedPricing()
  const proof = [
    SITE_FACTS.members
      ? { value: SITE_FACTS.members.value, label: `${SITE_FACTS.members.label} (${SITE_FACTS.members.asOf})` }
      : { value: `${PRODUCT_FACTS.voiceNoteSeconds} sec`, label: 'voice note on every profile' },
    { value: SITE_FACTS.countries, label: 'countries open to members' },
    SITE_FACTS.rating
      ? { value: `${SITE_FACTS.rating.value} / 5`, label: SITE_FACTS.rating.label, href: SITE_FACTS.rating.sourceUrl }
      : { value: 'Selfie', label: 'verification for every member' },
    { value: formatPrice({ amount: 0, currency: region.currency }), label: 'to join; upgrade any time' },
  ]

  return (
    <MarketingShell stickyJoin>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(region)) }} />

      {/* ── Hero ── */}
      <section id="hero" className="mk-hero" aria-labelledby="hero-title">
        <div className="mk-hero__bg">
          <ResponsiveImage
            name="hero"
            alt=""
            sizes="100vw"
            priority
          />
        </div>
        <div className="mk-container mk-hero__grid">
          <div className="mk-hero__copy">
            <p className="mk-label mk-eyebrow mk-fade-in" style={{ margin: 0 }}>
              Voice first dating in {SITE_FACTS.countries} countries
            </p>
            <h1 id="hero-title" className="mk-hero-title mk-fade-in mk-fade-in--2">
              Find your <span className="mk-accent">person.</span>
            </h1>
            <p className="mk-lead mk-fade-in mk-fade-in--3" style={{ margin: 0, maxWidth: 520 }}>
              Hear someone&rsquo;s voice before you match. Send a Stitch, a like with a personal note, and meet people ranked by shared values.
            </p>
            <div className="mk-hero__ctas">
              <a href="/auth" className="mk-btn mk-btn--primary">Join free</a>
              {demo ? (
                <a href="#demo" className="mk-btn mk-btn--secondary">
                  <Icon name="play" size={20} /> Watch the {SITE_FACTS.demoVideoSeconds} second demo
                </a>
              ) : (
                <a href="#how" className="mk-btn mk-btn--secondary">See how it works</a>
              )}
            </div>
            <ul className="mk-hero__chips" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li className="mk-chip"><Icon name="verified" size={20} />Selfie verified profiles</li>
              <li className="mk-chip"><Icon name="shield" size={20} />{PRODUCT_FACTS.minimumAge}+ only</li>
              <li className="mk-chip"><Icon name="heart" size={20} />Free to join</li>
            </ul>
            <p className="mk-hero__note" style={{ margin: 0 }}>
              <Icon name="info" size={18} />
              Runs in your browser on any phone or computer. No download needed.
            </p>
          </div>
        </div>
      </section>

      {/* ── Proof strip ── */}
      <section className="mk-proof" aria-label="Mebley at a glance">
        <div className="mk-container">
          <ul className="mk-proof__list">
            {proof.map(p => (
              <li key={p.label} className="mk-proof__item">
                <span className="mk-proof__value">{p.value}</span>
                <span className="mk-proof__label">
                  {'href' in p && p.href ? <a href={p.href} target="_blank" rel="noopener noreferrer">{p.label}</a> : p.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mk-section mk-anchor" aria-labelledby="features-title">
        <div className="mk-container">
          <div className="mk-section-head">
            <p className="mk-label" style={{ margin: 0 }}>Features</p>
            <h2 id="features-title" className="mk-h2">Six ways Mebley is different</h2>
            <p className="mk-lead" style={{ margin: 0 }}>
              Built around voice, intention and shared values, so the conversations you start actually go somewhere.
            </p>
          </div>
          <ul className="mk-grid-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {FEATURES.map(f => (
              <li key={f.title} className="mk-card mk-feature">
                <span className="mk-icon-disc"><Icon name={f.icon} /></span>
                <h3 className="mk-h3">{f.title}</h3>
                <p className="mk-feature__sub" style={{ margin: 0 }}>{f.sub}</p>
                <p className="mk-feature__desc">{f.desc}</p>
                <div className="mk-feature__frag" aria-hidden="true">{f.frag}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="mk-section mk-section--alt mk-anchor" aria-labelledby="how-title">
        <div className="mk-container">
          <div className="mk-section-head">
            <p className="mk-label" style={{ margin: 0 }}>How it works</p>
            <h2 id="how-title" className="mk-h2">Three steps to something real</h2>
          </div>
          {demo ? (
            <figure id="demo" className="mk-demo mk-anchor">
              <DemoVideo src={demo.src} poster={demo.poster} describedBy="demo-desc" />
              <figcaption className="mk-demo__caption">
                <span>Mebley in {SITE_FACTS.demoVideoSeconds} seconds. Plays on its own with no sound; use the controls to pause. Sample screens; photo is illustrative.</span>
                <details>
                  <summary>Read what the video shows</summary>
                  <p id="demo-desc">
                    Every profile has a 30 second voice note you can listen to before you decide. You record your own and answer prompts in your own words.
                    You send a Stitch, a like with a personal note saying why you noticed someone. When it is mutual, you talk with text and voice messages.
                    From any chat you can report or block someone. Mebley is free to join at mebley.com.
                  </p>
                </details>
              </figcaption>
            </figure>
          ) : null}
          <ol className="mk-grid-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {STEPS.map((s, i) => (
              <li key={s.title} className="mk-card mk-step">
                <span className="mk-step__n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mk-h3"><span className="mk-sr">Step {i + 1}: </span>{s.title}</h3>
                <p className="mk-body" style={{ margin: 0 }}>{s.desc}</p>
                <div className="mk-step__phone">
                  <PhoneFrame size="sm" label={s.label}>{s.screen}</PhoneFrame>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Safety and values (replaces "Why Mebley") ── */}
      <section id="safety" className="mk-split mk-section mk-anchor" aria-labelledby="safety-title">
        <div className="mk-split__bg">
          <ResponsiveImage name="safety" alt="" sizes="100vw" />
        </div>
        <div className="mk-container">
          <div className="mk-split__content">
            <p className="mk-label" style={{ margin: 0 }}>Safety and values</p>
            <h2 id="safety-title" className="mk-h2">Built to be safe, fair and real</h2>
            <ul className="mk-checklist">
              {SAFETY.map(s => (
                <li key={s.title}>
                  <span className="mk-icon-disc"><Icon name={s.icon} /></span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div>
              <a href="/safety" className="mk-btn mk-btn--secondary">
                Visit the Safety centre <Icon name="arrow" size={20} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stories ── */}
      <section id="stories" className="mk-section mk-section--alt mk-anchor" aria-labelledby="stories-title">
        <div className="mk-container">
          <div className="mk-section-head">
            <p className="mk-label" style={{ margin: 0 }}>Stories</p>
            <h2 id="stories-title" className="mk-h2">People who met on Mebley</h2>
          </div>
          <ul className="mk-grid-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {STORIES.map(s => (
              <li key={s.name} className="mk-card mk-story">
                <span className="mk-stars" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map(n => <Icon key={n} name="star" size={18} mono />)}
                </span>
                <blockquote>
                  <p style={{ margin: 0 }}>&ldquo;{s.q}&rdquo;</p>
                </blockquote>
                <footer>
                  <ResponsiveImage name={s.img} alt="" sizes="56px" width={56} height={56} />
                  <div>
                    <div className="mk-story__name">{s.name}</div>
                    <div className="mk-story__meta">{s.city} · {s.tag}</div>
                  </div>
                </footer>
              </li>
            ))}
          </ul>
          <p className="mk-small" style={{ marginBlock: '24px 0' }}>
            Illustrative stories and photos while we gather consented member stories.{' '}
            <a href="/contact" style={{ color: 'var(--coral-200)' }}>Met someone on Mebley? Share your story.</a>
          </p>
        </div>
      </section>

      {/* ── Pricing summary ── */}
      <section id="pricing" className="mk-section mk-anchor" aria-labelledby="pricing-title">
        <div className="mk-container">
          <div className="mk-section-head">
            <p className="mk-label" style={{ margin: 0 }}>Pricing</p>
            <h2 id="pricing-title" className="mk-h2">Free to join. Upgrade when you want more.</h2>
            <p className="mk-lead" style={{ margin: 0 }}>
              Prices for {countryName(region.country)} in {region.currency}. {paymentMethodsText(region)} Cancel any time.
            </p>
          </div>
          <div className="mk-plans mk-plans--3">
            {HOME_PLANS.map(p => (
              <div key={p.key} className={`mk-card mk-plan${'featured' in p && p.featured ? ' mk-plan--featured' : ''}`}>
                {'featured' in p && p.featured ? <span className="mk-plan__badge">Most chosen</span> : null}
                <h3 className="mk-h3">{p.name}</h3>
                <div className="mk-plan__price">
                  <span className="mk-plan__amount">{planPriceText(region, p.key).amount}</span>
                  <span className="mk-plan__alt">{planPriceText(region, p.key).sub}</span>
                </div>
                <p className="mk-small" style={{ margin: 0 }}>{p.tagline}</p>
                <ul>
                  {p.features.slice(0, 5).map(f => (
                    <li key={f}><Icon name="check" size={20} />{f}</li>
                  ))}
                </ul>
                <a href="/auth" className={`mk-btn ${'featured' in p && p.featured ? 'mk-btn--primary' : 'mk-btn--secondary'}`}>
                  {p.key === 'free' ? 'Join free' : `Start with ${p.name}`}
                </a>
              </div>
            ))}
          </div>
          <p style={{ marginBlock: '24px 0' }}>
            <a href="/pricing" className="mk-btn mk-btn--ghost" style={{ paddingInline: 0 }}>
              Compare all plans and credit prices <Icon name="arrow" size={20} />
            </a>
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="mk-section mk-section--alt mk-anchor" aria-labelledby="faq-title">
        <div className="mk-container">
          <div className="mk-section-head">
            <p className="mk-label" style={{ margin: 0 }}>FAQ</p>
            <h2 id="faq-title" className="mk-h2">Questions people ask first</h2>
          </div>
          <div className="mk-faq">
            {FAQS.slice(0, 6).map(f => (
              <details key={f.q}>
                <summary>{f.q}<Icon name="plus" size={22} /></summary>
                <div>
                  {f.a.map(p => <p key={p}>{p}</p>)}
                  {f.link ? <p><a href={f.link.href}>{f.link.label}</a></p> : null}
                </div>
              </details>
            ))}
          </div>
          <p style={{ marginBlock: '24px 0' }}>
            <a href="/faq" className="mk-btn mk-btn--ghost" style={{ paddingInline: 0 }}>
              All questions <Icon name="arrow" size={20} />
            </a>
          </p>
        </div>
      </section>

      {/* ── Final call to action ── */}
      <section className="mk-cta" aria-labelledby="cta-title">
        <div className="mk-cta__bg">
          <ResponsiveImage name="cta" alt="" sizes="100vw" />
        </div>
        <div className="mk-container">
          <div className="mk-cta__content">
            <h2 id="cta-title" className="mk-h2">Your person is already here.</h2>
            <p className="mk-lead" style={{ margin: 0 }}>
              Join free today. It takes two minutes and a {PRODUCT_FACTS.voiceNoteSeconds} second voice note.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <a href="/auth" className="mk-btn mk-btn--primary">Join free</a>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)' }}>
                <span className="mk-frag__play" aria-hidden="true"><Icon name="mic" size={16} mono /></span>
                <span style={{ width: 120 }} aria-hidden="true"><Waveform bars={14} /></span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
