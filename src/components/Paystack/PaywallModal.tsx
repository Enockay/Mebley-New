/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
// src/components/Paystack/PaywallModal.tsx

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

// ── All pricing exactly from spec ─────────────────────────────────────────
const SUBSCRIPTION_TIERS = [
  {
    plan:  'premium',
    name:  'Premium',
    emoji: '✨',
    color: '#f43f5e',
    badge: null as string | null,
    weekly:  5.99,
    monthly: 14.99,
    weeklyCredits: 50,
    boost: '1 Quick Boost/week',
    features: [
      'See who liked you',
      'Unlimited likes',
      'Read receipts',
      'Advanced filters',
      'Priority in Discover',
      '50 credits/week',
      '1 Quick Boost/week',
    ],
  },
  {
    plan:  'vip',
    name:  'VIP',
    emoji: '👑',
    color: '#e8a020',
    badge: 'Most popular',
    weekly:  11.99,
    monthly: 29.99,
    weeklyCredits: 150,
    boost: '1 Day Boost/week',
    features: [
      'Everything in Premium',
      '150 credits/week',
      '1 Day Boost/week',
      'VIP badge on profile',
      'Higher weekly credits',
      'Bigger weekly boost',
    ],
  },
]

const CREDIT_PACKS = [
  { key: 'starter', label: 'Starter',  price: 4.99,  credits: 100,  bonus: 0,   badge: null        },
  { key: 'popular', label: 'Popular',  price: 19.99, credits: 300,  bonus: 30,  badge: '🔥 Popular' },
  { key: 'value',   label: 'Value',    price: 39.99, credits: 700,  bonus: 100, badge: 'Best value' },
  { key: 'mega',    label: 'Mega',     price: 74.99, credits: 1600, bonus: 300, badge: null        },
]

const MOMENTS = [
  { key: 'stitch',        label: 'The Stitch',      credits: 50,  emoji: '🧵', desc: 'Super like with note — jumps to top of stack' },
  { key: 'voice_like',    label: 'Voice Note Like',  credits: 80,  emoji: '🎙️', desc: 'Send a voice note with your like' },
  { key: 'here_tonight',  label: 'Here Tonight',     credits: 80,  emoji: '🌙', desc: 'Live presence badge, surfaces to nearby for 6hrs' },
  { key: 'night_out',     label: 'Night Out',        credits: 100, emoji: '🌃', desc: 'Bumps you in Discover 6pm–2am for 4hrs' },
  { key: 'spotlight',     label: 'Spotlight Story',  credits: 120, emoji: '✨', desc: 'Story ring around your profile card for 24hrs' },
  { key: 'golden_thread', label: 'Golden Thread',    credits: 150, emoji: '✦',  desc: 'Gold border on your card in Discover for 24hrs' },
  { key: 'direct_match',  label: 'Direct Match',     credits: 300, emoji: '⚡', desc: 'Skip likes entirely — send match request with note' },
]

const BOOSTS = [
  { key: 'quick',   label: 'Quick Boost',   credits: 50,  emoji: '⚡', duration: '6 hours'  },
  { key: 'day',     label: 'Day Boost',     credits: 120, emoji: '🔥', duration: '24 hours' },
  { key: 'weekend', label: 'Weekend Boost', credits: 250, emoji: '🚀', duration: '3 days'   },
  { key: 'power',   label: 'Power Boost',   credits: 400, emoji: '💥', duration: '5 days'   },
]

type Tab = 'plans' | 'credits' | 'moments' | 'boosts'

interface Props {
  open:     boolean
  onClose:  () => void
  trigger?: 'stitch_limit' | 'spotlight' | 'golden_thread' | 'vip_feature' | 'general'
  // Called when user spends credits on a moment/boost (already owns credits)
  onSpendCredits?: (product: string, cost: number) => Promise<void>
}

const TRIGGER_MSG: Record<string, string> = {
  stitch_limit:  "You've used all your free Stitches today.",
  spotlight:     "Spotlight Story requires credits.",
  golden_thread: "Golden Thread requires credits.",
  vip_feature:   "This is a VIP feature.",
  general:       "Unlock the full Crotchet experience.",
}

