import type { Metadata } from 'next'
import MarketingLayout from '@/components/UI/MarketingLayout'
import Link from 'next/link'
import Icon, { type IconName } from '@/components/Marketing/Icon'
import { SITE_FACTS, PRODUCT_FACTS } from '@/lib/site-facts'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about Mebley — the team building voice-first, intentional dating for people who want something real. Our mission, values, and story.',
  alternates: { canonical: 'https://mebley.com/about' },
  openGraph: {
    title: 'About Mebley — Our Story & Mission',
    description: 'We\'re building dating that respects your time, your values, and your desire for something real. Meet the team behind Mebley.',
    url: 'https://mebley.com/about',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'About Mebley' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Mebley — Our Story & Mission',
    description: 'We\'re building dating that respects your time, your values, and your desire for something real.',
    images: ['/opengraph-image'],
  },
}

// Design-system tokens (see src/components/Marketing/marketing.css)
const T = {
  bg:    'var(--plum-950)',
  text:  'var(--text-1)',
  muted: 'var(--text-2)',
  rose:  'var(--coral-500)',
  card:  'var(--plum-900)',
  border:'rgba(244,238,246,0.08)',
  roseBorder: 'rgba(232,53,95,0.32)',
}

// Only verifiable facts (review T1). Add sourced member figures in site-facts.ts.
const STATS = [
  { v: SITE_FACTS.countries, l: 'Countries' },
  { v: `${PRODUCT_FACTS.voiceNoteSeconds} sec`, l: 'Voice note on every profile' },
  { v: `${PRODUCT_FACTS.minimumAge}+`, l: 'Adults only' },
  { v: 'Free', l: 'To join' },
]

const VALUES = [
  {
    icon: 'heart' as IconName,
    title: 'Depth over swipes',
    desc: 'We built Mebley for people tired of endless swiping. Every feature is designed to spark genuine conversation.',
  },
  {
    icon: 'globe' as IconName,
    title: 'Globally inclusive',
    desc: 'Love has no borders. Mebley is open in more than 40 countries, and matching considers values and intentions, not just distance.',
  },
  {
    icon: 'shield' as IconName,
    title: 'Safe by design',
    desc: 'Selfie verification, block and report in every chat, and a moderation team are built in. Safety is a feature, not an afterthought.',
  },
  {
    icon: 'target' as IconName,
    title: 'Intent-first matching',
    desc: 'Our Intent Score surfaces people who want what you want, not just people who swiped right. Compatibility over volume.',
  },
  {
    icon: 'mic' as IconName,
    title: 'Voice-first chemistry',
    desc: "A voice note tells you more in 30 seconds than a month of texting. We let your energy speak before you meet.",
  },
  {
    icon: 'info' as IconName,
    title: 'Transparency',
    desc: "No dark patterns and no fake activity. Our prices are public, and a Spotlight is always visibly marked.",
  },
]

const TEAM = [
  { initials: 'EK', name: 'Enock K.', role: 'Founder & CEO', grad: 'linear-gradient(135deg, #8b2556, #4a0e38)' },
  { initials: 'AA', name: 'Amara A.', role: 'Head of Design', grad: 'linear-gradient(135deg, #4830a0, #261668)' },
  { initials: 'JL', name: 'Jin L.',   role: 'Lead Engineer', grad: 'linear-gradient(135deg, #962840, #5e1228)' },
]

