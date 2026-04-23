'use client'

import { motion } from 'framer-motion'

/* ── Hero profile card data ─────────────────────────────────────── */
const HERO_CARDS = [
  {
    name: 'Amara', age: 27, loc: 'Nairobi · Kenya',
    tags: ['Art lover', 'Traveller', 'Bookworm'],
    match: '94%',
    grad: 'linear-gradient(150deg, #bf4578 0%, #8b2556 55%, #4a0e38 100%)',
    prompt: 'Her green flag', ans: 'Someone who reads for fun ✨',
  },
  {
    name: 'Jin', age: 29, loc: 'Seoul · Korea',
    tags: ['Jazz', 'Cooking', 'Hiking'],
    match: '91%',
    grad: 'linear-gradient(150deg, #6a4ec4 0%, #4830a0 55%, #261668 100%)',
    prompt: 'Ideal first date', ans: "Farmer's market then jazz 🎷",
  },
  {
    name: 'Priya', age: 25, loc: 'Mumbai · India',
    tags: ['Yoga', 'Podcasts', 'Brunch'],
    match: '89%',
    grad: 'linear-gradient(150deg, #c44858 0%, #962840 55%, #5e1228 100%)',
    prompt: 'Ideal Sunday', ans: 'Rooftop dinner & stargazing 🌙',
  },
]

const STATS = [
  { v: '40+',  l: 'Countries'    },
  { v: '12k+', l: 'Active users' },
  { v: '4.8★', l: 'App rating'  },
  { v: '78%',  l: 'Reply rate'  },
]

const FEATURES = [
  { icon: '🧵', title: 'The Stitch',    sub: 'Super-like with intention',  desc: 'Send a Stitch with a personal note and jump to the top of their stack.' },
  { icon: '🎙️', title: 'Voice Notes',   sub: 'Hear before you match',       desc: 'Record 30 seconds on your profile. Your laugh and energy speak first.' },
  { icon: '✨', title: 'Spotlight',     sub: 'Be impossible to miss',        desc: 'A glowing ring on your card for 24 hours. Because timing is everything.' },
  { icon: '🌙', title: 'Here Tonight',  sub: 'Live presence. Real sparks.',  desc: "Activate when you're out and surface to people looking to connect now." },
  { icon: '🌍', title: 'Global Match',  sub: 'No borders',                   desc: 'Discover across 40+ countries — Nairobi, Tokyo, London, Mumbai.' },
  { icon: '🎯', title: 'Intent Score',  sub: 'Quality over quantity',         desc: 'Your feed ranks by compatibility and shared values, not who paid to boost.' },
]

const HOW = [
  { n: '01', title: 'Build your story',      desc: 'Add photos, voice notes, and prompts that reveal the real you — not just the highlight reel.' },
  { n: '02', title: 'Stitch with intention', desc: 'Send a thoughtful like with a personal note that rises above the noise.' },
  { n: '03', title: 'Connect for real',      desc: "When it's mutual, start a conversation that actually goes somewhere." },
]

const TESTIMONIALS = [
  { text: "I sent a Stitch and she replied within minutes. We met for coffee two days later. The intentionality is real.", name: 'Amara K.', age: 27, city: 'Nairobi', match: 'Matched with Jin, Seoul' },
  { text: "Hearing someone's laugh before a first date changes everything. No other app feels like this.", name: 'Priya S.', age: 25, city: 'Mumbai', match: 'Matched with Kwame, London' },
  { text: "The Golden Thread made me stop scrolling. His profile stood out in a way I couldn't explain.", name: 'Zainab A.', age: 25, city: 'Dubai', match: 'Matched with Remi, Paris' },
]

const VALUES = [
  { icon: '💎', title: 'Depth over swipes',  desc: 'Designed for better conversations, not endless scrolling.' },
  { icon: '🌐', title: 'Globally inclusive', desc: 'Connect across cultures with fair, values-based matching.' },
  { icon: '🔒', title: 'Safe by design',     desc: 'Verification, reporting, and moderation built in from day one.' },
]

/* ── Design tokens ──────────────────────────────────────────────── */
const T = {
  bg:        '#0c0a1e',           // midnight indigo base
  bgDeep:    '#080615',           // deeper sections
  text:      '#f0e8f4',           // primary text
  muted:     '#9080a0',           // muted text
  faint:     '#5a4868',           // very muted
  rose:      '#f03868',           // primary accent
  coral:     '#ff7a50',           // secondary accent
  card:      'rgba(255,255,255,0.055)',
  cardBorder:'rgba(255,255,255,0.09)',
  roseGlow:  'rgba(240,56,104,0.18)',
  roseBorder:'rgba(240,56,104,0.25)',
} as const

