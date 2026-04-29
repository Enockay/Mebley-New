'use client'

import { useState } from 'react'
import MarketingLayout from '@/components/UI/MarketingLayout'

const T = {
  text:  '#f0e8f4',
  muted: 'rgba(240,232,244,0.52)',
  rose:  '#f03868',
  rose2: '#e03060',
  card:  'rgba(255,255,255,0.045)',
  border:'rgba(255,255,255,0.09)',
  roseBorder: 'rgba(240,56,104,0.25)',
}

const CATEGORIES = [
  'General enquiry',
  'Account or billing',
  'Safety or reporting',
  'Press & partnerships',
  'Feature request',
  'Bug report',
]

const CONTACT_CARDS = [
  {
    emoji: '✉️',
    title: 'Email us',
    detail: 'support@mebley.com',
    sub: 'Usually replies within 24 hours',
  },
  {
    emoji: '🛡️',
    title: 'Safety & trust',
    detail: 'safety@mebley.com',
    sub: 'Reviewed within 4 hours',
  },
  {
    emoji: '📰',
    title: 'Press',
    detail: 'press@mebley.com',
    sub: 'Media kits & interviews',
  },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', category: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setApiError('')
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setLoading(true)
    setApiError('')
    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        setSent(true)
      }
    } catch {
      setApiError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 14,
    border: `1px solid ${T.border}`,
    background: 'rgba(255,255,255,0.05)',
    color: T.text, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  return (
    <MarketingLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Hero ── */}
        <section style={{ textAlign: 'center', padding: '80px 0 64px' }}>
          <div style={{
            display: 'inline-block', marginBottom: 18,
            background: 'rgba(240,56,104,0.12)', border: `1px solid ${T.roseBorder}`,
            borderRadius: 100, padding: '6px 18px',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ff80a8',
          }}>
            Get in touch
          </div>
          <h1 style={{
            fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 700, color: T.text, margin: '0 0 16px', letterSpacing: '-0.02em',
          }}>
            We'd love to hear from you
          </h1>
          <p style={{ fontSize: 17, color: T.muted, maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
            Questions, feedback, partnership ideas — our team reads every message.
          </p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 40, marginBottom: 80, alignItems: 'start' }}>

          {/* ── Left: contact cards + info ── */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 }}>
              {CONTACT_CARDS.map(c => (
                <div key={c.title} style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 18, padding: '20px',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: 'rgba(240,56,104,0.10)', border: '1px solid rgba(240,56,104,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>
                    {c.emoji}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>{c.title}</p>
                    <p style={{ fontSize: 13, color: T.rose, margin: '0 0 2px', fontWeight: 600 }}>{c.detail}</p>
                    <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{c.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: '24px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: '0 0 12px' }}>Follow us</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {['Twitter / X', 'Instagram', 'LinkedIn'].map(s => (
                  <span key={s} style={{
                    padding: '7px 14px', borderRadius: 100,
                    background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`,
                    fontSize: 12, color: T.muted, cursor: 'pointer',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: form ── */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 28, padding: '36px 32px' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✉️</div>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: T.text, margin: '0 0 10px' }}>
                  Message sent!
                </h2>
                <p style={{ fontSize: 15, color: T.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
                  Thanks {form.name.split(' ')[0]}! We'll get back to you at {form.email} within 24 hours.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', category: '', message: '' }) }}
                  style={{
                    padding: '11px 28px', borderRadius: 100, border: `1px solid ${T.border}`,
                    background: 'transparent', color: T.muted, fontSize: 14, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <p style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 700, color: T.text, margin: '0 0 6px' }}>Send a message</p>
                  <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>We read every message and usually reply within 24 hours.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 6 }}>Name</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="Your name"
                      required style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 6 }}>Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com"
                      required style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 6 }}>Category</label>
                  <select name="category" value={form.category} onChange={handleChange}
                    style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }}>
                    <option value="" disabled>Choose a topic…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 6 }}>Message</label>
                  <textarea name="message" value={form.message} onChange={handleChange}
                    placeholder="Tell us what's on your mind…"
                    rows={5} required
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                  />
                </div>

                {apiError && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 12,
                    background: 'rgba(240,56,104,0.10)', border: '1px solid rgba(240,56,104,0.25)',
                    color: '#ff6688', fontSize: 13, lineHeight: 1.5,
                  }}>
                    {apiError}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  padding: '15px', borderRadius: 14, border: 'none',
                  background: `linear-gradient(135deg, ${T.rose2}, ${T.rose})`,
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: '0 6px 20px rgba(240,56,104,0.3)',
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? 'Sending…' : 'Send message →'}
                </button>

                <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: 0 }}>
                  By sending, you agree to our{' '}
                  <a href="/privacy" style={{ color: T.rose, textDecoration: 'none' }}>Privacy Policy</a>.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* ── FAQ strip ── */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: T.text, marginBottom: 28, textAlign: 'center' }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { q: 'How do credits work?', a: "Credits are your in-app currency. Spend them on Moments (like Here Tonight) or Boosts to increase your visibility. You earn credits through your monthly plan or by purchasing packs." },
              { q: 'Can I cancel my plan?', a: "Yes, anytime. Your plan stays active until the end of the billing period, then reverts to free. No hidden fees or cancellation charges." },
              { q: 'How does photo verification work?', a: "Take a quick selfie from the app. Our system compares it to your profile photos. Verified profiles get a badge that tells others you're who you say you are." },
              { q: 'Is Mebley available worldwide?', a: "Mebley works in 40+ countries. Payment is handled by Paystack, which supports Visa, Mastercard, and bank cards internationally." },
            ].map(faq => (
              <div key={faq.q} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: '22px' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 8px' }}>{faq.q}</p>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </MarketingLayout>
  )
}
