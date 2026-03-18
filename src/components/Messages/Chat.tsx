/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng'
import type { Database } from '@/types/database.types'
import {
  ArrowLeft, Send, Image, Gift, Video,
  PhoneOff, MicOff, Mic, VideoOff, X, Loader2,
  CameraOff, Check, Trash2, MoreVertical, BellOff, Shield,
} from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

interface MongoMessage {
  id:             string
  conversationId: string
  senderId:       string
  receiverId:     string
  content:        string
  messageType:    'text' | 'image' | 'gif' | 'video_call'
  mediaUrl?:      string
  mediaKey?:      string
  callStatus?:    'initiated' | 'accepted' | 'declined' | 'missed' | 'ended'
  callDuration?:  number
  isRead:         boolean
  isDeleted?:     boolean
  createdAt:      string | Date
}

interface ChatProps {
  conversationId: string
  otherProfile:   Profile
  onBack:         () => void
}

const AGE_RANGE_LABELS: Record<string, string> = {
  '18_24': '18–24', '25_34': '25–34', '35_40': '35–40',
  '40_50': '40–50', '50_65': '50–65', '65_plus': '65+',
}

function getPhotoUrl(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null
  const first = photos[0]
  if (!first) return null
  if (typeof first === 'object' && 'url' in first) return (first as any).url
  if (typeof first === 'string') return first
  return null
}