/* ── Reveal ─────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, margin: '-50px' }}>
      {children}
    </motion.div>
  )
}

/* ── Section pill ───────────────────────────────────────────────── */
function Pill({ label }: { label: string }) {
  return (
    <div className="mb-5 inline-block rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
      style={{ background: 'rgba(240,56,104,0.14)', color: '#ff80a8', border: `1px solid ${T.roseBorder}` }}>
      {label}
    </div>
  )
}

/* ── Profile card ───────────────────────────────────────────────── */
function ProfileCard({ p, style = {} }: { p: typeof HERO_CARDS[0]; style?: React.CSSProperties }) {
  return (
    <div style={{ width: 252, borderRadius: 24, overflow: 'hidden', boxShadow: '0 32px 72px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.1)', ...style }}>
      {/* gradient photo */}
      <div className="relative flex items-center justify-center" style={{ height: 216, background: p.grad }}>
        <span className="select-none text-[5.5rem] font-extrabold" style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.11)', lineHeight: 1 }}>
          {p.name[0]}
        </span>
        <div className="absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold text-white"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.28)' }}>
          {p.match} match
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24" style={{ background: 'linear-gradient(to top, rgba(8,4,18,0.9) 0%, transparent 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-[15px] font-bold text-white">{p.name}, {p.age}</div>
          <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.52)' }}>{p.loc}</div>
        </div>
      </div>
      {/* body */}
      <div style={{ background: '#130620', padding: '14px 16px 16px' }}>
        <div className="mb-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: 'rgba(255,130,170,0.9)' }}>{p.prompt}</div>
          <div className="mt-0.5 text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.62)' }}>{p.ans}</div>
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {p.tags.map((t) => (
            <span key={t} className="rounded-full px-2.5 py-1 text-[10px]"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.58)' }}>
              {t}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="flex h-10 flex-1 items-center justify-center rounded-full text-lg"
            style={{ border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.32)' }}>✕</button>
          <button className="flex h-10 flex-1 items-center justify-center rounded-full font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${T.rose}, ${T.coral})` }}>♡</button>
        </div>
      </div>
    </div>
  )
}

/* ── Glass card ─────────────────────────────────────────────────── */
function GCard({ children, className = '', hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: T.card, border: `1px solid ${T.cardBorder}`, backdropFilter: 'blur(8px)', transition: 'border-color 0.2s, background 0.2s' }}
      {...(hover ? {
        onMouseEnter: (e: React.MouseEvent) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.roseBorder; el.style.background = 'rgba(240,56,104,0.08)' },
        onMouseLeave: (e: React.MouseEvent) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.cardBorder; el.style.background = T.card },
      } : {})}>
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-x-hidden" style={{ background: T.bg, color: T.text }}>

      {/* ═══════ NAV ═══════ */}
      <nav className="fixed top-0 z-40 w-full" style={{ background: 'rgba(10,8,26,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="Mebley" className="h-8 w-8 rounded-full object-cover" />
            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#ff6b96' }}>Mebley</span>
          </a>
          <ul className="hidden items-center gap-1 md:flex">
            {[['#features','Features'],['#how','How it works'],['#stories','Stories']].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="rounded-full px-4 py-2 text-sm transition"
                  style={{ color: T.muted }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.text; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.muted; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <a href="/auth" className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-88"
            style={{ background: `linear-gradient(135deg, ${T.rose}, ${T.coral})`, boxShadow: '0 8px 24px rgba(240,56,104,0.36)' }}>
            Get started
          </a>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden px-6 pb-0 pt-28 md:px-10 md:pt-36"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 0% 10%, rgba(240,56,104,0.22) 0%, transparent 58%),
            radial-gradient(ellipse 55% 50% at 100% 5%, rgba(100,60,200,0.18) 0%, transparent 55%),
            radial-gradient(ellipse 45% 40% at 50% 100%, rgba(180,30,90,0.14) 0%, transparent 55%),
            ${T.bg}
          `,
        }}>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-[1.2fr_0.8fr] md:gap-8">

          {/* copy */}
          <div className="pb-16">
            <Reveal>
              <div className="mb-8 inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ border: `1px solid ${T.roseBorder}`, background: 'rgba(240,56,104,0.1)', color: '#ff90b4' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: T.rose }} />
                Intentional dating, reimagined
              </div>
            </Reveal>

            <Reveal delay={0.07}>
              <h1 className="text-[3.2rem] font-bold leading-[1.04] tracking-tight text-white md:text-[4.6rem] lg:text-[5.4rem]"
                style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                Find your<br />
                <span style={{ display: 'inline-block', background: `linear-gradient(118deg, #ff6b96 0%, ${T.rose} 40%, ${T.coral} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>
                  person.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mt-6 max-w-md text-base leading-relaxed md:text-[1.05rem]" style={{ color: T.muted }}>
                Thoughtful profiles, voice-first chemistry, and matches ranked by depth — not by who swiped most recently.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="/auth" className="inline-flex items-center gap-2 rounded-full px-9 py-3.5 text-sm font-semibold text-white transition hover:opacity-88"
                  style={{ background: `linear-gradient(135deg, ${T.rose}, ${T.coral})`, boxShadow: '0 16px 40px rgba(240,56,104,0.38)' }}>
                  Start free →
                </a>
                <a href="#how" className="inline-flex items-center gap-2 rounded-full border px-9 py-3.5 text-sm font-medium transition"
                  style={{ borderColor: T.cardBorder, color: T.muted, background: T.card }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.roseBorder; (e.currentTarget as HTMLElement).style.color = T.text }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.cardBorder; (e.currentTarget as HTMLElement).style.color = T.muted }}>
                  How it works
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.27}>
              <div className="mt-9 flex flex-wrap gap-2">
                {['Trusted by 12k+ users','4.8 rated','Privacy-first','40+ countries'].map((t) => (
                  <span key={t} className="rounded-full px-4 py-1.5 text-xs"
                    style={{ border: `1px solid ${T.cardBorder}`, background: T.card, color: T.faint }}>
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* stacked profile cards */}
          <Reveal delay={0.12} className="hidden md:block">
            <div className="relative flex justify-center" style={{ height: 520 }}>
              <div className="absolute" style={{ transform: 'rotate(6.5deg) translateX(26px)', top: 26, zIndex: 1, opacity: 0.5 }}>
                <ProfileCard p={HERO_CARDS[2]} />
              </div>
              <div className="absolute" style={{ transform: 'rotate(-3.5deg) translateX(-22px)', top: 13, zIndex: 2, opacity: 0.76 }}>
                <ProfileCard p={HERO_CARDS[1]} />
              </div>
              <div className="absolute" style={{ top: 0, zIndex: 3 }}>
                <ProfileCard p={HERO_CARDS[0]} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={s.l} className="px-8 py-9 text-center"
              style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
              <div className="text-2xl font-extrabold md:text-[2.1rem]"
                style={{ fontFamily: 'var(--font-display)', color: T.rose }}>{s.v}</div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: T.faint }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ FEATURES ═══════ */}
      <section id="features" className="px-6 py-20 md:px-10 md:py-28" style={{ background: T.bg }}>
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-14">
            <Pill label="Features" />
            <h2 className="text-[1.8rem] font-bold md:text-[2.8rem]"
              style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}>
              Everything you need<br className="hidden md:block" /> to connect.
            </h2>
            <p className="mt-3 text-sm md:text-[0.97rem]" style={{ color: T.muted }}>Built for depth, not volume.</p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <GCard className="h-full p-6">
                  <div className="mb-4 text-[1.7rem]">{f.icon}</div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: T.rose }}>{f.sub}</div>
                  <h3 className="text-[0.95rem] font-bold text-white" style={{ color: '#ffffff' }}>{f.title}</h3>
                  <p className="mt-2 text-[0.84rem] leading-relaxed" style={{ color: T.faint }}>{f.desc}</p>
                </GCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how" className="px-6 py-20 md:px-10 md:py-28" style={{ background: T.bgDeep }}>
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-14">
            <Pill label="How it works" />
            <h2 className="text-[1.8rem] font-bold md:text-[2.8rem]"
              style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}>
              Three steps to<br className="hidden md:block" /> something real.
            </h2>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {HOW.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.1}>
                <GCard className="h-full p-8" hover={false}>
                  <div className="mb-6 text-5xl font-extrabold"
                    style={{ fontFamily: 'var(--font-display)', color: 'rgba(240,56,104,0.22)' }}>
                    {step.n}
                  </div>
                  <h3 className="text-[1rem] font-bold text-white" style={{ color: '#ffffff' }}>{step.title}</h3>
                  <p className="mt-2 text-[0.85rem] leading-relaxed" style={{ color: T.faint }}>{step.desc}</p>
                </GCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WHY MEBLEY ═══════ */}
      <section className="px-6 py-20 md:px-10 md:py-28" style={{ background: T.bg }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:gap-20">
            <Reveal>
              <Pill label="Why Mebley" />
              <h2 className="text-[1.8rem] font-bold leading-tight md:text-[2.8rem]"
                style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                Real love starts with{' '}
                <span style={{ display: 'inline-block', background: `linear-gradient(118deg, #ff6b96, ${T.coral})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>
                  real intent.
                </span>
              </h2>
              <p className="mt-5 text-sm leading-relaxed md:text-[0.97rem]" style={{ color: T.muted }}>
                Mebley is built for people who are done with games — and ready for something genuine.
              </p>
            </Reveal>

            <div className="flex flex-col gap-4">
              {VALUES.map((v, i) => (
                <Reveal key={v.title} delay={i * 0.08}>
                  <GCard className="flex gap-4 p-5" hover={false}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                      style={{ background: 'rgba(240,56,104,0.14)' }}>{v.icon}</div>
                    <div>
                      <div className="text-sm font-bold text-white" style={{ color: '#ffffff' }}>{v.title}</div>
                      <div className="mt-0.5 text-[0.83rem]" style={{ color: T.faint }}>{v.desc}</div>
                    </div>
                  </GCard>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section id="stories" className="px-6 py-20 md:px-10 md:py-28" style={{ background: T.bgDeep }}>
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-14 text-center">
            <Pill label="Real stories" />
            <h2 className="text-[1.8rem] font-bold md:text-[2.8rem]"
              style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}>
              Stories stitched with{' '}
              <span style={{ display: 'inline-block', background: `linear-gradient(118deg, #ff6b96, ${T.coral})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>
                intention.
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm md:text-[0.97rem]" style={{ color: T.muted }}>
              Real people. Real chemistry. Conversations that led somewhere.
            </p>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <GCard className="flex h-full flex-col p-7" hover={false}>
                  <div className="mb-3 text-3xl" style={{ color: 'rgba(240,56,104,0.35)' }}>"</div>
                  <p className="flex-1 text-[0.88rem] leading-relaxed md:text-[0.93rem]" style={{ color: T.text }}>{t.text}</p>
                  <div className="mt-6 flex items-center gap-3 border-t pt-5"
                    style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${T.rose}, ${T.coral})` }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white" style={{ color: '#ffffff' }}>{t.name}, {t.age} · {t.city}</div>
                      <div className="text-[11px] font-medium" style={{ color: T.rose }}>{t.match}</div>
                    </div>
                  </div>
                </GCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="px-6 py-16 md:px-10 md:py-24" style={{ background: T.bg }}>
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl px-10 py-16 text-center md:px-16 md:py-20"
            style={{
              background: `linear-gradient(145deg, rgba(240,56,104,0.18) 0%, rgba(100,40,180,0.14) 50%, rgba(240,56,104,0.1) 100%), ${T.bgDeep}`,
              border: `1px solid ${T.roseBorder}`,
              boxShadow: '0 40px 90px rgba(240,56,104,0.16)',
            }}>
            {/* glow accent */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(240,56,104,0.2) 0%, transparent 70%)' }} />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(100,60,200,0.18) 0%, transparent 70%)' }} />

            <div className="relative z-10">
              <h2 className="text-[2rem] font-bold text-white md:text-[3rem]"
                style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                Your person is already here.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm md:text-[0.97rem]" style={{ color: T.muted }}>
                Join thousands building something real. Start for free today.
              </p>
              <a href="/auth"
                className="mt-9 inline-flex items-center gap-2 rounded-full px-12 py-4 text-sm font-semibold text-white transition hover:opacity-88"
                style={{ background: `linear-gradient(135deg, ${T.rose}, ${T.coral})`, boxShadow: '0 16px 44px rgba(240,56,104,0.4)' }}>
                Create your profile →
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="px-6 pb-10 pt-14 md:px-10"
        style={{ background: T.bgDeep, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-start justify-between gap-10 pb-10">
            <div>
              <a href="/" className="flex items-center gap-2">
                <img src="/icon.svg" alt="Mebley" className="h-7 w-7 rounded-full object-cover" />
                <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#ff6b96' }}>Mebley</span>
              </a>
              <p className="mt-3 max-w-[210px] text-sm leading-relaxed" style={{ color: T.faint }}>
                Dating built for people who want something real.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10 text-sm md:grid-cols-3">
              {[
                { head: 'Product',  links: [['#features','Features'],['#stories','Stories'],['/auth','Sign up']] },
                { head: 'Company', links: [['/about','About'],['/blog','Blog'],['/contact','Contact']] },
                { head: 'Legal',   links: [['/privacy','Privacy'],['/terms','Terms']] },
              ].map(({ head, links }) => (
                <div key={head}>
                  <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: T.faint }}>{head}</h4>
                  <div className="space-y-2.5">
                    {links.map(([href, label]) => (
                      <a key={href} href={href} className="block transition" style={{ color: 'rgba(200,160,190,0.3)' }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.color = 'rgba(200,160,190,0.75)' }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(200,160,190,0.3)' }}>
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-xs"
            style={{ borderColor: 'rgba(255,255,255,0.07)', color: 'rgba(200,160,190,0.22)' }}>
            <p>© 2025 Mebley Inc. All rights reserved.</p>
            <div className="flex gap-2">
              {['𝕏','IG','TT','YT'].map((s) => (
                <a key={s} href="#" className="flex h-7 w-7 items-center justify-center rounded-full text-[10px]"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}>{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
