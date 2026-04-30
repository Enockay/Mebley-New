'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  RefreshCw,
  Users,
  UserCheck,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Coins,
  Wallet,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Clock,
} from 'lucide-react'
import type { AdminOverviewStats } from '@/lib/admin-overview-api'
import { fetchAdminOverview } from '@/lib/admin-overview-api'

/* ─── Helpers ──────────────────────────────────────────────────── */

function pct(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

function fmt(n: number | string | undefined) {
  if (n === undefined || n === null) return '—'
  return typeof n === 'number' ? n.toLocaleString() : n
}

function today() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

/* ─── KPI Card ─────────────────────────────────────────────────── */

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  iconBg,
  accent,
  href,
  bar,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  accent: string
  href?: string
  bar?: number   // 0–100 fill
}) {
  const inner = (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${accent}28`,
        background: `linear-gradient(135deg, ${accent}0a 0%, rgba(255,255,255,0.02) 100%)`,
        padding: '18px 20px 16px',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: accent, opacity: 0.07, filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: iconBg, border: `1px solid ${accent}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <Icon size={18} color={iconColor} strokeWidth={2} />
        </div>
        {href && (
          <ArrowUpRight size={14} color={`${accent}80`} style={{ marginTop: 4 }} />
        )}
      </div>

      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'rgba(240,232,244,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 30, fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
        {fmt(value)}
      </p>
      {sub && (
        <p style={{ margin: '5px 0 0', fontSize: 12, color: 'rgba(240,232,244,0.45)' }}>{sub}</p>
      )}

      {bar !== undefined && (
        <div style={{ marginTop: 14 }}>
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(bar, 100)}%`,
                borderRadius: 99,
                background: `linear-gradient(90deg, ${accent}, ${accent}99)`,
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: `${accent}bb` }}>{bar}%</p>
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>{inner}</Link>
  }
  return inner
}

/* ─── Section title ────────────────────────────────────────────── */

function Section({ title, icon: Icon, iconColor, children }: {
  title: string
  icon: React.ElementType
  iconColor: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Icon size={14} color={iconColor} strokeWidth={2.5} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(240,232,244,0.55)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>
      {children}
    </div>
  )
}

/* ─── Horizontal stacked bar (moderation) ──────────────────────── */

function ModerationBar({ open, in_review, resolved, dismissed }: {
  open: number; in_review: number; resolved: number; dismissed: number
}) {
  const total = open + in_review + resolved + dismissed
  if (!total) return null

  const segments = [
    { label: 'Open',      value: open,      color: '#f03868', href: '/admin' },
    { label: 'In Review', value: in_review,  color: '#f59e0b', href: '/admin' },
    { label: 'Resolved',  value: resolved,   color: '#22c55e', href: '/admin' },
    { label: 'Dismissed', value: dismissed,  color: '#6366f1', href: '/admin' },
  ]

  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        padding: '20px 22px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Case Distribution</span>
        <span style={{ fontSize: 12, color: 'rgba(240,232,244,0.4)' }}>{total.toLocaleString()} total</span>
      </div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', gap: 2, marginBottom: 18 }}>
        {segments.map((s) => {
          const w = pct(s.value, total)
          if (!w) return null
          return (
            <div
              key={s.label}
              style={{
                height: '100%',
                width: `${w}%`,
                background: s.color,
                borderRadius: 99,
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                minWidth: 4,
              }}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
        {segments.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(240,232,244,0.65)', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{s.value.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: 'rgba(240,232,244,0.35)', minWidth: 30, textAlign: 'right' }}>
              {pct(s.value, total)}%
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ─── Horizontal bar row ───────────────────────────────────────── */

function BarRow({ label, value, max, color, suffix = '' }: {
  label: string; value: number; max: number; color: string; suffix?: string
}) {
  const fill = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'rgba(240,232,244,0.65)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
          {value.toLocaleString()}{suffix}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${fill}%`,
            borderRadius: 99,
            background: `linear-gradient(90deg, ${color}, ${color}99)`,
            transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  )
}

/* ─── Alert banner ─────────────────────────────────────────────── */

function AlertBanner({ critical, warning }: { critical: number; warning: number }) {
  if (!critical && !warning) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 24,
        padding: '12px 16px',
        borderRadius: 12,
        border: '1px solid rgba(239,68,68,0.35)',
        background: 'rgba(239,68,68,0.07)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
        <span style={{ fontSize: 13, color: '#fca5a5', fontWeight: 600 }}>System alerts</span>
      </div>
      {critical > 0 && (
        <span style={{ fontSize: 13, color: '#fca5a5' }}>
          <strong>{critical}</strong> critical issue{critical !== 1 ? 's' : ''}
        </span>
      )}
      {warning > 0 && (
        <span style={{ fontSize: 13, color: '#fde68a' }}>
          <strong>{warning}</strong> warning{warning !== 1 ? 's' : ''}
        </span>
      )}
      <Link
        href="/admin/ops"
        style={{
          marginLeft: 'auto', fontSize: 12, fontWeight: 700,
          color: '#fca5a5', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 4,
          border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8,
          padding: '4px 10px',
        }}
      >
        View Operations <ArrowUpRight size={12} />
      </Link>
    </div>
  )
}

