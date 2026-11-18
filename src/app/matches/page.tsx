'use client'
/**
 * Chats (2026 redesign). Desktop: conversation list beside the open chat.
 * Mobile: the list, and the chat full screen when ?conversation= is set.
 * "Liked me" moved to /likes. The previous implementation is in git history.
 */
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Chat from '@/components/Messages/Chat'
import ChatsView, { type ChatSummary, type ManageAction } from '@/components/App/ChatsView'
import { FullProfile } from '@/components/App/DiscoverView'
import { isOnline, toPerson } from '@/components/App/discover-model'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

type ApiConversation = {
  conversationId: string
  profile: Profile & { photos?: unknown; last_active?: string | null }
  lastMessage: string
  lastTime: string
  unreadCount: number
  hasMessages?: boolean
  lastFromMe?: boolean
  isPinned: boolean
  isMuted: boolean
  isArchived: boolean
}

function firstPhoto(photos: unknown): string | null {
  if (!Array.isArray(photos) || !photos[0]) return null
  const f = photos[0] as { url?: string } | string
  return typeof f === 'string' ? f : f.url ?? null
}

function MatchesContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const openId = params.get('conversation')

  const [convos, setConvos] = useState<ApiConversation[]>([])
  const [fetching, setFetching] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [likes, setLikes] = useState<{ count: number; photo: string | null }>({ count: 0, photo: null })
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => { if (!loading && !user) router.push('/auth') }, [user, loading, router])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations', { cache: 'no-store' })
      const data = await res.json()
      setConvos(Array.isArray(data?.conversations) ? data.conversations : [])
    } catch { /* keep previous list */ } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    load()
    fetch('/api/likes/received', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => d && setLikes({ count: Number(d.count) || 0, photo: firstPhoto(d.likers?.[0]?.photos) }))
      .catch(() => {})
  }, [user, load])

  const chats: ChatSummary[] = useMemo(() => convos.map(c => ({
    conversationId: c.conversationId,
    personId: c.profile.id,
    name: c.profile.full_name ?? 'Member',
    photo: firstPhoto(c.profile.photos),
    online: isOnline(c.profile.last_active),
    lastMessage: c.lastMessage?.replace(/\s*👋$/, '') || '',
    lastTime: c.lastTime,
    unread: c.unreadCount ?? 0,
    hasMessages: c.hasMessages ?? c.lastMessage !== 'Say hello 👋',
    lastFromMe: !!c.lastFromMe,
    pinned: c.isPinned,
    muted: c.isMuted,
    archived: c.isArchived,
  })), [convos])

  const active = convos.find(c => c.conversationId === openId) ?? null

  const open = (c: ChatSummary) => router.push(`/matches?conversation=${encodeURIComponent(c.conversationId)}`, { scroll: false })
  const close = () => { router.push('/matches', { scroll: false }); load() }

  const manage = async (action: ManageAction, c: ChatSummary) => {
    if (action === 'block' && !window.confirm(`Block ${c.name}? They won’t be able to message you or see you on Discover.`)) return
    await fetch('/api/chat/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action === 'block'
        ? { action, targetUserId: c.personId, conversationId: c.conversationId }
        : { action, conversationId: c.conversationId }),
    }).catch(() => {})
    if (action === 'block' && c.conversationId === openId) close()
    else load()
  }

  return (
    <div className="ma-msgs" data-open={!!active}>
      <ChatsView
        chats={chats}
        likesCount={likes.count}
        likesPhoto={likes.photo}
        loading={fetching}
        activeId={openId}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived(v => !v)}
        onOpen={open}
        onManage={manage}
      />
      <section className="ma-thread" aria-label={active ? `Chat with ${active.profile.full_name}` : 'Chat'}>
        {active ? (
          <Chat
            key={active.conversationId}
            conversationId={active.conversationId}
            otherProfile={active.profile}
            onBack={close}
            onViewProfile={() => setProfileOpen(true)}
            embedded
          />
        ) : openId && fetching ? (
          <div className="ma-thread__empty"><div className="ma-spinner" /></div>
        ) : (
          <div className="ma-thread__empty">
            <MessageCircle size={40} color="var(--ma-coral)" />
            <h2>Your conversations</h2>
            <p style={{ margin: 0 }}>Choose a chat to start talking.</p>
          </div>
        )}
      </section>
      {active && profileOpen ? (
        <FullProfile
          person={toPerson({ score: 0, reasons: [], profile: active.profile })}
          onClose={() => setProfileOpen(false)}
        />
      ) : null}
    </div>
  )
}

export default function MatchesPage() {
  return (
    <Suspense fallback={null}>
      <MatchesContent />
    </Suspense>
  )
}
