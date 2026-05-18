'use client'

import { motion } from 'framer-motion'
import Script from 'next/script'

/* ── Data ──────────────────────────────────────────────────────────── */
const STATS = [
  { v: '12k+', l: 'Active members' },
  { v: '40+',  l: 'Countries'      },
  { v: '4.8★', l: 'App rating'    },
  { v: '78%',  l: 'Reply rate'    },
]

const FEATURES = [
  { icon: '🧵', title: 'The Stitch',   sub: 'Super-like with intention',  desc: 'Send a Stitch with a personal note and rise above the noise — thoughtfully.' },
  { icon: '🎙️', title: 'Voice Notes',  sub: 'Hear before you meet',       desc: 'Record 30 seconds on your profile. Your voice and energy speak first.' },
  { icon: '✨', title: 'Spotlight',    sub: 'Be impossible to miss',       desc: 'A glowing ring on your card for 24 hours — because timing is everything.' },
  { icon: '🌙', title: 'Here Tonight', sub: 'Live presence, real sparks', desc: "Activate when you're out and surface to people looking to connect right now." },
  { icon: '🌍', title: 'Global Match', sub: '40+ countries',              desc: 'Discover across Nairobi, Tokyo, London, Mumbai, and everywhere between.' },
  { icon: '🎯', title: 'Intent Score', sub: 'Quality over quantity',      desc: 'Your feed ranks by compatibility and shared values — not who paid to boost.' },
]

const HOW = [
  { n: '01', title: 'Build your story',      desc: 'Add photos, a voice note, and prompts that show the real you — not just the highlight reel.' },
  { n: '02', title: 'Stitch with intention', desc: 'Send a thoughtful like with a personal note that rises above the noise.' },
  { n: '03', title: 'Connect for real',      desc: "When it's mutual, start a conversation that actually goes somewhere." },
]

const TESTIMONIALS = [
  { q: 'I sent a Stitch and she replied within minutes. We met for coffee two days later. The intentionality is real.', name: 'Amara K.', city: 'Nairobi', tag: 'Matched with Jin, Seoul' },
  { q: "Hearing someone's laugh before a first date changes everything. No other app feels like this.", name: 'Priya S.', city: 'Mumbai', tag: 'Matched with Kwame, London' },
  { q: 'His voice note made me stop scrolling. Within a week we were on a rooftop in Paris.', name: 'Zainab A.', city: 'Dubai', tag: 'Matched with Remi, Paris' },
]

const VALUES = [
  { icon: '💎', title: 'Depth over swipes',  desc: 'Designed for better conversations, not endless scrolling.' },
  { icon: '🌐', title: 'Globally inclusive', desc: 'Connect across cultures with fair, values-based matching.' },
  { icon: '🔒', title: 'Safe by design',     desc: 'Verification, reporting, and moderation built in from day one.' },
]

const FOOTER_LINKS = [
  { head: 'Product',  links: [['#features','Features'],['#stories','Stories'],['/auth','Sign up']] },
  { head: 'Company', links: [['/about','About'],['/blog','Blog'],['/contact','Contact']] },
  { head: 'Legal',   links: [['/privacy','Privacy'],['/terms','Terms']] },
]

/* ── Design tokens ─────────────────────────────────────────────────── */
const T = {
  bg:        '#09071a',
  bgDeep:    '#06050f',
  bgMid:     '#0d0b22',
  text:      '#f0e8f4',
  muted:     '#8a7898',
  faint:     '#4e3d60',
  rose:      '#f03868',
  coral:     '#ff7a50',
  card:      'rgba(255,255,255,0.042)',
  cardHov:   'rgba(240,56,104,0.07)',
  border:    'rgba(255,255,255,0.08)',
  roseBorder:'rgba(240,56,104,0.22)',
} as const

