'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Coins,
  DollarSign,
  Wallet,
  TrendingUp,
  Search,
  Plus,
  Minus,
  RefreshCw,
  ShoppingCart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  adminAdjustCredits,
  adminLookupCredits,
  type AdminCreditsTx,
  type AdminCreditsUser,
  type AdminCreditsWallet,
} from '@/lib/admin-credits-api'
import { fetchAdminRevenue, type AdminRevenueResponse, type StripeDayBucket } from '@/lib/admin-revenue-api'
import AdminPageHeader from '@/components/Admin/AdminPageHeader'

/* ─── Helpers ──────────────────────────────────────────────────── */

function formatTs(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch { return iso }
}

function initials(user: AdminCreditsUser): string {
  const name = user.full_name || user.username || user.email
  return name.slice(0, 2).toUpperCase()
}

/* ─── KPI card ─────────────────────────────────────────────────── */

function RevenueCard({ label, value, sub, icon: Icon, iconColor, iconBg, accent }: {
  label: string; value: string; sub: string
  icon: React.ElementType; iconColor: string; iconBg: string; accent: string
}) {
  return (
    <div style={{
      borderRadius: 16, border: `1px solid ${accent}28`,
      background: `linear-gradient(135deg, ${accent}0a 0%, rgba(255,255,255,0.02) 100%)`,
      padding: '20px 22px', position: 'relative', overflow: 'hidden', flex: 1, minWidth: 180,
    }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: accent, opacity: 0.06, filter: 'blur(20px)' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: iconBg, border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={iconColor} strokeWidth={2} />
        </div>
        <TrendingUp size={13} color={`${accent}60`} />
      </div>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'rgba(240,232,244,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
      <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(240,232,244,0.4)' }}>{sub}</p>
    </div>
  )
}

/* ─── Transaction type bar chart ───────────────────────────────── */

function TxTypeChart({ rows }: { rows: AdminRevenueResponse['credit_transactions_by_type'] }) {
  if (!rows.length) return (
    <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'rgba(240,232,244,0.35)' }}>
      No transactions in this period.
    </div>
  )
  const maxCount = Math.max(...rows.map(r => r.tx_count), 1)
  const palette = ['#818cf8', '#f03868', '#22c55e', '#f59e0b', '#06b6d4', '#a855f7', '#fb923c', '#34d399']

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {rows.map((row, i) => {
        const fill = Math.round((row.tx_count / maxCount) * 100)
        const color = palette[i % palette.length]
        const isNeg = row.credits_sum < 0
        return (
          <div key={row.type}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace', color: 'rgba(240,232,244,0.75)', flex: 1 }}>{row.type}</span>
              <span style={{ fontSize: 12, color: 'rgba(240,232,244,0.5)', minWidth: 40, textAlign: 'right' }}>{row.tx_count}×</span>
              <span style={{
                fontSize: 12, fontWeight: 700, minWidth: 64, textAlign: 'right',
                color: isNeg ? '#fca5a5' : '#86efac',
              }}>
                {isNeg ? '' : '+'}{row.credits_sum.toLocaleString()}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${fill}%`, borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${color}99)`, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Day revenue mini-bars ────────────────────────────────────── */

function DayRevenueBars({ days }: { days: StripeDayBucket[] }) {
  if (!days || !days.length) return null
  const slice = days.slice(0, 14).reverse()
  const maxRev = Math.max(...slice.map((d: StripeDayBucket) => d.revenue_usd), 0.01)
  return (
    <div>
      <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: 'rgba(240,232,244,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Daily Revenue (last 14 days)</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
        {slice.map((d: StripeDayBucket) => {
          const h = Math.max(Math.round((d.revenue_usd / maxRev) * 100), d.revenue_usd > 0 ? 8 : 2)
          return (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }} title={`${d.date}: $${d.revenue_usd.toFixed(2)}`}>
              <div style={{ width: '100%', height: `${h}%`, minHeight: 2, borderRadius: '3px 3px 0 0', background: d.revenue_usd > 0 ? 'linear-gradient(180deg, #f3cd86, #f59e0b)' : 'rgba(255,255,255,0.08)', transition: 'height 0.5s' }} />
              <span style={{ fontSize: 9, color: 'rgba(240,232,244,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', width: '100%', textAlign: 'center' }}>
                {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).split(' ')[1]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Wallet stat pill ─────────────────────────────────────────── */

function WalletStat({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <div style={{ flex: 1, minWidth: 110, borderRadius: 12, border: `1px solid ${color}25`, background: `${color}0d`, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Icon size={13} color={color} strokeWidth={2.2} />
        <span style={{ fontSize: 11, color: 'rgba(240,232,244,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{value.toLocaleString()}</p>
    </div>
  )
}

/* ─── Main component ───────────────────────────────────────────── */

export default function AdminCreditsConsole() {
  const [query, setQuery]               = useState('')
  const [loadingLookup, setLoadingLookup] = useState(false)
  const [lookupErr, setLookupErr]       = useState<string | null>(null)
  const [user, setUser]                 = useState<AdminCreditsUser | null>(null)
  const [wallet, setWallet]             = useState<AdminCreditsWallet | null>(null)
  const [txs, setTxs]                   = useState<AdminCreditsTx[]>([])

  const [mode, setMode]                 = useState<'add' | 'remove'>('add')
  const [amount, setAmount]             = useState('')
  const [reason, setReason]             = useState('')
  const [adjustBusy, setAdjustBusy]     = useState(false)
  const [adjustErr, setAdjustErr]       = useState<string | null>(null)
  const [adjustOk, setAdjustOk]         = useState<string | null>(null)

  const [rev, setRev]                   = useState<AdminRevenueResponse | null>(null)
  const [revErr, setRevErr]             = useState<string | null>(null)
  const [revLoading, setRevLoading]     = useState(false)
  const [revDays, setRevDays]           = useState(30)

  const loadRevenue = useCallback(async () => {
    setRevErr(null)
    setRevLoading(true)
    try {
      setRev(await fetchAdminRevenue(revDays))
    } catch (e: unknown) {
      setRev(null)
      setRevErr(e instanceof Error ? e.message : 'Failed to load revenue')
    } finally {
      setRevLoading(false)
    }
  }, [revDays])

  useEffect(() => { loadRevenue() }, [loadRevenue])

  const runLookup = async () => {
    if (!query.trim()) return
    setLookupErr(null); setAdjustOk(null)
    setLoadingLookup(true)
    try {
      const data = await adminLookupCredits(query.trim())
      setUser(data.user); setWallet(data.wallet); setTxs(data.transactions)
    } catch (e: unknown) {
      setUser(null); setWallet(null); setTxs([])
      setLookupErr(e instanceof Error ? e.message : 'Lookup failed')
    } finally {
      setLoadingLookup(false)
    }
  }

  const runAdjust = async () => {
    if (!user) return
    const n = Number.parseInt(amount, 10)
    if (!Number.isFinite(n) || n <= 0) { setAdjustErr('Enter a positive whole number'); return }
    if (!reason.trim())                 { setAdjustErr('Reason is required'); return }
    setAdjustErr(null); setAdjustOk(null); setAdjustBusy(true)
    try {
      await adminAdjustCredits({ userId: user.id, mode, amount: n, reason: reason.trim() })
      setAdjustOk(mode === 'add' ? `+${n} credits added.` : `−${n} credits removed.`)
      setAmount(''); setReason('')
      const fresh = await adminLookupCredits(user.email || user.id)
      setWallet(fresh.wallet); setTxs(fresh.transactions)
      await loadRevenue()
    } catch (e: unknown) {
      setAdjustErr(e instanceof Error ? e.message : 'Adjustment failed')
    } finally {
      setAdjustBusy(false)
    }
  }

  const PERIOD_TABS = [
    { label: '7d',  value: 7  },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
  ]

  const inputStyle: React.CSSProperties = {
    borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)', color: '#f0e8f4',
    padding: '10px 14px', fontSize: 13, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  }

  return (
    <div>
      <AdminPageHeader
        icon={Coins}
        iconColor="#f59e0b"
        title="Credits & Revenue"
        subtitle="Lookup wallets, grant or remove credits, view purchase revenue and ledger mix."
        loading={revLoading}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {PERIOD_TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setRevDays(t.value)}
                style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: revDays === t.value ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.12)',
                  background: revDays === t.value ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                  color: revDays === t.value ? '#fde68a' : 'rgba(240,232,244,0.6)',
                }}
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={loadRevenue}
              disabled={revLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: revLoading ? 'not-allowed' : 'pointer',
                border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(240,232,244,0.7)',
                opacity: revLoading ? 0.5 : 1,
              }}
            >
              <RefreshCw size={13} strokeWidth={2.2} style={{ transform: revLoading ? 'rotate(360deg)' : 'none', transition: 'transform 0.4s' }} />
              Refresh
            </button>
          </div>
        }
      />

      <div className="a-credits-pad" style={{ padding: '24px 28px 48px', display: 'grid', gap: 24 }}>

        {/* ── Revenue section ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart3 size={14} color="#f59e0b" strokeWidth={2.5} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(240,232,244,0.45)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Income & Activity ({revDays} days)
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {revErr && (
            <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(127,29,29,0.25)', color: '#fecaca', fontSize: 13 }}>
              {revErr}
            </div>
          )}
          {rev?.note && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', fontSize: 12, color: 'rgba(240,232,244,0.45)' }}>
              {rev.note}
            </div>
          )}

          {/* KPI row */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
            <RevenueCard
              label="Credit-pack Revenue"
              value={rev?.stripe_orders
                ? `$${rev.stripe_orders.total_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'}
              sub={rev?.stripe_orders ? `${rev.stripe_orders.order_count} completed orders` : 'No Stripe data'}
              icon={DollarSign}
              iconColor="#f3cd86"
              iconBg="rgba(243,205,134,0.14)"
              accent="#f59e0b"
            />
            <RevenueCard
              label="Credits from Purchases"
              value={rev ? rev.credits_granted_from_credit_purchase.toLocaleString() : '—'}
              sub="Sum of credit_purchase rows"
              icon={ShoppingCart}
              iconColor="#a78bfa"
              iconBg="rgba(167,139,250,0.14)"
              accent="#a855f7"
            />
          </div>

          {/* Day bars + Tx type chart side-by-side */}
          <div className={`a-chartrow ${rev?.stripe_orders?.by_day?.length ? 'a-chartrow-split' : 'a-chartrow-single'}`}>
            {/* Transaction type bars */}
            <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '20px 22px' }}>
              <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#fff' }}>Ledger by Transaction Type</p>
              {revLoading
                ? <div style={{ height: 80, borderRadius: 10, background: 'rgba(255,255,255,0.05)', animation: 'credits-shimmer 1.4s infinite' }} />
                : <TxTypeChart rows={rev?.credit_transactions_by_type ?? []} />
              }
            </div>

            {/* Day revenue bars */}
            {rev?.stripe_orders?.by_day && rev.stripe_orders.by_day.length > 0 && (
              <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <DayRevenueBars days={rev.stripe_orders.by_day} />
              </div>
            )}
          </div>
        </div>

        {/* ── Wallet Lookup section ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Search size={14} color="#818cf8" strokeWidth={2.5} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(240,232,244,0.45)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              User Wallet Lookup
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={15} color="rgba(240,232,244,0.3)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runLookup()}
                placeholder="Search by email or user UUID…"
                style={{ ...inputStyle, paddingLeft: 40 }}
              />
            </div>
            <button
              type="button"
              disabled={loadingLookup}
              onClick={runLookup}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                borderRadius: 10, border: '1px solid rgba(240,56,104,0.4)',
                background: loadingLookup ? 'rgba(240,56,104,0.08)' : 'rgba(240,56,104,0.18)',
                color: '#ffd6df', padding: '0 20px', fontWeight: 700, fontSize: 13,
                cursor: loadingLookup ? 'wait' : 'pointer', whiteSpace: 'nowrap', height: 42,
              }}
            >
              <Search size={14} strokeWidth={2.2} />
              {loadingLookup ? 'Searching…' : 'Lookup'}
            </button>
          </div>

          {lookupErr && (
            <div style={{ padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(127,29,29,0.25)', color: '#fecaca', fontSize: 13, marginBottom: 14 }}>
              {lookupErr}
            </div>
          )}

          {/* User result */}
          {user && wallet && (
            <div style={{ display: 'grid', gap: 16 }}>

              {/* User card */}
              <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.02)', padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: 'linear-gradient(135deg, #f03868, #a855f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17, fontWeight: 800, color: '#fff',
                    boxShadow: '0 4px 14px rgba(240,56,104,0.25)',
                  }}>
                    {initials(user)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff' }}>
                        {user.full_name || user.username || user.email}
                      </p>
                      <span style={{
                        borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                        background: user.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        color: user.is_active ? '#86efac' : '#fca5a5',
                        border: `1px solid ${user.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(240,232,244,0.5)' }}>{user.email}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 11, fontFamily: 'ui-monospace, monospace', color: 'rgba(240,232,244,0.3)' }}>{user.id}</p>
                  </div>
                </div>

                {/* Wallet stats */}
                <div className="a-walletstats">
                  <WalletStat label="Balance"        value={wallet.balance}        color="#818cf8" icon={Wallet} />
                  <WalletStat label="Lifetime Earned" value={wallet.lifetime_earned} color="#22c55e" icon={ArrowUpRight} />
                  <WalletStat label="Lifetime Spent"  value={wallet.lifetime_spent}  color="#f03868" icon={ArrowDownRight} />
                </div>
              </div>

              {/* Adjust credits */}
              <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.02)', padding: '20px 22px' }}>
                <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#fff' }}>Adjust Credits</p>

                {/* Mode toggle */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {(['add', 'remove'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        border: mode === m
                          ? m === 'add' ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(239,68,68,0.5)'
                          : '1px solid rgba(255,255,255,0.1)',
                        background: mode === m
                          ? m === 'add' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'
                          : 'rgba(255,255,255,0.03)',
                        color: mode === m
                          ? m === 'add' ? '#86efac' : '#fca5a5'
                          : 'rgba(240,232,244,0.5)',
                      }}
                    >
                      {m === 'add' ? <Plus size={14} strokeWidth={2.5} /> : <Minus size={14} strokeWidth={2.5} />}
                      {m === 'add' ? 'Grant Credits' : 'Remove Credits'}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 10, alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'rgba(240,232,244,0.45)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</label>
                    <input
                      type="number" min={1} placeholder="e.g. 100"
                      value={amount} onChange={e => setAmount(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'rgba(240,232,244,0.45)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason (internal)</label>
                    <input
                      placeholder="e.g. Compensation, bug refund…"
                      value={reason} onChange={e => setReason(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && runAdjust()}
                      style={inputStyle}
                    />
                  </div>
                  <button
                    type="button" disabled={adjustBusy} onClick={runAdjust}
                    style={{
                      height: 42, padding: '0 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      cursor: adjustBusy ? 'wait' : 'pointer',
                      border: mode === 'add' ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(239,68,68,0.5)',
                      background: mode === 'add' ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
                      color: mode === 'add' ? '#86efac' : '#fca5a5',
                      opacity: adjustBusy ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {adjustBusy ? 'Applying…' : 'Apply'}
                  </button>
                </div>

                {adjustErr && (
                  <div style={{ marginTop: 12, padding: '9px 13px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.35)', background: 'rgba(127,29,29,0.22)', color: '#fecaca', fontSize: 12 }}>
                    {adjustErr}
                  </div>
                )}
                {adjustOk && (
                  <div style={{ marginTop: 12, padding: '9px 13px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)', color: '#86efac', fontSize: 12, fontWeight: 600 }}>
                    {adjustOk}
                  </div>
                )}
              </div>

              {/* Transaction ledger */}
              {txs.length > 0 && (
                <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Recent Ledger</span>
                    <span style={{ fontSize: 12, color: 'rgba(240,232,244,0.4)' }}>Latest {txs.length} transactions</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 560 }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}>
                          {['When', 'Type', 'Amount', 'Balance after', 'Note'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'rgba(240,232,244,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {txs.map(t => (
                          <tr key={t.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '10px 14px', color: 'rgba(240,232,244,0.6)', whiteSpace: 'nowrap' }}>{formatTs(t.created_at)}</td>
                            <td style={{ padding: '10px 14px', fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'rgba(200,210,255,0.8)' }}>{t.type}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: t.amount >= 0 ? '#86efac' : '#fca5a5', whiteSpace: 'nowrap' }}>
                              {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString()}
                            </td>
                            <td style={{ padding: '10px 14px', color: 'rgba(240,232,244,0.7)' }}>{t.balance_after.toLocaleString()}</td>
                            <td style={{ padding: '10px 14px', color: 'rgba(240,232,244,0.5)', maxWidth: 240, wordBreak: 'break-word' }}>{t.description ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes credits-shimmer {
          0%  { opacity: 0.5 }
          50% { opacity: 1   }
          100%{ opacity: 0.5 }
        }
      `}</style>
    </div>
  )
}
