'use client'

import { useCallback, useEffect, useState } from 'react'
import { BadgeCheck, Clock, CheckCircle, XCircle, User, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import AdminControlShell from '@/components/Admin/AdminControlShell'
import AdminPageHeader from '@/components/Admin/AdminPageHeader'
import { useAdminGuard } from '@/hooks/useAdminGuard'

type VerifStatus = 'pending' | 'approved' | 'all'

type Submission = {
  user_id: string
  username: string | null
  full_name: string | null
  email: string
  photo_verified: boolean
  verification_submitted_at: string | null
  verification_notes: string | null
  photos: { slot: number; url: string }[]
  created_at: string
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60)    return 'just now'
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

/* ── Inline style tokens ── */
const S = {
  bg:         '#080614',
  card:       'rgba(255,255,255,0.03)',
  border:     'rgba(255,255,255,0.08)',
  borderFocus:'rgba(240,56,104,0.4)',
  text:       '#f0e8f4',
  muted:      'rgba(240,232,244,0.5)',
  faint:      'rgba(240,232,244,0.25)',
  rose:       '#f03868',
  green:      '#22c55e',
  amber:      '#f59e0b',
} as const

function StatusPill({ verified }: { verified: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: verified ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
      border: `1px solid ${verified ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
      color: verified ? '#4ade80' : '#fbbf24',
    }}>
      {verified ? <CheckCircle size={11} /> : <Clock size={11} />}
      {verified ? 'Verified' : 'Pending'}
    </span>
  )
}

function NoteInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Optional note…"
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '7px 10px',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${S.border}`,
        borderRadius: 8,
        fontSize: 12, color: S.text,
        outline: 'none',
        fontFamily: "'DM Sans', sans-serif",
      }}
    />
  )
}

