'use client'

import MarketingLayout from '@/components/UI/MarketingLayout'
import Link from 'next/link'
import Icon, { type IconName } from '@/components/Marketing/Icon'

const T = {
  text:  'var(--text-1)',
  muted: 'var(--text-2)',
  rose:  'var(--coral-500)',
  card:  'var(--plum-900)',
  border:'rgba(244,238,246,0.08)',
}

const POSTS = [
  {
    slug:     'voice-notes-change-dating',
    category: 'Features',
    catColor: '#a78bfa',
    date:     'April 18, 2026',
    read:     '4 min read',
    title:    'Why voice notes are changing the way we date',
    excerpt:  "A written bio can be crafted. A voice note can't lie. Here's what 30 seconds of audio reveals that months of texting doesn't.",
    grad:     'linear-gradient(135deg, #4830a0 0%, #261668 100%)',
    icon:     'mic' as IconName,
  },
  {
    slug:     'intent-score-explained',
    category: 'How it works',
    catColor: '#f03868',
    date:     'April 12, 2026',
    read:     '6 min read',
    title:    'The Intent Score: how we match on what you actually want',
    excerpt:  "Most algorithms match on behaviour. Ours matches on intent. Here's what goes into the score that shapes your Discover feed.",
    grad:     'linear-gradient(135deg, #bf4578 0%, #8b2556 100%)',
    icon:     'target' as IconName,
  },
  {
    slug:     'global-dating-culture',
    category: 'Culture',
    catColor: '#fbbf24',
    date:     'April 5, 2026',
    read:     '8 min read',
    title:    'Love across borders: dating culture in 5 cities',
    excerpt:  "From Nairobi to Seoul, first-date expectations vary wildly. We spoke to Mebley members on 4 continents about what connection means to them.",
    grad:     'linear-gradient(135deg, #c44858 0%, #962840 100%)',
    icon:     'globe' as IconName,
  },
  {
    slug:     'safety-on-mebley',
    category: 'Safety',
    catColor: '#22c55e',
    date:     'March 28, 2026',
    read:     '5 min read',
    title:    "How Mebley keeps you safe — and why we built it this way",
    excerpt:  "Photo verification, reporting, and moderation aren't add-ons. They're the foundation. Here's why we prioritised safety above growth.",
    grad:     'linear-gradient(135deg, #1a5c3a 0%, #0d3321 100%)',
    icon:     'lock' as IconName,
  },
  {
    slug:     'here-tonight-feature',
    category: 'Features',
    catColor: '#a78bfa',
    date:     'March 20, 2026',
    read:     '3 min read',
    title:    "Here Tonight: meet people who are actually out right now",
    excerpt:  "Most matches go nowhere because timing is off. Here Tonight changes that — it surfaces people who are available now, tonight.",
    grad:     'linear-gradient(135deg, #4a0e38 0%, #2d0622 100%)',
    icon:     'moon' as IconName,
  },
  {
    slug:     'meaningful-connections',
    category: 'Relationships',
    catColor: '#fb923c',
    date:     'March 14, 2026',
    read:     '7 min read',
    title:    '5 things people who find lasting love online do differently',
    excerpt:  "After analysing thousands of matches that led to real relationships, patterns emerge. The biggest one? How they fill out their profile.",
    grad:     'linear-gradient(135deg, #7c2d12 0%, #431407 100%)',
    icon:     'heart' as IconName,
  },
]

const CATEGORIES = ['All', 'Features', 'How it works', 'Culture', 'Safety', 'Relationships']