export default function AboutPage() {
  return (
    <MarketingLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Hero ── */}
        <section style={{ textAlign: 'center', padding: '96px 0 72px' }}>
          <div style={{
            display: 'inline-block', marginBottom: 20,
            background: 'rgba(240,56,104,0.12)', border: `1px solid ${T.roseBorder}`,
            borderRadius: 100, padding: '6px 18px',
            fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--champagne-400)',
          }}>
            Our story
          </div>
          <h1 style={{
            fontFamily: "'Fraunces', serif", fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 700, color: T.text, margin: '0 0 20px', letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            Built for people who want<br />
            <span style={{ color: T.rose }}>something real</span>
          </h1>
          <p style={{ fontSize: 18, color: T.muted, maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.7 }}>
            Mebley started with a simple question: why does modern dating feel so shallow? We built the answer.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
            {STATS.map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 800, color: T.rose, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 15, color: 'var(--text-3)', marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mission ── */}
        <section style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 28, padding: '52px 48px', marginBottom: 80,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 280, height: 280,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,56,104,0.12), transparent)',
            pointerEvents: 'none',
          }} />
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--champagne-400)', margin: '0 0 16px' }}>
            Our mission
          </p>
          <blockquote style={{
            fontFamily: "'Fraunces', serif", fontSize: 'clamp(22px, 3vw, 32px)',
            fontWeight: 700, color: T.text, margin: '0', lineHeight: 1.4,
            borderLeft: `4px solid ${T.rose}`, paddingLeft: 24,
          }}>
            &ldquo;To make meaningful connections the default, not the exception, for people everywhere who are ready to stop scrolling and start feeling.&rdquo;
          </blockquote>
        </section>

        {/* ── Values ── */}
        <section style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--champagne-400)', margin: '0 0 12px' }}>What we stand for</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>
              Our values
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {VALUES.map(v => (
              <div key={v.title} style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 20, padding: '28px 24px',
                transition: 'border-color 0.2s',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'rgba(240,56,104,0.10)', border: `1px solid rgba(240,56,104,0.2)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, color: 'var(--coral-500)',
                }}>
                  <Icon name={v.icon} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 600, color: T.text, margin: '0 0 10px' }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: 17, color: T.muted, lineHeight: 1.6, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Team ── */}
        <section style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--champagne-400)', margin: '0 0 12px' }}>The people behind it</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: T.text, margin: 0 }}>
              Our team
            </h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            {TEAM.map(m => (
              <div key={m.name} style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 24, padding: '32px 28px', textAlign: 'center',
                minWidth: 200,
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: m.grad,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
                }}>
                  {m.initials}
                </div>
                <p style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 4px' }}>{m.name}</p>
                <p style={{ fontSize: 15, color: 'var(--text-3)', margin: 0 }}>{m.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Company details (review T4) ── */}
        <section style={{ marginBottom: 96 }} aria-labelledby="company-title">
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: '32px 28px', display: 'grid', gap: 12 }}>
            <h2 id="company-title" style={{ fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 600, color: T.text, margin: 0 }}>Company details</h2>
            <p style={{ margin: 0, color: T.muted }}>{SITE_FACTS.legalName}{SITE_FACTS.registeredAddress ? `, ${SITE_FACTS.registeredAddress}` : ''}</p>
            <p style={{ margin: 0, color: T.muted }}>
              Press, partnerships and support: <Link href="/contact" style={{ color: 'var(--coral-200)' }}>contact us</Link>.
            </p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{
          textAlign: 'center', marginBottom: 96,
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(240,56,104,0.12), transparent)',
          borderRadius: 32, padding: '64px 24px',
          border: `1px solid rgba(240,56,104,0.14)`,
        }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: T.text, margin: '0 0 16px' }}>
            Ready to find your person?
          </h2>
          <p style={{ fontSize: 17, color: T.muted, margin: '0 0 32px' }}>Join free today. It takes two minutes and a {PRODUCT_FACTS.voiceNoteSeconds} second voice note.</p>
          <Link href="/auth" style={{
            display: 'inline-block',
            background: 'var(--gradient-action)',
            color: '#fff', textDecoration: 'none',
            padding: '16px 40px', borderRadius: 100, fontSize: 16, fontWeight: 700,
            boxShadow: '0 8px 28px rgba(240,56,104,0.35)',
          }}>
            Join free
          </Link>
        </section>

      </div>
    </MarketingLayout>
  )
}
