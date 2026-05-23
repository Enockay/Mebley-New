'use client'

import { useCallback, useEffect, useState } from 'react'
import { Users, Heart, Zap, Star, Eye, EyeOff, MapPin, Globe, Search, ChevronLeft, ChevronRight, Shield, CheckCircle, XCircle } from 'lucide-react'
import type { AdminUser } from '@/lib/admin-users-api'
import { fetchAdminUsers, setAdminUserStatus } from '@/lib/admin-users-api'
import AdminPageHeader from '@/components/Admin/AdminPageHeader'

const PAGE_SIZE = 50

const C = {
  rose:    '#f03868',
  coral:   '#ff7a50',
  border:  'rgba(255,255,255,0.08)',
  card:    'rgba(255,255,255,0.04)',
  cardHov: 'rgba(255,255,255,0.07)',
  muted:   'rgba(240,232,244,0.45)',
  text:    '#f0e8f4',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function Avatar({ photos, name, size = 40, active }: { photos: { url: string }[]; name: string | null; size?: number; active?: boolean }) {
  const url = photos?.[0]?.url
  const initials = (name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const dotSize = Math.round(size * 0.28)
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name ?? ''} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.border}` }} />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: `linear-gradient(135deg, rgba(240,56,104,0.5), rgba(255,122,80,0.5))`,
          border: `2px solid rgba(240,56,104,0.35)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: Math.round(size * 0.34), fontWeight: 700, color: '#fff',
        }}>
          {initials}
        </div>
      )}
      {active != null && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: active ? '#22c55e' : '#ef4444',
          border: '2px solid #0d0b22',
        }} />
      )}
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
      background: active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      color: active ? '#86efac' : '#fca5a5',
      border: `1px solid ${active ? 'rgba(34,197,94,0.28)' : 'rgba(239,68,68,0.28)'}`,
    }}>
      {active ? <CheckCircle size={9} /> : <XCircle size={9} />}
      {active ? 'Active' : 'Banned'}
    </span>
  )
}

function TierBadge({ tier }: { tier: string | null }) {
  const t = tier ?? 'free'
  const map: Record<string, { bg: string; fg: string; border: string }> = {
    premium: { bg: 'rgba(234,179,8,0.12)', fg: '#fde68a', border: 'rgba(234,179,8,0.28)' },
    vip:     { bg: 'rgba(168,85,247,0.12)', fg: '#d8b4fe', border: 'rgba(168,85,247,0.28)' },
    free:    { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(240,232,244,0.5)', border: 'rgba(255,255,255,0.1)' },
  }
  const c = map[t] ?? map.free
  return (
    <span style={{ borderRadius: 999, padding: '2px 7px', fontSize: 10, fontWeight: 700, textTransform: 'capitalize', background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}>
      {t}
    </span>
  )
}

function StatCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number | string; color: string; bg: string }) {
  return (
    <div style={{ flex: 1, minWidth: 90, borderRadius: 12, padding: '12px 14px', background: bg, border: `1px solid ${color}28`, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ color, display: 'flex', opacity: 0.9 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 3, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.rose, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(240,56,104,0.25), transparent)' }} />
    </div>
  )
}

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 13, color: C.text, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon}{value}
      </span>
    </div>
  )
}

function TagList({ tags, color }: { tags: string[]; color: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
      {tags.map((t) => (
        <span key={t} style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '3px 10px', background: `${color}18`, color, border: `1px solid ${color}38` }}>
          {t}
        </span>
      ))}
    </div>
  )
}