function SubmissionCard({
  sub,
  onAction,
}: {
  sub: Submission
  onAction: (userId: string, action: 'approve' | 'reject', notes: string) => Promise<void>
}) {
  const [note, setNote]         = useState(sub.verification_notes ?? '')
  const [acting, setActing]     = useState(false)
  const [expanded, setExpanded] = useState(false)

  const primaryPhoto = sub.photos?.find(p => p.slot === 0)?.url ?? null

  const handle = async (action: 'approve' | 'reject') => {
    setActing(true)
    await onAction(sub.user_id, action, note)
    setActing(false)
  }

  return (
    <div style={{
      background: S.card,
      border: `1px solid ${S.border}`,
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        borderBottom: expanded ? `1px solid ${S.border}` : 'none',
        cursor: 'pointer',
      }} onClick={() => setExpanded(e => !e)}>

        {/* Avatar */}
        <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {primaryPhoto ? (
            <Image src={primaryPhoto} alt={sub.username ?? ''} width={44} height={44} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
          ) : (
            <User size={20} color={S.faint} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: S.text }}>
              {sub.full_name || sub.username || '—'}
            </span>
            <StatusPill verified={sub.photo_verified} />
          </div>
          <span style={{ fontSize: 12, color: S.muted }}>
            @{sub.username ?? '?'} · {sub.email}
          </span>
        </div>

        {/* Time + chevron */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: S.faint }}>
            {sub.verification_submitted_at ? timeAgo(sub.verification_submitted_at) : '—'}
          </div>
          <ChevronDown
            size={14}
            color={S.faint}
            style={{ marginTop: 4, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          />
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '16px' }}>
          {/* Photos strip */}
          {sub.photos && sub.photos.length > 0 ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {sub.photos.slice(0, 6).map((photo, i) => (
                <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: `1px solid ${S.border}` }}>
                  <Image src={photo.url} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                  {photo.slot === 0 && (
                    <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 9, fontWeight: 700, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '1px 5px', borderRadius: 4 }}>
                      Main
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: S.faint, marginBottom: 16 }}>No profile photos uploaded.</p>
          )}

          {/* Previous note */}
          {sub.verification_notes && (
            <p style={{ fontSize: 12, color: S.muted, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: S.faint }}>Previous note: </span>
              {sub.verification_notes}
            </p>
          )}

          {/* Note input */}
          <div style={{ marginBottom: 12 }}>
            <NoteInput value={note} onChange={setNote} />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={acting || sub.photo_verified}
              onClick={() => handle('approve')}
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 10,
                background: acting || sub.photo_verified ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.15)',
                border: `1px solid ${acting || sub.photo_verified ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.4)'}`,
                color: sub.photo_verified ? 'rgba(74,222,128,0.4)' : '#4ade80',
                fontSize: 12, fontWeight: 700, cursor: acting || sub.photo_verified ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'background 0.15s',
              }}>
              <CheckCircle size={13} />
              {sub.photo_verified ? 'Already approved' : acting ? 'Saving…' : 'Approve'}
            </button>
            <button
              disabled={acting}
              onClick={() => handle('reject')}
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 10,
                background: 'rgba(240,56,104,0.1)',
                border: '1px solid rgba(240,56,104,0.3)',
                color: '#fda4b4',
                fontSize: 12, fontWeight: 700, cursor: acting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'background 0.15s',
              }}>
              <XCircle size={13} />
              {acting ? 'Saving…' : 'Reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */

export default function VerificationPage() {
  const { loading: authLoading, authorized } = useAdminGuard()
  const [status, setStatus]     = useState<VerifStatus>('pending')
  const [items, setItems]       = useState<Submission[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async (s: VerifStatus) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/verification?status=${s}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setItems(data.submissions ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(status) }, [status, load])

  const handleAction = async (userId: string, action: 'approve' | 'reject', notes: string) => {
    const res = await fetch('/api/admin/verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, notes }),
    })
    if (!res.ok) return
    setItems(prev => prev.map(item =>
      item.user_id === userId
        ? { ...item, photo_verified: action === 'approve', verification_notes: notes || null }
        : item
    ))
  }

  if (authLoading || !authorized) return null

  const tabs: { label: string; value: VerifStatus; count?: number }[] = [
    { label: 'Pending',  value: 'pending',  count: status === 'pending' ? items.length : undefined },
    { label: 'Approved', value: 'approved', count: status === 'approved' ? items.length : undefined },
    { label: 'All',      value: 'all' },
  ]

  return (
    <AdminControlShell active="verification">
      <AdminPageHeader
        icon={BadgeCheck}
        iconColor="#22c55e"
        title="ID Verification"
        subtitle="Review selfie submissions and manually approve or reject."
        loading={loading}
        right={
          <span style={{
            padding: '5px 12px', borderRadius: 8,
            border: '1px solid rgba(34,197,94,0.22)',
            background: 'rgba(34,197,94,0.08)',
            fontSize: 12, color: '#4ade80', fontWeight: 600,
          }}>
            {items.length} {items.length === 1 ? 'submission' : 'submissions'}
          </span>
        }
      />

      <div style={{ padding: '16px 20px 32px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              style={{
                padding: '7px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                background: status === tab.value ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${status === tab.value ? 'rgba(34,197,94,0.4)' : S.border}`,
                color: status === tab.value ? '#4ade80' : S.muted,
                transition: 'all 0.15s',
              }}>
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  marginLeft: 6, padding: '1px 7px', borderRadius: 99,
                  background: 'rgba(34,197,94,0.2)',
                  fontSize: 10, color: '#4ade80',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && !loading && (
          <div style={{ borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(127,29,29,0.3)', color: '#fecaca', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 72, borderRadius: 14, background: 'rgba(255,255,255,0.03)', animation: 'verif-shimmer 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <div style={{
            borderRadius: 18, border: `1px solid ${S.border}`, background: S.card,
            padding: '64px 32px', textAlign: 'center',
          }}>
            <BadgeCheck size={40} color="rgba(34,197,94,0.2)" strokeWidth={1.5} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(240,232,244,0.5)', margin: 0 }}>
              No {status === 'all' ? '' : status} submissions
            </p>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(sub => (
              <SubmissionCard key={sub.user_id} sub={sub} onAction={handleAction} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes verif-shimmer {
          0%, 100% { opacity: 0.4 }
          50%       { opacity: 0.8 }
        }
      `}</style>
    </AdminControlShell>
  )
}