/* ─── Skeleton loader ──────────────────────────────────────────── */

function Skeleton({ h = 90, radius = 16 }: { h?: number; radius?: number }) {
  return (
    <div
      style={{
        height: h, borderRadius: radius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  )
}

/* ─── Main component ───────────────────────────────────────────── */

export default function AdminOverviewPanel() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async (manual = false) => {
    if (manual) setSpinning(true)
    else setLoading(true)
    setError(null)
    try {
      setStats(await fetchAdminOverview())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
      setSpinning(false)
    }
  }

  useEffect(() => { load() }, [])

  const s = stats

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── Page header ── */}
      <header
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(8,6,20,0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          padding: '0 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          {/* Left */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <Activity size={16} color="#f03868" strokeWidth={2.2} />
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Overview
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={11} color="rgba(240,232,244,0.35)" />
              <span style={{ fontSize: 12, color: 'rgba(240,232,244,0.35)' }}>{today()}</span>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Live dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.07)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
              <span style={{ fontSize: 12, color: '#86efac', fontWeight: 600 }}>Live</span>
            </div>

            {/* Refresh */}
            <button
              onClick={() => load(true)}
              disabled={spinning || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 10,
                padding: '7px 14px',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(240,232,244,0.8)',
                fontSize: 13,
                fontWeight: 600,
                cursor: spinning || loading ? 'not-allowed' : 'pointer',
                opacity: spinning || loading ? 0.6 : 1,
                transition: 'background 0.15s',
              }}
            >
              <RefreshCw
                size={14}
                strokeWidth={2.2}
                style={{ transition: 'transform 0.4s', transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)' }}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Progress bar while loading */}
        {loading && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #f03868, #a855f7)',
                animation: 'progress-indeterminate 1.4s ease infinite',
                borderRadius: 99,
              }}
            />
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <div className="a-pad" style={{ padding: '28px 28px 48px' }}>

        {/* Animations */}
        <style>{`
          @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
          @keyframes progress-indeterminate {
            0%   { width: 0%; margin-left: 0% }
            50%  { width: 70%; margin-left: 15% }
            100% { width: 0%; margin-left: 100% }
          }
        `}</style>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(127,29,29,0.28)', color: '#fecaca', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Alerts */}
        {s && <AlertBanner critical={s.ops.open_critical} warning={s.ops.open_warning} />}

        {/* ── Top KPI row ── */}
        <div className="a-kpi4" style={{ marginBottom: 4 }}>
          {loading ? (
            [1,2,3,4].map(i => <Skeleton key={i} h={140} />)
          ) : (
            <>
              <KpiCard
                label="Total Users"
                value={s?.users.total ?? 0}
                sub="all registered accounts"
                icon={Users}
                iconColor="#818cf8"
                iconBg="rgba(129,140,248,0.15)"
                accent="#818cf8"
                href="/admin/users"
              />
              <KpiCard
                label="Active Accounts"
                value={s?.users.active ?? 0}
                sub={s ? `${pct(s.users.active, s.users.total)}% of total` : undefined}
                icon={UserCheck}
                iconColor="#22c55e"
                iconBg="rgba(34,197,94,0.15)"
                accent="#22c55e"
                href="/admin/users"
                bar={s ? pct(s.users.active, s.users.total) : 0}
              />
              <KpiCard
                label="New This Week"
                value={s?.users.this_week ?? 0}
                sub={s ? `${s.users.today} today` : undefined}
                icon={UserPlus}
                iconColor="#f59e0b"
                iconBg="rgba(245,158,11,0.15)"
                accent="#f59e0b"
              />
              <KpiCard
                label="Open Cases"
                value={s?.moderation.open ?? 0}
                sub={s?.moderation.in_review ? `${s.moderation.in_review} in review` : 'none in review'}
                icon={ShieldAlert}
                iconColor={s && s.moderation.open > 0 ? '#f03868' : '#6366f1'}
                iconBg={s && s.moderation.open > 0 ? 'rgba(240,56,104,0.15)' : 'rgba(99,102,241,0.15)'}
                accent={s && s.moderation.open > 0 ? '#f03868' : '#6366f1'}
                href="/admin"
              />
            </>
          )}
        </div>

        {/* ── Middle row: User breakdown + Moderation bar ── */}
        <Section title="Users & Verification" icon={TrendingUp} iconColor="#818cf8">
          <div className="a-kpi2" style={{ gap: 16 }}>
            {/* User bars */}
            {loading ? (
              <><Skeleton h={180} /><Skeleton h={180} /></>
            ) : (
              <>
                <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '20px 22px' }}>
                  <p style={{ margin: '0 0 18px', fontSize: 13, fontWeight: 700, color: '#fff' }}>Account Breakdown</p>
                  <BarRow label="Active accounts"    value={s?.users.active ?? 0}   max={s?.users.total ?? 1} color="#22c55e" />
                  <BarRow label="Email verified"     value={s?.users.verified ?? 0}  max={s?.users.total ?? 1} color="#818cf8" />
                  <BarRow label="Joined this week"   value={s?.users.this_week ?? 0} max={s?.users.total ?? 1} color="#f59e0b" />
                  <BarRow label="Joined today"       value={s?.users.today ?? 0}     max={s?.users.this_week ?? 1} color="#f03868" />
                </div>

                <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '20px 22px' }}>
                  <p style={{ margin: '0 0 18px', fontSize: 13, fontWeight: 700, color: '#fff' }}>Platform Health</p>
                  {[
                    { label: 'Verified rate',   value: pct(s?.users.verified ?? 0, s?.users.total ?? 1), color: '#818cf8' },
                    { label: 'Active rate',     value: pct(s?.users.active ?? 0,   s?.users.total ?? 1), color: '#22c55e' },
                    { label: 'Resolved cases',  value: pct(s?.moderation.resolved ?? 0, Math.max((s?.moderation.open ?? 0) + (s?.moderation.resolved ?? 0) + (s?.moderation.dismissed ?? 0), 1)), color: '#34d399' },
                    { label: 'Cases dismissed', value: pct(s?.moderation.dismissed ?? 0, Math.max((s?.moderation.open ?? 0) + (s?.moderation.resolved ?? 0) + (s?.moderation.dismissed ?? 0), 1)), color: '#6366f1' },
                  ].map(row => (
                    <div key={row.label} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: 'rgba(240,232,244,0.6)' }}>{row.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.value}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${row.value}%`, borderRadius: 99, background: `linear-gradient(90deg, ${row.color}, ${row.color}99)`, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Section>

        {/* ── Moderation distribution ── */}
        <Section title="Moderation" icon={ShieldCheck} iconColor="#f03868">
          {loading
            ? <Skeleton h={160} />
            : s && <ModerationBar
                open={s.moderation.open}
                in_review={s.moderation.in_review}
                resolved={s.moderation.resolved}
                dismissed={s.moderation.dismissed}
              />
          }
        </Section>

        {/* ── Credits ── */}
        <Section title="Credits & Wallets" icon={Coins} iconColor="#f59e0b">
          {loading ? (
            <div className="a-kpi2">
              <Skeleton h={110} /><Skeleton h={110} />
            </div>
          ) : (
            <div className="a-autofill">
              <KpiCard
                label="Active Wallets"
                value={s?.credits.wallets ?? 0}
                icon={Wallet}
                iconColor="#f59e0b"
                iconBg="rgba(245,158,11,0.15)"
                accent="#f59e0b"
                href="/admin/credits"
              />
              <KpiCard
                label="Total Credit Balance"
                value={s ? s.credits.total_balance.toLocaleString() : 0}
                sub="across all wallets"
                icon={Coins}
                iconColor="#fbbf24"
                iconBg="rgba(251,191,36,0.13)"
                accent="#fbbf24"
                href="/admin/credits"
              />
            </div>
          )}
        </Section>

        {/* ── Ops ── */}
        <Section title="Operations" icon={AlertTriangle} iconColor="#ef4444">
          {loading ? (
            <div className="a-kpi2">
              <Skeleton h={110} /><Skeleton h={110} />
            </div>
          ) : (
            <div className="a-autofill">
              <KpiCard
                label="Critical Issues"
                value={s?.ops.open_critical ?? 0}
                sub={s?.ops.open_critical === 0 ? 'All clear' : 'Needs attention'}
                icon={XCircle}
                iconColor={s && s.ops.open_critical > 0 ? '#ef4444' : '#22c55e'}
                iconBg={s && s.ops.open_critical > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.12)'}
                accent={s && s.ops.open_critical > 0 ? '#ef4444' : '#22c55e'}
                href="/admin/ops"
              />
              <KpiCard
                label="Open Warnings"
                value={s?.ops.open_warning ?? 0}
                sub={s?.ops.open_warning === 0 ? 'No warnings' : 'Review needed'}
                icon={AlertTriangle}
                iconColor={s && s.ops.open_warning > 0 ? '#f59e0b' : '#22c55e'}
                iconBg={s && s.ops.open_warning > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.12)'}
                accent={s && s.ops.open_warning > 0 ? '#f59e0b' : '#22c55e'}
                href="/admin/ops"
              />
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
