/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Chat from '@/components/Messages/Chat'
import type { Database } from '@/types/database.types'
import { usePlan } from '@/hooks/usePlan'
import { usePaywall } from '@/hooks/usePaywall'
import { WHO_LIKED_YOU_UNLOCK_CREDITS } from '@/lib/who-liked-you-unlock.constants'
import {
  Search, Pin, BellOff, Archive, Shield,
  MoreVertical, ChevronRight, MessageCircle,
  Bell, ArchiveRestore, PinOff, Ghost, Heart, Lock, Sparkles, Loader2,
} from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

interface Liker {
  id:          string
  full_name:   string
  age_range:   string | null
  location:    string | null
  photos:      unknown
  bio:         string | null
  liked_at:    string
  is_stitch:   boolean
  stitch_note: string | null
}

interface Conversation {
  conversationId: string
  profile:        Profile
  lastMessage:    string
  lastTime:       string
  unreadCount:    number
  isPinned:       boolean
  isMuted:        boolean
  isArchived:     boolean
  isPendingLike?: boolean
}

function getPhotoUrl(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null
  const first = photos[0]
  if (!first) return null
  if (typeof first === 'object' && 'url' in first) return (first as any).url
  if (typeof first === 'string') return first
  return null
}

function timeAgo(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const diff  = Date.now() - d.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'now'
  if (mins < 60)  return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days < 7)   return `${days}d`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isUserOnline(lastActive?: string | null): boolean {
  if (!lastActive) return false
  const ts = new Date(lastActive).getTime()
  if (Number.isNaN(ts)) return false
  return Date.now() - ts <= 5 * 60 * 1000
}

const LIKED_ME_SEEN_STORAGE_KEY = 'mebley:liked-me-latest-seen'

function readLikedMeSeenLatestIso(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(LIKED_ME_SEEN_STORAGE_KEY)
  } catch {
    return null
  }
}

/** True when there are likers and the newest like is newer than what the user last acknowledged on Liked Me. */
function likedMeHasUnread(likersCount: number, latestLikedAt: string | null, seenLatestIso: string | null): boolean {
  if (likersCount <= 0 || !latestLikedAt) return false
  if (!seenLatestIso) return true
  const tLatest = new Date(latestLikedAt).getTime()
  const tSeen = new Date(seenLatestIso).getTime()
  if (Number.isNaN(tLatest)) return true
  if (Number.isNaN(tSeen)) return true
  return tLatest > tSeen
}