function formatTime(ts: string | Date): string {
  if (!ts) return ''
  const d = typeof ts === 'string' ? new Date(ts) : ts
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function Chat({ conversationId, otherProfile, onBack }: ChatProps) {
  const { profile: currentProfile } = useAuth()

  // Messages
  const [messages, setMessages]         = useState<MongoMessage[]>([])
  const [loading, setLoading]           = useState(true)
  const [sending, setSending]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [text, setText]                 = useState('')
  const messagesEndRef                  = useRef<HTMLDivElement>(null)
  const imageInputRef                   = useRef<HTMLInputElement>(null)

  // Message actions
  const [selectedMsg, setSelectedMsg]   = useState<string | null>(null)
  const [deleting, setDeleting]         = useState<string | null>(null)

  // Header menu
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [menuAction, setMenuAction]     = useState<string | null>(null)

  // GIF panel
  const [showGifs, setShowGifs]         = useState(false)
  const [gifQuery, setGifQuery]         = useState('')
  const [gifs, setGifs]                 = useState<any[]>([])
  const [gifLoading, setGifLoading]     = useState(false)

  // Video call
  const [showCallConfirm, setShowCallConfirm] = useState(false)
  const [inCall, setInCall]                   = useState(false)
  const [callLoading, setCallLoading]         = useState(false)
  const [callConnected, setCallConnected]     = useState(false)
  const [callSeconds, setCallSeconds]         = useState(0)
  const [micMuted, setMicMuted]               = useState(false)
  const [camOff, setCamOff]                   = useState(false)
  const [remoteJoined, setRemoteJoined]       = useState(false)
  const agoraClientRef  = useRef<IAgoraRTCClient | null>(null)
  const localTracksRef  = useRef<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(null)
  const localVideoRef   = useRef<HTMLDivElement>(null)
  const remoteVideoRef  = useRef<HTMLDivElement>(null)
  const callTimerRef    = useRef<NodeJS.Timeout | null>(null)

  // ── Load messages ──────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/messages/${conversationId}`)
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch { setError('Could not load messages') }
    finally { setLoading(false) }
  }, [conversationId])

  useEffect(() => { loadMessages() }, [loadMessages])

  // ── Realtime ───────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'conversations', filter: `id=eq.${conversationId}`,
      }, async () => {
        try {
          const res  = await fetch(`/api/messages/${conversationId}?limit=1`)
          const data = await res.json()
          if (data.messages?.length > 0) {
            const latest = data.messages[data.messages.length - 1]
            setMessages(prev => {
              const alreadyExists = prev.some(m =>
                m.id === latest.id ||
                (m.id?.startsWith('tmp-') && m.content === latest.content && m.senderId === latest.senderId)
              )
              if (alreadyExists) return prev
              return [...prev, latest]
            })
          }
        } catch { /* ignore */ }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  // ── Auto scroll ────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Call timer ─────────────────────────────────────────────
  useEffect(() => {
    if (callConnected) {
      callTimerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000)
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current) }
  }, [callConnected])

  // ── Click outside to dismiss menus ────────────────────────
  useEffect(() => {
    const handler = () => {
      setSelectedMsg(null)
      setShowChatMenu(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  // ── Send text ──────────────────────────────────────────────
  const sendText = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !currentProfile || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    const optimistic: MongoMessage = {
      id: `tmp-${Date.now()}`, conversationId,
      senderId: currentProfile.id, receiverId: otherProfile.id,
      content, messageType: 'text', isRead: false,
      createdAt: new Date().toISOString(),
    }
    setMessages(p => [...p, optimistic])
    try {
      const res     = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, messageType: 'text' }),
      })
      const { message } = await res.json()
      setMessages(p => p.map(m => m.id === optimistic.id ? { ...message } : m))
    } catch {
      setMessages(p => p.filter(m => m.id !== optimistic.id))
      setText(content)
      setError('Failed to send message')
    } finally { setSending(false) }
  }

  // ── Send media ─────────────────────────────────────────────
  const sendMediaMessage = async (
    messageType: MongoMessage['messageType'],
    content: string,
    extras?: Partial<MongoMessage>
  ) => {
    if (!currentProfile) return
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, messageType, ...extras }),
      })
      const { message } = await res.json()
      setMessages(p => [...p, { ...message }])
    } catch { setError('Failed to send') }
  }

  // ── Image upload ───────────────────────────────────────────
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentProfile) return
    const msgId = `msg-${Date.now()}`
    try {
      const presignRes = await fetch('/api/chat/media', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, messageId: msgId, fileType: file.type, mediaType: 'image' }),
      })
      const { url, fields, cloudfrontUrl } = await presignRes.json()
      const fd = new FormData()
      Object.entries(fields).forEach(([k, v]) => fd.append(k, v as string))
      fd.append('file', file)
      await fetch(url, { method: 'POST', body: fd })
      await sendMediaMessage('image', '📷 Photo', { mediaUrl: cloudfrontUrl })
    } catch { setError('Failed to upload image') }
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  // ── GIF search ─────────────────────────────────────────────
  const searchGifs = async (q: string) => {
    if (!q) return
    setGifLoading(true)
    try {
      const key  = process.env.NEXT_PUBLIC_GIPHY_API_KEY
      const res  = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=16&rating=g`)
      const data = await res.json()
      setGifs(data.data ?? [])
    } catch { /* ignore */ }
    setGifLoading(false)
  }

  const sendGif = async (gifUrl: string) => {
    setShowGifs(false)
    setGifQuery('')
    setGifs([])
    await sendMediaMessage('gif', gifUrl, { mediaUrl: gifUrl })
  }

  // ── Delete message ─────────────────────────────────────────
  const deleteMessage = async (messageId: string) => {
    setSelectedMsg(null)
    setDeleting(messageId)
    try {
      const res = await fetch('/api/messages/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, conversationId }),
      })
      if (res.ok) {
        setMessages(p => p.map(m =>
          m.id === messageId
            ? { ...m, content: 'This message was deleted', isDeleted: true }
            : m
        ))
      } else {
        setError('Could not delete message')
      }
    } catch { setError('Could not delete message') }
    finally { setDeleting(null) }
  }

  // ── Chat management (mute/block) ───────────────────────────
  const handleChatAction = async (action: string) => {
    setShowChatMenu(false)
    setMenuAction(action)
    if (action === 'block') {
      if (!confirm(`Block ${otherProfile.full_name}? They won't be able to message you.`)) {
        setMenuAction(null)
        return
      }
    }
    try {
      await fetch('/api/chat/manage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, conversationId, targetUserId: otherProfile.id }),
      })
      if (action === 'block') onBack()
    } catch { setError('Action failed') }
    finally { setMenuAction(null) }
  }

  // ── Video call ─────────────────────────────────────────────
  const startCall = async () => {
    setShowCallConfirm(false)
    setCallLoading(true)
    setInCall(true)
    setCallSeconds(0)
    setCallConnected(false)
    setRemoteJoined(false)
    try {
      const res = await fetch('/api/chat/call', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: conversationId, conversationId }),
      })
      const { token, appId, channelName } = await res.json()
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      AgoraRTC.setLogLevel(4)
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      agoraClientRef.current = client
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType)
        if (mediaType === 'video' && remoteVideoRef.current) {
          user.videoTrack?.play(remoteVideoRef.current)
          setRemoteJoined(true)
          setCallConnected(true)
        }
        if (mediaType === 'audio') user.audioTrack?.play()
      })
      client.on('user-unpublished', () => { setRemoteJoined(false) })
      client.on('user-left', async () => { setRemoteJoined(false); await endCall(true) })
      await client.join(appId, channelName, token, null)
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { encoderConfig: 'music_standard' },
        { encoderConfig: '720p_1' }
      )
      localTracksRef.current = [audioTrack, videoTrack]
      if (localVideoRef.current) videoTrack.play(localVideoRef.current)
      await client.publish([audioTrack, videoTrack])
      await sendMediaMessage('video_call', '📹 Video call', { callStatus: 'initiated' })
    } catch (err: any) {
      console.error('Call error:', err)
      setError('Could not start video call. Check camera and microphone permissions.')
      setInCall(false)
    } finally { setCallLoading(false) }
  }

  const endCall = async (remote = false) => {
    const duration = callSeconds
    if (localTracksRef.current) {
      localTracksRef.current[0].stop(); localTracksRef.current[0].close()
      localTracksRef.current[1].stop(); localTracksRef.current[1].close()
      localTracksRef.current = null
    }
    if (agoraClientRef.current) {
      try { await agoraClientRef.current.leave() } catch { /* ignore */ }
      agoraClientRef.current = null
    }
    setInCall(false); setCallConnected(false); setRemoteJoined(false)
    setMicMuted(false); setCamOff(false)
    if (duration > 0) {
      await sendMediaMessage('video_call', `📹 Video call · ${formatDuration(duration)}`, { callStatus: 'ended', callDuration: duration })
    } else if (!remote) {
      await sendMediaMessage('video_call', '📹 Call ended', { callStatus: 'ended' })
    }
  }

  const toggleMic = () => {
    if (!localTracksRef.current) return
    const muted = !micMuted
    localTracksRef.current[0].setEnabled(!muted)
    setMicMuted(muted)
  }

  const toggleCam = () => {
    if (!localTracksRef.current) return
    const off = !camOff
    localTracksRef.current[1].setEnabled(!off)
    setCamOff(off)
  }

  const avatarUrl = getPhotoUrl(otherProfile.photos)
  const initials  = otherProfile.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'
  const ageLabel  = AGE_RANGE_LABELS[(otherProfile as any).age_range ?? '']

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .msg-in { animation: slideUp 0.15s ease forwards; }
        .menu-btn:hover { background: rgba(244,63,94,0.06) !important; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fdf8f5', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>

        {/* ── Header ── */}
        <div style={{ background: 'rgba(253,248,245,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(244,63,94,0.08)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(244,63,94,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowLeft size={18} color="#f43f5e" />
          </button>

          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#f43f5e,#ec4899)', padding: 2, flexShrink: 0 }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#fdf8f5' }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,63,94,0.1)' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#f43f5e', fontFamily: "'Fraunces',serif" }}>{initials}</span>
                  </div>
              }
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#2d1b1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {otherProfile.full_name}{ageLabel ? `, ${ageLabel}` : ''}
            </p>
            {otherProfile.location && (
              <p style={{ margin: 0, fontSize: 11, color: '#a37a82' }}>{otherProfile.location}</p>
            )}
          </div>

          {/* Video call button */}
          <button
            onClick={e => { e.stopPropagation(); !inCall && setShowCallConfirm(true) }}
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(244,63,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Video size={17} color="#f43f5e" />
          </button>

          {/* Three dot menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={e => { e.stopPropagation(); setShowChatMenu(!showChatMenu) }}
              style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: showChatMenu ? 'rgba(244,63,94,0.1)' : 'rgba(244,63,94,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MoreVertical size={17} color="#a37a82" />
            </button>

            {showChatMenu && (
              <div
                onClick={e => e.stopPropagation()}
                style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 200, background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(180,60,80,0.15)', border: '1px solid rgba(244,63,94,0.08)', minWidth: 190, overflow: 'hidden', animation: 'slideDown 0.15s ease' }}>
                {[
                  { icon: BellOff, label: 'Mute notifications', action: 'mute',  color: '#8b5cf6' },
                  { icon: Shield,  label: 'Block user',         action: 'block', color: '#ef4444' },
                ].map(item => (
                  <button
                    key={item.action}
                    className="menu-btn"
                    onClick={() => handleChatAction(item.action)}
                    style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Sans',sans-serif", transition: 'background 0.15s' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <item.icon size={15} color={item.color} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: item.action === 'block' ? '#ef4444' : '#2d1b1f' }}>
                      {menuAction === item.action ? '…' : item.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Error bar ── */}
        {error && (
          <div style={{ background: 'rgba(244,63,94,0.08)', borderBottom: '1px solid rgba(244,63,94,0.15)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#f43f5e' }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={14} color="#f43f5e" />
            </button>
          </div>
        )}

        {/* ── Messages ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid rgba(244,63,94,0.15)', borderTopColor: '#f43f5e', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🧵</div>
                <p style={{ fontSize: 14, color: '#a37a82', lineHeight: 1.6, margin: 0 }}>
                  Start the conversation with<br />
                  <strong style={{ color: '#2d1b1f' }}>{otherProfile.full_name?.split(' ')[0]}</strong>
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {messages.map((msg, i) => {
                const own    = msg.senderId === currentProfile?.id
                const isTemp = msg.id?.startsWith('tmp-')
                const isDeleted = msg.isDeleted

                // Video call pill
                if (msg.messageType === 'video_call') {
                  return (
                    <div key={msg.id ?? i} className="msg-in" style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.12)' }}>
                        <Video size={13} color="#f43f5e" />
                        <span style={{ fontSize: 12, color: '#a37a82', fontWeight: 500 }}>
                          {msg.callStatus === 'ended'
                            ? msg.callDuration ? `Video call · ${formatDuration(msg.callDuration)}` : 'Video call ended'
                            : 'Video call started'}
                        </span>
                        <span style={{ fontSize: 11, color: '#c4a0a8' }}>{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={msg.id ?? i}
                    className="msg-in"
                    style={{ display: 'flex', justifyContent: own ? 'flex-end' : 'flex-start', position: 'relative' }}
                    onClick={e => { e.stopPropagation(); if (own && !isTemp && !isDeleted) setSelectedMsg(prev => prev === msg.id ? null : msg.id) }}
                  >
                    {/* Delete popup — appears above the bubble */}
                    {selectedMsg === msg.id && own && !isDeleted && (
                      <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', right: 0, zIndex: 100, animation: 'slideDown 0.15s ease' }}>
                        <button
                          onClick={e => { e.stopPropagation(); deleteMessage(msg.id) }}
                          disabled={deleting === msg.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 12, background: 'white', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontSize: 13, color: '#ef4444', fontWeight: 600, fontFamily: "'DM Sans',sans-serif", boxShadow: '0 4px 16px rgba(0,0,0,0.12)', whiteSpace: 'nowrap' }}>
                          {deleting === msg.id
                            ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                            : <Trash2 size={13} />
                          }
                          Delete for everyone
                        </button>
                      </div>
                    )}

                    <div style={{
                      maxWidth: '72%',
                      padding: (msg.messageType === 'image' || msg.messageType === 'gif') && !isDeleted ? '4px' : '10px 14px',
                      borderRadius: own ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isDeleted
                        ? 'rgba(180,60,80,0.06)'
                        : own ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'rgba(255,255,255,0.95)',
                      border: isDeleted ? '1px dashed rgba(244,63,94,0.2)' : own ? 'none' : '1px solid rgba(244,63,94,0.1)',
                      boxShadow: isDeleted ? 'none' : own ? '0 4px 16px rgba(244,63,94,0.25)' : '0 2px 8px rgba(180,60,80,0.06)',
                      color: isDeleted ? '#c4a0a8' : own ? 'white' : '#2d1b1f',
                      cursor: own && !isTemp && !isDeleted ? 'pointer' : 'default',
                      opacity: isTemp ? 0.8 : 1,
                    }}>

                      {/* Deleted message */}
                      {isDeleted && (
                        <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', lineHeight: 1.5 }}>
                          🚫 This message was deleted
                        </p>
                      )}

                      {/* Image */}
                      {!isDeleted && (msg.messageType === 'image' || msg.messageType === 'gif') && msg.mediaUrl && (
                        <img src={msg.mediaUrl} alt="" style={{ maxWidth: 220, maxHeight: 200, borderRadius: 14, display: 'block' }} />
                      )}

                      {/* Text */}
                      {!isDeleted && msg.messageType === 'text' && (
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{msg.content}</p>
                      )}

                      {/* Timestamp + delivery ticks */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 4, paddingRight: (msg.messageType === 'image' || msg.messageType === 'gif') && !isDeleted ? 6 : 0, paddingBottom: (msg.messageType === 'image' || msg.messageType === 'gif') && !isDeleted ? 4 : 0 }}>
                        <span style={{ fontSize: 10, color: isDeleted ? '#c4a0a8' : own ? 'rgba(255,255,255,0.65)' : '#a37a82' }}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {own && !isDeleted && (
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            {isTemp ? (
                              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>○</span>
                            ) : (
                              <span style={{ display: 'flex', color: msg.isRead ? '#60d4f5' : 'rgba(255,255,255,0.55)' }}>
                                <Check size={11} strokeWidth={3} />
                                <Check size={11} strokeWidth={3} style={{ marginLeft: -5 }} />
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── GIF Panel ── */}
        {showGifs && (
          <div style={{ background: 'rgba(255,255,255,0.97)', borderTop: '1px solid rgba(244,63,94,0.1)', padding: '12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                value={gifQuery}
                onChange={e => setGifQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchGifs(gifQuery)}
                placeholder="Search GIFs…"
                style={{ flex: 1, padding: '9px 14px', borderRadius: 12, border: '1.5px solid rgba(244,63,94,0.15)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans',sans-serif" }}
              />
              <button onClick={() => searchGifs(gifQuery)} style={{ padding: '9px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f43f5e,#ec4899)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                {gifLoading ? '…' : 'Go'}
              </button>
              <button onClick={() => { setShowGifs(false); setGifs([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="#a37a82" />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {gifs.length === 0 && !gifLoading && (
                <p style={{ fontSize: 12, color: '#a37a82', padding: '4px 0', margin: 0 }}>
                  {gifQuery ? 'No results' : 'Search for a GIF above'}
                </p>
              )}
              {gifs.map((gif: any) => (
                <button key={gif.id} onClick={() => sendGif(gif.images.fixed_height_small.url)} style={{ flexShrink: 0, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 10, overflow: 'hidden' }}>
                  <img src={gif.images.fixed_height_small.url} alt={gif.title} style={{ height: 90, width: 'auto', display: 'block' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input bar ── */}
        <div style={{ background: 'rgba(253,248,245,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(244,63,94,0.08)', padding: '10px 12px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))', flexShrink: 0 }}>
          <form onSubmit={sendText} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" onClick={() => setShowGifs(!showGifs)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', background: showGifs ? 'rgba(244,63,94,0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Gift size={18} color={showGifs ? '#f43f5e' : '#a37a82'} />
            </button>
            <button type="button" onClick={() => imageInputRef.current?.click()} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Image size={18} color="#a37a82" />
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Message ${otherProfile.full_name?.split(' ')[0] ?? ''}…`}
              style={{ flex: 1, padding: '11px 16px', borderRadius: 24, border: '1.5px solid rgba(244,63,94,0.12)', background: 'rgba(255,255,255,0.9)', fontSize: 14, color: '#2d1b1f', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0, background: text.trim() ? 'linear-gradient(135deg,#f43f5e,#ec4899)' : 'rgba(244,63,94,0.12)', cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: text.trim() ? '0 4px 12px rgba(244,63,94,0.3)' : 'none', transition: 'all 0.2s ease' }}>
              {sending
                ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                : <Send size={17} color={text.trim() ? 'white' : '#f43f5e'} />
              }
            </button>
          </form>
        </div>

        {/* ── Call Confirmation ── */}
        {showCallConfirm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,4,9,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ background: '#fdf8f5', borderRadius: 24, padding: '32px 28px', maxWidth: 320, width: '100%', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(244,63,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Video size={30} color="#f43f5e" />
              </div>
              <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: '#2d1b1f', margin: '0 0 8px' }}>Start video call?</h3>
              <p style={{ fontSize: 14, color: '#a37a82', margin: '0 0 24px', lineHeight: 1.6 }}>
                Calling {otherProfile.full_name?.split(' ')[0]}…
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowCallConfirm(false)} style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid rgba(244,63,94,0.2)', background: 'white', color: '#a37a82', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
                <button onClick={startCall} style={{ flex: 1, padding: '13px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#f43f5e,#ec4899)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 4px 16px rgba(244,63,94,0.3)' }}>Call Now</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Full Screen Video Call ── */}
        {inCall && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#0a0408', display: 'flex', flexDirection: 'column' }}>
            <div ref={remoteVideoRef} style={{ position: 'absolute', inset: 0, background: '#1a0a0f' }} />

            {!remoteJoined && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 10 }}>
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,#f43f5e,#ec4899)', padding: 3, boxShadow: '0 0 0 8px rgba(244,63,94,0.15)', animation: 'pulse-dot 2s ease-in-out infinite' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#1a0a0f' }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 32, fontWeight: 700, color: '#f43f5e', fontFamily: "'Fraunces',serif" }}>{initials}</span>
                        </div>
                    }
                  </div>
                </div>
                <p style={{ color: 'white', fontSize: 18, fontWeight: 600, fontFamily: "'Fraunces',serif", margin: 0 }}>{otherProfile.full_name?.split(' ')[0]}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>
                  {callLoading ? 'Connecting…' : 'Waiting for them to join…'}
                </p>
                {callLoading && <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid rgba(244,63,94,0.3)', borderTopColor: '#f43f5e', animation: 'spin 0.8s linear infinite' }} />}
              </div>
            )}

            {callConnected && (
              <div style={{ position: 'absolute', top: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 20 }}>
                <div style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', borderRadius: 100, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
                  <span style={{ color: 'white', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{formatDuration(callSeconds)}</span>
                </div>
              </div>
            )}

            <div ref={localVideoRef} style={{ position: 'absolute', top: 80, right: 16, width: 110, height: 150, borderRadius: 16, overflow: 'hidden', zIndex: 20, border: '2px solid rgba(255,255,255,0.15)', background: '#1a0a0f', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
            {camOff && (
              <div style={{ position: 'absolute', top: 80, right: 16, width: 110, height: 150, borderRadius: 16, zIndex: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2d1b1f' }}>
                <CameraOff size={24} color="rgba(255,255,255,0.4)" />
              </div>
            )}

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, padding: '32px 40px', paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
                <button onClick={toggleMic} style={{ width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer', background: micMuted ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {micMuted ? <MicOff size={22} color="#ef4444" /> : <Mic size={22} color="white" />}
                </button>
                <button onClick={() => endCall(false)} style={{ width: 68, height: 68, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(239,68,68,0.5)' }}>
                  <PhoneOff size={28} color="white" />
                </button>
                <button onClick={toggleCam} style={{ width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer', background: camOff ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {camOff ? <VideoOff size={22} color="#ef4444" /> : <Video size={22} color="white" />}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
