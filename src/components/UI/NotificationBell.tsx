 'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Bell, X, Heart, MessageCircle, Zap, Info, CheckCheck } from 'lucide-react'
import Image from 'next/image'

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  data: Record<string, unknown>
  actor_id: string | null
  read_at: string | null
  created_at: string
  actor_username: string | null
  actor_photo: string | null
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60)  return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function typeIcon(type: string) {
  switch (type) {
    case 'match':      return <Heart size={13} color="#f03868" />
    case 'like':       return <Heart size={13} color="#fb7185" />
    case 'message':    return <MessageCircle size={13} color="#818cf8" />
    case 'super_like': return <Zap size={13} color="#f59e0b" />
    default:           return <Info size={13} color="#94a3b8" />
  }
}

function typeColor(type: string): string {
  switch (type) {
    case 'match':      return 'rgba(240,56,104,0.15)'
    case 'like':       return 'rgba(251,113,133,0.18)'
    case 'message':    return 'rgba(129,140,248,0.15)'
    case 'super_like': return 'rgba(245,158,11,0.15)'
    default:           return 'rgba(148,163,184,0.15)'
  }
}

export default function NotificationBell() {
  const [open, setOpen]               = useState(false)
  const [notifications, setNotifs]    = useState<Notification[]>([])
  const [unreadCount, setUnread]      = useState(0)
  const [loading, setLoading]         = useState(false)
  const panelRef                      = useRef<HTMLDivElement>(null)
  const fetchedRef                    = useRef(false)

  const fetchNotifs = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setNotifs(data.notifications ?? [])
      setUnread(data.unreadCount ?? 0)
    } catch { /* ignore */ } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  // Initial fetch + 60s polling
  useEffect(() => {
    if (!fetchedRef.current) { fetchedRef.current = true; fetchNotifs() }
    const t = setInterval(() => fetchNotifs(true), 60_000)
    return () => clearInterval(t)
  }, [fetchNotifs])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchNotifs(true)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [fetchNotifs])

  // Mark all read when panel opens
  useEffect(() => {
    if (!open || unreadCount === 0) return
    fetch('/api/notifications', { method: 'PATCH' }).then(() => {
      setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
      setUnread(0)
    }).catch(() => {})
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        style={{
          position: 'relative',
          width: 34, height: 34,
          borderRadius: '50%',
          border: open ? '1px solid rgba(240,56,104,0.35)' : '1px solid rgba(255,255,255,0.14)',
          background: open ? 'rgba(240,56,104,0.12)' : 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'border-color 0.18s, background 0.18s',
          color: open ? '#fda4b4' : 'rgba(255,255,255,0.65)',
          flexShrink: 0,
        }}>
        <Bell size={16} strokeWidth={2} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            minWidth: 17, height: 17, borderRadius: 99,
            background: '#f03868',
            fontSize: 10, fontWeight: 700, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid #080614',
            lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 320, maxWidth: 'calc(100vw - 24px)',
          background: 'rgba(12,10,30,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          zIndex: 400,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 16px 11px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f0e8f4' }}>Notifications</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,232,244,0.4)', padding: 2, display: 'flex' }}>
              <X size={14} />
            </button>
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto', overscrollBehavior: 'contain' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: '2px solid rgba(240,56,104,0.3)',
                  borderTopColor: '#f03868',
                  animation: 'nb-spin 0.7s linear infinite',
                  margin: '0 auto',
                }} />
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <Bell size={28} color="rgba(240,232,244,0.15)" strokeWidth={1.5} style={{ margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: 'rgba(240,232,244,0.35)', margin: 0 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <NotifRow key={n.id} n={n} />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 11, color: 'rgba(240,232,244,0.3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCheck size={12} />
                All caught up
              </span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes nb-spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

function NotifRow({ n }: { n: Notification }) {
  const isUnread = !n.read_at
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 11,
      padding: '11px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      background: isUnread ? 'rgba(240,56,104,0.04)' : 'transparent',
      transition: 'background 0.15s',
      cursor: 'default',
    }}>
      {/* Actor avatar or type icon */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {n.actor_photo ? (
          <Image
            src={n.actor_photo}
            alt={n.actor_username ?? ''}
            width={36} height={36}
            style={{ borderRadius: '50%', objectFit: 'cover', width: 36, height: 36, display: 'block' }}
            unoptimized
          />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: typeColor(n.type),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {typeIcon(n.type)}
          </div>
        )}
        {n.actor_photo && (
          <span style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 16, height: 16, borderRadius: '50%',
            background: typeColor(n.type),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #080614',
          }}>
            {typeIcon(n.type)}
          </span>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: isUnread ? 700 : 500, color: isUnread ? '#f0e8f4' : 'rgba(240,232,244,0.7)', lineHeight: 1.4 }}>
          {n.title}
        </p>
        {n.body && (
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(240,232,244,0.45)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {n.body}
          </p>
        )}
        <p style={{ margin: '5px 0 0', fontSize: 10, color: 'rgba(240,232,244,0.28)' }}>
          {timeAgo(n.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {isUnread && (
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f03868', flexShrink: 0, marginTop: 4 }} />
      )}
    </div>
  )
}
