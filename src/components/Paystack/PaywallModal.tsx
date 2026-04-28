/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

// ── Brand colours ──────────────────────────────────────────────────
const ROSE    = '#f03868'
const ROSE2   = '#e03060'
const ROSE_DIM = 'rgba(240,56,104,0.18)'
const GOLD    = '#fbbf24'
const GOLD_DIM = 'rgba(251,191,36,0.18)'

const SUBSCRIPTION_TIERS = [
  {
    plan:    'starter',
    name:    'Starter',
    emoji:   '🪨',
    color:   '#a78bfa',   // soft violet — distinct from rose but still on-brand
    badge:   null as string | null,
    monthly: 5.00,
    features: [
      '100 credits/month',
      'Perfect for getting started',
      'Use credits on Moments & Boosts',
    ],
  },
  {
    plan:    'premium',
    name:    'Premium',
    emoji:   '✨',
    color:   ROSE,
    badge:   null as string | null,
    monthly: 10.00,
    features: [
      'See who liked you',
      'Unlimited likes',
      'Read receipts',
      'Advanced filters',
      'Priority in Discover',
      '250 credits/month',
      '1 Quick Boost/month',
    ],
  },
  {
    plan:    'vip',
    name:    'VIP',
    emoji:   '👑',
    color:   GOLD,
    badge:   'Most popular' as string | null,
    monthly: 15.00,
    features: [
      'Everything in Premium',
      '450 credits/month',
      '1 Day Boost/month',
      'VIP badge on profile',
      'Highest monthly credits',
      'Biggest monthly boost',
    ],
  },
]

const CREDIT_PACKS = [
  { key: 'starter', label: 'Starter Pack', credits: 100, bonus: 0,   usd: 4.99,  emoji: '🪨', desc: '100 credits — great for trying things out' },
  { key: 'popular', label: 'Popular Pack', credits: 300, bonus: 30,  usd: 19.99, emoji: '⭐', desc: '300 + 30 bonus credits' },
  { key: 'value',   label: 'Value Pack',   credits: 700, bonus: 100, usd: 39.99, emoji: '🔥', desc: '700 + 100 bonus credits' },
  { key: 'mega',    label: 'Mega Pack',    credits: 1600,bonus: 300, usd: 74.99, emoji: '💥', desc: '1,600 + 300 bonus credits — best value' },
]

const MOMENTS = [
  {
    key:     'spotlight',
    label:   'Spotlight',
    credits: 120,
    emoji:   '✦',
    desc:    'Feature your profile at the top of Discover for 24 hours',
  },
  {
    key:     'golden_thread',
    label:   'Golden Thread',
    credits: 150,
    emoji:   '🪡',
    desc:    'Gold border on your card in Discover for 24 hours',
  },
  {
    key:     'direct_match',
    label:   'Direct Match',
    credits: 300,
    emoji:   '⚡',
    desc:    'Skip likes entirely — send a match request with a note',
  },
]

const BOOSTS = [
  { key: 'quick',   label: 'Quick Boost',   credits: 50,  emoji: '⚡', duration: '6 hours'  },
  { key: 'day',     label: 'Day Boost',     credits: 120, emoji: '🔥', duration: '24 hours' },
  { key: 'weekend', label: 'Weekend Boost', credits: 250, emoji: '🚀', duration: '3 days'   },
  { key: 'power',   label: 'Power Boost',   credits: 400, emoji: '💥', duration: '5 days'   },
]

type Mode = 'plans' | 'spend'
type PlansSection = 'plans' | 'credits'
type SpendSection = 'moments' | 'boosts'

interface Props {
  open:            boolean
  onClose:         () => void
  trigger?:        'spotlight' | 'golden_thread' | 'vip_feature' | 'general'
  defaultTab?:     'plans' | 'credits' | 'moments' | 'boosts'
  onSpendCredits?: (product: string, cost: number) => Promise<void>
}

