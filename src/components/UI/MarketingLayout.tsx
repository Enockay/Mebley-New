'use client'
// src/components/UI/MarketingLayout.tsx
// Shared header + footer for marketing/content pages (About, Blog, Contact)
import Link from 'next/link'

const T = {
  bg:    '#0c0a1e',
  text:  '#f0e8f4',
  muted: 'rgba(240,232,244,0.52)',
  rose:  '#f03868',
  card:  'rgba(255,255,255,0.05)',
  border:'rgba(255,255,255,0.09)',
}

const NAV_LINKS = [
  { href: '/about',   label: 'About'   },
  { href: '/blog',    label: 'Blog'    },
  { href: '/contact', label: 'Contact' },
]

const FOOTER_COLS = [
  {
    head: 'Product',
    links: [['/#features', 'Features'], ['/upgrade', 'Pricing'], ['/blog', 'Blog']],
  },
  {
    head: 'Company',
    links: [['/about', 'About'], ['/contact', 'Contact']],
  },
  {
    head: 'Legal',
    links: [['/privacy', 'Privacy'], ['/terms', 'Terms']],
  },
]

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(12,10,30,0.90)', backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${T.border}`,
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: '100%',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #f03868, #ff7a50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🧵</div>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: T.text }}>
            Mebley
          </span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} style={{
              padding: '7px 14px', borderRadius: 100,
              fontSize: 13, fontWeight: 600, color: T.muted,
              textDecoration: 'none', transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = T.text)}
            onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
              {l.label}
            </Link>
          ))}
          <Link href="/auth" style={{
            padding: '9px 20px', borderRadius: 100, marginLeft: 8,
            background: 'linear-gradient(135deg, #e03060, #f03868)',
            fontSize: 13, fontWeight: 700, color: '#fff',
            textDecoration: 'none', boxShadow: '0 4px 14px rgba(240,56,104,0.3)',
          }}>
            Get started
          </Link>
        </nav>
      </header>

      {/* ── Content ── */}
      <main>{children}</main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: `1px solid ${T.border}`,
        padding: '48px 24px 32px',
        maxWidth: 1100, margin: '0 auto',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #f03868, #ff7a50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧵</div>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700 }}>Mebley</span>
            </div>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, maxWidth: 260, margin: '0 0 18px' }}>
              Intentional connections across 40+ countries. Dating built for people who want something real.
            </p>
            <p style={{ fontSize: 12, color: 'rgba(240,232,244,0.3)', margin: 0 }}>© 2026 Mebley. All rights reserved.</p>
          </div>
          {FOOTER_COLS.map(col => (
            <div key={col.head}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(240,232,244,0.38)', margin: '0 0 14px' }}>
                {col.head}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(([href, label]) => (
                  <Link key={href} href={href} style={{ fontSize: 13, color: T.muted, textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  )
}
