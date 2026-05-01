'use client'

import { motion } from 'framer-motion'

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

/* ── Hero profile card preview ─────────────────────────────────────── */
const HERO_CARD = {
  name: 'Amara', age: 27, loc: 'Nairobi · Kenya',
  match: '94%',
  tags: ['Art', 'Travel', 'Books'],
  prompt: 'Her green flag',
  ans: 'Someone who reads for fun ✨',
  grad: 'linear-gradient(160deg, #c8446e 0%, #7c2050 50%, #3d0c30 100%)',
}

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
export default function LandingPage() {
  return (
    <div className="landing-page overflow-x-hidden" style={{ background: T.bg, color: T.text, fontFamily: "'DM Sans', sans-serif" }}>

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
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#ff6b96' }}>Mebley</span>
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
        paddingTop: 96,
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

        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '60px 40px 0', position: 'relative', width: '100%' }}>
          <div className="grid md:grid-cols-2" style={{ gap: 64, alignItems: 'center' }}>

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
                  fontSize: 'clamp(2.4rem, 3.8vw, 4rem)',
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
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
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
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: 620 }}>
                <HeroCardScene />
              </div>
            </Reveal>

          </div>
        </div>

        {/* Bottom fade */}
        <div style={{ height: 80, background: `linear-gradient(to bottom, transparent, ${T.bg})`, marginTop: 40 }} />
      </section>


      {/* ────────── FEATURES ────────── */}
      <section id="features" style={{ background: T.bg, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Reveal className="mb-12">
            <Label text="Features" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.7rem, 4vw, 2.8rem)', fontWeight: 800, color: '#fff', margin: '0 0 10px', lineHeight: 1.12 }}>
              Everything you need<br className="hidden md:block" /> to connect.
            </h2>
            <p style={{ fontSize: 15, color: T.muted }}>Built for depth, not volume.</p>
          </Reveal>

          <div style={{ display: 'grid', gap: 14 }} className="sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.05}>
                <GCard className="h-full" >
                  <div style={{ padding: '24px 22px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: 'rgba(240,56,104,0.12)',
                      border: '1px solid rgba(240,56,104,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, marginBottom: 16,
                    }}>
                      {f.icon}
                    </div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.rose, marginBottom: 4 }}>{f.sub}</div>
                    <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{f.title}</h3>
                    <p style={{ fontSize: 13.5, lineHeight: 1.65, color: T.faint, margin: 0 }}>{f.desc}</p>
                  </div>
                </GCard>
              </Reveal>
            ))}
          </div>
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
      <section style={{ background: T.bgMid, padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240,56,104,0.09) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'grid', gap: 48, alignItems: 'center' }} className="md:grid-cols-2">
            <Reveal>
              <Label text="Why Mebley" />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.7rem, 4vw, 2.8rem)', fontWeight: 800, color: '#fff', lineHeight: 1.12, margin: '0 0 18px' }}>
                Real love starts with{' '}
                <span style={{
                  background: `linear-gradient(118deg, #ff7dab, ${T.coral})`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent', color: 'transparent',
                }}>
                  real intent.
                </span>
              </h2>
              <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.7, maxWidth: 420, margin: 0 }}>
                Mebley is built for people who are done with games — and ready for something genuine.
              </p>
            </Reveal>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {VALUES.map((v, i) => (
                <Reveal key={v.title} delay={i * 0.07}>
                  <div style={{
                    display: 'flex', gap: 16, alignItems: 'flex-start',
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 16, padding: '18px 20px',
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                      background: 'rgba(240,56,104,0.12)', border: '1px solid rgba(240,56,104,0.16)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>{v.icon}</div>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{v.title}</div>
                      <div style={{ fontSize: 13.5, color: T.faint, lineHeight: 1.6 }}>{v.desc}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
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
      <section style={{ background: T.bg, padding: '72px 24px' }}>
        <Reveal>
          <div style={{
            maxWidth: 860, margin: '0 auto', position: 'relative', overflow: 'hidden',
            borderRadius: 28, padding: '64px 32px', textAlign: 'center',
            background: `linear-gradient(145deg, rgba(240,56,104,0.15) 0%, rgba(90,35,170,0.12) 50%, rgba(240,56,104,0.08) 100%), ${T.bgDeep}`,
            border: `1px solid rgba(240,56,104,0.18)`,
            boxShadow: '0 40px 90px rgba(240,56,104,0.12)',
          }}>
            {/* glows */}
            <div style={{ position: 'absolute', top: -80, left: -80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,56,104,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,60,200,0.16) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 100,
                border: '1px solid rgba(240,56,104,0.22)', background: 'rgba(240,56,104,0.08)',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ff90b4',
                marginBottom: 20,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.rose, display: 'inline-block' }} />
                Join thousands worldwide
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 800, color: '#fff',
                margin: '0 0 16px', lineHeight: 1.1,
              }}>
                Your person is already here.
              </h2>
              <p style={{ fontSize: 15, color: T.muted, maxWidth: 380, margin: '0 auto 36px', lineHeight: 1.7 }}>
                Join thousands building something real. Start free today.
              </p>
              <a href="/auth" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 40px', borderRadius: 100, fontSize: 15, fontWeight: 700, color: '#fff',
                background: `linear-gradient(135deg, ${T.rose}, ${T.coral})`,
                boxShadow: '0 16px 44px rgba(240,56,104,0.4)',
                textDecoration: 'none', transition: 'opacity 0.15s, transform 0.15s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.9'; el.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; el.style.transform = 'translateY(0)' }}>
                Create your profile →
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
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#ff6b96' }}>Mebley</span>
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

            {/* Powered by — center */}
            <a
              href="https://www.blackie-networks.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12, color: 'rgba(200,170,190,0.6)',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
                transition: 'color 0.15s',
                letterSpacing: '0.03em',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(240,180,210,0.9)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(200,170,190,0.6)' }}
            >
              Powered by
              <span style={{ fontWeight: 700, color: 'rgba(230,180,210,0.8)' }}>Blackie Networks</span>
              <span>🩷</span>
            </a>

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

