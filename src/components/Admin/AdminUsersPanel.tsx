'use client'

import { useCallback, useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import type { AdminUser } from '@/lib/admin-users-api'
import { fetchAdminUsers, setAdminUserStatus } from '@/lib/admin-users-api'
import AdminPageHeader from '@/components/Admin/AdminPageHeader'

const PAGE_SIZE = 50

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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 700,
        background: active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
        color: active ? '#86efac' : '#fca5a5',
        border: `1px solid ${active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
      }}
    >
      {active ? 'Active' : 'Banned'}
    </span>
  )
}

function TierBadge({ tier }: { tier: string | null }) {
  const t = tier ?? 'free'
  const colors: Record<string, { bg: string; fg: string; border: string }> = {
    premium: { bg: 'rgba(234,179,8,0.15)', fg: '#fde68a', border: 'rgba(234,179,8,0.3)' },
    vip:     { bg: 'rgba(168,85,247,0.15)', fg: '#d8b4fe', border: 'rgba(168,85,247,0.3)' },
    free:    { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(240,232,244,0.55)', border: 'rgba(255,255,255,0.12)' },
  }
  const c = colors[t] ?? colors.free
  return (
    <span
      style={{
        borderRadius: 999,
        padding: '2px 7px',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
      }}
    >
      {t}
    </span>
  )
}

const cellStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '9px 0',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}
const labelStyle: React.CSSProperties = { fontSize: 12, color: 'rgba(240,232,244,0.5)' }
const valueStyle: React.CSSProperties = { fontSize: 13, color: '#f0e8f4', fontWeight: 500 }

export default function AdminUsersPanel() {
  const [query, setQuery]               = useState('')
  const [debouncedQ, setDebouncedQ]     = useState('')
  const [users, setUsers]               = useState<AdminUser[]>([])
  const [total, setTotal]               = useState(0)
  const [offset, setOffset]             = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [selected, setSelected]         = useState<AdminUser | null>(null)
  const [actionBusy, setActionBusy]     = useState(false)
  const [feedback, setFeedback]         = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 320)
    return () => clearTimeout(t)
  }, [query])

  const load = useCallback(async (q: string, off: number) => {
    setLoading(true)
    setError(null)
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
      setUsers([])
      setSelected(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setOffset(0)
    load(debouncedQ, 0)
  }, [debouncedQ, load])

  const handleSelect = (u: AdminUser) => {
    setSelected(u)
    setFeedback(null)
  }

  const handleStatusToggle = async () => {
    if (!selected || actionBusy) return
    const action = selected.is_active ? 'deactivate' : 'activate'
    setActionBusy(true)
    setFeedback(null)
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

  return (
    <div>
      <AdminPageHeader
        icon={Users}
        iconColor="#22c55e"
        title="User Management"
        subtitle="Browse, search, and manage accounts."
        loading={loading}
        right={
          <span style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.07)', fontSize: 12, color: '#86efac', fontWeight: 600 }}>
            {total.toLocaleString()} users
          </span>
        }
      />

      <div className="a-inner-pad" style={{ padding: '16px 16px 24px' }}>
        <input
          type="text"
          placeholder="Search by email, username, or name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 14,
            color: '#f0e8f4',
            outline: 'none',
            marginBottom: 14,
          }}
        />

        {loading && (
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14,
              padding: 14,
              color: 'rgba(240,232,244,0.7)',
              fontSize: 13,
            }}
          >
            Loading users…
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              border: '1px solid rgba(248,113,113,0.45)',
              background: 'rgba(127,29,29,0.32)',
              borderRadius: 14,
              padding: 14,
              color: '#fecaca',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <section className="a-twopanel">
            {/* User list */}
            <div
              style={{
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                overflow: 'hidden',
              }}
            >
              {users.length === 0 ? (
                <div
                  style={{
                    padding: 20,
                    fontSize: 13,
                    color: 'rgba(240,232,244,0.45)',
                    textAlign: 'center',
                  }}
                >
                  No users found.
                </div>
              ) : (
                users.map((u) => {
                  const isSelected = selected?.id === u.id
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSelect(u)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '11px 14px',
                        background: isSelected ? 'rgba(240,56,104,0.12)' : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        cursor: 'pointer',
                        border: 'none',
                        borderLeft: isSelected ? '3px solid rgba(240,56,104,0.8)' : '3px solid transparent',
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#f0e8f4',
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {u.email}
                        </span>
                        <StatusBadge active={u.is_active} />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 7,
                          marginTop: 4,
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        {u.username && (
                          <span style={{ fontSize: 11, color: 'rgba(240,232,244,0.5)' }}>
                            @{u.username}
                          </span>
                        )}
                        <TierBadge tier={u.tier} />
                        <span style={{ fontSize: 11, color: 'rgba(240,232,244,0.38)' }}>
                          {formatDate(u.created_at)}
                        </span>
                      </div>
                    </button>
                  )
                })
              )}

              {total > PAGE_SIZE && (
                <div
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <button
                    disabled={offset === 0}
                    onClick={() => {
                      const o = Math.max(0, offset - PAGE_SIZE)
                      setOffset(o)
                      load(debouncedQ, o)
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent',
                      color: 'rgba(240,232,244,0.8)',
                      cursor: offset === 0 ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      opacity: offset === 0 ? 0.4 : 1,
                    }}
                  >
                    Prev
                  </button>
                  <span style={{ fontSize: 12, color: 'rgba(240,232,244,0.45)' }}>
                    {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
                  </span>
                  <button
                    disabled={offset + PAGE_SIZE >= total}
                    onClick={() => {
                      const o = offset + PAGE_SIZE
                      setOffset(o)
                      load(debouncedQ, o)
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent',
                      color: 'rgba(240,232,244,0.8)',
                      cursor: offset + PAGE_SIZE >= total ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      opacity: offset + PAGE_SIZE >= total ? 0.4 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Detail panel */}
            {selected ? (
              <div
                style={{
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                  padding: 18,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                    >
                      <h3 style={{ margin: 0, fontSize: 15, color: '#ffffff' }}>
                        {selected.full_name || '(no name)'}
                      </h3>
                      <StatusBadge active={selected.is_active} />
                      <TierBadge tier={selected.tier} />
                    </div>
                    {selected.username && (
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(240,232,244,0.5)' }}>
                        @{selected.username}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleStatusToggle}
                    disabled={actionBusy}
                    style={{
                      borderRadius: 10,
                      border: selected.is_active
                        ? '1px solid rgba(239,68,68,0.5)'
                        : '1px solid rgba(34,197,94,0.5)',
                      background: selected.is_active
                        ? 'rgba(239,68,68,0.14)'
                        : 'rgba(34,197,94,0.14)',
                      color: selected.is_active ? '#fca5a5' : '#86efac',
                      padding: '8px 14px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: actionBusy ? 'not-allowed' : 'pointer',
                      opacity: actionBusy ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {actionBusy ? '…' : selected.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>

                {feedback && (
                  <div
                    style={{
                      marginBottom: 14,
                      padding: '10px 12px',
                      borderRadius: 10,
                      fontSize: 13,
                      background: feedback.ok
                        ? 'rgba(34,197,94,0.1)'
                        : 'rgba(239,68,68,0.12)',
                      border: `1px solid ${feedback.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      color: feedback.ok ? '#86efac' : '#fca5a5',
                    }}
                  >
                    {feedback.msg}
                  </div>
                )}

                <div style={{ display: 'grid', gap: 0 }}>
                  {([
                    ['Email', selected.email],
                    ['Joined', formatDate(selected.created_at)],
                    ['Last active', timeAgo(selected.last_active)],
                    ['Credits', selected.credit_balance != null ? selected.credit_balance.toLocaleString() : '—'],
                    ['Email verified', selected.email_verified ? 'Yes' : 'No'],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} style={cellStyle}>
                      <span style={labelStyle}>{label}</span>
                      <span style={valueStyle}>{value}</span>
                    </div>
                  ))}
                </div>

                <p
                  style={{ marginTop: 12, fontSize: 11, color: 'rgba(240,232,244,0.3)', wordBreak: 'break-all' }}
                >
                  ID: <span style={{ fontFamily: 'ui-monospace, monospace' }}>{selected.id}</span>
                </p>
              </div>
            ) : (
              <div
                style={{
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                  padding: 20,
                  textAlign: 'center',
                  color: 'rgba(240,232,244,0.38)',
                  fontSize: 13,
                }}
              >
                Select a user to view details.
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
