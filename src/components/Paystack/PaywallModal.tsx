/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

const SUBSCRIPTION_TIERS = [
  {
    plan:    'premium',
    name:    'Premium',
    emoji:   '✨',
    color:   '#f43f5e',
    badge:   null as string | null,
    weekly:  5.99,
    monthly: 14.99,
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
    plan:    'vip',
    name:    'VIP',
    emoji:   '👑',
    color:   '#e8a020',
    badge:   'Most popular' as string | null,
    weekly:  11.99,
    monthly: 29.99,
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
  { key: 'starter', label: 'Starter', price: 4.99,  credits: 100,  bonus: 0,   badge: null          },
  { key: 'popular', label: 'Popular', price: 19.99, credits: 300,  bonus: 30,  badge: '🔥 Popular'  },
  { key: 'value',   label: 'Value',   price: 39.99, credits: 700,  bonus: 100, badge: 'Best value'  },
  { key: 'mega',    label: 'Mega',    price: 74.99, credits: 1600, bonus: 300, badge: null          },
]

const MOMENTS = [
  {
    key:     'spotlight',
    label:   'Spotlight Story',
    credits: 120,
    emoji:   '✨',
    desc:    'Story ring on your profile card — visible to everyone on Discover for 24hrs',
  },
  {
    key:     'golden_thread',
    label:   'Golden Thread',
    credits: 150,
    emoji:   '✦',
    desc:    'Gold border on your card in Discover for 24hrs',
  },
  {
    key:     'direct_match',
    label:   'Direct Match',
    credits: 300,
    emoji:   '⚡',
    desc:    'Skip likes entirely — send a match request with a mandatory note',
  },
]

const BOOSTS = [
  { key: 'quick',   label: 'Quick Boost',   credits: 50,  emoji: '⚡', duration: '6 hours'  },
  { key: 'day',     label: 'Day Boost',     credits: 120, emoji: '🔥', duration: '24 hours' },
  { key: 'weekend', label: 'Weekend Boost', credits: 250, emoji: '🚀', duration: '3 days'   },
  { key: 'power',   label: 'Power Boost',   credits: 400, emoji: '💥', duration: '5 days'   },
]

type Mode = 'plans' | 'spend'
type SpendSection = 'credits' | 'moments' | 'boosts'

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
  const { user, profile } = useAuth()
  const pathname = usePathname()
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)

  const mode: Mode           = defaultTab === 'plans' ? 'plans' : 'spend'
  const [cycle, setCycle]    = useState<'weekly' | 'monthly'>('monthly')
  const [section, setSection] = useState<SpendSection>(
    defaultTab === 'credits' ? 'credits' :
    defaultTab === 'moments' ? 'moments' :
    defaultTab === 'boosts'  ? 'boosts'  : 'credits'
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
  const drawerBackground = 'linear-gradient(165deg, rgba(26,10,45,0.98), rgba(14,6,30,0.98))'

  const currentPlan   = (profile as any)?.plan ?? 'free'
  const walletBalance = (profile as any)?.credit_balance ?? 0

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
    { key: 'credits', label: '💳 Buy Credits' },
    { key: 'moments', label: '✨ Moments'     },
    { key: 'boosts',  label: '🚀 Boosts'      },
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop (mobile + non-browse only). Desktop browse behaves like profile drawer. */}
          {!isDesktopBrowse && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.18)',
                zIndex: 900,
                backdropFilter: 'blur(2px)',
              }}
            />
          )}

          {/* Sheet */}
          <motion.div
            initial={isDesktopBrowse ? { x: '100%' } : { y: '100%' }}
            animate={isDesktopBrowse ? { x: 0 } : { y: 0 }}
            exit={isDesktopBrowse ? { x: '100%' } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: isDesktopBrowse ? 72 : 0,
              top: isDesktopBrowse ? 62 : 'auto',
              left: 0,
              right: 0,
              zIndex: isDesktopBrowse ? 181 : 901,
              width: '100%',
              maxWidth: isDesktopBrowse ? 520 : undefined,
              marginLeft: isDesktopBrowse ? 'auto' : undefined,
              background: drawerBackground,
              borderRadius: isDesktopBrowse ? 0 : '28px 28px 0 0',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: isDesktopBrowse ? '1px solid rgba(255,255,255,0.1)' : 'none',
              borderLeft: isDesktopBrowse ? '1px solid rgba(255,255,255,0.15)' : undefined,
              maxHeight: isDesktopBrowse ? 'none' : '92vh',
              overflowY: 'auto',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: isDesktopBrowse ? 'none' : 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            <div style={{ padding: '16px 20px 48px', position: 'relative' }}>
              <button
                onClick={onClose}
                aria-label="Close paywall"
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 12,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.24)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.92)',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                ×
              </button>

              {/* ── PLANS MODE ── */}
              {mode === 'plans' && (
                <>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>👑</div>
                    <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                      Upgrade your experience
                    </h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                      Unlock the full Crotchet experience
                    </p>
                  </div>

                  {/* Billing toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                    <span style={{ fontSize: 13, color: cycle === 'weekly' ? '#fff' : 'rgba(255,255,255,0.4)' }}>Weekly</span>
                    <button
                      onClick={() => setCycle(c => c === 'weekly' ? 'monthly' : 'weekly')}
                      style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', background: cycle === 'monthly' ? '#f43f5e' : 'rgba(255,255,255,0.15)', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: 2, left: cycle === 'monthly' ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </button>
                    <span style={{ fontSize: 13, color: cycle === 'monthly' ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                      Monthly <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>save ~58%</span>
                    </span>
                  </div>

                  {/* Plan cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {SUBSCRIPTION_TIERS.map(tier => {
                      const price   = cycle === 'weekly' ? tier.weekly : tier.monthly
                      const planKey = `${tier.plan}_${cycle}`
                      const owned   = currentPlan === tier.plan
                      return (
                        <div key={tier.plan} style={{
                          border: `1.5px solid ${tier.color}44`,
                          borderRadius: 20, padding: '20px',
                          background: `${tier.color}08`,
                          position: 'relative',
                        }}>
                          {tier.badge && (
                            <div style={{ position: 'absolute', top: 14, right: 14, background: tier.color, borderRadius: 100, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                              {tier.badge}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <span style={{ fontSize: 28 }}>{tier.emoji}</span>
                            <div>
                              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>{tier.name}</div>
                              <div style={{ fontSize: 24, fontWeight: 800, color: tier.color, lineHeight: 1 }}>
                                ${price}
                                <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>
                                  /{cycle === 'weekly' ? 'wk' : 'mo'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {tier.features.map(f => (
                              <li key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
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
                              fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700,
                              background: owned ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${tier.color}, ${tier.color}aa)`,
                              color: owned ? 'rgba(255,255,255,0.35)' : '#fff',
                              opacity: loading === planKey ? 0.6 : 1,
                            }}>
                            {loading === planKey ? 'Opening…' : owned ? '✓ Current plan' : `Get ${tier.name}`}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* ── SPEND MODE ── */}
              {mode === 'spend' && (
                <>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 38, marginBottom: 8 }}>🧵</div>
                    <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 700, color: '#fff', margin: '0 0 8px', lineHeight: 1.05 }}>
                      Credits & Moments
                    </h2>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(232,160,32,0.16)', border: '1px solid rgba(232,160,32,0.34)', borderRadius: 100, padding: '7px 16px', fontSize: 14, color: '#e8a020', fontWeight: 700, marginTop: 4 }}>
                      🪙 {walletBalance.toLocaleString()} credits
                    </div>
                  </div>

                  {/* Section tabs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 4, marginBottom: 22, gap: 3 }}>
                    {sectionTabs.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setSection(t.key)}
                        style={{
                          padding: '11px 6px', borderRadius: 10, border: 'none', cursor: 'pointer',
                          fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
                          transition: 'all 0.2s',
                          background: section === t.key ? 'linear-gradient(135deg, rgba(244,63,94,0.28), rgba(236,72,153,0.18))' : 'transparent',
                          color: section === t.key ? '#ffdbe9' : 'rgba(255,255,255,0.58)',
                        }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Buy Credits */}
                  {section === 'credits' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.56)', margin: '0 0 10px', textAlign: 'center' }}>
                        Credits never expire · Use on Moments &amp; Boosts
                      </p>
                      {CREDIT_PACKS.map(pack => (
                        <div key={pack.key} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                          border: '1px solid rgba(255,255,255,0.13)',
                          borderRadius: 12, padding: '18px 18px', position: 'relative',
                          boxShadow: '0 8px 24px rgba(8,2,20,0.2)',
                        }}>
                          {pack.badge && (
                            <div style={{ position: 'absolute', top: -10, right: 12, background: 'linear-gradient(135deg,#f43f5e,#ec4899)', borderRadius: 12, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: '#fff', boxShadow: '0 6px 16px rgba(244,63,94,0.35)' }}>
                              {pack.badge}
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.08, marginBottom: 6 }}>{pack.label}</div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.2 }}>
                              {pack.credits.toLocaleString()} credits
                              {pack.bonus > 0 && <span style={{ color: '#4ade80', marginLeft: 4 }}>+{pack.bonus} bonus</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => pay('credits', pack.key)}
                            disabled={loading === pack.key}
                            style={{
                              background: 'linear-gradient(135deg,#f43f5e,#ec4899)',
                              border: 'none', borderRadius: 16, padding: '10px 16px',
                              color: '#fff', fontSize: 16, fontWeight: 800,
                              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                              opacity: loading === pack.key ? 0.6 : 1, whiteSpace: 'nowrap',
                              boxShadow: '0 10px 22px rgba(244,63,94,0.36)',
                            }}>
                            {loading === pack.key ? '…' : `$${pack.price}`}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Moments */}
                  {section === 'moments' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.56)', margin: '0 0 8px', textAlign: 'center' }}>
                        Stand out and get noticed
                      </p>
                      {MOMENTS.map(m => {
                        const canAfford = walletBalance >= m.credits
                        return (
                          <div key={m.key} style={{
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                            border: `1px solid rgba(255,255,255,0.12)`,
                            borderRadius: 12, padding: '16px 14px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                                <span style={{ fontSize: 26, flexShrink: 0 }}>{m.emoji}</span>
                                <div>
                                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{m.label}</div>
                                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', lineHeight: 1.45 }}>{m.desc}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => canAfford ? spendCredits(m.key, m.credits) : setSection('credits')}
                                disabled={loading === m.key}
                                style={{
                                  background: canAfford ? 'rgba(232,160,32,0.18)' : 'rgba(255,255,255,0.06)',
                                  border: `1px solid ${canAfford ? 'rgba(232,160,32,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                  borderRadius: 14, padding: '7px 12px',
                                  color: canAfford ? '#e8a020' : 'rgba(255,255,255,0.3)',
                                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                  fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap',
                                  flexShrink: 0, opacity: loading === m.key ? 0.6 : 1,
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
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.56)', margin: '0 0 8px', textAlign: 'center' }}>
                        Get more visibility in Discover
                      </p>
                      {BOOSTS.map(b => {
                        const canAfford = walletBalance >= b.credits
                        return (
                          <div key={b.key} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 12, padding: '16px 16px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: 26 }}>{b.emoji}</span>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{b.label}</div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)' }}>{b.duration}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => canAfford ? spendCredits(b.key, b.credits) : setSection('credits')}
                              disabled={loading === b.key}
                              style={{
                                background: canAfford ? 'rgba(244,63,94,0.18)' : 'rgba(255,255,255,0.06)',
                                border: `1px solid ${canAfford ? 'rgba(244,63,94,0.35)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: 14, padding: '7px 12px',
                                color: canAfford ? '#f43f5e' : 'rgba(255,255,255,0.3)',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap',
                                opacity: loading === b.key ? 0.6 : 1,
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

              {/* Footer note */}
              <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.42)', marginTop: 26, lineHeight: 1.6 }}>
                💳 Visa, Mastercard &amp; all major cards accepted<br />
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