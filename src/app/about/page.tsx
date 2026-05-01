import type { Metadata } from 'next'
import MarketingLayout from '@/components/UI/MarketingLayout'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about Mebley — the team building voice-first, intentional dating for people who want something real. Our mission, values, and story.',
  alternates: { canonical: 'https://mebley.com/about' },
  openGraph: {
    title: 'About Mebley — Our Story & Mission',
    description: 'We\'re building dating that respects your time, your values, and your desire for something real. Meet the team behind Mebley.',
    url: 'https://mebley.com/about',
  },
}

const T = {
  bg:    '#0c0a1e',
  text:  '#f0e8f4',
  muted: 'rgba(240,232,244,0.52)',
  rose:  '#f03868',
  card:  'rgba(255,255,255,0.045)',
  border:'rgba(255,255,255,0.09)',
  roseBorder: 'rgba(240,56,104,0.25)',
}

const STATS = [
  { v: '40+',  l: 'Countries'      },
  { v: '12k+', l: 'Active members' },
  { v: '4.8★', l: 'App rating'    },
  { v: '78%',  l: 'Reply rate'    },
]

const VALUES = [
  {
    emoji: '💎',
    title: 'Depth over swipes',
    desc: 'We built Mebley for people tired of endless swiping. Every feature is designed to spark genuine conversation, not hollow connections.',
  },
  {
    emoji: '🌐',
    title: 'Globally inclusive',
    desc: 'Love has no borders. Our matching algorithm spans 40+ countries and is built for cultural nuance — not just proximity.',
  },
  {
    emoji: '🔒',
    title: 'Safe by design',
    desc: 'Photo verification, reporting tools, and moderation are built in from day one. Safety is a feature, not an afterthought.',
  },
  {
    emoji: '🎯',
    title: 'Intent-first matching',
    desc: 'Our Intent Score surfaces people who want what you want — not just people who swiped right. Compatibility over volume.',
  },
  {
    emoji: '🎙️',
    title: 'Voice-first chemistry',
    desc: "A voice note tells you more in 30 seconds than a month of texting. We let your energy speak before you meet.",
  },
  {
    emoji: '✨',
    title: 'Transparency',
    desc: "No dark patterns, no fake activity. We show you real people, real matches, and real costs. What you see is what you get.",
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
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ff80a8',
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
                <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{s.l}</div>
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
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ff80a8', margin: '0 0 16px' }}>
            Our mission
          </p>
          <blockquote style={{
            fontFamily: "'Fraunces', serif", fontSize: 'clamp(22px, 3vw, 32px)',
            fontWeight: 700, color: T.text, margin: '0', lineHeight: 1.4,
            borderLeft: `4px solid ${T.rose}`, paddingLeft: 24,
          }}>
            "To make meaningful connections the default — not the exception — for people everywhere who are ready to stop scrolling and start feeling."
          </blockquote>
        </section>

        {/* ── Values ── */}
        <section style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ff80a8', margin: '0 0 12px' }}>What we stand for</p>
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
                  fontSize: 22, marginBottom: 16,
                }}>
                  {v.emoji}
                </div>
                <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 10px' }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Team ── */}
        <section style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ff80a8', margin: '0 0 12px' }}>The people behind it</p>
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
                <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{m.role}</p>
              </div>
            ))}
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
          <p style={{ fontSize: 16, color: T.muted, margin: '0 0 32px' }}>Join thousands of people making real connections on Mebley.</p>
          <Link href="/auth" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #e03060, #f03868)',
            color: '#fff', textDecoration: 'none',
            padding: '16px 40px', borderRadius: 100, fontSize: 16, fontWeight: 700,
            boxShadow: '0 8px 28px rgba(240,56,104,0.35)',
          }}>
            Create your profile →
          </Link>
        </section>

      </div>
    </MarketingLayout>
  )
}
