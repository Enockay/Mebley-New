/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Chat from '@/components/Messages/Chat'
import type { Database } from '@/types/database.types'
import { MessageCircle, Search } from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

interface Conversation {
  conversationId: string
  profile:        Profile
  lastMessage:    string
  lastTime:       string
  unreadCount:    number
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
  const diff = Date.now() - d.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'now'
  if (mins < 60)  return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days < 7)   return `${days}d`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function MatchesPage() {
  const { user, profile, loading } = useAuth()
  const router  = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [fetching, setFetching]           = useState(true)
  const [search, setSearch]               = useState('')
  const [chatView, setChatView]           = useState<{
    conversationId: string
    profile:        Profile
  } | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  const loadConversations = useCallback(async () => {
    if (!profile) return
    setFetching(true)
    try {
      const { data: matches } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, created_at')
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })

      if (!matches) return

      const convos: Conversation[] = []
      for (const match of matches) {
        const otherId = match.user1_id === profile.id ? match.user2_id : match.user1_id

        const [{ data: otherProfile }, { data: conv }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', otherId).single(),
          supabase.from('conversations').select('id').eq('match_id', match.id).single(),
        ])

        if (!otherProfile || !conv) continue

        // Fetch last message from MongoDB via API
        let lastMessage = 'Say hello 👋'
        let lastTime    = match.created_at ?? ''
        let unreadCount = 0

        try {
          const res  = await fetch(`/api/messages/${conv.id}?limit=1`)
          const data = await res.json()
          if (data.messages?.length > 0) {
            const msg   = data.messages[data.messages.length - 1]
            lastMessage = msg.messageType === 'image'      ? '📷 Photo'
                        : msg.messageType === 'voice'      ? '🎙️ Voice note'
                        : msg.messageType === 'gif'        ? '🎞️ GIF'
                        : msg.messageType === 'video_call' ? '📹 Video call'
                        : msg.content
            lastTime    = msg.createdAt
            unreadCount = msg.senderId !== profile.id && !msg.isRead ? 1 : 0
          }
        } catch { /* no messages yet */ }

        convos.push({
          conversationId: conv.id,
          profile:        otherProfile,
          lastMessage,
          lastTime,
          unreadCount,
        })
      }
      setConversations(convos)
    } finally {
      setFetching(false)
    }
  }, [profile])

  useEffect(() => { loadConversations() }, [loadConversations])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#fdf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2.5px solid rgba(244,63,94,0.15)', borderTopColor: '#f43f5e', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (chatView) return (
    <div style={{ height: '100vh' }}>
      <Chat
        conversationId={chatView.conversationId}
        otherProfile={chatView.profile}
        onBack={() => { setChatView(null); loadConversations() }}
      />
    </div>
  )

  const filtered = conversations.filter(c =>
    c.profile.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ minHeight: '100vh', background: '#fdf8f5', fontFamily: "'DM Sans', sans-serif", paddingTop: 80, paddingBottom: 90 }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>

          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: '#2d1b1f', margin: '0 0 4px' }}>
              Messages
            </h1>
            <p style={{ fontSize: 13, color: '#a37a82', margin: 0 }}>
              {conversations.length} {conversations.length === 1 ? 'connection' : 'connections'}
            </p>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={15} color="#a37a82" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px 11px 38px',
                borderRadius: 14, border: '1.5px solid rgba(244,63,94,0.1)',
                background: 'rgba(255,255,255,0.85)',
                fontSize: 14, color: '#2d1b1f',
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Conversation list */}
          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.85)', borderRadius: 18,
                  border: '1px solid rgba(244,63,94,0.08)',
                  padding: '16px', display: 'flex', alignItems: 'center', gap: 14,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}>
                  <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(244,63,94,0.08)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, background: 'rgba(244,63,94,0.06)', borderRadius: 7, width: '60%', marginBottom: 8 }} />
                    <div style={{ height: 11, background: 'rgba(244,63,94,0.04)', borderRadius: 6, width: '80%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>💝</div>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: '#2d1b1f', margin: '0 0 8px' }}>
                {search ? 'No results' : 'No matches yet'}
              </h3>
              <p style={{ fontSize: 14, color: '#a37a82', margin: 0, lineHeight: 1.6 }}>
                {search ? 'Try a different name' : 'Start swiping to find your perfect match'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(conv => {
                const avatarUrl = getPhotoUrl(conv.profile.photos)
                const initials  = conv.profile.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'
                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => setChatView({ conversationId: conv.conversationId, profile: conv.profile })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 18,
                      background: 'rgba(255,255,255,0.85)',
                      border: `1.5px solid ${conv.unreadCount > 0 ? 'rgba(244,63,94,0.2)' : 'rgba(244,63,94,0.08)'}`,
                      boxShadow: '0 2px 12px rgba(180,60,80,0.05)',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: 54, height: 54, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                        padding: 2,
                        boxShadow: conv.unreadCount > 0 ? '0 0 0 2px rgba(244,63,94,0.3)' : 'none',
                      }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#fdf8f5' }}>
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,63,94,0.1)' }}>
                              <span style={{ fontSize: 18, fontWeight: 700, color: '#f43f5e', fontFamily: "'Fraunces', serif" }}>{initials}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Unread badge */}
                      {conv.unreadCount > 0 && (
                        <div style={{
                          position: 'absolute', top: -2, right: -2,
                          width: 18, height: 18, borderRadius: '50%',
                          background: '#f43f5e', border: '2px solid #fdf8f5',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: 'white',
                        }}>
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{
                          fontSize: 15, fontWeight: conv.unreadCount > 0 ? 700 : 600,
                          color: '#2d1b1f',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: '70%',
                        }}>
                          {conv.profile.full_name}
                        </span>
                        <span style={{ fontSize: 11, color: '#a37a82', flexShrink: 0 }}>
                          {conv.lastTime ? timeAgo(conv.lastTime) : ''}
                        </span>
                      </div>
                      <p style={{
                        fontSize: 13,
                        color: conv.unreadCount > 0 ? '#6b2d3e' : '#a37a82',
                        fontWeight: conv.unreadCount > 0 ? 600 : 400,
                        margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {conv.lastMessage}
                      </p>
                    </div>

                    <MessageCircle size={16} color="rgba(244,63,94,0.3)" style={{ flexShrink: 0 }} />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}