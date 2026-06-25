/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Coins, Zap, Sparkles, TrendingUp, Clock, ArrowUpRight, ArrowDownLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// ── Products ─────────────────────────────────────────────────────────────────

const CREDIT_PACKS = [
  { key: 'starter', label: 'Starter',  credits: 100,  bonus: 0,   kes: 650,  usd: 4.99,  emoji: '🪨', popular: false },
  { key: 'popular', label: 'Popular',  credits: 300,  bonus: 30,  kes: 2600, usd: 19.99, emoji: '⭐', popular: true  },
  { key: 'value',   label: 'Value',    credits: 700,  bonus: 100, kes: 5200, usd: 39.99, emoji: '🔥', popular: false },
  { key: 'mega',    label: 'Mega',     credits: 1600, bonus: 300, kes: 9750, usd: 74.99, emoji: '💥', popular: false },
] as const

const BOOSTS = [
  { key: 'quick',   label: 'Quick Boost',   credits: 50,  emoji: '⚡', duration: '6 hours',  desc: 'Get seen for 6 hours' },
  { key: 'day',     label: 'Day Boost',     credits: 120, emoji: '🔥', duration: '24 hours', desc: 'Top of discovery for a day' },
  { key: 'weekend', label: 'Weekend Boost', credits: 250, emoji: '🚀', duration: '3 days',   desc: '3-day visibility surge' },
  { key: 'power',   label: 'Power Boost',   credits: 400, emoji: '💥', duration: '5 days',   desc: 'Maximum exposure for 5 days' },
] as const

const MOMENTS = [
  { key: 'here_tonight', label: 'Here Tonight', credits: 80,  emoji: '🔥', desc: 'Tell people you\'re available tonight (6h)' },
  { key: 'spotlight',    label: 'Spotlight',    credits: 120, emoji: '✦',  desc: 'Glowing ring + top of Discover for 24h' },
  { key: 'stitch',       label: 'Stitch Pack',  credits: 50,  emoji: '🧵', desc: 'Send a super-like with a personal note' },
  { key: 'night_out',    label: 'Night Out',    credits: 100, emoji: '🌙', desc: 'Broadcast you\'re heading out tonight (8h)' },
] as const

type Tab = 'buy' | 'spend' | 'history'
type SpendSection = 'boosts' | 'moments'

interface Transaction {
  id:            string
  amount:        number
  balance_after: number
  type:          string
  description:   string | null
  created_at:    string
}

interface CreditsStoreProps {
  onClose: () => void
}

const C = {
  bg:     '#0c0a1e',
  card:   'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.10)',
  text:   '#f0e8f4',
  muted:  'rgba(240,232,244,0.52)',
  gold:   '#fbbf24',
  rose:   '#f03868',
  violet: '#a78bfa',
}