/* ── Helpers ───────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, margin: '-40px' }}>
      {children}
    </motion.div>
  )
}

function Label({ text }: { text: string }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
      style={{ background: 'rgba(240,56,104,0.1)', color: '#ff80a8', border: `1px solid ${T.roseBorder}` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.rose, display: 'inline-block' }} />
      {text}
    </div>
  )
}

function GCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl transition-all duration-200 ${className}`}
      style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: 'blur(10px)' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.roseBorder; el.style.background = T.cardHov }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.border; el.style.background = T.card }}>
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://mebley.com/#organization',
      name: 'Mebley',
      url: 'https://mebley.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://mebley.com/icon.svg',
        width: 200,
        height: 200,
      },
      sameAs: [
        'https://twitter.com/mebley',
        'https://instagram.com/mebleyapp',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: 'https://mebley.com/contact',
        availableLanguage: 'English',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://mebley.com/#website',
      url: 'https://mebley.com',
      name: 'Mebley',
      description: 'Voice-first dating app for intentional connections across 40+ countries.',
      publisher: { '@id': 'https://mebley.com/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://mebley.com/browse?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'MobileApplication',
      name: 'Mebley',
      operatingSystem: 'WEB',
      applicationCategory: 'LifestyleApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free to join, premium features available',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '1200',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Voice notes on profiles',
        'Intentional matching by values',
        'Video calls',
        'Global dating across 40+ countries',
        'The Stitch — super-like with a personal note',
        'Here Tonight live presence',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Mebley?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Mebley is a voice-first dating app designed for intentional connections. Members record a 30-second voice note for their profile so you can hear their energy before you meet. Available across 40+ countries.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Mebley free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, Mebley is free to join and use. Premium features like Spotlight boosts, the Stitch super-like, and seeing who liked you are available through credits and subscription plans.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does Mebley matching work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Mebley uses an Intent Score to rank profiles by shared values, relationship goals, interests, and compatibility — not just by who paid to be seen. This gives you a quality-over-quantity feed.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is The Stitch?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The Stitch is Mebley\'s signature super-like feature. When you send a Stitch, you attach a personal note explaining why you think you\'d connect. It rises above ordinary likes and shows real intention.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which countries is Mebley available in?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Mebley is available globally across 40+ countries, with active communities in Nairobi, London, Mumbai, Tokyo, Dubai, Paris, New York, Lagos, and more.',
          },
        },
      ],
    },
  ],
}

export default function LandingPage() {
  return (
    <div className="landing-page overflow-x-hidden" style={{ background: T.bg, color: T.text, fontFamily: "'DM Sans', sans-serif" }}>
      <Script
        id="ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        strategy="afterInteractive"
      />

      {/* ────────── NAV ────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(9,7,26,0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/icon.svg" alt="Mebley" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: '#fff' }}>Mebley</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="hidden md:flex" style={{ gap: 4 }}>
              {[['#features','Features'],['#how','How it works'],['#stories','Stories']].map(([href, label]) => (
                <a key={href} href={href}
                  style={{ padding: '7px 16px', borderRadius: 100, fontSize: 13.5, color: T.muted, textDecoration: 'none', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = T.text; el.style.background = 'rgba(255,255,255,0.07)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = T.muted; el.style.background = 'transparent' }}>
                  {label}
                </a>
              ))}
            </div>
            <a href="/auth" style={{
              padding: '9px 22px', borderRadius: 100, fontSize: 13.5, fontWeight: 600, color: '#fff',
              background: `linear-gradient(135deg, ${T.rose}, ${T.coral})`,
              boxShadow: '0 6px 20px rgba(240,56,104,0.32)',
              textDecoration: 'none', transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
              Get started
            </a>
          </div>
        </div>
      </nav>

      {/* ────────── HERO ────────── */}
      <section className="pt-20 md:pt-24" style={{
        paddingBottom: 0,
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: `
          radial-gradient(ellipse 90% 80% at -10% 0%, rgba(240,56,104,0.22) 0%, transparent 55%),
          radial-gradient(ellipse 70% 70% at 110% -5%, rgba(100,55,210,0.18) 0%, transparent 52%),
          radial-gradient(ellipse 50% 55% at 60% 110%, rgba(160,25,80,0.14) 0%, transparent 52%),
          ${T.bg}
        `,
      }}>
        {/* grid mesh */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.022,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
        }} />

        {/* Large decorative glow behind cards */}
        <div style={{
          position: 'absolute', top: '10%', right: '5%',
          width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(214,77,232,0.1) 0%, rgba(240,56,104,0.06) 40%, transparent 70%)',
          pointerEvents: 'none', filter: 'blur(40px)',
        }} />

        <div className="px-4 sm:px-8 md:px-10 pt-0 md:pt-6" style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', width: '100%' }}>
          <div className="grid md:grid-cols-2 gap-10 md:gap-16" style={{ alignItems: 'center' }}>

            {/* ── Copy ── */}
            <div>
              <Reveal>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '7px 16px', borderRadius: 100,
                  border: `1px solid ${T.roseBorder}`, background: 'rgba(240,56,104,0.09)',
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ff90b4',
                  marginBottom: 28,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.rose, display: 'inline-block', boxShadow: '0 0 6px rgba(240,56,104,0.7)' }} />
                  Intentional dating, reimagined
                </div>
              </Reveal>

              <Reveal delay={0.07}>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 6vw, 4rem)',
                  fontWeight: 800,
                  lineHeight: 1.03,
                  letterSpacing: '-0.03em',
                  color: '#ffffff',
                  margin: '0 0 24px',
                }}>
                  Find your<br />
                  <span style={{
                    background: `linear-gradient(118deg, #ff7dab 0%, ${T.rose} 45%, ${T.coral} 100%)`,
                    WebkitBackgroundClip: 'text', backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent', color: 'transparent',
                  }}>
                    person.
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={0.13}>
                <p style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', color: T.muted, lineHeight: 1.75, maxWidth: 500, margin: '0 0 40px' }}>
                  Thoughtful profiles, voice-first chemistry, and matches ranked by depth — not by who swiped most recently.
                </p>
              </Reveal>

              {/* ── Mobile profile preview ── */}
              <Reveal delay={0.15}>
                <div className="block md:hidden" style={{ marginBottom: 36 }}>
                  <MobileHeroCard />
                </div>
              </Reveal>

              <Reveal delay={0.18}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 36 }}>
                  <a href="/auth" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '15px 36px', borderRadius: 100,
                    background: `linear-gradient(135deg, ${T.rose}, ${T.coral})`,
                    boxShadow: '0 16px 40px rgba(240,56,104,0.38)',
                    fontSize: 15, fontWeight: 700, color: '#fff', textDecoration: 'none',
                    transition: 'opacity 0.15s, transform 0.15s',
                  }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.9'; el.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; el.style.transform = 'translateY(0)' }}>
                    Start free →
                  </a>
                  <a href="#how" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '15px 30px', borderRadius: 100,
                    border: `1px solid rgba(255,255,255,0.14)`, background: 'rgba(255,255,255,0.05)',
                    fontSize: 15, fontWeight: 500, color: T.muted, textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.roseBorder; el.style.color = T.text }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.14)'; el.style.color = T.muted }}>
                    How it works
                  </a>
                </div>
              </Reveal>

              <Reveal delay={0.24}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 48 }}>
                  {[
                    { icon: '✓', text: 'Free to start' },
                    { icon: '🌍', text: '40+ countries' },
                    { icon: '★', text: '4.8 rated' },
                    { icon: '🔒', text: 'Privacy-first' },
                  ].map(({ icon, text }) => (
                    <span key={text} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 100, fontSize: 12.5, fontWeight: 500,
                      border: `1px solid rgba(255,255,255,0.09)`, background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(200,180,215,0.6)',
                    }}>
                      <span style={{ fontSize: 11 }}>{icon}</span>
                      {text}
                    </span>
                  ))}
                </div>
              </Reveal>

              {/* Stats row */}
              <Reveal delay={0.28}>
                <div style={{ display: 'flex', gap: 'clamp(16px, 4vw, 32px)', flexWrap: 'wrap' }}>
                  {STATS.map(s => (
                    <div key={s.l}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.55rem', fontWeight: 800, color: T.rose, lineHeight: 1 }}>{s.v}</div>
                      <div style={{ fontSize: 11, color: T.faint, marginTop: 4, letterSpacing: '0.06em' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* ── Desktop card scene ── */}
            <Reveal delay={0.1} className="hidden md:flex">
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: 540, minHeight: 620 }}>
                  <HeroCardScene />
                </div>
              </div>
            </Reveal>

          </div>
        </div>

        {/* Bottom fade */}
        <div style={{ height: 80, background: `linear-gradient(to bottom, transparent, ${T.bg})`, marginTop: 40 }} />
      </section>

      {/* ────────── FEATURES ────────── */}
      <section id="features" style={{ position: 'relative', overflow: 'hidden', minHeight: 580 }}>
        <img src="/bg-features.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(6,4,18,0.97) 0%, rgba(6,4,18,0.82) 38%, rgba(6,4,18,0.35) 65%, transparent 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '72px 32px', display: 'grid', alignItems: 'center' }} className="md:grid-cols-2">
          <Reveal>
            <Label text="Features" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, color: '#fff', lineHeight: 1.08, margin: '0 0 10px' }}>
              Everything you need to{' '}
              <span style={{ background: `linear-gradient(118deg, #ff7dab, ${T.coral})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>connect.</span>
            </h2>
            <p style={{ fontSize: 14.5, color: 'rgba(200,175,215,0.6)', margin: '0 0 32px', lineHeight: 1.6 }}>Built for depth, not volume.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {FEATURES.map((f) => (
                <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, background: 'rgba(240,56,104,0.15)', border: '1px solid rgba(240,56,104,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: 'rgba(180,150,200,0.58)', lineHeight: 1.55 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ────────── HOW IT WORKS ────────── */}
      <section id="how" style={{ background: T.bgDeep, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Reveal className="mb-12">
            <Label text="How it works" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.7rem, 4vw, 2.8rem)', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.12 }}>
              Three steps to<br className="hidden md:block" /> something real.
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gap: 16 }} className="md:grid-cols-3">
            {HOW.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.08}>
                <div style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 20, padding: '32px 28px', height: '100%', boxSizing: 'border-box',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '3.2rem', fontWeight: 800, lineHeight: 1,
                    background: `linear-gradient(135deg, rgba(240,56,104,0.35), rgba(240,56,104,0.08))`,
                    WebkitBackgroundClip: 'text', backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent', color: 'transparent',
                    marginBottom: 24,
                  }}>
                    {step.n}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>{step.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: T.faint, margin: 0 }}>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── JOURNEY ────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3/2', minHeight: 'clamp(340px, 55vw, 800px)' }}>
        <img src="/journey-bg.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(6,4,18,0.72) 0%, rgba(6,4,18,0.35) 55%, transparent 80%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(6,4,18,0.45) 0%, transparent 30%, transparent 65%, rgba(6,4,18,0.55) 100%)' }} />

        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, padding: 'clamp(20px, 4vw, 40px) clamp(16px, 5vw, 32px)', textAlign: 'center', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: 520 }}>
            <Reveal>
              <Label text="Where stories begin" />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 4vw, 3rem)', fontWeight: 800, color: '#fff', lineHeight: 1.08, margin: '0 0 clamp(10px, 2vw, 14px)', textShadow: '0 2px 24px rgba(0,0,0,0.6)' }}>
                From first date to{' '}
                <span style={{ background: `linear-gradient(118deg, #ff7dab, ${T.coral})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>forever.</span>
              </h2>
              <p style={{ fontSize: 'clamp(13px, 1.8vw, 15px)', color: 'rgba(230,210,240,0.75)', lineHeight: 1.7, maxWidth: '100%', margin: '0 auto clamp(18px, 3vw, 28px)', textShadow: '0 1px 12px rgba(0,0,0,0.5)' }}>
                Every great love story starts with one intentional decision. Mebley is where that decision gets made — thoughtfully, beautifully, for keeps.
              </p>
              <div style={{ display: 'flex', gap: 'clamp(14px, 3.5vw, 32px)', flexWrap: 'wrap', marginBottom: 'clamp(18px, 3vw, 32px)', justifyContent: 'center' }}>
                {[['500+', 'Couples matched'], ['78%', 'Reply rate'], ['40+', 'Countries']].map(([v, l]) => (
                  <div key={l}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', fontWeight: 800, color: T.rose, lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>{v}</div>
                    <div style={{ fontSize: 'clamp(9px, 1.1vw, 11px)', color: 'rgba(200,170,220,0.6)', marginTop: 3, letterSpacing: '0.06em' }}>{l}</div>
                  </div>
                ))}
              </div>
              <a href="/auth" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: 'clamp(10px, 1.5vw, 13px) clamp(22px, 3vw, 32px)', borderRadius: 100, fontSize: 'clamp(13px, 1.5vw, 14px)', fontWeight: 700, color: '#fff',
                background: `linear-gradient(135deg, ${T.rose}, ${T.coral})`,
                boxShadow: '0 12px 36px rgba(240,56,104,0.45)',
                textDecoration: 'none', transition: 'opacity 0.15s, transform 0.15s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.9'; el.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; el.style.transform = 'translateY(0)' }}>
                Start your story →
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ────────── WHY MEBLEY ────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 520 }}>
        <img src="/bg-why.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(6,4,18,0.97) 0%, rgba(6,4,18,0.82) 38%, rgba(6,4,18,0.35) 65%, transparent 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '72px 32px', display: 'grid', alignItems: 'center' }} className="md:grid-cols-2">
          <Reveal>
            <Label text="Why Mebley" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, color: '#fff', lineHeight: 1.08, margin: '0 0 16px' }}>
              Real love starts with{' '}
              <span style={{ background: `linear-gradient(118deg, #ff7dab, ${T.coral})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>real intent.</span>
            </h2>
            <p style={{ fontSize: 14.5, color: 'rgba(200,175,215,0.6)', lineHeight: 1.7, maxWidth: 400, margin: '0 0 32px' }}>
              Mebley is built for people who are done with games — and ready for something genuine.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {VALUES.map((v) => (
                <div key={v.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, background: 'rgba(240,56,104,0.15)', border: '1px solid rgba(240,56,104,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{v.icon}</div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{v.title}</div>
                    <div style={{ fontSize: 13, color: 'rgba(180,150,200,0.58)', lineHeight: 1.55 }}>{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ────────── TESTIMONIALS ────────── */}
      <section id="stories" style={{ background: T.bgDeep, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Reveal className="mb-12 text-center">
            <Label text="Real stories" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.7rem, 4vw, 2.8rem)', fontWeight: 800, color: '#fff', margin: '0 0 10px', lineHeight: 1.12 }}>
              Stories stitched with{' '}
              <span style={{
                background: `linear-gradient(118deg, #ff7dab, ${T.coral})`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: 'transparent', color: 'transparent',
              }}>
                intention.
              </span>
            </h2>
            <p style={{ fontSize: 15, color: T.muted, maxWidth: 480, margin: '0 auto' }}>
              Real people. Real chemistry. Conversations that went somewhere.
            </p>
          </Reveal>

          <div style={{ display: 'grid', gap: 16 }} className="md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.07}>
                <div style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 20, padding: '28px 26px',
                  display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box',
                }}>
                  {/* Stars */}
                  <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                    {[0,1,2,3,4].map(n => (
                      <span key={n} style={{ color: '#f59e0b', fontSize: 14 }}>★</span>
                    ))}
                  </div>
                  <p style={{ flex: 1, fontSize: 14.5, lineHeight: 1.75, color: T.text, margin: '0 0 24px', fontStyle: 'italic' }}>
                    "{t.q}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 18 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${T.rose}, ${T.coral})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 700, color: '#fff',
                    }}>{t.name[0]}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>{t.name} · {t.city}</div>
                      <div style={{ fontSize: 11.5, color: T.rose, fontWeight: 500, marginTop: 1 }}>{t.tag}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── CTA ────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Full-bleed photo */}
        <img
          src="/couple-5.jpg"
          alt="Couple"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
        {/* Multi-layer overlay for readability */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(9,7,26,0.55) 0%, rgba(9,7,26,0.72) 60%, rgba(9,7,26,0.92) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(240,56,104,0.12) 0%, transparent 70%)' }} />

        {/* Content */}
        <Reveal>
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '72px 24px', maxWidth: 680, margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 100, marginBottom: 22,
              border: '1px solid rgba(240,56,104,0.3)', background: 'rgba(240,56,104,0.1)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ff90b4',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.rose, display: 'inline-block' }} />
              Join thousands worldwide
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 3.4rem)', fontWeight: 800, color: '#fff',
              margin: '0 0 18px', lineHeight: 1.08,
              textShadow: '0 2px 32px rgba(0,0,0,0.5)',
            }}>
              Your person is already here.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(240,225,245,0.72)', maxWidth: 400, margin: '0 auto 40px', lineHeight: 1.75 }}>
              Join thousands building something real — one intentional connection at a time.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/auth" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '15px 42px', borderRadius: 100, fontSize: 15, fontWeight: 700, color: '#fff',
                background: `linear-gradient(135deg, ${T.rose}, ${T.coral})`,
                boxShadow: '0 16px 48px rgba(240,56,104,0.45)',
                textDecoration: 'none', transition: 'opacity 0.15s, transform 0.15s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.9'; el.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; el.style.transform = 'translateY(0)' }}>
                Create your profile →
              </a>
              <a href="#how" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '15px 30px', borderRadius: 100, fontSize: 15, fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.75)', textDecoration: 'none', backdropFilter: 'blur(10px)',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.roseBorder; el.style.color = '#fff' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.2)'; el.style.color = 'rgba(255,255,255,0.75)' }}>
                See how it works
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ────────── FOOTER ────────── */}
      <footer style={{ background: T.bgDeep, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '56px 24px 28px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 40, paddingBottom: 40 }}>
            <div>
              <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 12 }}>
                <img src="/icon.svg" alt="Mebley" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#fff' }}>Mebley</span>
              </a>
              <p style={{ fontSize: 13.5, color: T.faint, maxWidth: 200, lineHeight: 1.65 }}>
                Dating built for people who want something real.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
              {FOOTER_LINKS.map(({ head, links }) => (
                <div key={head}>
                  <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.faint, margin: '0 0 16px' }}>{head}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {links.map(([href, label]) => (
                      <a key={href} href={href} style={{ fontSize: 13.5, color: 'rgba(180,140,170,0.4)', textDecoration: 'none', transition: 'color 0.15s' }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.color = 'rgba(180,140,170,0.75)' }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(180,140,170,0.4)' }}>
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'space-between', gap: 14,
            borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20,
          }}>
            <p style={{ fontSize: 12, color: 'rgba(200,170,190,0.65)' }}>© 2025 Mebley Inc. All rights reserved.</p>

<div style={{ display: 'flex', gap: 8 }}>
              {['𝕏','IG','TT'].map(s => (
                <a key={s} href="#" style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.2)', fontSize: 11, color: 'rgba(200,170,190,0.65)', textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.roseBorder; el.style.color = T.text }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.2)'; el.style.color = 'rgba(200,170,190,0.65)' }}>
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ── Shared photo tile ─────────────────────────────────────────────── */
function PhotoTile({
  src, position, size, rotate, floatY, floatDuration, floatDelay, entranceDelay, objectPosition = 'top', zIndex = 1, children,
}: {
  src: string; position: React.CSSProperties; size: { w: number | string; h: number | string };
  rotate: number; floatY: [number, number]; floatDuration: number; floatDelay: number;
  entranceDelay: number; objectPosition?: string; zIndex?: number; children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.75, delay: entranceDelay, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'absolute', zIndex, transform: `rotate(${rotate}deg)`, ...position }}
    >
      <motion.div
        animate={{ y: floatY }}
        transition={{ duration: floatDuration, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: floatDelay }}
        style={{
          width: size.w, height: size.h, borderRadius: 22, overflow: 'hidden',
          boxShadow: '0 28px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.1)',
          position: 'relative',
        }}
      >
        <img src={src} alt="Couple" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,7,26,0.45) 0%, transparent 52%)' }} />
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ── Mobile hero photo collage ─────────────────────────────────────── */
function MobileHeroCard() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 340, height: 310, margin: '0 auto' }}>

      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,56,104,0.22) 0%, transparent 70%)', filter: 'blur(36px)', pointerEvents: 'none' }} />

      {/* Main photo — large, slight left tilt */}
      <PhotoTile src="/couple-2.jpg" position={{ top: 0, left: 0 }} size={{ w: 195, h: 260 }}
        rotate={-4} floatY={[-7, 5]} floatDuration={3.6} floatDelay={0}
        entranceDelay={0.15} objectPosition="top" zIndex={2} />

      {/* Accent photo — right, counter-tilt */}
      <PhotoTile src="/couple-4.jpg" position={{ top: 30, right: 0 }} size={{ w: 155, h: 200 }}
        rotate={5} floatY={[6, -7]} floatDuration={4.0} floatDelay={0.5}
        entranceDelay={0.3} objectPosition="top" zIndex={3} />

      {/* Third photo — bottom center, peeking out */}
      <PhotoTile src="/couple-1.jpg" position={{ bottom: 0, left: '50%' }} size={{ w: 150, h: 130 }}
        rotate={-2} floatY={[-5, 6]} floatDuration={3.8} floatDelay={0.9}
        entranceDelay={0.45} objectPosition="top" zIndex={1} />

      {/* Match badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, duration: 0.5, ease: [0.16,1,0.3,1] }}
        style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
          padding: '6px 13px', borderRadius: 100, whiteSpace: 'nowrap',
          background: 'rgba(9,7,26,0.88)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(240,56,104,0.38)',
          fontSize: 11, fontWeight: 700, color: '#ff90b4',
          display: 'flex', alignItems: 'center', gap: 5,
          boxShadow: '0 6px 20px rgba(240,56,104,0.2)',
        }}
      >
        ⚡ 94% match
      </motion.div>

      {/* Match toast */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.5, ease: [0.16,1,0.3,1] }}
        style={{
          position: 'absolute', bottom: 8, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '8px 12px', borderRadius: 13, whiteSpace: 'nowrap',
          background: 'rgba(9,7,26,0.92)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(240,56,104,0.25)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #f03868, #ff7a50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🎉</div>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', lineHeight: 1 }}>It's a match!</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Amara liked you back</div>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Hero photo collage (desktop) ──────────────────────────────────── */