function PaginationBar({ offset, total, pageSize, onPrev, onNext }: { offset: number; total: number; pageSize: number; onPrev: () => void; onNext: () => void }) {
  const from = offset + 1
  const to   = Math.min(offset + pageSize, total)
  const pct  = total > 0 ? (to / total) * 100 : 0
  const hasPrev = offset > 0
  const hasNext = offset + pageSize < total

  return (
    <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.2)' }}>
      {/* Progress bar */}
      <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.08)', marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(to right, ${C.rose}, ${C.coral})`, borderRadius: 999, transition: 'width 0.3s ease' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button
          onClick={onPrev} disabled={!hasPrev}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: hasPrev ? 'rgba(255,255,255,0.06)' : 'transparent', color: hasPrev ? C.text : 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 600, cursor: hasPrev ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
          <ChevronLeft size={14} /> Prev
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{from}–{to}</span>
          <span style={{ fontSize: 12, color: C.muted }}> of </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.rose }}>{total.toLocaleString()}</span>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>Showing {to - from + 1} users</div>
        </div>

        <button
          onClick={onNext} disabled={!hasNext}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: hasNext ? 'rgba(255,255,255,0.06)' : 'transparent', color: hasNext ? C.text : 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 600, cursor: hasNext ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default function AdminUsersPanel() {
  const [query, setQuery]           = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [users, setUsers]           = useState<AdminUser[]>([])
  const [total, setTotal]           = useState(0)
  const [offset, setOffset]         = useState(0)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [selected, setSelected]     = useState<AdminUser | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [feedback, setFeedback]     = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 320)
    return () => clearTimeout(t)
  }, [query])

  const load = useCallback(async (q: string, off: number) => {
    setLoading(true); setError(null)
    try {
      const res = await fetchAdminUsers({ q: q || undefined, limit: PAGE_SIZE, offset: off })
      setUsers(res.users)
      setTotal(res.total)
      setSelected((prev) => {
        if (prev && res.users.some((u) => u.id === prev.id)) return prev
        return res.users[0] ?? null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
      setUsers([]); setSelected(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { setOffset(0); load(debouncedQ, 0) }, [debouncedQ, load])

  const handleStatusToggle = async () => {
    if (!selected || actionBusy) return
    const action = selected.is_active ? 'deactivate' : 'activate'
    setActionBusy(true); setFeedback(null)
    try {
      await setAdminUserStatus(selected.id, action)
      const updated = { ...selected, is_active: !selected.is_active }
      setSelected(updated)
      setUsers((prev) => prev.map((u) => (u.id === selected.id ? updated : u)))
      setFeedback({ ok: true, msg: action === 'deactivate' ? 'User deactivated.' : 'User reactivated.' })
    } catch (err) {
      setFeedback({ ok: false, msg: err instanceof Error ? err.message : 'Action failed' })
    } finally {
      setActionBusy(false)
    }
  }

  const goPage = (newOffset: number) => { setOffset(newOffset); load(debouncedQ, newOffset) }

  return (
    <div>
      <AdminPageHeader
        icon={Users} iconColor="#22c55e"
        title="User Management"
        subtitle="Browse, search, and manage all accounts."
        loading={loading}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ padding: '5px 14px', borderRadius: 999, border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.08)', fontSize: 12, color: '#86efac', fontWeight: 700 }}>
              {total.toLocaleString()} total
            </div>
          </div>
        }
      />

      <div style={{ padding: '16px 16px 24px' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by email, username, or name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '10px 14px 10px 38px',
              fontSize: 13.5, color: C.text, outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(240,56,104,0.45)' }}
            onBlur={e => { e.currentTarget.style.borderColor = C.border }}
          />
        </div>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40, color: C.muted, fontSize: 13 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${C.rose}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
            Loading users…
          </div>
        )}

        {error && !loading && (
          <div style={{ borderRadius: 12, padding: '12px 16px', background: 'rgba(127,29,29,0.32)', border: '1px solid rgba(248,113,113,0.35)', color: '#fecaca', fontSize: 13 }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="a-twopanel">
            {/* ── USER LIST ── */}
            <div style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: 'rgba(13,11,34,0.6)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '82vh' }}>

              {/* List header */}
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted }}>Members</span>
                <span style={{ fontSize: 11, color: C.rose, fontWeight: 700 }}>{users.length} shown</span>
              </div>

              {users.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontSize: 13 }}>No users found.</div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {users.map((u) => {
                    const isSelected = selected?.id === u.id
                    return (
                      <button
                        key={u.id}
                        onClick={() => { setSelected(u); setFeedback(null) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          width: '100%', textAlign: 'left',
                          padding: '11px 14px',
                          background: isSelected ? 'rgba(240,56,104,0.1)' : 'transparent',
                          borderBottom: `1px solid ${C.border}`,
                          cursor: 'pointer', border: 'none',
                          borderLeft: `3px solid ${isSelected ? C.rose : 'transparent'}`,
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                      >
                        <Avatar photos={u.photos} name={u.full_name} size={38} active={u.is_active} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.email}
                            </span>
                            <StatusBadge active={u.is_active} />
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {u.username && <span style={{ fontSize: 11, color: C.muted }}>@{u.username}</span>}
                            <TierBadge tier={u.tier} />
                            <span style={{ fontSize: 10.5, color: 'rgba(240,232,244,0.3)', marginLeft: 'auto' }}>{formatDate(u.created_at)}</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Pagination */}
              {total > PAGE_SIZE && (
                <PaginationBar
                  offset={offset} total={total} pageSize={PAGE_SIZE}
                  onPrev={() => goPage(Math.max(0, offset - PAGE_SIZE))}
                  onNext={() => goPage(offset + PAGE_SIZE)}
                />
              )}
            </div>

            {/* ── DETAIL PANEL ── */}
            {selected ? (
              <div style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: 'rgba(13,11,34,0.6)', overflowY: 'auto', maxHeight: '82vh' }}>

                {/* Hero header */}
                <div style={{ padding: '20px 20px 16px', background: 'linear-gradient(to bottom, rgba(240,56,104,0.07), transparent)', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <Avatar photos={selected.photos} name={selected.full_name} size={56} active={selected.is_active} />
                      <div>
                        <h3 style={{ margin: '0 0 5px', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                          {selected.full_name || <span style={{ color: C.muted, fontStyle: 'italic' }}>No name</span>}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {selected.username && (
                            <span style={{ fontSize: 12, color: C.muted }}>@{selected.username}</span>
                          )}
                          <StatusBadge active={selected.is_active} />
                          <TierBadge tier={selected.tier} />
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(240,232,244,0.3)', marginTop: 4 }}>
                          {selected.email}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleStatusToggle}
                      disabled={actionBusy}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 700,
                        border: selected.is_active ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(34,197,94,0.4)',
                        background: selected.is_active ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                        color: selected.is_active ? '#fca5a5' : '#86efac',
                        cursor: actionBusy ? 'not-allowed' : 'pointer',
                        opacity: actionBusy ? 0.6 : 1, whiteSpace: 'nowrap', transition: 'all 0.15s',
                      }}
                    >
                      <Shield size={13} />
                      {actionBusy ? 'Working…' : selected.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>

                  {feedback && (
                    <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 10, fontSize: 12.5, background: feedback.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${feedback.ok ? 'rgba(34,197,94,0.28)' : 'rgba(239,68,68,0.28)'}`, color: feedback.ok ? '#86efac' : '#fca5a5' }}>
                      {feedback.msg}
                    </div>
                  )}
                </div>

                <div style={{ padding: '4px 20px 24px' }}>

                  {/* Stat cards */}
                  <SectionDivider label="Activity" />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <StatCard icon={<Heart size={16} />} label="Likes received" value={selected.likes_received} color="#f43f5e" bg="rgba(244,63,94,0.08)" />
                    <StatCard icon={<Zap size={16} />} label="Likes sent" value={selected.likes_sent} color="#f97316" bg="rgba(249,115,22,0.08)" />
                    <StatCard icon={<Star size={16} />} label="Matches" value={selected.matches_count} color="#a855f7" bg="rgba(168,85,247,0.08)" />
                    {selected.profile_completeness != null && (
                      <StatCard icon={<Eye size={16} />} label="Profile" value={`${selected.profile_completeness}%`} color="#22d3ee" bg="rgba(34,211,238,0.08)" />
                    )}
                  </div>

                  {/* Photos */}
                  {selected.photos?.length > 0 && (
                    <>
                      <SectionDivider label="Photos" />
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {selected.photos.map((ph, i) => (
                          <a key={i} href={ph.url} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={ph.url} alt={`Photo ${i + 1}`} style={{ width: 68, height: 68, objectFit: 'cover', borderRadius: 10, border: `1px solid ${C.border}`, transition: 'border-color 0.15s' }} />
                          </a>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Account */}
                  <SectionDivider label="Account" />
                  <InfoRow label="Email" value={selected.email} />
                  <InfoRow label="Joined" value={formatDate(selected.created_at)} />
                  <InfoRow label="Last active" value={timeAgo(selected.last_active)} />
                  <InfoRow label="Credits" value={selected.credit_balance != null ? selected.credit_balance.toLocaleString() : '—'} />
                  <InfoRow label="Email verified" value={selected.email_verified ? <span style={{ color: '#86efac', display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={12} /> Yes</span> : <span style={{ color: '#fca5a5', display:'flex', alignItems:'center', gap:4 }}><XCircle size={12} /> No</span>} />
                  <InfoRow label="Plan" value={<TierBadge tier={selected.plan ?? 'free'} />} />
                  <InfoRow label="Plan expires" value={formatDate(selected.plan_expires)} />

                  {/* Profile */}
                  <SectionDivider label="Profile" />
                  {selected.gender    && <InfoRow label="Gender"      value={selected.gender} />}
                  {selected.age_range && <InfoRow label="Age range"   value={selected.age_range} />}
                  {selected.location  && <InfoRow label="Location"    value={selected.location}    icon={<MapPin size={12} color={C.muted} />} />}
                  {selected.nationality && <InfoRow label="Nationality" value={selected.nationality} icon={<Globe size={12} color={C.muted} />} />}
                  {selected.visible != null && (
                    <InfoRow label="Visible" value={selected.visible
                      ? <span style={{ color: '#86efac', display:'flex', alignItems:'center', gap:4 }}><Eye size={12} /> Yes</span>
                      : <span style={{ color: '#fca5a5', display:'flex', alignItems:'center', gap:4 }}><EyeOff size={12} /> No</span>} />
                  )}

                  {/* Bio */}
                  {selected.bio && (
                    <>
                      <SectionDivider label="Bio" />
                      <p style={{ margin: 0, fontSize: 13, color: 'rgba(240,232,244,0.8)', lineHeight: 1.6, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', border: `1px solid ${C.border}` }}>
                        {selected.bio}
                      </p>
                    </>
                  )}

                  {/* Tags */}
                  {selected.looking_for?.length > 0 && (
                    <><SectionDivider label="Looking for" /><TagList tags={selected.looking_for} color="#f43f5e" /></>
                  )}
                  {(selected.gender_preference?.length ?? 0) > 0 && (
                    <><SectionDivider label="Gender preference" /><TagList tags={selected.gender_preference!} color="#a855f7" /></>
                  )}
                  {selected.interests?.length > 0 && (
                    <><SectionDivider label="Interests" /><TagList tags={selected.interests} color="#22d3ee" /></>
                  )}

                  {/* Prompts */}
                  {selected.prompts?.length > 0 && (
                    <>
                      <SectionDivider label="Prompts" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selected.prompts.map((pr, i) => (
                          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', border: `1px solid ${C.border}` }}>
                            <p style={{ margin: 0, fontSize: 10, color: C.rose, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{pr.question}</p>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.text, lineHeight: 1.5 }}>{pr.answer}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* ID */}
                  <div style={{ marginTop: 20, padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>User ID</span>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(240,232,244,0.4)', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>{selected.id}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: 'rgba(13,11,34,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: C.muted, fontSize: 13 }}>
                Select a user to view details.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
