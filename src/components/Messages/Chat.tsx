/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
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
  messageType:    'text' | 'image' | 'gif' | 'audio' | 'video_call'
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
  embedded?:      boolean
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

function isUserOnline(lastActive?: string | null): boolean {
  if (!lastActive) return false
  const ts = new Date(lastActive).getTime()
  if (Number.isNaN(ts)) return false
  return Date.now() - ts <= 5 * 60 * 1000
}

function formatLastSeen(lastActive?: string | null): string {
  if (!lastActive) return 'Offline'
  const ts = new Date(lastActive).getTime()
  if (Number.isNaN(ts)) return 'Offline'
  const diffMins = Math.floor((Date.now() - ts) / 60000)
  if (diffMins < 1) return 'Last seen now'
  if (diffMins < 60) return `Last seen ${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Last seen ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `Last seen ${diffDays}d ago`
}

export default function Chat({ conversationId, otherProfile, onBack, embedded = false }: ChatProps) {
  const { profile: currentProfile } = useAuth()
  const isPendingConversation = conversationId.startsWith('pending-')
  const bottomInsetPadding = 'max(10px, env(safe-area-inset-bottom))'

  // Messages
  const [messages, setMessages]         = useState<MongoMessage[]>([])
  const [loading, setLoading]           = useState(true)
  const [sending, setSending]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [text, setText]                 = useState('')
  const [otherLastActive, setOtherLastActive] = useState<string | null>((otherProfile as any).last_active ?? null)
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string } | null>(null)
  const [mediaCaption, setMediaCaption] = useState('')
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null)
  const expandedImageScrollerRef = useRef<HTMLDivElement>(null)
  const [presenceViaSocket, setPresenceViaSocket] = useState(false)
  const messagesEndRef                  = useRef<HTMLDivElement>(null)
  const imageInputRef                   = useRef<HTMLInputElement>(null)
  const mediaRecorderRef                = useRef<MediaRecorder | null>(null)
  const audioChunksRef                  = useRef<Blob[]>([])
  const [recordingAudio, setRecordingAudio] = useState(false)

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
    if (isPendingConversation) {
      setMessages([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res  = await fetch(`/api/messages/${conversationId}`)
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch { setError('Could not load messages') }
    finally { setLoading(false) }
  }, [conversationId, isPendingConversation])

  useEffect(() => { loadMessages() }, [loadMessages])

  useEffect(() => {
    if (expandedImageUrl && expandedImageScrollerRef.current) {
      expandedImageScrollerRef.current.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [expandedImageUrl])

  // Revoke object URLs for selected images to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl)
    }
  }, [pendingImage?.previewUrl])

  // ── Live stream updates (SSE) ──────────────────────────────
  useEffect(() => {
    if (isPendingConversation) return
    const stream = new EventSource(`/api/chat/stream/${conversationId}`)
    const onMessage = (ev: MessageEvent) => {
      try {
        const latest = JSON.parse(ev.data)
        setMessages(prev => {
          const alreadyExists = prev.some(m =>
            m.id === latest.id ||
            (m.id?.startsWith('tmp-') && m.content === latest.content && m.senderId === latest.senderId)
          )
          if (alreadyExists) return prev
          return [...prev, latest]
        })
      } catch {
        // ignore malformed events
      }
    }
    const onReady = () => setPresenceViaSocket(true)
    const onOpen  = () => setPresenceViaSocket(true)
    const onError = () => setPresenceViaSocket(false)
    stream.addEventListener('message', onMessage as EventListener)
    stream.addEventListener('ready', onReady as EventListener)
    stream.addEventListener('open', onOpen as EventListener)
    stream.addEventListener('error', onError as EventListener)
    return () => {
      stream.removeEventListener('message', onMessage as EventListener)
      stream.removeEventListener('ready', onReady as EventListener)
      stream.removeEventListener('open', onOpen as EventListener)
      stream.removeEventListener('error', onError as EventListener)
      stream.close()
      setPresenceViaSocket(false)
    }
  }, [conversationId, isPendingConversation])

  // ── Presence heartbeat (this user) ─────────────────────────
  useEffect(() => {
    if (!presenceViaSocket) return
    let timer: NodeJS.Timeout | null = null
    const beat = async () => {
      try { await fetch('/api/presence/heartbeat', { method: 'POST' }) } catch { /* ignore */ }
    }
    beat()
    timer = setInterval(beat, 60_000)
    return () => { if (timer) clearInterval(timer) }
  }, [presenceViaSocket])

  // ── Poll other user's last_active for live online status ───
  useEffect(() => {
    if (!otherProfile?.id || isPendingConversation) return
    let timer: NodeJS.Timeout | null = null
    const fetchLastActive = async () => {
      try {
        const res = await fetch(`/api/presence/last-active?userId=${otherProfile.id}`)
        const data = await res.json()
        if ('lastActive' in data) setOtherLastActive(data.lastActive)
      } catch { /* ignore */ }
    }
    fetchLastActive()
    timer = setInterval(fetchLastActive, 20_000)
    return () => { if (timer) clearInterval(timer) }
  }, [otherProfile?.id, isPendingConversation])

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
    if (isPendingConversation) {
      setError('Chat unlocks once you both like each other')
      return
    }
    if (pendingImage) return
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
  ): Promise<MongoMessage | null> => {
    if (isPendingConversation) {
      setError('Chat unlocks once you both like each other')
      return null
    }
    if (!currentProfile) return null
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, messageType, ...extras }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Failed to send')
      }
      const { message } = await res.json()
      setMessages(p => [...p, { ...message }])
      return message as MongoMessage
    } catch (err: any) {
      setError(err?.message ?? 'Failed to send')
      return null
    }
  }

  // ── Image upload ───────────────────────────────────────────
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (uploadingMedia) {
      if (imageInputRef.current) imageInputRef.current.value = ''
      return
    }
    if (!file || !currentProfile) return
    setError(null)

    // WhatsApp-like flow: store locally for preview + caption, upload happens only on "Send".
    const previewUrl = URL.createObjectURL(file)
    setPendingImage(prev => {
      return { file, previewUrl }
    })
    setMediaCaption('')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const cancelPendingImage = () => {
    setPendingImage(null)
    setMediaCaption('')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const sendPendingImage = async () => {
    if (!pendingImage || !currentProfile) return
    if (isPendingConversation) {
      setError('Chat unlocks once you both like each other')
      return
    }
    if (uploadingMedia) return

    const caption = mediaCaption.trim() || '📷 Photo'
    setUploadingMedia(true)
    try {
      const msgId = `msg-${Date.now()}`
      const presignRes = await fetch('/api/chat/media', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          messageId: msgId,
          fileType: pendingImage.file.type,
          mediaType: 'image',
        }),
      })

      if (!presignRes.ok) throw new Error('Failed to get upload URL')
      const { url, fields, cloudfrontUrl } = await presignRes.json()
      if (!cloudfrontUrl) throw new Error('Missing mediaUrl from upload response')

      const fd = new FormData()
      Object.entries(fields).forEach(([k, v]) => fd.append(k, v as string))
      fd.append('file', pendingImage.file)

      const uploadRes = await fetch(url, { method: 'POST', body: fd })
      if (!uploadRes.ok) throw new Error('Upload to storage failed')
      const sent = await sendMediaMessage('image', caption, { mediaUrl: cloudfrontUrl })
      if (sent) {
        setPendingImage(null)
        setMediaCaption('')
      }
    } catch {
      setError('Failed to upload image')
    } finally {
      setUploadingMedia(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  // ── GIF helpers ────────────────────────────────────────────
  const mapGiphy = (data: any[]) =>
    (data ?? []).map((item: any) => ({
      id: item.id,
      url: item.images?.fixed_height_small?.url || item.images?.downsized_small?.url || item.images?.original?.url,
      title: item.title ?? '',
      provider: 'giphy',
    }))

  const mapTenor = (data: any[]) =>
    (data ?? []).map((item: any) => {
      const mf = item.media_formats ?? {}
      const url =
        mf.tinygif?.url ||
        mf.gif?.url ||
        mf.mediumgif?.url ||
        mf.nanogif?.url ||
        mf.mp4?.url ||
        ''
      return { id: item.id, url, title: item.content_description ?? '', provider: 'tenor' }
    })

  const tryGiphySearch = async (q: string, limit = 16) => {
    const key  = process.env.NEXT_PUBLIC_GIPHY_API_KEY
    if (!key) return { ok: false, gifs: [] as any[] }
    const res  = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=${limit}&rating=g`)
    if (!res.ok) return { ok: false, gifs: [] as any[] }
    const data = await res.json()
    return { ok: true, gifs: mapGiphy(data.data) }
  }

  const tryGiphyTrending = async (limit = 16) => {
    const key  = process.env.NEXT_PUBLIC_GIPHY_API_KEY
    if (!key) return { ok: false, gifs: [] as any[] }
    const res  = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=${limit}&rating=g`)
    if (!res.ok) return { ok: false, gifs: [] as any[] }
    const data = await res.json()
    return { ok: true, gifs: mapGiphy(data.data) }
  }

  // Tenor fallback — uses public demo key for light usage
  const TENOR_KEY_FALLBACK = 'LIVDSRZULELA'
  const tryTenorSearch = async (q: string, limit = 16) => {
    const key = process.env.NEXT_PUBLIC_TENOR_API_KEY || TENOR_KEY_FALLBACK
    const res = await fetch(`https://tenor.googleapis.com/v2/search?key=${key}&q=${encodeURIComponent(q)}&limit=${limit}&media_filter=basic&client_key=crotchet`)
    if (!res.ok) return { ok: false, gifs: [] as any[] }
    const data = await res.json()
    return { ok: true, gifs: mapTenor(data.results) }
  }
  const tryTenorTrending = async (limit = 16) => {
    const key = process.env.NEXT_PUBLIC_TENOR_API_KEY || TENOR_KEY_FALLBACK
    const res = await fetch(`https://tenor.googleapis.com/v2/featured?key=${key}&limit=${limit}&media_filter=basic&client_key=crotchet`)
    if (!res.ok) return { ok: false, gifs: [] as any[] }
    const data = await res.json()
    return { ok: true, gifs: mapTenor(data.results) }
  }

  const searchGifs = async (q: string) => {
    const query = q.trim()
    if (!query) return
    setGifLoading(true)
    try {
      let out: any[] = []
      const g = await tryGiphySearch(query)
      if (g.ok && g.gifs.length > 0) out = g.gifs
      else {
        const t = await tryTenorSearch(query)
        if (t.ok) out = t.gifs
      }
      setGifs(out)
    } catch { setGifs([]) }
    setGifLoading(false)
  }

  const loadTrendingGifs = async () => {
    setGifLoading(true)
    try {
      let out: any[] = []
      const g = await tryGiphyTrending()
      if (g.ok && g.gifs.length > 0) out = g.gifs
      else {
        const t = await tryTenorTrending()
        if (t.ok) out = t.gifs
      }
      setGifs(out)
    } catch { setGifs([]) }
    setGifLoading(false)
  }

  const sendGif = async (gifUrl: string) => {
    setShowGifs(false)
    setGifQuery('')
    setGifs([])
    await sendMediaMessage('gif', gifUrl, { mediaUrl: gifUrl })
  }

  const toggleVoiceRecording = async () => {
    if (isPendingConversation) {
      setError('Chat unlocks once you both like each other')
      return
    }
    if (recordingAudio && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) audioChunksRef.current.push(ev.data)
      }
      recorder.onstop = async () => {
        setRecordingAudio(false)
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (blob.size === 0) return
        const msgId = `msg-${Date.now()}`
        try {
          const presignRes = await fetch('/api/chat/media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId, messageId: msgId, fileType: 'audio/webm', mediaType: 'audio' }),
          })
          const { url, fields, cloudfrontUrl } = await presignRes.json()
          if (!presignRes.ok) throw new Error('Failed to get upload URL')
          if (!cloudfrontUrl) throw new Error('Missing mediaUrl from upload response')
          const fd = new FormData()
          Object.entries(fields).forEach(([k, v]) => fd.append(k, v as string))
          fd.append('file', blob, `${msgId}.webm`)
          const uploadRes = await fetch(url, { method: 'POST', body: fd })
          if (!uploadRes.ok) throw new Error('Upload to storage failed')
          await sendMediaMessage('audio', '🎤 Voice note', { mediaUrl: cloudfrontUrl })
        } catch {
          setError('Failed to send voice note')
        }
      }
      recorder.start()
      setRecordingAudio(true)
    } catch {
      setError('Microphone permission is required for voice notes')
    }
  }

  // ── Delete message ─────────────────────────────────────────
  const deleteMessage = async (messageId: string) => {
    if (isPendingConversation) return
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
    if (isPendingConversation && action !== 'block') {
      setError('This chat is pending until they like you back')
      return
    }
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
    if (isPendingConversation) {
      setError('Video call is available after you match')
      return
    }
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
  const online    = isUserOnline(otherLastActive)
  const statusText = isPendingConversation
    ? 'Pending match'
    : (online ? 'Online now' : formatLastSeen(otherLastActive))

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

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: embedded ? '100%' : 'calc(100dvh - 72px)',
        background: 'radial-gradient(44% 50% at 8% 90%, rgba(236,72,153,0.26), transparent 72%), radial-gradient(38% 44% at 92% 10%, rgba(139,92,246,0.24), transparent 74%), linear-gradient(140deg,#090019 0%,#17032f 36%,#2a0645 70%,#3d0853 100%)',
        fontFamily: "'DM Sans', sans-serif",
        position: 'relative',
      }}>

        {/* ── Header ── */}
        <div style={{ background: 'rgba(13,4,27,0.58)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.14)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowLeft size={18} color="#f8ecff" />
          </button>

          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#f43f5e,#ec4899)', padding: 2, flexShrink: 0 }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#120326' }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,63,94,0.1)' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#f43f5e', fontFamily: "'Fraunces',serif" }}>{initials}</span>
                  </div>
              }
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff6fb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {otherProfile.full_name}{ageLabel ? `, ${ageLabel}` : ''}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: online ? '#a7f3d0' : 'rgba(246,223,252,0.72)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: isPendingConversation ? '#f9a8d4' : (online ? '#34d399' : 'rgba(246,223,252,0.42)'), boxShadow: isPendingConversation ? '0 0 0 2px rgba(249,168,212,0.18)' : (online ? '0 0 0 2px rgba(52,211,153,0.22)' : 'none') }} />
              {statusText}
              {otherProfile.location ? ` • ${otherProfile.location}` : ''}
            </p>
          </div>

          {/* Video call button */}
          <button
            onClick={e => { e.stopPropagation(); !inCall && setShowCallConfirm(true) }}
            disabled={isPendingConversation}
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: isPendingConversation ? 'not-allowed' : 'pointer', opacity: isPendingConversation ? 0.5 : 1, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Video size={17} color="#f6e8ff" />
          </button>

          {/* Three dot menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={e => { e.stopPropagation(); setShowChatMenu(!showChatMenu) }}
              style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: showChatMenu ? 'rgba(236,72,153,0.24)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MoreVertical size={17} color="#f0d9ff" />
            </button>

            {showChatMenu && (
              <div
                onClick={e => e.stopPropagation()}
                style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 200, background: 'rgba(18,6,37,0.96)', borderRadius: 16, boxShadow: '0 18px 36px rgba(0,0,0,0.42)', border: '1px solid rgba(255,255,255,0.16)', minWidth: 190, overflow: 'hidden', animation: 'slideDown 0.15s ease' }}>
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
                    <span style={{ fontSize: 14, fontWeight: 500, color: item.action === 'block' ? '#ef4444' : '#f8ecff' }}>
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
          <div style={{ background: 'rgba(244,63,94,0.16)', borderBottom: '1px solid rgba(244,63,94,0.28)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#ffe1eb' }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={14} color="#ffe1eb" />
            </button>
          </div>
        )}

        {/* ── Messages ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid rgba(244,63,94,0.15)', borderTopColor: '#f43f5e', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{isPendingConversation ? '💌' : '🧵'}</div>
                <p style={{ fontSize: 14, color: 'rgba(246,223,252,0.82)', lineHeight: 1.6, margin: 0 }}>
                  {isPendingConversation ? (
                    <>
                      You liked <strong style={{ color: '#fff6fb' }}>{otherProfile.full_name?.split(' ')[0]}</strong>.<br />
                      Chat opens when they like you back.
                    </>
                  ) : (
                    <>
                      Start the conversation with<br />
                      <strong style={{ color: '#fff6fb' }}>{otherProfile.full_name?.split(' ')[0]}</strong>
                    </>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {messages.map((msg, i) => {
                const own    = msg.senderId === currentProfile?.id
                const isTemp = msg.id?.startsWith('tmp-')
                const isDeleted = msg.isDeleted
                const isGif = msg.messageType === 'gif'
                const imageCaption = (msg.messageType === 'image' && !isDeleted && typeof msg.content === 'string')
                  ? msg.content.trim()
                  : ''
                const hasImageCaption = Boolean(imageCaption && imageCaption !== '📷 Photo')

                // Video call pill
                if (msg.messageType === 'video_call') {
                  return (
                    <div key={msg.id ?? i} className="msg-in" style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <Video size={13} color="#f43f5e" />
                        <span style={{ fontSize: 12, color: 'rgba(246,223,252,0.82)', fontWeight: 500 }}>
                          {msg.callStatus === 'ended'
                            ? msg.callDuration ? `Video call · ${formatDuration(msg.callDuration)}` : 'Video call ended'
                            : 'Video call started'}
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(246,223,252,0.62)' }}>{formatTime(msg.createdAt)}</span>
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
                          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 12, background: 'rgba(20,8,40,0.98)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontSize: 13, color: '#ff8ca0', fontWeight: 600, fontFamily: "'DM Sans',sans-serif", boxShadow: '0 10px 24px rgba(0,0,0,0.35)', whiteSpace: 'nowrap' }}>
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
                      padding: (msg.messageType === 'image' || msg.messageType === 'gif') && !isDeleted ? '0' : '10px 14px',
                      borderRadius: own ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isDeleted
                        ? 'rgba(255,255,255,0.08)'
                        : isGif ? 'transparent'
                        : own ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'rgba(255,255,255,0.12)',
                      border: isDeleted ? '1px dashed rgba(255,255,255,0.24)' : isGif ? 'none' : own ? 'none' : '1px solid rgba(255,255,255,0.2)',
                      boxShadow: isDeleted ? 'none' : isGif ? 'none' : own ? '0 8px 20px rgba(244,63,94,0.28)' : '0 4px 14px rgba(0,0,0,0.2)',
                      color: isDeleted ? 'rgba(246,223,252,0.66)' : own ? 'white' : '#fff2fb',
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
                        <img
                          src={msg.mediaUrl}
                          alt=""
                          onClick={e => { e.stopPropagation(); setExpandedImageUrl(msg.mediaUrl ?? null) }}
                          style={{ maxWidth: 220, maxHeight: 200, borderRadius: 14, display: 'block', cursor: 'zoom-in' }}
                        />
                      )}

                      {/* Image caption/message */}
                      {!isDeleted && msg.messageType === 'image' && hasImageCaption && (
                        <p style={{ margin: 0, padding: '8px 10px 0', fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}>{imageCaption}</p>
                      )}
                      {!isDeleted && msg.messageType === 'audio' && msg.mediaUrl && (
                        <audio controls preload="none" src={msg.mediaUrl} style={{ width: 220, display: 'block' }} />
                      )}

                      {/* Text */}
                      {!isDeleted && msg.messageType === 'text' && (
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{msg.content}</p>
                      )}

                      {/* Timestamp + delivery ticks */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 4, paddingRight: (msg.messageType === 'image' || msg.messageType === 'gif') && !isDeleted ? 8 : 0, paddingBottom: (msg.messageType === 'image' || msg.messageType === 'gif') && !isDeleted ? 6 : 0 }}>
                        <span style={{ fontSize: 10, color: isDeleted ? 'rgba(246,223,252,0.6)' : own ? 'rgba(255,255,255,0.65)' : 'rgba(246,223,252,0.68)' }}>
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

          {expandedImageUrl && (
            <div
              style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(8,2,18,0.9)', backdropFilter: 'blur(2px)' }}
              onClick={() => setExpandedImageUrl(null)}
            >
              <div
                ref={expandedImageScrollerRef}
                style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}
                onClick={e => e.stopPropagation()}
              >
                <img
                  src={expandedImageUrl}
                  alt=""
                  style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                />
              </div>
              <button
                type="button"
                onClick={() => setExpandedImageUrl(null)}
                style={{ position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.14)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Close image preview"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ── GIF Panel ── */}
        {showGifs && (
          <div style={{ background: 'rgba(14,4,28,0.72)', borderTop: '1px solid rgba(255,255,255,0.16)', padding: '12px', flexShrink: 0, backdropFilter: 'blur(14px)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                value={gifQuery}
                onChange={e => setGifQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchGifs(gifQuery)}
                placeholder="Search GIFs…"
                style={{ flex: 1, padding: '9px 14px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', fontSize: 13, color: '#fff2fb', outline: 'none', fontFamily: "'DM Sans',sans-serif" }}
              />
              <button onClick={() => searchGifs(gifQuery)} style={{ padding: '9px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f43f5e,#ec4899)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                {gifLoading ? '…' : 'Go'}
              </button>
              <button onClick={() => { setShowGifs(false); setGifs([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="rgba(246,223,252,0.76)" />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {gifs.length === 0 && !gifLoading && (
                <p style={{ fontSize: 12, color: 'rgba(246,223,252,0.76)', padding: '4px 0', margin: 0 }}>
                  {gifQuery ? 'No results' : 'Type a topic or tap Go for trending'}
                </p>
              )}
              {gifs.map((gif: any) => (
                <button key={gif.id} onClick={() => sendGif(gif.url)} style={{ flexShrink: 0, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 10, overflow: 'hidden' }}>
                  <img src={gif.url} alt={gif.title} style={{ height: 90, width: 'auto', display: 'block' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input bar ── */}
        <div style={{ background: 'rgba(13,4,27,0.66)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.16)', padding: '10px 12px', paddingBottom: bottomInsetPadding, flexShrink: 0 }}>
          {pendingImage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 58, height: 58, borderRadius: 16, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <img
                  src={pendingImage.previewUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>

              <input
                value={mediaCaption}
                onChange={e => setMediaCaption(e.target.value)}
                placeholder="Add a caption…"
                style={{ flex: 1, padding: '11px 16px', borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.12)', fontSize: 14, color: '#fff2fb', outline: 'none', fontFamily: "'DM Sans',sans-serif" }}
                disabled={uploadingMedia || isPendingConversation}
              />

              <button
                type="button"
                onClick={cancelPendingImage}
                disabled={uploadingMedia}
                style={{ padding: '10px 14px', borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: 'rgba(246,223,252,0.82)', fontSize: 13, fontWeight: 700, cursor: uploadingMedia ? 'default' : 'pointer', flexShrink: 0 }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={sendPendingImage}
                disabled={uploadingMedia || isPendingConversation}
                style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0, background: !isPendingConversation ? 'linear-gradient(135deg,#f43f5e,#ec4899)' : 'rgba(244,63,94,0.12)', cursor: !isPendingConversation ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: !isPendingConversation ? '0 4px 12px rgba(244,63,94,0.3)' : 'none' }}
                aria-label="Send image"
              >
                {uploadingMedia ? (
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <Send size={17} color="white" />
                )}
              </button>
            </div>
          )}
          <form onSubmit={sendText} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={async () => {
                const next = !showGifs
                setShowGifs(next)
                if (next && gifs.length === 0) {
                  // load trending on open if empty
                  await loadTrendingGifs()
                }
              }}
              style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', background: showGifs ? 'rgba(236,72,153,0.24)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Gift size={18} color={showGifs ? '#ffd7ec' : 'rgba(246,223,252,0.76)'} />
            </button>
            <button type="button" onClick={() => imageInputRef.current?.click()} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Image size={18} color="rgba(246,223,252,0.76)" />
            </button>
            <button
              type="button"
              onClick={toggleVoiceRecording}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                cursor: 'pointer',
                background: recordingAudio ? 'rgba(244,63,94,0.34)' : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
              title={recordingAudio ? 'Stop recording' : 'Record voice note'}
            >
              <Mic size={17} color={recordingAudio ? '#fff' : 'rgba(246,223,252,0.82)'} />
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={isPendingConversation ? 'Waiting for match to unlock chat…' : `Message ${otherProfile.full_name?.split(' ')[0] ?? ''}…`}
              style={{ flex: 1, padding: '11px 16px', borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.12)', fontSize: 14, color: '#fff2fb', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
              disabled={sending || isPendingConversation || !!pendingImage}
            />
            <button
              type="submit"
              disabled={!text.trim() || sending || isPendingConversation || !!pendingImage}
              style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0, background: !isPendingConversation && text.trim() ? 'linear-gradient(135deg,#f43f5e,#ec4899)' : 'rgba(244,63,94,0.12)', cursor: !isPendingConversation && text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: !isPendingConversation && text.trim() ? '0 4px 12px rgba(244,63,94,0.3)' : 'none', transition: 'all 0.2s ease' }}>
              {sending
                ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                : <Send size={17} color={!isPendingConversation && text.trim() ? 'white' : '#f43f5e'} />
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
