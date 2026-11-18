'use client'
/**
 * Chats list (2026 redesign). Presentational; data and actions come from
 * /matches (or the dev studio). Shows a "New matches" row (matches with no
 * messages yet, plus Likes you) and the message list with search.
 */
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Archive, ArchiveRestore, BellOff, Bell, MoreHorizontal, Pin, PinOff, Search, ShieldX } from 'lucide-react'
import { initials } from './AppFrame'

/* eslint-disable @next/next/no-img-element */

export type ChatSummary = {
  conversationId: string
  personId: string
  name: string
  photo: string | null
  online: boolean
  lastMessage: string
  lastTime: string
  unread: number
  hasMessages: boolean
  lastFromMe: boolean
  pinned: boolean
  muted: boolean
  archived: boolean
}

export type ManageAction = 'pin' | 'unpin' | 'mute' | 'unmute' | 'archive' | 'unarchive' | 'block'

/** "9:12", "Yesterday", "Mon", "22 May" */
export function chatTime(iso: string): string {
  const d = new Date(iso)
  if (!iso || Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000)
  if (days <= 0) return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
  if (days === 1) return 'Yesterday'
  if (days < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Face({ name, photo, online, size = 56, ring }: { name: string; photo: string | null; online?: boolean; size?: number; ring?: 'coral' | 'gold' }) {
  return (
    <span className={`ma-face${ring ? ` ma-face--${ring}` : ''}`} style={{ width: size, height: size }}>
      {photo ? <img src={photo} alt="" /> : <span className="ma-face__init">{initials(name)}</span>}
      {online ? <span className="ma-face__online" aria-label="Online" /> : null}
    </span>
  )
}

function RowMenu({ chat, onManage }: { chat: ChatSummary; onManage: (a: ManageAction, c: ChatSummary) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [open])
  const act = (a: ManageAction) => { setOpen(false); onManage(a, chat) }
  return (
    <div className="ma-menu ma-convo__menu" ref={ref}>
      <button type="button" className="ma-iconbtn" style={{ width: 36, height: 36 }} aria-label={`Options for chat with ${chat.name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <MoreHorizontal size={18} />
      </button>
      {open ? (
        <div className="ma-menu__list" role="menu">
          <button role="menuitem" onClick={() => act(chat.pinned ? 'unpin' : 'pin')}>{chat.pinned ? <PinOff size={16} /> : <Pin size={16} />} {chat.pinned ? 'Unpin' : 'Pin to top'}</button>
          <button role="menuitem" onClick={() => act(chat.muted ? 'unmute' : 'mute')}>{chat.muted ? <Bell size={16} /> : <BellOff size={16} />} {chat.muted ? 'Unmute' : 'Mute'}</button>
          <button role="menuitem" onClick={() => act(chat.archived ? 'unarchive' : 'archive')}>{chat.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />} {chat.archived ? 'Move to chats' : 'Archive'}</button>
          <button role="menuitem" className="ma-danger" onClick={() => act('block')}><ShieldX size={16} /> Block</button>
        </div>
      ) : null}
    </div>
  )
}

export default function ChatsView({
  chats, likesCount, likesPhoto, loading, activeId, showArchived, onToggleArchived, onOpen, onManage,
}: {
  chats: ChatSummary[]
  likesCount: number
  likesPhoto?: string | null
  loading: boolean
  activeId: string | null
  showArchived: boolean
  onToggleArchived: () => void
  onOpen: (c: ChatSummary) => void
  onManage: (a: ManageAction, c: ChatSummary) => void
}) {
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()
  const visible = chats.filter(c => c.archived === showArchived && (!term || c.name.toLowerCase().includes(term)))
  const fresh = visible.filter(c => !c.hasMessages)
  const threads = visible
    .filter(c => c.hasMessages)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())

  return (
    <section className="ma-chats" aria-labelledby="ma-chats-title">
      <div className="ma-chats__head">
        <h1 id="ma-chats-title" className="ma-title">{showArchived ? 'Archived' : 'Chats'}</h1>
        <button type="button" className="ma-iconbtn" aria-pressed={showArchived} aria-label={showArchived ? 'Back to chats' : 'Show archived chats'} onClick={onToggleArchived}>
          {showArchived ? <ArchiveRestore size={20} /> : <Archive size={20} />}
        </button>
      </div>

      <label className="ma-search ma-search--block">
        <Search size={18} aria-hidden="true" />
        <span className="ma-sr">Search conversations</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search conversations" />
      </label>

      {!showArchived && (fresh.length > 0 || likesCount > 0) ? (
        <div className="ma-section">
          <p className="ma-label">New matches</p>
          <ul className="ma-newmatches">
            {likesCount > 0 ? (
              <li>
                <Link href="/likes" className="ma-newmatch">
                  <span className="ma-face ma-face--gold ma-face--likes" style={{ width: 64, height: 64 }}>
                    {likesPhoto ? <img src={likesPhoto} alt="" className="ma-face__blur" /> : null}
                    <b>{likesCount > 99 ? '99+' : likesCount}</b>
                  </span>
                  <span className="ma-gold">Likes you</span>
                </Link>
              </li>
            ) : null}
            {fresh.map(c => (
              <li key={c.conversationId}>
                <button type="button" className="ma-newmatch" onClick={() => onOpen(c)}>
                  <Face name={c.name} photo={c.photo} size={64} ring="coral" />
                  <span>{c.name.split(' ')[0]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="ma-section">
        <p className="ma-label">Messages</p>
        {loading && chats.length === 0 ? (
          <div className="ma-empty" style={{ padding: 30 }}><div className="ma-spinner" /></div>
        ) : threads.length === 0 ? (
          <div className="ma-empty" style={{ padding: '30px 10px' }}>
            <p style={{ margin: 0 }}>{showArchived ? 'No archived chats.' : term ? 'No chats match your search.' : 'When you match with someone, your conversation shows up here.'}</p>
            {!showArchived && !term ? <Link href="/browse" className="ma-btn ma-btn--primary ma-btn--pill ma-btn--sm">Find people on Discover</Link> : null}
          </div>
        ) : (
          <ul className="ma-convos">
            {threads.map(c => (
              <li key={c.conversationId} className="ma-convo" data-active={c.conversationId === activeId} data-unread={c.unread > 0}>
                <button type="button" className="ma-convo__main" onClick={() => onOpen(c)}>
                  <Face name={c.name} photo={c.photo} online={c.online} />
                  <span className="ma-convo__text">
                    <span className="ma-convo__top">
                      <b>{c.name.split(' ')[0]}</b>
                      {c.pinned ? <Pin size={13} aria-label="Pinned" className="ma-muted" /> : null}
                      {c.muted ? <BellOff size={13} aria-label="Muted" className="ma-muted" /> : null}
                      <time className="ma-convo__time" dateTime={c.lastTime}>{chatTime(c.lastTime)}</time>
                    </span>
                    <span className="ma-convo__bottom">
                      <span className="ma-convo__msg">{c.lastFromMe ? 'You: ' : ''}{c.lastMessage}</span>
                      {c.unread > 0 ? <span className="ma-badge">{c.unread}</span> : null}
                    </span>
                  </span>
                </button>
                <RowMenu chat={c} onManage={onManage} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
