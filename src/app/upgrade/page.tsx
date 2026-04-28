'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePaywall } from '@/hooks/usePaywall'
import { usePlan, TIER_COLOR } from '@/hooks/usePlan'
import { Check, Lock, Sparkles, Crown, Zap, ChevronRight } from 'lucide-react'

// ── Design tokens ─────────────────────────────────────────────────────────
const T = {
  bg:    '#0c0a1e',
  text:  '#f0e8f4',
  muted: 'rgba(240,232,244,0.52)',
  rose:  '#f03868',
  rose2: '#e03060',
  gold:  '#fbbf24',
  violet:'#a78bfa',
}

// ── Tier definitions ──────────────────────────────────────────────────────
const TIERS = [
  {
    key:     'starter' as const,
    label:   'Starter',
    emoji:   '🪨',
    color:   T.violet,
    price:   5,
    period:  '/mo',
    tagline: 'Get started with credits',
    features: [
      { label: '100 credits / month',            included: true  },
      { label: 'Spend credits on Moments & Boosts', included: true  },
      { label: 'Basic matching',                  included: true  },
      { label: 'See who liked you',               included: false },
      { label: 'Read receipts',                   included: false },
      { label: 'Advanced filters',                included: false },
      { label: 'Priority in Discover',            included: false },
      { label: 'VIP badge + profile boost',       included: false },
    ],
  },
  {
    key:     'premium' as const,
    label:   'Premium',
    emoji:   '✨',
    color:   T.rose,
    price:   10,
    period:  '/mo',
    tagline: 'The full Mebley experience',
    badge:   'Most popular',
    features: [
      { label: '250 credits / month',             included: true },
      { label: 'Spend credits on Moments & Boosts', included: true },
      { label: 'See who liked you',               included: true },
      { label: 'Read receipts',                   included: true },
      { label: 'Advanced filters',                included: true },
      { label: 'Priority in Discover',            included: true },
      { label: '1 Quick Boost / month',           included: true },
      { label: 'VIP badge + profile boost',       included: false },
    ],
  },
  {
    key:     'vip' as const,
    label:   'VIP',
    emoji:   '👑',
    color:   T.gold,
    price:   15,
    period:  '/mo',
    tagline: 'Maximum visibility & credits',
    features: [
      { label: '450 credits / month',             included: true },
      { label: 'Spend credits on Moments & Boosts', included: true },
      { label: 'See who liked you',               included: true },
      { label: 'Read receipts',                   included: true },
      { label: 'Advanced filters',                included: true },
      { label: 'Priority in Discover',            included: true },
      { label: '1 Day Boost / month',             included: true },
      { label: 'VIP badge + profile boost',       included: true },
    ],
  },
]

// ── Feature comparison rows ───────────────────────────────────────────────
const COMPARE_ROWS = [
  { label: 'Monthly credits',        free: '0',          starter: '100',    premium: '250',     vip: '450'           },
  { label: 'Spend on Moments',       free: false,        starter: true,     premium: true,      vip: true            },
  { label: 'Swipe & match',          free: 'Limited',    starter: 'Limited',premium: 'Unlimited',vip: 'Unlimited'    },
  { label: 'See who liked you',      free: false,        starter: false,    premium: true,      vip: true            },
  { label: 'Read receipts',          free: false,        starter: false,    premium: true,      vip: true            },
  { label: 'Advanced filters',       free: false,        starter: false,    premium: true,      vip: true            },
  { label: 'Priority in Discover',   free: false,        starter: false,    premium: true,      vip: true            },
  { label: 'Monthly free boost',     free: false,        starter: false,    premium: 'Quick',   vip: 'Day boost'     },
  { label: 'VIP badge',              free: false,        starter: false,    premium: false,     vip: true            },
]

function Cell({ value }: { value: boolean | string }) {
  if (value === false) return <span style={{ color: 'rgba(240,232,244,0.18)', fontSize: 16 }}>–</span>
  if (value === true)  return <Check size={16} color={T.rose} strokeWidth={2.5} />
  return <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{value}</span>
}

