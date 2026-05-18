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
      <section style={{
        position: 'relative', overflow: 'hidden',
        minHeight: '100vh', background: '#000',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Background photo */}
        <img src="/hero-bg.png" alt=""
          className="object-[75%_top] md:object-[center_top]"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
          }} />
        {/* Gradient — lighter so photo bleeds through behind text */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.68) 18%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.16) 55%, transparent 72%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, transparent 16%, transparent 78%, rgba(0,0,0,0.28) 100%)',
        }} />

        {/* ── Max-width wrapper — centres all hero content like other sections ── */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 1280, margin: '0 auto',
          flex: 1, display: 'flex',
        }}>

        {/* ── Notification cards — grouped together, right side, vertically centred ── */}
        <div className="hidden md:flex" style={{
          position: 'absolute', top: '50%', right: 32,
          transform: 'translateY(-50%)', zIndex: 3,
          flexDirection: 'column', gap: 12, width: 260,
        }}>
          <motion.div initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.7, ease: [0.16,1,0.3,1] }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 18,
              background: 'rgba(8,4,18,0.92)', backdropFilter: 'blur(22px)',
              border: `1px solid rgba(240,56,104,0.3)`, boxShadow: '0 10px 36px rgba(0,0,0,0.65)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                {[4,10,15,7,13,5,11,8,14,6,10,4].map((h, i) => (
                  <div key={i} style={{ width: 2.5, height: h, background: T.rose, borderRadius: 2, opacity: 0.9 }} />
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Voice note</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>0:28</div>
              </div>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                border: `1.5px solid rgba(240,56,104,0.55)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.rose, fontSize: 10,
              }}>▶</div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.7, ease: [0.16,1,0.3,1] }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 18,
              background: 'rgba(8,4,18,0.92)', backdropFilter: 'blur(22px)',
              border: `1px solid rgba(240,56,104,0.3)`, boxShadow: '0 10px 36px rgba(0,0,0,0.65)',
            }}>
              <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>🧵</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 4 }}>Stitch sent</div>
                <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.45 }}>Can't wait to hear your thoughts!</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.7, ease: [0.16,1,0.3,1] }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 18,
              background: 'rgba(8,4,18,0.92)', backdropFilter: 'blur(22px)',
              border: `1px solid rgba(240,56,104,0.3)`, boxShadow: '0 10px 36px rgba(0,0,0,0.65)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${T.rose}, ${T.coral})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>♥</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 4 }}>It's a match! 🎉</div>
                <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.45 }}>You and Alex liked each other</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Left content column (logo → copy → stats) ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          maxWidth: 640,
          paddingLeft: 'clamp(24px, 3vw, 48px)',
          paddingRight: 'clamp(16px, 3vw, 40px)',
        }}>

          {/* Logo */}
          <div style={{ paddingTop: 26 }}>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <img src="/icon.svg" alt="Mebley" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff' }}>Mebley</span>
            </a>
          </div>

          {/* Centre copy */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 20, paddingBottom: 20 }}>
            <Reveal>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '7px 16px', borderRadius: 100, marginBottom: 22,
                border: `1px solid ${T.roseBorder}`, background: 'rgba(240,56,104,0.1)',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ff90b4',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.rose, display: 'inline-block', boxShadow: '0 0 6px rgba(240,56,104,0.7)' }} />
                Intentional dating, reimagined
              </div>
            </Reveal>

            <Reveal delay={0.07}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.8rem, 5.5vw, 5rem)',
                fontWeight: 800, lineHeight: 1.0,
                letterSpacing: '-0.02em', color: '#fff',
                margin: '0 0 20px',
              }}>
                Find your<br />
                <span style={{
                  background: `linear-gradient(118deg, #ff7dab 0%, ${T.rose} 45%, ${T.coral} 100%)`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent', color: 'transparent',
                }}>person.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p style={{ fontSize: 'clamp(14px,1.4vw,16px)', color: 'rgba(200,185,215,0.75)', lineHeight: 1.75, margin: '0 0 28px', maxWidth: 400 }}>
                Thoughtful profiles, voice-first chemistry, and matches ranked by depth — not by who swiped most recently.
              </p>
            </Reveal>

            <Reveal delay={0.17}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
                <a href="/auth" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 30px', borderRadius: 100,
                  background: `linear-gradient(135deg, ${T.rose}, ${T.coral})`,
                  boxShadow: '0 12px 32px rgba(240,56,104,0.42)',
                  fontSize: 15, fontWeight: 700, color: '#fff', textDecoration: 'none',
                  transition: 'opacity 0.15s, transform 0.15s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.9'; el.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; el.style.transform = 'translateY(0)' }}>
                  Start free →
                </a>
                <a href="#how" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 26px', borderRadius: 100,
                  border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.06)',
                  fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.82)', textDecoration: 'none',
                  backdropFilter: 'blur(10px)', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.roseBorder; el.style.color = '#fff' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.22)'; el.style.color = 'rgba(255,255,255,0.82)' }}>
                  How it works
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.21}>
              <div style={{ display: 'flex', gap: 'clamp(14px,2.5vw,28px)', flexWrap: 'wrap' }}>
                {[
                  { icon: '🛡️', text: 'Privacy-first' },
                  { icon: '🌍', text: '40+ countries' },
                  { icon: '⭐', text: '4.8 rated' },
                  { icon: '🔒', text: 'Safe & secure' },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(200,180,215,0.65)' }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>{text}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Stats pinned to bottom */}
          <Reveal delay={0.26}>
            <div style={{ display: 'flex', paddingBottom: 44 }}>
              {STATS.map((s, i) => (
                <div key={s.l} style={{
                  paddingRight: i < STATS.length - 1 ? 'clamp(14px,2.5vw,32px)' : 0,
                  borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  marginRight: i < STATS.length - 1 ? 'clamp(14px,2.5vw,32px)' : 0,
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 800, color: T.rose, lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 'clamp(10px,1.1vw,12px)', color: 'rgba(180,155,200,0.5)', marginTop: 5, letterSpacing: '0.04em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
        </div>{/* end max-width wrapper */}
      </section>

      {/* ────────── FEATURES ────────── */}
      <section id="features" style={{ position: 'relative', overflow: 'hidden', minHeight: 580 }}>
        <img src="/bg-features.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(6,4,18,0.78) 0%, rgba(6,4,18,0.55) 35%, rgba(6,4,18,0.18) 60%, transparent 80%)' }} />
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
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Full-bleed photo */}
        <img
          src="/couple-5.jpg"
          alt="Couple"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
        {/* Multi-layer overlay for readability */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(9,7,26,0.18) 0%, rgba(9,7,26,0.38) 55%, rgba(9,7,26,0.72) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(9,7,26,0.52) 0%, transparent 100%)' }} />

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