export default function PaywallModal({
  open,
  onClose,
  trigger = 'general',
  defaultTab = 'plans',
  onSpendCredits,
}: Props) {
  const { user, profile, creditBalance } = useAuth()
  const pathname = usePathname()
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)

  const mode: Mode                      = (defaultTab === 'plans' || defaultTab === 'credits') ? 'plans' : 'spend'
  const [plansSection, setPlansSection] = useState<PlansSection>(defaultTab === 'credits' ? 'credits' : 'plans')
  const [section, setSection]           = useState<SpendSection>(
    defaultTab === 'moments' ? 'moments' :
    defaultTab === 'boosts'  ? 'boosts'  : 'moments'
  )
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 1024px)')
    const sync = () => setIsDesktopViewport(mql.matches)
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [])

  const isDesktopBrowse = pathname === '/browse' && isDesktopViewport

  const currentPlan   = (profile as any)?.plan ?? 'free'
  const walletBalance = Math.max(0, Number(creditBalance ?? 0))

  async function pay(type: 'subscription' | 'credits', product: string) {
    if (!user) return
    setLoading(product)
    setError(null)
    try {
      const res  = await fetch('/api/paystack/initialise', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type, product }),
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

  const sectionTabs: { key: SpendSection; label: string }[] = [
    { key: 'moments', label: '✨ Moments' },
    { key: 'boosts',  label: '🚀 Boosts'  },
  ]

  const bg = 'radial-gradient(ellipse 72% 52% at 12% 92%, rgba(240,56,104,0.14) 0%, transparent 65%), radial-gradient(ellipse 55% 48% at 92% 8%, rgba(120,40,180,0.10) 0%, transparent 65%), #0c0a1e'

  return (
    <AnimatePresence>
      {open && (
        <>
          {!isDesktopBrowse && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              style={{ position: 'fixed', inset: 0, background: 'rgba(4,2,14,0.72)', zIndex: 900, backdropFilter: 'blur(6px)' }}
            />
          )}

          <motion.div
            initial={isDesktopBrowse ? { x: '100%' } : { y: '100%' }}
            animate={isDesktopBrowse ? { x: 0 } : { y: 0 }}
            exit={isDesktopBrowse ? { x: '100%' } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: isDesktopBrowse ? 72 : 0,
              top: isDesktopBrowse ? 62 : 'auto',
              left: 0, right: 0,
              zIndex: isDesktopBrowse ? 181 : 901,
              width: '100%',
              maxWidth: isDesktopBrowse ? 520 : undefined,
              marginLeft: isDesktopBrowse ? 'auto' : undefined,
              background: bg,
              borderRadius: isDesktopBrowse ? 0 : '28px 28px 0 0',
              border: '1px solid rgba(240,56,104,0.18)',
              borderBottom: isDesktopBrowse ? '1px solid rgba(255,255,255,0.08)' : 'none',
              borderLeft: isDesktopBrowse ? '1px solid rgba(255,255,255,0.12)' : undefined,
              maxHeight: isDesktopBrowse ? 'none' : '92vh',
              overflowY: 'auto',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Drag handle */}
            {!isDesktopBrowse && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(240,56,104,0.35)' }} />
              </div>
            )}

            <div style={{ padding: '16px 20px 56px', position: 'relative' }}>
              {/* Close */}
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  position: 'absolute', top: 10, right: 12,
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.86)',
                  cursor: 'pointer', display: 'grid', placeItems: 'center',
                  fontSize: 20, lineHeight: 1,
                }}>
                ×
              </button>

              {/* ── PLANS MODE ── */}
              {mode === 'plans' && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 22 }}>
                    <div style={{ fontSize: 42, marginBottom: 10 }}>👑</div>
                    <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#f0e8f4', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                      Get more on Mebley
                    </h2>
                  </div>

                  {/* Plans / Credits tab */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(240,56,104,0.15)', borderRadius: 14, padding: 4, marginBottom: 20, gap: 3 }}>
                    {([['plans', '👑 Monthly Plans'], ['credits', '🪙 Buy Credits']] as const).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setPlansSection(key)}
                        style={{
                          padding: '11px 6px', borderRadius: 11, border: 'none', cursor: 'pointer',
                          fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                          transition: 'all 0.2s',
                          background: plansSection === key
                            ? `linear-gradient(135deg, ${ROSE_DIM}, rgba(224,48,96,0.12))`
                            : 'transparent',
                          color: plansSection === key ? '#ffb0c4' : 'rgba(240,232,244,0.52)',
                          boxShadow: plansSection === key ? `inset 0 0 0 1px rgba(240,56,104,0.28)` : 'none',
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Monthly subscription plans */}
                  {plansSection === 'plans' && (
                    <>
                      <div style={{ textAlign: 'center', marginBottom: 16 }}>
                        <span style={{ fontSize: 12, color: 'rgba(240,232,244,0.55)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          Monthly billing · Cancel anytime
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {SUBSCRIPTION_TIERS.map(tier => {
                          const planKey = `${tier.plan}_monthly`
                          const owned   = currentPlan === tier.plan
                          return (
                            <div key={tier.plan} style={{
                              border: `1.5px solid ${tier.color}38`,
                              borderRadius: 20, padding: '20px',
                              background: `${tier.color}09`,
                              position: 'relative',
                              boxShadow: owned ? `0 0 0 1.5px ${tier.color}55` : 'none',
                            }}>
                              {tier.badge && (
                                <div style={{
                                  position: 'absolute', top: 14, right: 14,
                                  background: `linear-gradient(135deg, ${tier.color}cc, ${tier.color}88)`,
                                  borderRadius: 100, padding: '3px 10px',
                                  fontSize: 10, fontWeight: 800, color: '#fff',
                                  letterSpacing: '0.04em',
                                }}>
                                  {tier.badge}
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <span style={{ fontSize: 28 }}>{tier.emoji}</span>
                                <div>
                                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#f0e8f4' }}>{tier.name}</div>
                                  <div style={{ fontSize: 26, fontWeight: 800, color: tier.color, lineHeight: 1 }}>
                                    ${tier.monthly}
                                    <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(240,232,244,0.38)' }}>/mo</span>
                                  </div>
                                </div>
                              </div>
                              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {tier.features.map(f => (
                                  <li key={f} style={{ fontSize: 13, color: 'rgba(240,232,244,0.76)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <span style={{ color: tier.color, fontSize: 12, marginTop: 2, flexShrink: 0 }}>✓</span>
                                    {f}
                                  </li>
                                ))}
                              </ul>
                              <button
                                onClick={() => !owned && pay('subscription', planKey)}
                                disabled={owned || loading === planKey}
                                style={{
                                  width: '100%', padding: '14px 0', borderRadius: 100, border: 'none',
                                  cursor: owned ? 'default' : 'pointer',
                                  fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700,
                                  background: owned
                                    ? 'rgba(255,255,255,0.08)'
                                    : tier.color === ROSE
                                      ? `linear-gradient(135deg, ${ROSE2}, ${ROSE})`
                                      : tier.color === GOLD
                                        ? `linear-gradient(135deg, #d97706, ${GOLD})`
                                        : `linear-gradient(135deg, #7c3aed, #a78bfa)`,
                                  color: owned ? 'rgba(240,232,244,0.3)' : tier.color === GOLD ? '#1a0e00' : '#fff',
                                  opacity: loading === planKey ? 0.65 : 1,
                                  boxShadow: owned ? 'none' : `0 6px 20px ${tier.color}30`,
                                  letterSpacing: '0.01em',
                                }}>
                                {loading === planKey ? 'Opening…' : owned ? '✓ Current plan' : `Get ${tier.name}`}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {/* One-time credit packs */}
                  {plansSection === 'credits' && (
                    <>
                      <p style={{ fontSize: 12, color: 'rgba(240,232,244,0.48)', margin: '0 0 14px', textAlign: 'center', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
                        One-time purchase · Credits never expire
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {CREDIT_PACKS.map(pack => (
                          <div key={pack.key} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(240,56,104,0.12)',
                            borderRadius: 16, padding: '14px 16px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 12, background: ROSE_DIM, border: `1px solid rgba(240,56,104,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                {pack.emoji}
                              </div>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#f0e8f4' }}>{pack.label}</div>
                                <div style={{ fontSize: 12, color: 'rgba(240,232,244,0.52)' }}>{pack.desc}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => pay('credits', pack.key)}
                              disabled={loading === pack.key}
                              style={{
                                background: `linear-gradient(135deg, ${ROSE2}, ${ROSE})`,
                                border: 'none', borderRadius: 100, padding: '8px 14px',
                                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
                                flexShrink: 0, opacity: loading === pack.key ? 0.6 : 1,
                                boxShadow: `0 4px 14px rgba(240,56,104,0.3)`,
                              }}>
                              {loading === pack.key ? '…' : `$${pack.usd}`}
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── SPEND MODE ── */}
              {mode === 'spend' && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 38, marginBottom: 8 }}>🪡</div>
                    <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#f0e8f4', margin: '0 0 8px', lineHeight: 1.05 }}>
                      Credits & Moments
                    </h2>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: ROSE_DIM, border: `1px solid rgba(240,56,104,0.35)`, borderRadius: 100, padding: '7px 16px', fontSize: 14, color: ROSE, fontWeight: 700, marginTop: 4 }}>
                      🪙 {walletBalance.toLocaleString()} credits
                    </div>
                  </div>

                  {/* Section tabs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(240,56,104,0.15)', borderRadius: 14, padding: 4, marginBottom: 22, gap: 3 }}>
                    {sectionTabs.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setSection(t.key)}
                        style={{
                          padding: '11px 6px', borderRadius: 11, border: 'none', cursor: 'pointer',
                          fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                          transition: 'all 0.2s',
                          background: section === t.key
                            ? `linear-gradient(135deg, ${ROSE_DIM}, rgba(224,48,96,0.12))`
                            : 'transparent',
                          color: section === t.key ? '#ffb0c4' : 'rgba(240,232,244,0.52)',
                          boxShadow: section === t.key ? `inset 0 0 0 1px rgba(240,56,104,0.28)` : 'none',
                        }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Moments */}
                  {section === 'moments' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ fontSize: 12, color: 'rgba(240,232,244,0.48)', margin: '0 0 4px', textAlign: 'center', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
                        Stand out and get noticed
                      </p>
                      {MOMENTS.map(m => {
                        const canAfford = walletBalance >= m.credits
                        return (
                          <div key={m.key} style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(240,56,104,0.12)',
                            borderRadius: 16, padding: '16px 14px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: ROSE_DIM, border: `1px solid rgba(240,56,104,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                                  {m.emoji}
                                </div>
                                <div>
                                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f0e8f4', marginBottom: 3 }}>{m.label}</div>
                                  <div style={{ fontSize: 12, color: 'rgba(240,232,244,0.58)', lineHeight: 1.5 }}>{m.desc}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => canAfford
                                  ? spendCredits(m.key, m.credits)
                                  : setError('Not enough credits. Upgrade your plan to get more.')}
                                disabled={loading === m.key}
                                style={{
                                  background: canAfford
                                    ? `linear-gradient(135deg, ${ROSE2}, ${ROSE})`
                                    : 'rgba(255,255,255,0.06)',
                                  border: canAfford ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: 100, padding: '8px 14px',
                                  color: canAfford ? '#fff' : 'rgba(240,232,244,0.3)',
                                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                  fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
                                  flexShrink: 0, opacity: loading === m.key ? 0.6 : 1,
                                  boxShadow: canAfford ? `0 4px 14px rgba(240,56,104,0.3)` : 'none',
                                }}>
                                {loading === m.key ? '…' : `🪙 ${m.credits}`}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Boosts */}
                  {section === 'boosts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ fontSize: 12, color: 'rgba(240,232,244,0.48)', margin: '0 0 4px', textAlign: 'center', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
                        Get more visibility in Discover
                      </p>
                      {BOOSTS.map(b => {
                        const canAfford = walletBalance >= b.credits
                        return (
                          <div key={b.key} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(240,56,104,0.12)',
                            borderRadius: 16, padding: '14px 16px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 12, background: ROSE_DIM, border: `1px solid rgba(240,56,104,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                {b.emoji}
                              </div>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#f0e8f4' }}>{b.label}</div>
                                <div style={{ fontSize: 12, color: 'rgba(240,232,244,0.52)' }}>{b.duration}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => canAfford
                                ? spendCredits(b.key, b.credits)
                                : setError('Not enough credits. Upgrade your plan to get more.')}
                              disabled={loading === b.key}
                              style={{
                                background: canAfford
                                  ? `linear-gradient(135deg, ${ROSE2}, ${ROSE})`
                                  : 'rgba(255,255,255,0.06)',
                                border: canAfford ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 100, padding: '8px 14px',
                                color: canAfford ? '#fff' : 'rgba(240,232,244,0.3)',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
                                opacity: loading === b.key ? 0.6 : 1,
                                boxShadow: canAfford ? `0 4px 14px rgba(240,56,104,0.3)` : 'none',
                              }}>
                              {loading === b.key ? '…' : `🪙 ${b.credits}`}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Footer */}
              <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(240,232,244,0.36)', marginTop: 28, lineHeight: 1.7 }}>
                💳 Visa, Mastercard &amp; all major cards accepted<br />
                Powered by Paystack · Credits never expire · Not cashable
              </p>

              {error && (
                <div style={{ marginTop: 14, padding: '11px 16px', background: 'rgba(240,56,104,0.10)', border: '1px solid rgba(240,56,104,0.28)', borderRadius: 12, fontSize: 13, color: ROSE, textAlign: 'center', lineHeight: 1.5 }}>
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
