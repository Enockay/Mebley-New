/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ArrowLeft, Send, Mic, MicOff, Image, Gift,
  Video, Phone, PhoneOff, Square, Play, Pause, X, Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface MongoMessage {
  id:            string
  conversationId: string
  senderId:      string
  receiverId:    string
  content:       string
  messageType:   'text' | 'image' | 'gif' | 'audio' | 'voice' | 'video_call'
  mediaUrl?:     string
  mediaKey?:     string
  duration?:     number
  callStatus?:   'initiated' | 'accepted' | 'declined' | 'missed' | 'ended'
  callDuration?: number
  isRead:        boolean
  createdAt:     string
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

function formatTime(ts: string | Date) {
  const d = typeof ts === 'string' ? new Date(ts) : ts
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── GIF Search via Giphy ──────────────────────────────────────
const GIPHY_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY ?? ''

export default function Chat({ conversationId, otherProfile, onBack }: ChatProps) {
  const { profile: currentProfile } = useAuth()

  // Messages
  const [messages, setMessages]       = useState<MongoMessage[]>([])
  const [loading, setLoading]         = useState(true)
  const [sending, setSending]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [text, setText]               = useState('')
  const messagesEndRef                = useRef<HTMLDivElement>(null)

  // Media panels
  const [showGifs, setShowGifs]       = useState(false)
  const [gifQuery, setGifQuery]       = useState('')
  const [gifs, setGifs]               = useState<any[]>([])
  const [gifLoading, setGifLoading]   = useState(false)
  const imageInputRef                 = useRef<HTMLInputElement>(null)

  // Voice recording
  const [recording, setRecording]       = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [audioBlob, setAudioBlob]       = useState<Blob | null>(null)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const mediaRecorderRef              = useRef<MediaRecorder | null>(null)
  const recordChunksRef               = useRef<Blob[]>([])
  const recordTimerRef                = useRef<NodeJS.Timeout | null>(null)
  const audioRefs                     = useRef<Map<string, HTMLAudioElement>>(new Map())

  // Video call
  const [inCall, setInCall]           = useState(false)
  const [callLoading, setCallLoading] = useState(false)
  const [showCallConfirm, setShowCallConfirm] = useState(false)
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(null)
  const [micMuted, setMicMuted]       = useState(false)
  const agoraClientRef                = useRef<IAgoraRTCClient | null>(null)
  const localVideoRef                 = useRef<HTMLDivElement>(null)
  const remoteVideoRef                = useRef<HTMLDivElement>(null)

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
              // Skip if already exists by id OR if we sent it (optimistic already added)
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      const res  = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, messageType: 'text' }),
      })
      const { message } = await res.json()
      setMessages(p => p.map(m => m.id === optimistic.id ? { ...message } : m))
    } catch {
      setMessages(p => p.filter(m => m.id !== optimistic.id))
      setText(content)
    } finally { setSending(false) }
  }

  // ── Send media message ─────────────────────────────────────
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
      const res  = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=12&rating=g`)
      const data = await res.json()
      setGifs(data.data ?? [])
    } catch { /* ignore */ }
    setGifLoading(false)
  }

  const sendGif = async (gifUrl: string) => {
    setShowGifs(false)
    await sendMediaMessage('gif', gifUrl, { mediaUrl: gifUrl })
  }

  // ── Voice recording ────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr     = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      recordChunksRef.current  = []
      mr.ondataavailable = e => { if (e.data.size > 0) recordChunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(recordChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      setRecording(true)
      setRecordSeconds(0)
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000)
    } catch { setError('Microphone access denied') }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    if (recordTimerRef.current) clearInterval(recordTimerRef.current)
    setRecording(false)
  }

  const sendVoiceNote = async () => {
    if (!audioBlob || !currentProfile) return
    const msgId = `msg-${Date.now()}`
    try {
      const presignRes = await fetch('/api/chat/media', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, messageId: msgId, fileType: 'audio/webm', mediaType: 'voice' }),
      })
      const { url, fields, cloudfrontUrl } = await presignRes.json()
      const fd = new FormData()
      Object.entries(fields).forEach(([k, v]) => fd.append(k, v as string))
      fd.append('file', audioBlob)
      await fetch(url, { method: 'POST', body: fd })
      await sendMediaMessage('voice', '🎙️ Voice note', { mediaUrl: cloudfrontUrl, duration: recordSeconds })
    } catch { setError('Failed to send voice note') }
    setAudioBlob(null)
    setRecordSeconds(0)
  }

  const playVoice = (id: string, url: string) => {
    if (playingVoice === id) {
      audioRefs.current.get(id)?.pause()
      setPlayingVoice(null)
      return
    }
    let audio = audioRefs.current.get(id)
    if (!audio) {
      audio = new Audio(url)
      audio.onended = () => setPlayingVoice(null)
      audioRefs.current.set(id, audio)
    }
    audio.play()
    setPlayingVoice(id)
  }

  // ── Video call ─────────────────────────────────────────────
  const startCall = async () => {
    setCallLoading(true)
    try {
      const res  = await fetch('/api/chat/call', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: conversationId }),
      })
      const { token, appId, channelName } = await res.json()
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      const client   = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      agoraClientRef.current = client

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType)
        if (mediaType === 'video' && remoteVideoRef.current) {
          user.videoTrack?.play(remoteVideoRef.current)
        }
        if (mediaType === 'audio') user.audioTrack?.play()
      })

      await client.join(appId, channelName, token, null)
      const AgoraRTC2 = (await import('agora-rtc-sdk-ng')).default
      const [audioTrack, videoTrack] = await AgoraRTC2.createMicrophoneAndCameraTracks()
      if (localVideoRef.current) videoTrack.play(localVideoRef.current)
      await client.publish([audioTrack, videoTrack])
      setLocalTracks([audioTrack, videoTrack])
      setInCall(true)

      await sendMediaMessage('video_call', '📹 Video call started', { callStatus: 'initiated' })
    } catch (err) {
      setError('Could not start video call')
      console.error(err)
    }
    setCallLoading(false)
  }

  const endCall = async () => {
    localTracks?.[0].stop(); localTracks?.[0].close()
    localTracks?.[1].stop(); localTracks?.[1].close()
    await agoraClientRef.current?.leave()
    setLocalTracks(null)
    setInCall(false)
  }

  const toggleMic = () => {
    if (!localTracks) return
    const muted = !micMuted
    localTracks[0].setEnabled(!muted)
    setMicMuted(muted)
  }

  const avatarUrl = getPhotoUrl(otherProfile.photos)
  const initials  = otherProfile.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'
  const ageLabel  = AGE_RANGE_LABELS[(otherProfile as any).age_range ?? '']

  // ── Styles ────────────────────────────────────────────────
  const s = {
    page:  { display: 'flex', flexDirection: 'column' as const, height: '100vh', background: '#fdf8f5', fontFamily: "'DM Sans', sans-serif" },
    header: { position: 'sticky' as const, top: 0, zIndex: 20, background: 'rgba(253,248,245,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(244,63,94,0.08)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 },
    bubble: (own: boolean) => ({
      maxWidth: '72%', padding: '10px 14px', borderRadius: own ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      background: own ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'rgba(255,255,255,0.9)',
      border: own ? 'none' : '1px solid rgba(244,63,94,0.1)',
      boxShadow: own ? '0 4px 16px rgba(244,63,94,0.25)' : '0 2px 8px rgba(180,60,80,0.06)',
      color: own ? 'white' : '#2d1b1f',
    }),
  }

  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <div style={s.header}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(244,63,94,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowLeft size={18} color="#f43f5e" />
        </button>

        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#f43f5e,#ec4899)', padding: 2, flexShrink: 0 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#fdf8f5' }}>
            {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,63,94,0.1)' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#f43f5e', fontFamily: "'Fraunces',serif" }}>{initials}</span>
              </div>
            )}
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
          onClick={inCall ? endCall : () => setShowCallConfirm(true)}
          disabled={callLoading}
          style={{
            width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: inCall ? 'rgba(239,68,68,0.1)' : 'rgba(244,63,94,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
          {callLoading ? <Loader2 size={17} color="#f43f5e" className="animate-spin" /> : inCall ? <PhoneOff size={17} color="#ef4444" /> : <Video size={17} color="#f43f5e" />}
        </button>
      </div>

      {/* ── Call confirmation ── */}
      {showCallConfirm && !inCall && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: 'rgba(15,4,9,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: 'rgba(253,248,245,0.98)', borderRadius: 24,
            padding: '32px 28px', maxWidth: 320, width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
            <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: '#2d1b1f', margin: '0 0 8px' }}>
              Start video call?
            </h3>
            <p style={{ fontSize: 14, color: '#a37a82', margin: '0 0 24px', lineHeight: 1.6 }}>
              You're about to start a video call with {otherProfile.full_name?.split(' ')[0]}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowCallConfirm(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 14,
                  border: '1.5px solid rgba(244,63,94,0.2)',
                  background: 'white', color: '#a37a82',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans',sans-serif",
                }}>
                Cancel
              </button>
              <button
                onClick={() => { setShowCallConfirm(false); startCall() }}
                style={{
                  flex: 1, padding: '12px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg,#f43f5e,#ec4899)',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                  boxShadow: '0 4px 16px rgba(244,63,94,0.3)',
                }}>
                Start Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Video call overlay ── */}
      {inCall && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0f0409', display: 'flex', flexDirection: 'column' }}>
          {/* Remote video */}
          <div ref={remoteVideoRef} style={{ flex: 1, background: '#1a0a0f' }} />
          {/* Local video pip */}
          <div ref={localVideoRef} style={{ position: 'absolute', top: 80, right: 16, width: 120, height: 160, borderRadius: 14, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', background: '#2d1b1f' }} />
          {/* Controls */}
          <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'center', gap: 20, background: 'rgba(0,0,0,0.5)' }}>
            <button onClick={toggleMic} style={{ width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer', background: micMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {micMuted ? <MicOff size={22} color="#ef4444" /> : <Mic size={22} color="white" />}
            </button>
            <button onClick={endCall} style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}>
              <PhoneOff size={26} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* ── Error bar ── */}
      {error && (
        <div style={{ background: 'rgba(244,63,94,0.08)', borderBottom: '1px solid rgba(244,63,94,0.15)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#f43f5e' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color="#f43f5e" /></button>
        </div>
      )}

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Loader2 size={28} color="#f43f5e" style={{ animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <p style={{ fontSize: 14, color: '#a37a82', lineHeight: 1.6 }}>
                Say hello to {otherProfile.full_name}!<br />
                <span style={{ fontSize: 12 }}>A new stitch begins here 🧵</span>
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((msg, i) => {
              const own = msg.senderId === currentProfile?.id
              return (
                <div key={msg.id ?? i} style={{ display: 'flex', justifyContent: own ? 'flex-end' : 'flex-start' }}>
                  <div style={s.bubble(own)}>

                    {/* Image */}
                    {msg.messageType === 'image' && msg.mediaUrl && (
                      <img src={msg.mediaUrl} alt="shared" style={{ maxWidth: 220, borderRadius: 12, display: 'block', marginBottom: 4 }} />
                    )}

                    {/* GIF */}
                    {msg.messageType === 'gif' && msg.mediaUrl && (
                      <img src={msg.mediaUrl} alt="gif" style={{ maxWidth: 220, borderRadius: 12, display: 'block', marginBottom: 4 }} />
                    )}

                    {/* Voice note */}
                    {msg.messageType === 'voice' && msg.mediaUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 140 }}>
                        <button
                          onClick={() => playVoice(msg.id, msg.mediaUrl!)}
                          style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: own ? 'rgba(255,255,255,0.25)' : 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {playingVoice === msg.id ? <Square size={14} color={own ? 'white' : '#f43f5e'} /> : <Play size={14} color={own ? 'white' : '#f43f5e'} />}
                        </button>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 3, borderRadius: 2, background: own ? 'rgba(255,255,255,0.3)' : 'rgba(244,63,94,0.2)' }}>
                            <div style={{ height: '100%', width: playingVoice === msg.id ? '50%' : '0%', background: own ? 'white' : '#f43f5e', borderRadius: 2, transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: 10, color: own ? 'rgba(255,255,255,0.7)' : '#a37a82', marginTop: 3, display: 'block' }}>
                            {msg.duration ? formatDuration(msg.duration) : ''}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Video call */}
                    {msg.messageType === 'video_call' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Video size={16} color={own ? 'rgba(255,255,255,0.8)' : '#f43f5e'} />
                        <span style={{ fontSize: 13 }}>
                          {msg.callStatus === 'ended' ? `Video call · ${msg.callDuration ? formatDuration(msg.callDuration) : 'ended'}` : 'Video call started'}
                        </span>
                      </div>
                    )}

                    {/* Text content */}
                    {msg.messageType === 'text' && (
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{msg.content}</p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: own ? 'rgba(255,255,255,0.6)' : '#a37a82' }}>
                        {formatTime(msg.createdAt)}
                      </span>
                      {own && (
                        <span style={{ fontSize: 10, color: msg.isRead ? '#60d4f5' : 'rgba(255,255,255,0.5)', letterSpacing: '-1px' }}>
                          {msg.id?.startsWith('tmp-') ? '○' : msg.isRead ? '✓✓' : '✓✓'}
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

      {/* ── Voice note preview ── */}
      {audioBlob && !recording && (
        <div style={{ padding: '10px 16px', background: 'rgba(244,63,94,0.05)', borderTop: '1px solid rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Mic size={16} color="#f43f5e" />
          <span style={{ fontSize: 13, color: '#f43f5e', flex: 1 }}>Voice note ready · {formatDuration(recordSeconds)}</span>
          <button onClick={() => { setAudioBlob(null); setRecordSeconds(0) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a37a82' }}><X size={16} /></button>
          <button onClick={sendVoiceNote} style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)', border: 'none', borderRadius: 100, padding: '6px 14px', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Send</button>
        </div>
      )}

      {/* ── GIF panel ── */}
      {showGifs && (
        <div style={{ background: 'rgba(255,255,255,0.95)', borderTop: '1px solid rgba(244,63,94,0.1)', padding: '12px', maxHeight: 260, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={gifQuery}
              onChange={e => setGifQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchGifs(gifQuery)}
              placeholder="Search GIFs…"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid rgba(244,63,94,0.15)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans',sans-serif" }}
            />
            <button onClick={() => searchGifs(gifQuery)} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f43f5e,#ec4899)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              {gifLoading ? '…' : 'Search'}
            </button>
            <button onClick={() => setShowGifs(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a37a82' }}><X size={16} /></button>
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {gifs.map((gif: any) => (
              <button key={gif.id} onClick={() => sendGif(gif.images.fixed_height_small.url)} style={{ flexShrink: 0, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 8, overflow: 'hidden' }}>
                <img src={gif.images.fixed_height_small.url} alt={gif.title} style={{ height: 80, width: 'auto', display: 'block' }} />
              </button>
            ))}
            {gifs.length === 0 && !gifLoading && (
              <p style={{ fontSize: 12, color: '#a37a82', padding: '8px 0' }}>Search for a GIF above</p>
            )}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div style={{ background: 'rgba(253,248,245,0.95)', borderTop: '1px solid rgba(244,63,94,0.08)', padding: '10px 12px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        {recording ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f43f5e', animation: 'pulse 1s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: '#f43f5e', fontWeight: 600, flex: 1 }}>Recording · {formatDuration(recordSeconds)}</span>
            <button onClick={stopRecording} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Square size={16} color="white" fill="white" />
            </button>
          </div>
        ) : (
          <form onSubmit={sendText} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* GIF */}
            <button type="button" onClick={() => setShowGifs(!showGifs)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', background: showGifs ? 'rgba(244,63,94,0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Gift size={18} color={showGifs ? '#f43f5e' : '#a37a82'} />
            </button>

            {/* Image */}
            <button type="button" onClick={() => imageInputRef.current?.click()} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Image size={18} color="#a37a82" />
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" style={{ display: 'none' }} onChange={handleImageSelect} />

            {/* Text input */}
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Message ${otherProfile.full_name?.split(' ')[0]}…`}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 24,
                border: '1.5px solid rgba(244,63,94,0.12)',
                background: 'rgba(255,255,255,0.9)',
                fontSize: 14, color: '#2d1b1f', outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
              }}
              disabled={sending}
            />

            {/* Voice / Send */}
            {text.trim() ? (
              <button type="submit" disabled={sending} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#f43f5e,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(244,63,94,0.3)' }}>
                {sending ? <Loader2 size={17} color="white" style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={17} color="white" />}
              </button>
            ) : (
              <button type="button" onMouseDown={startRecording} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(244,63,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mic size={18} color="#f43f5e" />
              </button>
            )}
          </form>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}
