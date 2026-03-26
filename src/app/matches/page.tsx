/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Chat from '@/components/Messages/Chat'
import type { Database } from '@/types/database.types'
import {
  Search, Pin, BellOff, Archive, Shield,
  MoreVertical, ChevronRight, MessageCircle,
  Bell, ArchiveRestore, PinOff, Ghost,
} from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

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

export default function MatchesPage({ embedded = false }: { embedded?: boolean }) {
  const { user, profile, loading } = useAuth()
  const router  = useRouter()

  const [conversations, setConversations]   = useState<Conversation[]>([])
  const [fetching, setFetching]             = useState(true)
  const [search, setSearch]                 = useState('')
  const [showArchived, setShowArchived]     = useState(false)
  const [chatView, setChatView]             = useState<{ conversationId: string; profile: Profile } | null>(null)
  const [menuOpen, setMenuOpen]             = useState<string | null>(null)
  const [longPressId, setLongPressId]       = useState<string | null>(null)
  const longPressTimer                      = useRef<NodeJS.Timeout | null>(null)

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
        if (!res.ok || !data?.conversationId) {
          return
        }
        setChatView({ conversationId: data.conversationId, profile: conv.profile })
        return
      } catch {
        return
      }
    }
    setChatView({ conversationId: conv.conversationId, profile: conv.profile })
  }, [])

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(44% 50% at 8% 90%, rgba(236,72,153,0.26), transparent 72%), radial-gradient(38% 44% at 92% 10%, rgba(139,92,246,0.24), transparent 74%), linear-gradient(140deg,#090019 0%,#17032f 36%,#2a0645 70%,#3d0853 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2.5px solid rgba(244,63,94,0.15)', borderTopColor: '#f43f5e', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (chatView) return (
    <div style={{ height: '100%' }}>
      <Chat
        conversationId={chatView.conversationId}
        otherProfile={chatView.profile}
        onBack={() => { setChatView(null); loadConversations() }}
        embedded={embedded}
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
        background: 'radial-gradient(44% 50% at 8% 90%, rgba(236,72,153,0.26), transparent 72%), radial-gradient(38% 44% at 92% 10%, rgba(139,92,246,0.24), transparent 74%), radial-gradient(30% 34% at 52% 48%, rgba(228,112,208,0.14), transparent 72%), linear-gradient(140deg,#090019 0%,#17032f 36%,#2a0645 70%,#3d0853 100%)',
        fontFamily: "'DM Sans', sans-serif",
        paddingTop: embedded ? 18 : 'max(12px, env(safe-area-inset-top))',
        paddingBottom: embedded ? 18 : 90,
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: '#fff7fb', margin: '0 0 2px', textShadow: '0 3px 20px rgba(0,0,0,0.35)' }}>
                {showArchived ? 'Archived' : 'Messages'}
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(245,220,250,0.66)', margin: 0 }}>
                {visible.length} {visible.length === 1 ? 'conversation' : 'conversations'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                title="With chats"
                onClick={() => setShowArchived(false)}
                style={{ width: 38, height: 38, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.24)', background: !showArchived ? 'rgba(236,72,153,0.2)' : 'rgba(13,4,27,0.32)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
              >
                <MessageCircle size={16} color="#f8ecff" />
              </button>
              <button
                type="button"
                title="Empty state"
                onClick={() => setShowArchived(true)}
                style={{ width: 38, height: 38, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.24)', background: showArchived ? 'rgba(236,72,153,0.2)' : 'rgba(13,4,27,0.32)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
              >
                <Ghost size={16} color="#f8ecff" />
              </button>
            </div>
          </div>

          {/* Search */}
          {!showArchived && (
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={15} color="#a37a82" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search conversations…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.14)', fontSize: 14, color: '#fff2fb', fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' as const, backdropFilter: 'blur(6px)' }}
              />
            </div>
          )}

          {!showArchived && (
            <p style={{ fontSize: 12, letterSpacing: '0.16em', color: 'rgba(240,212,249,0.46)', fontWeight: 700, margin: '0 0 10px' }}>
              RECENT
            </p>
          )}

          {/* Conversation list */}
          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.14)', padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
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
                        padding: '13px 14px', borderRadius: 18, width: '100%',
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
                        style={{ position: 'absolute', right: 8, top: '100%', zIndex: 100, background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(180,60,80,0.15)', border: '1px solid rgba(244,63,94,0.1)', minWidth: 200, overflow: 'hidden', animation: 'slideUp 0.15s ease' }}
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
                            <span style={{ fontSize: 14, fontWeight: 500, color: item.action === 'block' ? '#ef4444' : '#2d1b1f' }}>{item.label}</span>
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
              style={{ width: '100%', marginTop: 16, padding: '14px', borderRadius: 16, border: '1.5px solid rgba(244,63,94,0.1)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#a37a82', fontFamily: "'DM Sans',sans-serif" }}>
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
