'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause, Trash2, Upload, Check } from 'lucide-react'

interface VoiceNoteRecorderProps {
  userId: string
}

type RecorderState = 'idle' | 'recording' | 'recorded' | 'uploading' | 'saved'

export default function VoiceNoteRecorder({ userId }: VoiceNoteRecorderProps) {
  const [state, setState]           = useState<RecorderState>('idle')
  const [duration, setDuration]     = useState(0)
  const [isPlaying, setIsPlaying]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [audioUrl, setAudioUrl]     = useState<string | null>(null)
  const [savedUrl, setSavedUrl]     = useState<string | null>(null)
  const [bars, setBars]             = useState<number[]>(Array(28).fill(4))

  const mediaRecorderRef  = useRef<MediaRecorder | null>(null)
  const audioRef          = useRef<HTMLAudioElement | null>(null)
  const chunksRef         = useRef<Blob[]>([])
  const timerRef          = useRef<NodeJS.Timeout | null>(null)
  const analyserRef       = useRef<AnalyserNode | null>(null)
  const animFrameRef      = useRef<number | null>(null)
  const streamRef         = useRef<MediaStream | null>(null)

  const MAX_SECONDS = 30

  // Load existing voice note on mount
  useEffect(() => {
    fetch('/api/voice-note')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.url) {
          setSavedUrl(data.url)
          setState('saved')
        }
      })
      .catch(() => {})
  }, [userId])

  // Animate waveform bars during recording
  const animateBars = (analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(data)
      const step = Math.floor(data.length / 28)
      setBars(Array.from({ length: 28 }, (_, i) => {
        const val = data[i * step] ?? 0
        return Math.max(4, Math.round((val / 255) * 40))
      }))
      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up analyser for waveform visualisation
      const ctx      = new AudioContext()
      const source   = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      analyserRef.current = analyser

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url  = URL.createObjectURL(blob)
        setAudioUrl(url)
        setState('recorded')
        setBars(Array(28).fill(4))
      }

      recorder.start()
      setState('recording')
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d >= MAX_SECONDS - 1) {
            stopRecording()
            return MAX_SECONDS
          }
          return d + 1
        })
      }, 1000)

      animateBars(analyser)
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const handlePlayPause = () => {
    const url = savedUrl ?? audioUrl
    if (!url) return
    if (!audioRef.current) {
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => setIsPlaying(false)
    }
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleDelete = async () => {
    audioRef.current?.pause()
    audioRef.current = null
    setAudioUrl(null)
    setSavedUrl(null)
    setIsPlaying(false)
    setDuration(0)
    setState('idle')
    // Delete from server
    await fetch('/api/voice-note', { method: 'DELETE' }).catch(() => {})
  }

  const handleUpload = async () => {
    if (!audioUrl) return
    setState('uploading')
    setError(null)
    try {
      const blob     = new Blob(chunksRef.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('file', blob, 'voice-note.webm')

      const res = await fetch('/api/voice-note', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setSavedUrl(data.url)
      setState('saved')
    } catch {
      setError('Upload failed — please try again.')
      setState('recorded')
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // ── Waveform display ──
  const Waveform = ({ animate }: { animate: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 44 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2,
          height: animate ? h : Math.max(4, Math.round(Math.sin(i * 0.4) * 14 + 18)),
          background: animate
            ? `linear-gradient(to top, #f43f5e, #ec4899)`
            : 'rgba(244,63,94,0.3)',
          transition: animate ? 'height 0.08s ease' : 'none',
          flexShrink: 0,
        }} />
      ))}
    </div>
  )

  return (
    <div>
      {error && (
        <p style={{ fontSize: 12, color: '#e11d48', marginBottom: 10,
          fontFamily: "'DM Sans', sans-serif" }}>
          {error}
        </p>
      )}

      {/* IDLE — prompt to record */}
      {state === 'idle' && (
        <button
          onClick={startRecording}
          style={{
            width: '100%', padding: '20px',
            borderRadius: 16, border: '2px dashed rgba(244,63,94,0.2)',
            background: 'rgba(244,63,94,0.02)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 10, cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(244,63,94,0.4)'
            e.currentTarget.style.background  = 'rgba(244,63,94,0.04)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)'
            e.currentTarget.style.background  = 'rgba(244,63,94,0.02)'
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(244,63,94,0.3)',
          }}>
            <Mic size={22} color="white" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#2d1b1f',
              fontFamily: "'DM Sans', sans-serif" }}>
              Record a voice note
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#a37a82',
              fontFamily: "'DM Sans', sans-serif" }}>
              Up to 30 seconds · Visible to matches only
            </p>
          </div>
        </button>
      )}

      {/* RECORDING */}
      {state === 'recording' && (
        <div style={{
          padding: '16px', borderRadius: 16,
          background: 'rgba(244,63,94,0.04)',
          border: '1.5px solid rgba(244,63,94,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#f43f5e',
                animation: 'pulse-rose 1s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f43f5e',
                fontFamily: "'DM Sans', sans-serif" }}>
                Recording
              </span>
            </div>
            <span style={{ fontSize: 13, color: '#6b4c52', fontFamily: "'DM Sans', sans-serif" }}>
              {formatTime(duration)} / {formatTime(MAX_SECONDS)}
            </span>
          </div>

          <div style={{ marginBottom: 14 }}>
            <Waveform animate={true} />
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, borderRadius: 2, background: 'rgba(244,63,94,0.1)', marginBottom: 14 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: 'linear-gradient(90deg, #f43f5e, #ec4899)',
              width: `${(duration / MAX_SECONDS) * 100}%`,
              transition: 'width 1s linear',
            }} />
          </div>

          <button onClick={stopRecording} style={{
            width: '100%', padding: '11px',
            borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
            color: 'white', fontSize: 14, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(244,63,94,0.3)',
          }}>
            <Square size={14} fill="white" /> Stop Recording
          </button>
        </div>
      )}

      {/* RECORDED — preview before saving */}
      {state === 'recorded' && (
        <div style={{
          padding: '16px', borderRadius: 16,
          background: 'rgba(255,251,249,0.9)',
          border: '1.5px solid rgba(244,63,94,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2d1b1f',
              fontFamily: "'DM Sans', sans-serif" }}>
              Preview — {formatTime(duration)}
            </span>
            <button onClick={handleDelete} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#a37a82', padding: 4,
              display: 'flex', alignItems: 'center',
            }}>
              <Trash2 size={15} />
            </button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <Waveform animate={false} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePlayPause} style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              border: '1.5px solid rgba(244,63,94,0.2)',
              background: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isPlaying
                ? <Pause size={16} color="#f43f5e" />
                : <Play size={16} color="#f43f5e" />
              }
            </button>
            <button onClick={handleUpload} style={{
              flex: 1, padding: '11px', borderRadius: 12,
              border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
              color: 'white', fontSize: 14, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(244,63,94,0.3)',
            }}>
              <Upload size={14} /> Save Voice Note
            </button>
          </div>

          <button onClick={startRecording} style={{
            width: '100%', marginTop: 8, padding: '9px',
            borderRadius: 12, border: '1.5px solid rgba(244,63,94,0.15)',
            background: 'white', color: '#a37a82', fontSize: 13,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            Record again
          </button>
        </div>
      )}

      {/* UPLOADING */}
      {state === 'uploading' && (
        <div style={{
          padding: '24px', borderRadius: 16, textAlign: 'center',
          background: 'rgba(244,63,94,0.03)',
          border: '1.5px solid rgba(244,63,94,0.1)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '2.5px solid rgba(244,63,94,0.15)',
            borderTopColor: '#f43f5e',
            animation: 'spin-slow 0.8s linear infinite',
            margin: '0 auto 10px',
          }} />
          <p style={{ margin: 0, fontSize: 13, color: '#a37a82',
            fontFamily: "'DM Sans', sans-serif" }}>
            Saving your voice note…
          </p>
        </div>
      )}

      {/* SAVED */}
      {state === 'saved' && (
        <div style={{
          padding: '16px', borderRadius: 16,
          background: 'rgba(255,251,249,0.9)',
          border: '1.5px solid rgba(244,63,94,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={13} color="white" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2d1b1f',
                fontFamily: "'DM Sans', sans-serif" }}>
                Voice note saved
              </span>
            </div>
            <button onClick={handleDelete} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#a37a82', padding: 4,
              display: 'flex', alignItems: 'center',
            }}>
              <Trash2 size={15} />
            </button>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Waveform animate={false} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePlayPause} style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              border: '1.5px solid rgba(244,63,94,0.2)',
              background: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isPlaying
                ? <Pause size={16} color="#f43f5e" />
                : <Play size={16} color="#f43f5e" />
              }
            </button>
            <button onClick={startRecording} style={{
              flex: 1, padding: '11px', borderRadius: 12,
              border: '1.5px solid rgba(244,63,94,0.15)',
              background: 'white', color: '#6b4c52', fontSize: 13,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              Record new note
            </button>
          </div>

          <p style={{ margin: '10px 0 0', fontSize: 11, color: '#a37a82', textAlign: 'center',
            fontFamily: "'DM Sans', sans-serif" }}>
            🔒 Visible to your matches only
          </p>
        </div>
      )}
    </div>
  )
}