export default function BlogPage() {
  const [featured, ...rest] = POSTS

  return (
    <MarketingLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Hero ── */}
        <section style={{ textAlign: 'center', padding: '80px 0 56px' }}>
          <div style={{
            display: 'inline-block', marginBottom: 18,
            background: 'rgba(240,56,104,0.12)', border: '1px solid rgba(240,56,104,0.25)',
            borderRadius: 100, padding: '6px 18px',
            fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--champagne-400)',
          }}>
            The Mebley Journal
          </div>
          <h1 style={{
            fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 700, color: T.text, margin: '0 0 16px', letterSpacing: '-0.02em',
          }}>
            Stories about modern connection
          </h1>
          <p style={{ fontSize: 17, color: T.muted, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Insights on dating, relationships, and what it takes to find something real in a noisy world.
          </p>
        </section>

        {/* ── Category pills ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
          {CATEGORIES.map((c, i) => (
            <span key={c} style={{
              padding: '8px 18px', borderRadius: 100,
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              background: i === 0 ? 'var(--gradient-action)' : T.card,
              color:      i === 0 ? '#fff' : T.muted,
              border:     i === 0 ? 'none' : `1px solid ${T.border}`,
            }}>
              {c}
            </span>
          ))}
        </div>

        {/* ── Featured post ── */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 28, overflow: 'hidden', marginBottom: 40,
          display: 'grid', gridTemplateColumns: '1fr 1fr',
        }}>
          <div style={{
            background: featured.grad,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 280, fontSize: 80,
          }}>
            <Icon name={featured.icon} size={56} />
          </div>
          <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 100, fontSize: 15, fontWeight: 700,
                color: featured.catColor, background: `${featured.catColor}18`, border: `1px solid ${featured.catColor}30`,
              }}>{featured.category}</span>
              <span style={{ fontSize: 15, color: T.muted }}>{featured.date} · {featured.read}</span>
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: T.text, margin: '0 0 12px', lineHeight: 1.3 }}>
              {featured.title}
            </h2>
            <p style={{ fontSize: 17, color: T.muted, lineHeight: 1.7, margin: '0 0 24px' }}>{featured.excerpt}</p>
            <Link href={`/blog/${featured.slug}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 17, fontWeight: 700, color: T.rose, textDecoration: 'none',
            }}>
              Read article <span style={{ fontSize: 16 }}>→</span>
            </Link>
          </div>
        </div>

        {/* ── Post grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 80 }}>
          {rest.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 22, overflow: 'hidden',
                transition: 'border-color 0.2s, transform 0.2s',
                height: '100%', display: 'flex', flexDirection: 'column',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,56,104,0.3)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.borderColor = T.border
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}>
                <div style={{
                  background: post.grad, height: 140,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 56,
                }}>
                  <Icon name={post.icon} size={40} />
                </div>
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 100, fontSize: 15, fontWeight: 700,
                      color: post.catColor, background: `${post.catColor}18`,
                    }}>{post.category}</span>
                    <span style={{ fontSize: 15, color: T.muted }}>{post.read}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 700, color: T.text, margin: '0 0 8px', lineHeight: 1.35, flex: 1 }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.6, margin: '0 0 14px' }}>
                    {post.excerpt.slice(0, 100)}…
                  </p>
                  <span style={{ fontSize: 15, color: T.muted }}>{post.date}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Newsletter ── */}
        <section style={{
          textAlign: 'center', marginBottom: 80,
          background: 'rgba(240,56,104,0.06)', border: '1px solid rgba(240,56,104,0.14)',
          borderRadius: 28, padding: '52px 24px',
        }}>
          <div style={{ marginBottom: 16, color: 'var(--coral-500)', display: 'flex', justifyContent: 'center' }}><Icon name="message" size={40} /></div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: T.text, margin: '0 0 10px' }}>
            Get new stories in your inbox
          </h2>
          <p style={{ fontSize: 17, color: T.muted, margin: '0 0 28px' }}>No spam. Just good writing about modern connection.</p>
          <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', gap: 10, maxWidth: 420, margin: '0 auto', justifyContent: 'center' }}>
            <input
              type="email"
              placeholder="your@email.com"
              style={{
                flex: 1, padding: '13px 18px', borderRadius: 100, border: `1px solid ${T.border}`,
                background: 'rgba(255,255,255,0.06)', color: T.text, fontSize: 17,
                fontFamily: "'DM Sans', sans-serif", outline: 'none',
              }}
            />
            <button type="submit" style={{
              padding: '13px 24px', borderRadius: 100, border: 'none',
              background: 'var(--gradient-action)',
              color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Subscribe
            </button>
          </form>
        </section>

      </div>
    </MarketingLayout>
  )
}