function HeroCardScene() {
  return (
    <div style={{ position: 'relative', width: 540, height: 630 }}>

      {/* Ambient rose glow */}
      <div style={{ position: 'absolute', top: '42%', left: '48%', transform: 'translate(-50%,-50%)', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,56,104,0.17) 0%, transparent 68%)', filter: 'blur(52px)', pointerEvents: 'none', zIndex: 0 }} />
      {/* Purple accent glow */}
      <div style={{ position: 'absolute', top: '15%', right: '10%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,60,220,0.14) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Photo 1: top-right landscape — African savanna sunset ── */}
      <PhotoTile src="/couple-2.jpg" position={{ top: 0, right: 0 }} size={{ w: 295, h: 218 }}
        rotate={4} floatY={[-8, 5]} floatDuration={3.4} floatDelay={0}
        entranceDelay={0.15} objectPosition="top" zIndex={2}>
        <div style={{
          position: 'absolute', top: 13, left: 13,
          padding: '5px 12px', borderRadius: 100,
          background: 'rgba(9,7,26,0.75)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(240,56,104,0.4)',
          fontSize: 11, fontWeight: 700, color: '#ff90b4',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>⚡ 94% match</div>
      </PhotoTile>

      {/* ── Photo 2: center-left portrait — NYC couple ── */}
      <PhotoTile src="/couple-4.jpg" position={{ top: 110, left: 0 }} size={{ w: 216, h: 300 }}
        rotate={-7} floatY={[7, -9]} floatDuration={4.0} floatDelay={0.45}
        entranceDelay={0.28} objectPosition="top" zIndex={3} />

      {/* ── Photo 3: center-right square — indoor warm couple ── */}
      <PhotoTile src="/couple-3.jpg" position={{ top: 240, right: 22 }} size={{ w: 214, h: 214 }}
        rotate={6} floatY={[-6, 7]} floatDuration={3.7} floatDelay={0.9}
        entranceDelay={0.42} objectPosition="center" zIndex={2} />

      {/* ── Photo 4: bottom-left landscape — Indian sunset couple ── */}
      <PhotoTile src="/couple-1.jpg" position={{ bottom: 0, left: 58 }} size={{ w: 286, h: 208 }}
        rotate={-3} floatY={[5, -7]} floatDuration={4.2} floatDelay={1.2}
        entranceDelay={0.55} objectPosition="top" zIndex={4} />

      {/* ── Floating "It's a match" toast ── */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.88 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.3, duration: 0.6, ease: [0.16,1,0.3,1] }}
        style={{
          position: 'absolute', bottom: 22, right: 14, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 16, whiteSpace: 'nowrap',
          background: 'rgba(9,7,26,0.94)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(240,56,104,0.3)',
          boxShadow: '0 20px 52px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f03868, #ff7a50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎉</div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', lineHeight: 1 }}>It's a match!</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', marginTop: 3 }}>Amara liked you back</div>
        </div>
      </motion.div>

      {/* ── Floating "Stitch sent" badge ── */}
      <motion.div
        initial={{ opacity: 0, x: -16, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 1.7, duration: 0.55, ease: [0.16,1,0.3,1] }}
        style={{
          position: 'absolute', top: 14, left: 60, zIndex: 10,
          padding: '8px 15px', borderRadius: 12, whiteSpace: 'nowrap',
          background: 'rgba(100,55,210,0.88)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(150,100,255,0.45)',
          fontSize: 11.5, fontWeight: 700, color: '#e9d5ff',
          boxShadow: '0 10px 28px rgba(100,55,210,0.5)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        🧵 Stitch sent
      </motion.div>
    </div>
  )
}