/* ── Mobile hero card ──────────────────────────────────────────────── */
function MobileHeroCard() {
  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)',
      maxWidth: 320, margin: '0 auto',
    }}>
      <div style={{ height: 180, background: HERO_CARD.grad, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '5rem', fontWeight: 800, color: 'rgba(255,255,255,0.1)', lineHeight: 1 }}>{HERO_CARD.name[0]}</span>
        <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', fontSize: 11, fontWeight: 700, color: '#fff' }}>
          {HERO_CARD.match} match
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,6,24,0.9) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: 12, left: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{HERO_CARD.name}, {HERO_CARD.age}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{HERO_CARD.loc}</div>
        </div>
      </div>
      <div style={{ background: '#110420', padding: '14px 16px 16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 12px', marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,130,170,0.9)', marginBottom: 3 }}>{HERO_CARD.prompt}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{HERO_CARD.ans}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {HERO_CARD.tags.map(t => (
            <span key={t} style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)' }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, height: 38, borderRadius: 100, border: '1px solid rgba(255,255,255,0.13)', background: 'transparent', color: 'rgba(255,255,255,0.3)', fontSize: 16, cursor: 'pointer' }}>✕</button>
          <button style={{ flex: 1, height: 38, borderRadius: 100, border: 'none', background: 'linear-gradient(135deg, #f03868, #ff7a50)', color: '#fff', fontSize: 16, cursor: 'pointer', fontWeight: 700 }}>♡</button>
        </div>
      </div>
    </div>
  )
}

/* ── Hero card scene (desktop) ─────────────────────────────────────── */
const HERO_CARDS = [
  { name: 'Amara',  age: 27, loc: 'Nairobi · Kenya',  match: '94%', grad: 'linear-gradient(160deg, #c8446e 0%, #7c2050 50%, #3d0c30 100%)', prompt: 'Her green flag',   ans: 'Someone who reads for fun ✨',       tags: ['Art', 'Travel', 'Books'] },
  { name: 'Jin',    age: 29, loc: 'Seoul · Korea',     match: '91%', grad: 'linear-gradient(160deg, #6a4ec4 0%, #4830a0 50%, #261668 100%)', prompt: 'Ideal first date', ans: "Farmer's market then jazz 🎷",      tags: ['Jazz', 'Cooking'] },
  { name: 'Priya',  age: 25, loc: 'Mumbai · India',    match: '89%', grad: 'linear-gradient(160deg, #c44858 0%, #962840 50%, #5e1228 100%)', prompt: 'Ideal Sunday',     ans: 'Rooftop dinner & stargazing 🌙',    tags: ['Yoga', 'Podcasts'] },
]