export default function MatchesPage({ embedded = false, onOpenChat }: { embedded?: boolean; onOpenChat?: (conv: { conversationId: string; profile: Profile }) => void }) {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router  = useRouter()
  const { can, creditBalance } = usePlan()
  const { openPaywall } = usePaywall()

  const [tab, setTab]                       = useState<'messages' | 'liked-me'>('messages')
  const [conversations, setConversations]   = useState<Conversation[]>([])
  const [fetching, setFetching]             = useState(true)
  const [search, setSearch]                 = useState('')
  const [showArchived, setShowArchived]     = useState(false)
  const [chatView, setChatView]             = useState<{ conversationId: string; profile: Profile } | null>(null)
  const [menuOpen, setMenuOpen]             = useState<string | null>(null)
  const [longPressId, setLongPressId]       = useState<string | null>(null)
  const longPressTimer                      = useRef<NodeJS.Timeout | null>(null)

  const [likers, setLikers]         = useState<Liker[]>([])
  const [likersCount, setLikersCount] = useState(0)
  const [latestLikedAt, setLatestLikedAt] = useState<string | null>(null)
  const [likedMeSeenLatestIso, setLikedMeSeenLatestIso] = useState<string | null>(readLikedMeSeenLatestIso)
  const [likersLocked, setLikersLocked] = useState(true)
  const [likersFetching, setLikersFetching] = useState(false)
  const [likingBack, setLikingBack] = useState<string | null>(null)
  const [likedMeUnlocking, setLikedMeUnlocking] = useState(false)

  const likersHardLocked = !can('who_liked_you') && creditBalance < WHO_LIKED_YOU_UNLOCK_CREDITS
  const likedMeHasNew = likedMeHasUnread(likersCount, latestLikedAt, likedMeSeenLatestIso)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  const loadConversations = useCallback(async () => {
    if (!profile) return
    setFetching(true)
    try {
      const res = await fetch('/api/chat/conversations')
      const data = await res.json()
      const convos: Conversation[] = Array.isArray(data?.conversations) ? data.conversations : []

      // Sort: pinned first, then by time
      convos.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
      })

      setConversations(convos)
    } finally {
      setFetching(false)
    }
  }, [profile])

  useEffect(() => { loadConversations() }, [loadConversations])

  const loadLikers = useCallback(async () => {
    if (!user) return
    setLikersFetching(true)
    try {
      const res  = await fetch('/api/likes/received')
      const data = await res.json()
      setLikers(Array.isArray(data?.likers) ? data.likers : [])
      setLikersCount(data?.count ?? 0)
      const latest = typeof data?.latest_liked_at === 'string' ? data.latest_liked_at : null
      setLatestLikedAt(latest)
      setLikersLocked(data?.locked ?? true)
      if (latest) {
        try {
          localStorage.setItem(LIKED_ME_SEEN_STORAGE_KEY, latest)
        } catch { /* ignore */ }
        setLikedMeSeenLatestIso(latest)
      }
    } finally {
      setLikersFetching(false)
    }
  }, [user])

  /** Prefetch “liked me” count for tab badge (GET returns count even when list is locked). */
  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetch('/api/likes/received')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setLikersCount(typeof data?.count === 'number' ? data.count : 0)
        setLatestLikedAt(typeof data?.latest_liked_at === 'string' ? data.latest_liked_at : null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (tab === 'liked-me') loadLikers()
  }, [tab, loadLikers])

  const handleLikedMeTab = async () => {
    if (can('who_liked_you')) {
      setTab('liked-me')
      return
    }
    setLikedMeUnlocking(true)
    try {
      const res  = await fetch('/api/likes/received/unlock', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.status === 402) {
        openPaywall('general', 'credits')
        return
      }
      if (!res.ok || !data.unlocked) {
        openPaywall('general', 'plans')
        return
      }
      await refreshProfile()
      setTab('liked-me')
    } catch {
      openPaywall('general', 'plans')
    } finally {
      setLikedMeUnlocking(false)
    }
  }

  const handleUnlockLikedMeOverlay = async () => {
    setLikedMeUnlocking(true)
    try {
      const res  = await fetch('/api/likes/received/unlock', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.status === 402) {
        openPaywall('general', 'credits')
        return
      }
      if (!res.ok || !data.unlocked) {
        openPaywall('general', 'plans')
        return
      }
      await refreshProfile()
      await loadLikers()
    } catch {
      openPaywall('general', 'plans')
    } finally {
      setLikedMeUnlocking(false)
    }
  }

  const handleLikeBack = async (liker: Liker) => {
    setLikingBack(liker.id)
    try {
      const res  = await fetch('/api/likes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ likeeId: liker.id }),
      })
      const data = await res.json()
      // Remove from likers list (either matched or liked back)
      setLikers(prev => {
        const next = prev.filter(l => l.id !== liker.id)
        setLatestLikedAt(next[0]?.liked_at ?? null)
        return next
      })
      setLikersCount(prev => Math.max(0, prev - 1))
      if (data?.isMatch) {
        // Switch to messages tab to see new match
        loadConversations()
        setTab('messages')
      }
    } finally {
      setLikingBack(null)
    }
  }

  const handleManage = async (action: string, conv: Conversation) => {
    setMenuOpen(null)
    setLongPressId(null)

    if (action === 'block') {
      if (!confirm(`Block ${conv.profile.full_name}? They won't be able to message you.`)) return
      await fetch('/api/chat/manage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block', targetUserId: conv.profile.id, conversationId: conv.conversationId }),
      })
      loadConversations()
      return
    }

    await fetch('/api/chat/manage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, conversationId: conv.conversationId }),
    })
    loadConversations()
  }

  // Long press handlers
  const handlePressStart = (id: string) => {
    longPressTimer.current = setTimeout(() => setLongPressId(id), 500)
  }

  const handlePressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const openConversation = useCallback(async (conv: Conversation) => {
    if (conv.isPendingLike) {
      try {
        const res = await fetch('/api/chat/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: conv.profile.id }),
        })
        const data = await res.json()
        if (res.status === 402) {
          openPaywall('general', 'plans')
          return
        }
        if (!res.ok || !data?.conversationId) {
          return
        }
        await refreshProfile()
        const opened = { conversationId: data.conversationId, profile: conv.profile }
        if (embedded && onOpenChat) { onOpenChat(opened); return }
        setChatView(opened)
        return
      } catch {
        return
      }
    }
    const opened = { conversationId: conv.conversationId, profile: conv.profile }
    if (embedded && onOpenChat) { onOpenChat(opened); return }
    setChatView(opened)
  }, [embedded, onOpenChat, openPaywall, refreshProfile])

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2.5px solid rgba(244,63,94,0.15)', borderTopColor: '#f43f5e', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (chatView) return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 400,
      background: '#0c0a1e',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Chat
        conversationId={chatView.conversationId}
        otherProfile={chatView.profile}
        onBack={() => { setChatView(null); loadConversations() }}
        embedded={true}
      />
    </div>
  )

  const visible = conversations.filter(c => {
    if (showArchived) return c.isArchived
    if (c.isArchived) return false
    return c.profile.full_name?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .conv-item { transition: all 0.15s ease; }
        .conv-item:active { transform: scale(0.98); }
        .menu-item:hover { background: transparent !important; }
      `}</style>

      {/* Long press menu overlay */}
      {longPressId && (() => {
        const conv = conversations.find(c => c.conversationId === longPressId)
        if (!conv) return null
        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(15,4,9,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }}
            onClick={() => setLongPressId(null)}
          >
            <div
              style={{ background: '#fdf8f5', borderRadius: 24, padding: '8px 0', width: '100%', maxWidth: 440, animation: 'slideUp 0.2s ease' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Profile header */}
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(244,63,94,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'rgba(244,63,94,0.1)', flexShrink: 0 }}>
                  {getPhotoUrl(conv.profile.photos)
                    ? <img src={getPhotoUrl(conv.profile.photos)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: '#f43f5e' }}>
                          {conv.profile.full_name?.[0]}
                        </span>
                      </div>
                  }
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#2d1b1f' }}>{conv.profile.full_name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#a37a82' }}>{conv.profile.location}</p>
                </div>
              </div>

              {/* Actions */}
              {[
                { icon: conv.isPinned ? PinOff : Pin,           label: conv.isPinned   ? 'Unpin'      : 'Pin to top',      action: conv.isPinned   ? 'unpin'    : 'pin',      color: '#f43f5e' },
                { icon: conv.isMuted  ? Bell    : BellOff,      label: conv.isMuted    ? 'Unmute'     : 'Mute',            action: conv.isMuted    ? 'unmute'   : 'mute',     color: '#8b5cf6' },
                { icon: conv.isArchived ? ArchiveRestore : Archive, label: conv.isArchived ? 'Unarchive' : 'Archive',       action: conv.isArchived ? 'unarchive': 'archive',  color: '#0ea5e9' },
                { icon: Shield,                                  label: 'Block user',                                        action: 'block',                                  color: '#ef4444' },
              ].map(item => (
                <button
                  key={item.action}
                  className="menu-item"
                  onClick={() => handleManage(item.action, conv)}
                  style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon size={17} color={item.color} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 500, color: item.action === 'block' ? '#ef4444' : '#2d1b1f' }}>{item.label}</span>
                  <ChevronRight size={15} color="#c4a0a8" style={{ marginLeft: 'auto' }} />
                </button>
              ))}

              <button
                onClick={() => setLongPressId(null)}
                style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#a37a82', fontFamily: "'DM Sans',sans-serif", textAlign: 'center' }}>
                Cancel
              </button>
            </div>
          </div>
        )
      })()}

      <div style={{
        minHeight: '100%',
        background: 'transparent',
        fontFamily: "'DM Sans', sans-serif",
        paddingTop: embedded ? 18 : 'max(12px, env(safe-area-inset-top))',
        paddingBottom: embedded ? 18 : 'calc(72px + env(safe-area-inset-bottom) + 16px)',
        paddingLeft: 8,
        paddingRight: 8,
      }}>
        <div className="matches-wrap">

          {/* Header */}
          <div style={{ marginBottom: 16 }}>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: '#fff7fb', margin: '0 0 14px', textShadow: '0 3px 20px rgba(0,0,0,0.35)' }}>
              {tab === 'liked-me' ? 'Liked Me' : showArchived ? 'Archived' : 'Messages'}
            </h1>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <button
                onClick={() => { setTab('messages'); setShowArchived(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 100,
                  background: tab === 'messages' ? 'rgba(236,72,153,0.22)' : 'rgba(255,255,255,0.07)',
                  border: `1.5px solid ${tab === 'messages' ? 'rgba(236,72,153,0.5)' : 'rgba(255,255,255,0.14)'}`,
                  color: tab === 'messages' ? '#f9a8d4' : 'rgba(245,220,251,0.6)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", backdropFilter: 'blur(8px)',
                }}
              >
                <MessageCircle size={13} />
                Messages
              </button>

              <button
                type="button"
                disabled={likedMeUnlocking}
                onClick={() => { void handleLikedMeTab() }}
                aria-label={likedMeHasNew ? `Liked Me, new likes${likersHardLocked ? '' : ` (${likersCount})`}` : 'Liked Me'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 100,
                  background: tab === 'liked-me' ? 'rgba(240,56,104,0.22)' : 'rgba(255,255,255,0.07)',
                  border: `1.5px solid ${tab === 'liked-me' ? 'rgba(240,56,104,0.5)' : 'rgba(255,255,255,0.14)'}`,
                  color: tab === 'liked-me' ? '#fca5a5' : 'rgba(245,220,251,0.6)',
                  fontSize: 13, fontWeight: 600, cursor: likedMeUnlocking ? 'wait' : 'pointer',
                  opacity: likedMeUnlocking ? 0.75 : 1,
                  fontFamily: "'DM Sans', sans-serif", backdropFilter: 'blur(8px)',
                  position: 'relative',
                }}
              >
                {likedMeUnlocking ? <Loader2 size={13} className="animate-spin" /> : <Heart size={13} />}
                Liked Me
                {/* Notification-style badge when there are likes newer than last visit */}
                {likedMeHasNew && likersCount > 0 && (
                  likersHardLocked ? (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute', top: -3, right: -3,
                        width: 10, height: 10, borderRadius: 99,
                        background: '#f03868',
                        border: '2px solid #080614',
                        boxSizing: 'content-box',
                      }}
                    />
                  ) : (
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
                      {likersCount > 99 ? '99+' : likersCount}
                    </span>
                  )
                )}
                {/* Softer count when already viewed */}
                {!likedMeHasNew && likersCount > 0 && (
                  <span style={{
                    marginLeft: 4, minWidth: 18, height: 18, borderRadius: 999,
                    background: can('who_liked_you') ? '#f03868' : (likersHardLocked ? 'rgba(240,56,104,0.5)' : 'rgba(167,139,250,0.85)'),
                    color: '#fff', fontSize: 10, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 5px',
                  }}>
                    {likersHardLocked ? '?' : likersCount}
                  </span>
                )}
                {!can('who_liked_you') && likersHardLocked && (
                  <Lock size={10} style={{ marginLeft: 2, opacity: 0.7 }} />
                )}
              </button>

              {/* Archive toggle — only on messages tab */}
              {tab === 'messages' && (
                <button
                  type="button"
                  title={showArchived ? 'Back to chats' : 'Archived'}
                  onClick={() => setShowArchived(v => !v)}
                  style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.2)', background: showArchived ? 'rgba(236,72,153,0.18)' : 'rgba(13,4,27,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
                >
                  {showArchived ? <Ghost size={14} color="#f8ecff" /> : <Archive size={14} color="#f8ecff" />}
                </button>
              )}
            </div>

            {tab === 'messages' && (
              <p style={{ fontSize: 13, color: 'rgba(245,220,250,0.55)', margin: 0 }}>
                {visible.length} {visible.length === 1 ? 'conversation' : 'conversations'}
              </p>
            )}
          </div>

          {/* Search — messages tab only */}
          {tab === 'messages' && !showArchived && (
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={15} color="#a37a82" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search conversations…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.14)', fontSize: 14, color: '#fff2fb', fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' as const, backdropFilter: 'blur(6px)' }}
              />
            </div>
          )}

          {tab === 'messages' && !showArchived && (
            <p style={{ fontSize: 12, letterSpacing: '0.16em', color: 'rgba(240,212,249,0.46)', fontWeight: 700, margin: '0 0 10px' }}>
              RECENT
            </p>
          )}

          {/* ── Liked Me tab ──────────────────────────────────────────── */}
          {tab === 'liked-me' && (
            <>
              {likersFetching ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(240,56,104,0.08)', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 14, background: 'rgba(255,255,255,0.14)', borderRadius: 7, width: '50%', marginBottom: 8 }} />
                        <div style={{ height: 11, background: 'rgba(255,255,255,0.07)', borderRadius: 6, width: '70%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : likersLocked ? (
                /* Free/Starter — show blurred upgrade prompt */
                <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden' }}>
                  {/* Blurred preview cards */}
                  {[1,2,3].map(i => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8, filter: 'blur(6px)', userSelect: 'none' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(240,56,104,0.3), rgba(167,139,250,0.3))', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 14, background: 'rgba(255,255,255,0.3)', borderRadius: 7, width: '45%', marginBottom: 8 }} />
                        <div style={{ height: 11, background: 'rgba(255,255,255,0.2)', borderRadius: 6, width: '65%' }} />
                      </div>
                      <div style={{ width: 72, height: 34, borderRadius: 100, background: 'rgba(240,56,104,0.3)' }} />
                    </div>
                  ))}
                  {/* Overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(12,10,30,0.1), rgba(12,10,30,0.85))',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '24px 20px', textAlign: 'center',
                  }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(240,56,104,0.15)', border: '1.5px solid rgba(240,56,104,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                      <Lock size={22} color="#f03868" />
                    </div>
                    {likersCount > 0 ? (
                      <p style={{ fontSize: 20, fontFamily: "'Fraunces', serif", fontWeight: 700, color: '#fff5fb', margin: '0 0 8px' }}>
                        {likersCount} {likersCount === 1 ? 'person' : 'people'} liked you
                      </p>
                    ) : (
                      <p style={{ fontSize: 20, fontFamily: "'Fraunces', serif", fontWeight: 700, color: '#fff5fb', margin: '0 0 8px' }}>
                        See who likes you
                      </p>
                    )}
                    <p style={{ fontSize: 13, color: 'rgba(245,220,251,0.65)', margin: '0 0 20px', lineHeight: 1.5 }}>
                      Premium includes this forever. Or spend{' '}
                      <strong style={{ color: '#f9a8d4' }}>{WHO_LIKED_YOU_UNLOCK_CREDITS} credits</strong>
                      {' '}to reveal everyone for <strong style={{ color: '#f9a8d4' }}>24 hours</strong>.
                    </p>
                    {creditBalance >= WHO_LIKED_YOU_UNLOCK_CREDITS && (
                      <button
                        type="button"
                        disabled={likedMeUnlocking}
                        onClick={() => { void handleUnlockLikedMeOverlay() }}
                        style={{
                          padding: '12px 28px', borderRadius: 100, border: '1.5px solid rgba(167,139,250,0.5)',
                          background: 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(167,139,250,0.2))',
                          color: '#ede9fe', fontSize: 14, fontWeight: 700, cursor: likedMeUnlocking ? 'wait' : 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                          marginBottom: 12,
                          width: '100%', maxWidth: 320,
                          boxShadow: '0 6px 20px rgba(99,102,241,0.2)',
                        }}
                      >
                        {likedMeUnlocking ? 'Unlocking…' : `Reveal with ${WHO_LIKED_YOU_UNLOCK_CREDITS} credits`}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openPaywall('general', 'plans')}
                      style={{
                        padding: '12px 28px', borderRadius: 100, border: 'none',
                        background: 'linear-gradient(135deg, #e03060, #f03868)',
                        color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                        boxShadow: '0 6px 20px rgba(240,56,104,0.35)',
                      }}
                    >
                      Upgrade to Premium
                    </button>
                    <p style={{ fontSize: 11, color: 'rgba(245,220,251,0.4)', margin: '12px 0 0' }}>
                      Or upgrade — Premium includes Liked Me anytime.
                    </p>
                  </div>
                </div>
              ) : likers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>💝</div>
                  <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: '#fff6fb', margin: '0 0 8px' }}>
                    No pending likes yet
                  </h3>
                  <p style={{ fontSize: 14, color: 'rgba(246,222,250,0.7)', margin: 0, lineHeight: 1.6 }}>
                    When someone likes your profile before you match, they'll appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {likers.map(liker => {
                    const avatarUrl = getPhotoUrl(liker.photos)
                    const initials  = liker.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'
                    const isLiking  = likingBack === liker.id
                    return (
                      <div key={liker.id} style={{
                        display: 'flex', flexDirection: 'column', gap: 0,
                        borderRadius: 14,
                        background: liker.is_stitch
                          ? 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(167,139,250,0.07))'
                          : 'rgba(255,255,255,0.07)',
                        border: liker.is_stitch
                          ? '1.5px solid rgba(167,139,250,0.35)'
                          : '1.5px solid rgba(240,56,104,0.18)',
                        backdropFilter: 'blur(8px)',
                        overflow: 'hidden',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px' }}>
                          {/* Avatar */}
                          <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: liker.is_stitch ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'linear-gradient(135deg, #f43f5e, #ec4899)', padding: 2 }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#0c0a1e' }}>
                              {avatarUrl
                                ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 20, fontWeight: 700, color: liker.is_stitch ? '#c4b5fd' : '#f43f5e', fontFamily: "'Fraunces',serif" }}>{initials}</span>
                                  </div>
                              }
                            </div>
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff5fb', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {liker.full_name}
                              </p>
                              {liker.is_stitch && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 3,
                                  padding: '2px 7px', borderRadius: 100,
                                  background: 'rgba(124,58,237,0.25)',
                                  border: '1px solid rgba(167,139,250,0.4)',
                                  fontSize: 10, fontWeight: 700,
                                  color: '#c4b5fd', letterSpacing: '0.06em',
                                  flexShrink: 0,
                                }}>
                                  <Sparkles size={8} />
                                  STITCH
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 12, color: 'rgba(245,220,251,0.55)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {[liker.age_range?.replace('_', '–'), liker.location].filter(Boolean).join(' · ')}
                            </p>
                            {!liker.is_stitch && liker.bio && (
                              <p style={{ fontSize: 12, color: 'rgba(245,220,251,0.45)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {liker.bio}
                              </p>
                            )}
                          </div>
                          {/* Like back */}
                          <button
                            onClick={() => handleLikeBack(liker)}
                            disabled={isLiking}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '9px 16px', borderRadius: 100, border: 'none',
                              background: isLiking
                                ? 'rgba(240,56,104,0.3)'
                                : liker.is_stitch
                                  ? 'linear-gradient(135deg, #6d28d9, #7c3aed)'
                                  : 'linear-gradient(135deg, #e03060, #f03868)',
                              color: '#fff', fontSize: 13, fontWeight: 700,
                              cursor: isLiking ? 'default' : 'pointer',
                              fontFamily: "'DM Sans', sans-serif",
                              flexShrink: 0,
                              boxShadow: liker.is_stitch
                                ? '0 4px 14px rgba(124,58,237,0.35)'
                                : '0 4px 14px rgba(240,56,104,0.3)',
                              transition: 'opacity 0.15s',
                              opacity: isLiking ? 0.7 : 1,
                            }}
                          >
                            <Heart size={13} fill={isLiking ? 'transparent' : '#fff'} />
                            {isLiking ? '…' : 'Like back'}
                          </button>
                        </div>

                        {/* Stitch note */}
                        {liker.is_stitch && liker.stitch_note && (
                          <div style={{
                            padding: '10px 14px 14px',
                            borderTop: '1px solid rgba(167,139,250,0.15)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <Sparkles size={13} color="#a78bfa" style={{ flexShrink: 0, marginTop: 2 }} />
                              <p style={{
                                fontSize: 13, color: 'rgba(221,214,254,0.85)',
                                margin: 0, lineHeight: 1.55,
                                fontStyle: 'italic',
                                fontFamily: "'DM Sans', sans-serif",
                              }}>
                                "{liker.stitch_note}"
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── Messages tab ──────────────────────────────────────────── */}
          {tab === 'messages' && fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(244,63,94,0.06)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, background: 'rgba(255,255,255,0.14)', borderRadius: 7, width: '55%', marginBottom: 8 }} />
                    <div style={{ height: 11, background: 'rgba(255,255,255,0.08)', borderRadius: 6, width: '75%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>
                {showArchived ? '📦' : '💝'}
              </div>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: '#fff6fb', margin: '0 0 8px' }}>
                {showArchived ? 'No archived chats' : search ? 'No results' : 'No matches yet'}
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(246,222,250,0.78)', margin: 0, lineHeight: 1.6 }}>
                {showArchived ? 'Archived conversations will appear here' : search ? 'Try a different name' : 'Start swiping to find your perfect match'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {visible.map(conv => {
                const avatarUrl = getPhotoUrl(conv.profile.photos)
                const initials  = conv.profile.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'
                const isMenuOpen = menuOpen === conv.conversationId
                const online = isUserOnline((conv.profile as any).last_active)

                return (
                  <div key={conv.conversationId} style={{ position: 'relative' }}>
                    <div
                      className="conv-item"
                      role="button"
                      tabIndex={0}
                      onClick={() => openConversation(conv)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openConversation(conv)
                        }
                      }}
                      onMouseDown={() => handlePressStart(conv.conversationId)}
                      onMouseUp={handlePressEnd}
                      onTouchStart={() => handlePressStart(conv.conversationId)}
                      onTouchEnd={handlePressEnd}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '13px 14px', borderRadius: 10, width: '100%',
                        background: conv.isPinned ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)',
                        border: `1.5px solid ${conv.isPinned ? 'rgba(255,255,255,0.32)' : conv.unreadCount > 0 ? 'rgba(236,72,153,0.4)' : 'rgba(255,255,255,0.12)'}`,
                        boxShadow: conv.isPinned ? '0 8px 26px rgba(8,1,25,0.32)' : '0 4px 14px rgba(8,1,25,0.22)',
                        cursor: 'pointer', textAlign: 'left',
                        backdropFilter: 'blur(8px)',
                        opacity: 1,
                      }}
                    >
                      {/* Pin indicator */}
                      {conv.isPinned && (
                        <Pin size={10} color="#f43f5e" style={{ position: 'absolute', top: 8, right: 48, opacity: 0.6 }} />
                      )}

                      {/* Avatar */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                          padding: 2,
                          boxShadow: conv.unreadCount > 0 ? '0 0 0 2px rgba(244,63,94,0.25)' : 'none',
                        }}>
                          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#fdf8f5' }}>
                            {avatarUrl
                              ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,63,94,0.08)' }}>
                                  <span style={{ fontSize: 18, fontWeight: 700, color: '#f43f5e', fontFamily: "'Fraunces',serif" }}>{initials}</span>
                                </div>
                            }
                          </div>
                        </div>
                        {/* Unread badge */}
                        {conv.unreadCount > 0 && (
                          <div style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: '#f43f5e', border: '2px solid #fdf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                            {conv.unreadCount}
                          </div>
                        )}
                        {online && (
                          <div
                            title="Online now"
                            style={{
                              position: 'absolute',
                              bottom: -1,
                              left: -1,
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              background: '#34d399',
                              border: '2px solid rgba(18,6,37,0.95)',
                              boxShadow: '0 0 0 3px rgba(52,211,153,0.2)',
                            }}
                          />
                        )}
                        {/* Muted indicator */}
                        {conv.isMuted && (
                          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#fdf8f5', border: '1px solid rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BellOff size={9} color="#a37a82" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 15, fontWeight: conv.unreadCount > 0 ? 700 : 600, color: '#fff5fb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                            {conv.profile.full_name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            {online && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#a7f3d0', fontWeight: 700 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                                Online
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: 'rgba(245,219,251,0.64)' }}>
                              {conv.lastTime ? timeAgo(conv.lastTime) : ''}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: conv.unreadCount > 0 ? '#ffe2f7' : 'rgba(245,220,251,0.72)', fontWeight: conv.unreadCount > 0 ? 600 : 400, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.isPendingLike ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#f9a8d4', border: '1px solid rgba(249,168,212,0.45)', borderRadius: 999, padding: '1px 7px' }}>
                                Pending
                              </span>
                              Waiting for match
                            </span>
                          ) : conv.isMuted ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BellOff size={11} />{conv.lastMessage}</span> : conv.lastMessage}
                        </p>
                      </div>

                      {/* Three dot menu */}
                      <button
                        onClick={e => { e.stopPropagation(); setMenuOpen(isMenuOpen ? null : conv.conversationId) }}
                        style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: isMenuOpen ? 'rgba(244,63,94,0.08)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        <MoreVertical size={15} color="rgba(244,221,251,0.7)" />
                      </button>
                    </div>

                    {/* Inline dropdown menu */}
                    {isMenuOpen && (
                      <div
                        style={{ position: 'absolute', right: 8, top: '100%', zIndex: 100, background: 'rgba(18,14,38,0.98)', backdropFilter: 'blur(20px)', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 200, overflow: 'hidden', animation: 'slideUp 0.15s ease' }}
                        onClick={e => e.stopPropagation()}
                      >
                        {[
                          { icon: conv.isPinned ? PinOff : Pin,               label: conv.isPinned   ? 'Unpin'     : 'Pin',     action: conv.isPinned   ? 'unpin'    : 'pin',     color: '#f43f5e' },
                          { icon: conv.isMuted  ? Bell   : BellOff,           label: conv.isMuted    ? 'Unmute'    : 'Mute',    action: conv.isMuted    ? 'unmute'   : 'mute',    color: '#8b5cf6' },
                          { icon: conv.isArchived ? ArchiveRestore : Archive,  label: conv.isArchived ? 'Unarchive' : 'Archive', action: conv.isArchived ? 'unarchive': 'archive', color: '#0ea5e9' },
                          { icon: Shield,                                       label: 'Block user',                              action: 'block',                                 color: '#ef4444' },
                        ].map(item => (
                          <button
                            key={item.action}
                            className="menu-item"
                            onClick={() => handleManage(item.action, conv)}
                            style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Sans',sans-serif", borderBottom: item.action === 'archive' ? '1px solid rgba(244,63,94,0.06)' : 'none' }}
                          >
                            <item.icon size={15} color={item.color} />
                            <span style={{ fontSize: 14, fontWeight: 500, color: item.action === 'block' ? '#ff6b6b' : '#f0e8f4' }}>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Archive link at bottom */}
          {!showArchived && conversations.some(c => c.isArchived) && (
            <button
              onClick={() => setShowArchived(true)}
              style={{ width: '100%', marginTop: 16, padding: '14px', borderRadius: 14, border: '1.5px solid rgba(240,56,104,0.18)', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'rgba(240,232,244,0.7)', fontFamily: "'DM Sans',sans-serif" }}>
              <Archive size={15} />
              View archived chats
              <ChevronRight size={15} />
            </button>
          )}

        </div>
      </div>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(null)} />
      )}
    </>
  )
}