function timeAgo(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function txIcon(type: string) {
  if (type.includes('earn') || type === 'subscription_credit' || type === 'purchase')
    return <ArrowUpRight size={14} color="#34d399" />
  return <ArrowDownLeft size={14} color="#f87171" />
}

export default function CreditsStore({ onClose }: CreditsStoreProps) {
  const { creditBalance, refreshProfile } = useAuth()
  const [tab, setTab]                   = useState<Tab>('buy')
  const [section, setSection]           = useState<SpendSection>('moments')
  const [txList, setTxList]             = useState<Transaction[]>([])
  const [txLoading, setTxLoading]       = useState(false)
  const [lifetime, setLifetime]         = useState({ earned: 0, spent: 0 })
  const [buying, setBuying]             = useState<string | null>(null)
  const [spending, setSpending]         = useState<string | null>(null)
  const [spendFeedback, setSpendFeedback] = useState<{ key: string; ok: boolean; msg: string } | null>(null)

  const balance = Math.max(0, Number(creditBalance ?? 0))

  const loadHistory = useCallback(async () => {
    setTxLoading(true)
    try {
      const res  = await fetch('/api/credits/transactions')
      const data = await res.json()
      if (res.ok) {
        setTxList(data.transactions ?? [])
        setLifetime({ earned: data.lifetime_earned ?? 0, spent: data.lifetime_spent ?? 0 })
      }
    } finally {
      setTxLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, loadHistory])

  const handleBuy = async (packKey: string) => {
    setBuying(packKey)
    try {
      const res  = await fetch('/api/paystack/initialise', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'credits', product: packKey }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error ?? 'Payment failed'); return }
      window.location.href = data.authorization_url
    } finally {
      setBuying(null)
    }
  }

  const handleSpend = async (product: string, type: 'boost' | 'moment') => {
    if (spending) return
    setSpending(product)
    setSpendFeedback(null)
    try {
      const res  = await fetch('/api/credits/spend', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, type }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSpendFeedback({ key: product, ok: false, msg: data.error ?? 'Not enough credits' })
      } else {
        setSpendFeedback({ key: product, ok: true, msg: 'Activated!' })
        await refreshProfile()
      }
    } finally {
      setSpending(null)
      setTimeout(() => setSpendFeedback(null), 2500)
    }
  }

  const tabStyle = (t: Tab): React.CSSProperties => ({
    flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13,
    background: tab === t ? 'rgba(255,255,255,0.12)' : 'transparent',
    color: tab === t ? C.text : C.muted,
    transition: 'all 0.15s',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(6,4,16,0.82)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 0 env(safe-area-inset-bottom)',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 520,
        maxHeight: '92dvh',
        background: `linear-gradient(170deg,#16082c 0%,${C.bg} 100%)`,
        border: `1px solid ${C.border}`,
        borderRadius: '24px 24px 0 0',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -16px 64px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        <style>{`@keyframes cs-spin{to{transform:rotate(360deg)}}`}</style>

        {/* Header */}
        <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={18} color={C.gold} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "'Fraunces',serif" }}>Credits Store</p>
                <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>Balance: {balance.toLocaleString()} credits</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} color={C.muted} />
            </button>
          </div>

          {/* Balance pill */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {([
              { label: 'Balance',  value: balance.toLocaleString(),           icon: <Coins size={14} color={C.gold} /> },
              { label: 'Earned',   value: lifetime.earned.toLocaleString(),   icon: <TrendingUp size={14} color="#34d399" /> },
              { label: 'Spent',    value: lifetime.spent.toLocaleString(),    icon: <Zap size={14} color={C.rose} /> },
            ] as const).map(stat => (
              <div key={stat.label} style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>{stat.icon}</div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text, fontFamily: "'DM Sans',sans-serif" }}>{stat.value}</p>
                <p style={{ margin: 0, fontSize: 10, color: C.muted, fontFamily: "'DM Sans',sans-serif", letterSpacing: '0.08em' }}>{stat.label.toUpperCase()}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 12 }}>
            <button style={tabStyle('buy')}     onClick={() => setTab('buy')}>🪙 Buy Credits</button>
            <button style={tabStyle('spend')}   onClick={() => setTab('spend')}>⚡ Spend</button>
            <button style={tabStyle('history')} onClick={() => setTab('history')}>🕑 History</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>

          {/* ── BUY tab ─────────────────────────────────────────────────── */}
          {tab === 'buy' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {CREDIT_PACKS.map(pack => {
                const isMega    = pack.key === 'mega'
                const accentCol = pack.popular ? C.rose : isMega ? C.gold : C.violet
                const accentDim = pack.popular ? 'rgba(240,56,104,0.15)' : isMega ? 'rgba(251,191,36,0.12)' : 'rgba(167,139,250,0.14)'
                const accentBdr = pack.popular ? 'rgba(240,56,104,0.38)' : isMega ? 'rgba(251,191,36,0.30)' : 'rgba(167,139,250,0.22)'
                return (
                  <div key={pack.key} style={{
                    borderRadius: 20,
                    background: `linear-gradient(160deg, ${accentDim}, rgba(12,10,30,0.95))`,
                    border: `1.5px solid ${accentBdr}`,
                    padding: '18px 14px 14px',
                    display: 'flex', flexDirection: 'column',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: pack.popular ? '0 8px 28px rgba(240,56,104,0.14)' : isMega ? '0 8px 28px rgba(251,191,36,0.10)' : 'none',
                  }}>
                    {/* Top banner */}
                    {(pack.popular || isMega) && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        background: pack.popular ? 'linear-gradient(90deg,#e03060,#f03868)' : 'linear-gradient(90deg,#b45309,#fbbf24)',
                        textAlign: 'center', padding: '4px 0',
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.10em',
                        color: isMega ? '#1a0e00' : '#fff',
                      }}>
                        {pack.popular ? '★ MOST POPULAR' : '🔥 BEST VALUE'}
                      </div>
                    )}

                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 13,
                      background: accentDim, border: `1px solid ${accentBdr}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                      marginTop: (pack.popular || isMega) ? 18 : 0,
                      marginBottom: 10,
                    }}>
                      {pack.emoji}
                    </div>

                    {/* Name */}
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3, fontFamily: "'DM Sans',sans-serif" }}>
                      {pack.label}
                    </div>

                    {/* Credits */}
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.4 }}>
                      {pack.credits.toLocaleString()}
                      {pack.bonus > 0 && <span style={{ color: accentCol, fontWeight: 700 }}> +{pack.bonus}</span>}
                      {' '}credits
                    </div>

                    {/* Price */}
                    <div style={{ marginBottom: 12, marginTop: 'auto' }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: accentCol, lineHeight: 1, fontFamily: "'DM Sans',sans-serif" }}>
                        KES {pack.kes.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(240,232,244,0.36)', marginTop: 3, fontFamily: "'DM Sans',sans-serif" }}>
                        ≈ ${pack.usd} USD
                      </div>
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => handleBuy(pack.key)}
                      disabled={buying === pack.key}
                      style={{
                        width: '100%', padding: '11px 0', borderRadius: 100, border: 'none',
                        cursor: buying === pack.key ? 'default' : 'pointer',
                        fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13,
                        background: pack.popular
                          ? 'linear-gradient(135deg,#e03060,#f03868)'
                          : isMega
                            ? 'linear-gradient(135deg,#b45309,#fbbf24)'
                            : 'linear-gradient(135deg,#5b21b6,#7c3aed)',
                        color: isMega ? '#1a0e00' : '#fff',
                        opacity: buying === pack.key ? 0.7 : 1,
                        boxShadow: pack.popular ? '0 4px 16px rgba(240,56,104,0.38)' : isMega ? '0 4px 16px rgba(251,191,36,0.28)' : '0 4px 16px rgba(124,58,237,0.28)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      }}>
                      {buying === pack.key
                        ? <Loader2 size={13} style={{ animation: 'cs-spin 0.8s linear infinite' }} />
                        : 'Get Pack'
                      }
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── SPEND tab ───────────────────────────────────────────────── */}
          {tab === 'spend' && (
            <div>
              {/* Section switcher */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {(['moments', 'boosts'] as SpendSection[]).map(s => (
                  <button key={s} onClick={() => setSection(s)} style={{
                    padding: '7px 16px', borderRadius: 100, border: `1.5px solid ${section === s ? 'rgba(167,139,250,0.5)' : C.border}`,
                    background: section === s ? 'rgba(167,139,250,0.15)' : 'transparent',
                    color: section === s ? C.violet : C.muted, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textTransform: 'capitalize',
                  }}>{s}</button>
                ))}
              </div>

              {section === 'moments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {MOMENTS.map(m => {
                    const canAfford = balance >= m.credits
                    const isActive  = spending === m.key
                    const feedback  = spendFeedback?.key === m.key ? spendFeedback : null
                    return (
                      <div key={m.key} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', borderRadius: 14,
                        background: C.card, border: `1.5px solid ${C.border}`,
                      }}>
                        <div style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{m.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'DM Sans',sans-serif" }}>{m.label}</p>
                          <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.4 }}>{m.desc}</p>
                          {feedback && (
                            <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, color: feedback.ok ? '#34d399' : '#f87171', fontFamily: "'DM Sans',sans-serif" }}>
                              {feedback.ok ? '✓ ' : ''}{feedback.msg}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleSpend(m.key, 'moment')}
                          disabled={!canAfford || isActive || !!spending}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '9px 14px', borderRadius: 100, border: 'none',
                            background: canAfford ? 'rgba(240,56,104,0.18)' : 'rgba(255,255,255,0.06)',
                            color: canAfford ? '#fda4af' : C.muted,
                            fontSize: 12, fontWeight: 700, cursor: canAfford && !spending ? 'pointer' : 'default',
                            fontFamily: "'DM Sans',sans-serif", flexShrink: 0,
                            opacity: isActive ? 0.7 : 1,
                          }}>
                          {isActive
                            ? <Loader2 size={12} style={{ animation: 'cs-spin 0.8s linear infinite' }} />
                            : feedback?.ok
                              ? <CheckCircle2 size={12} color="#34d399" />
                              : <><Coins size={12} /> {m.credits}</>
                          }
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {section === 'boosts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {BOOSTS.map(b => {
                    const canAfford = balance >= b.credits
                    const isActive  = spending === b.key
                    const feedback  = spendFeedback?.key === b.key ? spendFeedback : null
                    return (
                      <div key={b.key} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', borderRadius: 14,
                        background: C.card, border: `1.5px solid ${C.border}`,
                      }}>
                        <div style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{b.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'DM Sans',sans-serif" }}>{b.label}</p>
                            <span style={{ fontSize: 10, color: C.muted, background: 'rgba(255,255,255,0.08)', padding: '2px 7px', borderRadius: 100, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
                              <Clock size={8} style={{ display: 'inline', marginRight: 3 }} />{b.duration}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>{b.desc}</p>
                          {feedback && (
                            <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, color: feedback.ok ? '#34d399' : '#f87171', fontFamily: "'DM Sans',sans-serif" }}>
                              {feedback.ok ? '✓ ' : ''}{feedback.msg}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleSpend(b.key, 'boost')}
                          disabled={!canAfford || isActive || !!spending}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '9px 14px', borderRadius: 100, border: 'none',
                            background: canAfford ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.06)',
                            color: canAfford ? C.violet : C.muted,
                            fontSize: 12, fontWeight: 700, cursor: canAfford && !spending ? 'pointer' : 'default',
                            fontFamily: "'DM Sans',sans-serif", flexShrink: 0,
                            opacity: isActive ? 0.7 : 1,
                          }}>
                          {isActive
                            ? <Loader2 size={12} style={{ animation: 'cs-spin 0.8s linear infinite' }} />
                            : feedback?.ok
                              ? <CheckCircle2 size={12} color="#34d399" />
                              : <><Zap size={12} /> {b.credits}</>
                          }
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {balance < 50 && (
                <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 12, background: 'rgba(240,56,104,0.08)', border: '1px solid rgba(240,56,104,0.2)' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#fda4af', fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>
                    You need more credits to use these features.{' '}
                    <button onClick={() => setTab('buy')} style={{ background: 'none', border: 'none', color: C.rose, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                      Buy credits →
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY tab ─────────────────────────────────────────────── */}
          {tab === 'history' && (
            txLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 size={24} color={C.muted} style={{ animation: 'cs-spin 0.8s linear infinite' }} />
              </div>
            ) : txList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🪙</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Fraunces',serif", margin: '0 0 6px' }}>No transactions yet</p>
                <p style={{ fontSize: 13, color: C.muted, fontFamily: "'DM Sans',sans-serif", margin: 0 }}>Buy credits to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {txList.map(tx => (
                  <div key={tx.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12,
                    background: C.card, border: `1px solid ${C.border}`,
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: tx.amount > 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {txIcon(tx.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.text, fontFamily: "'DM Sans',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.description ?? tx.type}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>
                        Balance: {tx.balance_after.toLocaleString()} · {timeAgo(tx.created_at)}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 800, flexShrink: 0,
                      color: tx.amount > 0 ? '#34d399' : '#f87171',
                      fontFamily: "'DM Sans',sans-serif",
                    }}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