function HeroCard({ p, style = {} }: { p: typeof HERO_CARDS[0]; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: 300, borderRadius: 26, overflow: 'hidden',
      boxShadow: '0 40px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.1)',
      ...style,
    }}>
      {/* Photo area */}
      <div style={{ height: 260, background: p.grad, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '8rem', fontWeight: 800, color: 'rgba(255,255,255,0.08)', lineHeight: 1, userSelect: 'none' }}>{p.name[0]}</span>
        {/* Match badge */}
        <div style={{ position: 'absolute', top: 14, left: 14, padding: '5px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', fontSize: 11.5, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
          ⚡ {p.match} match
        </div>
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,4,22,0.95) 0%, rgba(8,4,22,0.2) 55%, transparent 100%)' }} />
        {/* Name / loc */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>{p.name}, {p.age}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>📍 {p.loc}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: 'rgba(12,6,28,0.98)', padding: '16px 18px 18px', backdropFilter: 'blur(20px)' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '11px 13px', marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,130,170,0.85)', marginBottom: 4 }}>{p.prompt}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>{p.ans}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {p.tags.map(t => <span key={t} style={{ padding: '4px 11px', borderRadius: 100, fontSize: 11, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.48)', background: 'rgba(255,255,255,0.05)' }}>{t}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, height: 42, borderRadius: 100, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.3)', fontSize: 17, cursor: 'pointer' }}>✕</button>
          <button style={{ flex: 2, height: 42, borderRadius: 100, border: 'none', background: 'linear-gradient(135deg, #f03868, #ff7a50)', color: '#fff', fontSize: 17, cursor: 'pointer', fontWeight: 700, boxShadow: '0 8px 24px rgba(240,56,104,0.38)' }}>♡ Like</button>
        </div>
      </div>
    </div>
  )
}

function HeroCardScene() {
  return (
    <div style={{ position: 'relative', width: 520, height: 620 }}>
      {/* Back card — right */}
      <div style={{ position: 'absolute', top: 60, right: -10, zIndex: 1, opacity: 0.45, transform: 'rotate(8deg) scale(0.88)', transformOrigin: 'bottom center' }}>
        <HeroCard p={HERO_CARDS[2]} />
      </div>
      {/* Middle card — left */}
      <div style={{ position: 'absolute', top: 36, left: -10, zIndex: 2, opacity: 0.7, transform: 'rotate(-6deg) scale(0.92)', transformOrigin: 'bottom center' }}>
        <HeroCard p={HERO_CARDS[1]} />
      </div>
      {/* Front card — center */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
        <HeroCard p={HERO_CARDS[0]} />
      </div>

      {/* Floating "Match" toast */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.1, duration: 0.55, ease: [0.16,1,0.3,1] }}
        style={{
          position: 'absolute', bottom: 24, right: 20, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px', borderRadius: 16,
          background: 'rgba(14,10,32,0.95)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(240,56,104,0.3)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f03868, #ff7a50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎉</div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', lineHeight: 1 }}>It's a match!</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>Amara liked you back</div>
        </div>
      </motion.div>

      {/* Floating "Stitch" badge */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.5, ease: [0.16,1,0.3,1] }}
        style={{
          position: 'absolute', top: 10, left: 10, zIndex: 10,
          padding: '8px 14px', borderRadius: 12,
          background: 'rgba(100,55,210,0.85)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(140,90,250,0.4)',
          fontSize: 11.5, fontWeight: 700, color: '#e9d5ff',
          boxShadow: '0 8px 24px rgba(100,55,210,0.4)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        🧵 Stitch sent
      </motion.div>
    </div>
  )
}