export default function PaywallModal({ open, onClose, trigger = 'general', onSpendCredits }: Props) {
  const { user, profile, refreshProfile } = useAuth()
  const [tab,     setTab    ] = useState<Tab>('plans')
  const [cycle,   setCycle  ] = useState<'weekly' | 'monthly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [error,   setError  ] = useState<string | null>(null)

  const currentPlan    = (profile as any)?.plan ?? 'free'
  const walletBalance  = (profile as any)?.credit_balance ?? 0   // read from profile or wallet join

  // ── Initiate Paystack payment ────────────────────────────────────────────
  async function pay(type: 'subscription' | 'credits', product: string) {
    if (!user) return
    setLoading(product)
    setError(null)
    try {
      const res  = await fetch('/api/paystack/initialize', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type, product, currency: 'USD' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Payment failed'); return }
      window.location.href = data.authorization_url
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  // ── Spend credits on a moment/boost ─────────────────────────────────────
  async function spendCredits(product: string, cost: number) {
    if (!onSpendCredits) return
    setLoading(product)
    setError(null)
    try {
      await onSpendCredits(product, cost)
      onClose()
    } catch (e: any) {
      setError(e.message || 'Failed to activate')
    } finally {
      setLoading(null)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'plans',   label: '📋 Plans'   },
    { key: 'credits', label: '💳 Credits' },
    { key: 'moments', label: '🧵 Moments' },
    { key: 'boosts',  label: '🚀 Boosts'  },
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 900, backdropFilter: 'blur(8px)' }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 901,
              background: '#0f0409',
              borderRadius: '28px 28px 0 0',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: 'none',
              maxHeight: '92vh',
              overflowY: 'auto',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            <div style={{ padding: '16px 20px 40px' }}>

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 6 }}>🧵</div>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                  Crotchet
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                  {TRIGGER_MSG[trigger]}
                </p>
                {walletBalance > 0 && (
                  <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(232,160,32,0.15)', border: '1px solid rgba(232,160,32,0.3)', borderRadius: 100, padding: '4px 12px', fontSize: 12, color: '#e8a020', fontWeight: 700 }}>
                    🪙 {walletBalance.toLocaleString()} credits
                  </div>
                )}
              </div>

              {/* Tab bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 3, marginBottom: 20, gap: 2 }}>
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    style={{ padding: '8px 4px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s', background: tab === t.key ? 'rgba(244,63,94,0.22)' : 'transparent', color: tab === t.key ? '#f43f5e' : 'rgba(255,255,255,0.45)' }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── PLANS TAB ──────────────────────────────────── */}
              {tab === 'plans' && (
                <>
                  {/* Billing toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
                    <span style={{ fontSize: 13, color: cycle === 'weekly' ? '#fff' : 'rgba(255,255,255,0.4)' }}>Weekly</span>
                    <button onClick={() => setCycle(c => c === 'weekly' ? 'monthly' : 'weekly')}
                      style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', background: cycle === 'monthly' ? '#f43f5e' : 'rgba(255,255,255,0.15)', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: 2, left: cycle === 'monthly' ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </button>
                    <span style={{ fontSize: 13, color: cycle === 'monthly' ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                      Monthly <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>save ~58%</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {SUBSCRIPTION_TIERS.map(tier => {
                      const price   = cycle === 'weekly' ? tier.weekly : tier.monthly
                      const planKey = `${tier.plan}_${cycle}` as string
                      const owned   = currentPlan === tier.plan
                      return (
                        <div key={tier.plan} style={{ border: `1.5px solid ${tier.color}44`, borderRadius: 18, padding: '18px 18px', background: `${tier.color}08`, position: 'relative' }}>
                          {tier.badge && (
                            <div style={{ position: 'absolute', top: 12, right: 12, background: tier.color, borderRadius: 100, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#fff' }}>{tier.badge}</div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <span style={{ fontSize: 24 }}>{tier.emoji}</span>
                            <div>
                              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>{tier.name}</div>
                              <div style={{ fontSize: 22, fontWeight: 800, color: tier.color, lineHeight: 1 }}>
                                ${price}<span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/{cycle === 'weekly' ? 'wk' : 'mo'}</span>
                              </div>
                            </div>
                          </div>
                          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {tier.features.map(f => (
                              <li key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <span style={{ color: tier.color, fontSize: 12, marginTop: 1, flexShrink: 0 }}>✓</span> {f}
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={() => !owned && pay('subscription', planKey)}
                            disabled={owned || loading === planKey}
                            style={{ width: '100%', padding: '13px 0', borderRadius: 100, border: 'none', cursor: owned ? 'default' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, background: owned ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${tier.color}, ${tier.color}aa)`, color: owned ? 'rgba(255,255,255,0.35)' : '#fff', opacity: loading === planKey ? 0.6 : 1 }}>
                            {loading === planKey ? 'Opening…' : owned ? '✓ Current plan' : `Get ${tier.name}`}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* ── CREDITS TAB ────────────────────────────────── */}
              {tab === 'credits' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textAlign: 'center' }}>
                    Credits are spend-only — use on Moments &amp; Boosts. Never expire.
                  </p>
                  {CREDIT_PACKS.map(pack => (
                    <div key={pack.key}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '14px 16px', position: 'relative' }}>
                      {pack.badge && (
                        <div style={{ position: 'absolute', top: -8, right: 12, background: '#f43f5e', borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#fff' }}>{pack.badge}</div>
                      )}
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{pack.label}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                          {pack.credits.toLocaleString()} credits
                          {pack.bonus > 0 && <span style={{ color: '#4ade80', marginLeft: 4 }}>+{pack.bonus} bonus</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => pay('credits', pack.key)}
                        disabled={loading === pack.key}
                        style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)', border: 'none', borderRadius: 100, padding: '9px 18px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: loading === pack.key ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                        {loading === pack.key ? '…' : `$${pack.price}`}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── MOMENTS TAB ────────────────────────────────── */}
              {tab === 'moments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', textAlign: 'center' }}>
                    Your balance: <span style={{ color: '#e8a020', fontWeight: 700 }}>🪙 {walletBalance.toLocaleString()}</span>
                  </p>
                  {MOMENTS.map(m => {
                    const canAfford = walletBalance >= m.credits
                    return (
                      <div key={m.key}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 22, flexShrink: 0 }}>{m.emoji}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{m.label}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{m.desc}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => canAfford ? spendCredits(m.key, m.credits) : setTab('credits')}
                          disabled={loading === m.key}
                          style={{ background: canAfford ? 'rgba(232,160,32,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${canAfford ? 'rgba(232,160,32,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 100, padding: '7px 14px', color: canAfford ? '#e8a020' : 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap', flexShrink: 0, opacity: loading === m.key ? 0.6 : 1 }}>
                          {loading === m.key ? '…' : `🪙 ${m.credits}`}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── BOOSTS TAB ─────────────────────────────────── */}
              {tab === 'boosts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', textAlign: 'center' }}>
                    Your balance: <span style={{ color: '#e8a020', fontWeight: 700 }}>🪙 {walletBalance.toLocaleString()}</span>
                  </p>
                  {BOOSTS.map(b => {
                    const canAfford = walletBalance >= b.credits
                    return (
                      <div key={b.key}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 26 }}>{b.emoji}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{b.label}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{b.duration}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => canAfford ? spendCredits(b.key, b.credits) : setTab('credits')}
                          disabled={loading === b.key}
                          style={{ background: canAfford ? 'rgba(244,63,94,0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${canAfford ? 'rgba(244,63,94,0.35)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 100, padding: '9px 18px', color: canAfford ? '#f43f5e' : 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap', opacity: loading === b.key ? 0.6 : 1 }}>
                          {loading === b.key ? '…' : `🪙 ${b.credits}`}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* M-Pesa note */}
              <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 20, lineHeight: 1.6 }}>
                💚 M-Pesa, card, bank transfer &amp; USSD supported<br/>
                Powered by Paystack · Credits never expire · Not cashable
              </p>

              {error && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, fontSize: 13, color: '#f43f5e', textAlign: 'center' }}>
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