// ── Return-from-payment banner ────────────────────────────────────────────
function PaymentBanner() {
  const params  = useSearchParams()
  const router  = useRouter()
  const { refreshProfile } = useAuth()
  const success = params.get('success') === '1'
  const type    = params.get('type')
  const errMsg  = params.get('error')

  useEffect(() => {
    if (success) {
      refreshProfile()
      const t = setTimeout(() => router.replace('/browse'), 3500)
      return () => clearTimeout(t)
    }
  }, [success]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!success && !errMsg) return null

  if (success) return (
    <div style={{
      margin: '0 0 32px',
      padding: '20px 24px',
      borderRadius: 20,
      background: 'rgba(34,197,94,0.08)',
      border: '1px solid rgba(34,197,94,0.28)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 42, marginBottom: 8 }}>{type === 'credits' ? '🪙' : '🎉'}</div>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#4ade80', margin: '0 0 4px', fontFamily: "'Fraunces', serif" }}>
        {type === 'credits' ? 'Credits added!' : "You're upgraded!"}
      </p>
      <p style={{ fontSize: 13, color: 'rgba(240,232,244,0.55)', margin: 0 }}>
        Redirecting in a moment…
      </p>
    </div>
  )

  return (
    <div style={{
      margin: '0 0 32px',
      padding: '18px 24px',
      borderRadius: 20,
      background: 'rgba(240,56,104,0.08)',
      border: '1px solid rgba(240,56,104,0.28)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>❌</div>
      <p style={{ fontSize: 16, fontWeight: 700, color: T.rose, margin: '0 0 4px' }}>Payment not completed</p>
      <p style={{ fontSize: 13, color: T.muted, margin: '0 0 16px' }}>
        {errMsg === 'payment_failed'    && 'Your payment was not completed. You were not charged.'}
        {errMsg === 'fulfillment_failed' && 'Payment received but activation failed — contact support@mebley.com.'}
        {errMsg === 'server_error'       && 'A server error occurred. Please try again.'}
        {!errMsg                         && 'Something went wrong. You were not charged.'}
      </p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
function UpgradeContent() {
  const router = useRouter()
  const { openPaywall } = usePaywall()
  const { tier, creditBalance, planExpires, isFree } = usePlan()
  const [tab, setTab] = useState<'cards' | 'compare'>('cards')

  const planExpiresFormatted = planExpires
    ? new Date(planExpires).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse 70% 50% at 12% 90%, rgba(240,56,104,0.11) 0%, transparent 65%),
                   radial-gradient(ellipse 55% 45% at 92% 8%,  rgba(120,40,180,0.09) 0%, transparent 65%),
                   ${T.bg}`,
      fontFamily: "'DM Sans', sans-serif",
      padding: '0 0 80px',
    }}>

      {/* Header bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(12,10,30,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4, display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0 }}>Plans & Credits</h1>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 18px 0' }}>

        {/* Payment result banner */}
        <Suspense fallback={null}><PaymentBanner /></Suspense>

        {/* Current plan chip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 16, padding: '14px 18px', marginBottom: 28,
        }}>
          <div>
            <p style={{ fontSize: 11, color: T.muted, margin: '0 0 4px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Current plan</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 15, fontWeight: 800, color: TIER_COLOR[tier],
                fontFamily: "'Fraunces', serif",
              }}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </span>
              {planExpiresFormatted && !isFree && (
                <span style={{ fontSize: 11, color: T.muted }}>· renews {planExpiresFormatted}</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: T.muted, margin: '0 0 2px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Credits</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: T.rose, margin: 0 }}>
              🪙 {creditBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(240,56,104,0.14)',
          borderRadius: 14, padding: 4, marginBottom: 24, gap: 3,
        }}>
          {(['cards', 'compare'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '11px', borderRadius: 11, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              background: tab === t ? `linear-gradient(135deg, rgba(240,56,104,0.18), rgba(224,48,96,0.12))` : 'transparent',
              color:      tab === t ? '#ffb0c4' : T.muted,
              boxShadow:  tab === t ? `inset 0 0 0 1px rgba(240,56,104,0.28)` : 'none',
            }}>
              {t === 'cards' ? '💎 Plan cards' : '📊 Compare'}
            </button>
          ))}
        </div>

        {/* ── PLAN CARDS ── */}
        {tab === 'cards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {TIERS.map(tier_ => {
              const isCurrentPlan = tier === tier_.key
              const color         = tier_.color
              return (
                <div key={tier_.key} style={{
                  borderRadius: 22,
                  border: `1.5px solid ${isCurrentPlan ? color : color + '30'}`,
                  background: `${color}08`,
                  padding: '20px',
                  position: 'relative',
                  boxShadow: isCurrentPlan ? `0 0 0 1px ${color}45, 0 8px 32px ${color}18` : 'none',
                }}>
                  {tier_.badge && (
                    <div style={{
                      position: 'absolute', top: 14, right: 14,
                      background: `linear-gradient(135deg, ${color}cc, ${color}88)`,
                      borderRadius: 100, padding: '3px 10px',
                      fontSize: 10, fontWeight: 800, color: '#fff',
                      letterSpacing: '0.04em',
                    }}>
                      {tier_.badge}
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div style={{
                      position: 'absolute', top: 14, right: tier_.badge ? 110 : 14,
                      background: `${color}20`, border: `1px solid ${color}50`,
                      borderRadius: 100, padding: '3px 10px',
                      fontSize: 10, fontWeight: 700, color,
                    }}>
                      ✓ Current
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 28 }}>{tier_.emoji}</span>
                    <div>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: T.text }}>{tier_.label}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{tier_.tagline}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>${tier_.price}</span>
                      <span style={{ fontSize: 12, color: T.muted }}>{tier_.period}</span>
                    </div>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tier_.features.map(f => (
                      <li key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13 }}>
                        <span style={{ marginTop: 1, flexShrink: 0 }}>
                          {f.included
                            ? <Check size={14} color={color} strokeWidth={2.5} />
                            : <span style={{ display: 'inline-block', width: 14, height: 14, lineHeight: '14px', textAlign: 'center', color: 'rgba(240,232,244,0.18)', fontSize: 12 }}>–</span>
                          }
                        </span>
                        <span style={{ color: f.included ? T.text : 'rgba(240,232,244,0.35)' }}>{f.label}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => !isCurrentPlan && openPaywall('general', 'plans')}
                    disabled={isCurrentPlan}
                    style={{
                      width: '100%', padding: '14px 0', borderRadius: 100, border: 'none',
                      cursor: isCurrentPlan ? 'default' : 'pointer',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700,
                      background: isCurrentPlan
                        ? 'rgba(255,255,255,0.07)'
                        : tier_.key === 'premium'
                          ? `linear-gradient(135deg, ${T.rose2}, ${T.rose})`
                          : tier_.key === 'vip'
                            ? `linear-gradient(135deg, #d97706, ${T.gold})`
                            : `linear-gradient(135deg, #7c3aed, ${T.violet})`,
                      color: isCurrentPlan
                        ? 'rgba(240,232,244,0.28)'
                        : tier_.key === 'vip' ? '#1a0e00' : '#fff',
                      boxShadow: isCurrentPlan ? 'none' : `0 6px 20px ${color}28`,
                    }}>
                    {isCurrentPlan ? '✓ Current plan' : `Get ${tier_.label}`}
                  </button>
                </div>
              )
            })}

            {/* Buy credits separately */}
            <button
              onClick={() => openPaywall('general', 'credits')}
              style={{
                width: '100%', padding: '15px', borderRadius: 18,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(240,56,104,0.2)',
                cursor: 'pointer', color: T.text,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontFamily: "'DM Sans', sans-serif",
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>🪙</span>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Buy Credits</p>
                  <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>One-time packs · never expire</p>
                </div>
              </div>
              <ChevronRight size={18} color={T.muted} />
            </button>
          </div>
        )}

        {/* ── COMPARISON TABLE ── */}
        {tab === 'compare' && (
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.09)' }}>
            {/* Header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px',
              background: 'rgba(255,255,255,0.05)', padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Feature</span>
              {['Free','Starter','Premium','VIP'].map((h, i) => {
                const colors = ['rgba(255,255,255,0.35)', T.violet, T.rose, T.gold]
                return (
                  <span key={h} style={{ fontSize: 10, fontWeight: 800, color: colors[i], textAlign: 'center', letterSpacing: '0.04em' }}>{h}</span>
                )
              })}
            </div>

            {COMPARE_ROWS.map((row, i) => (
              <div key={row.label} style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px',
                padding: '11px 14px', alignItems: 'center',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderBottom: i < COMPARE_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <span style={{ fontSize: 12, color: T.text }}>{row.label}</span>
                {([row.free, row.starter, row.premium, row.vip] as (boolean | string)[]).map((v, vi) => (
                  <div key={vi} style={{ display: 'flex', justifyContent: 'center' }}>
                    <Cell value={v} />
                  </div>
                ))}
              </div>
            ))}

            <div style={{ padding: '14px 16px', background: 'rgba(240,56,104,0.05)' }}>
              <button
                onClick={() => openPaywall('general', 'plans')}
                style={{
                  width: '100%', padding: '13px', borderRadius: 14, border: 'none',
                  background: `linear-gradient(135deg, ${T.rose2}, ${T.rose})`,
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  boxShadow: `0 6px 20px rgba(240,56,104,0.3)`,
                }}>
                Choose a plan
              </button>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(240,232,244,0.3)', marginTop: 28, lineHeight: 1.7 }}>
          💳 Visa, Mastercard & all major cards accepted<br />
          Powered by Paystack · Credits never expire · Cancel anytime
        </p>
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2.5px solid rgba(240,56,104,0.2)', borderTopColor: T.rose, animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  )
}
