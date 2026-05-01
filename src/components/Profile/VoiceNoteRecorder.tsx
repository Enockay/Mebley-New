'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Square, Play, Pause, Trash2, Upload, Check, Loader2, MicOff } from 'lucide-react'
import PermissionDialog from '@/components/UI/PermissionDialog'

interface VoiceNoteRecorderProps {
  existingUrl?: string | null
  onSaved: (url: string) => void
  onDeleted?: () => void
}

type Stage = 'idle' | 'recording' | 'recorded' | 'uploading' | 'saved'

const MAX_SECONDS = 30
const WAVE_COUNT  = 28

// Static decorative waveform heights
const WAVE_HEIGHTS = [30,55,72,44,88,62,38,78,52,90,42,66,58,82,36,60,74,46,70,34,84,54,42,74,60,36,78,50]

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function VoiceNoteRecorder({ existingUrl, onSaved, onDeleted }: VoiceNoteRecorderProps) {
  const [stage, setStage]           = useState<Stage>(existingUrl ? 'saved' : 'idle')
  const [elapsed, setElapsed]       = useState(0)
  const [audioUrl, setAudioUrl]     = useState<string | null>(existingUrl ?? null)
  const [playing, setPlaying]       = useState(false)
  const [progress, setProgress]     = useState(0)
  const [duration, setDuration]     = useState(0)
  const [error, setError]           = useState<string | null>(null)
  const [supported, setSupported]   = useState(true)
  const [showPermDialog, setShowPermDialog] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef        = useRef<MediaStream | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef         = useRef<HTMLAudioElement | null>(null)
  const blobRef          = useRef<Blob | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !navigator?.mediaDevices?.getUserMedia) {
      setSupported(false)
    }
  }, [])

  // Sync external existingUrl changes
  useEffect(() => {
    if (existingUrl && stage === 'idle') {
      setAudioUrl(existingUrl)
      setStage('saved')
    }
  }, [existingUrl, stage])

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  useEffect(() => () => { stopTimer(); stopStream() }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        blobRef.current = blob
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setStage('recorded')
        stopStream()
      }

      recorder.start(100)
      setElapsed(0)
      setStage('recording')

      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev + 1 >= MAX_SECONDS) {
            stopRecording()
            return MAX_SECONDS
          }
          return prev + 1
        })
      }, 1000)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setError('Microphone permission denied. Please allow mic access and try again.')
      } else {
        setError('Could not access microphone.')
      }
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    stopTimer()
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
    }
  }, [])

  const discard = () => {
    stopTimer()
    stopStream()
    if (audioUrl && !existingUrl) URL.revokeObjectURL(audioUrl)
    blobRef.current = null
    setAudioUrl(existingUrl ?? null)
    setStage(existingUrl ? 'saved' : 'idle')
    setElapsed(0)
    setPlaying(false)
    setProgress(0)
    setDuration(0)
    setError(null)
  }

  const deleteExisting = async () => {
    setError(null)
    try {
      const res = await fetch('/api/voice/confirm', { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setAudioUrl(null)
      setStage('idle')
      onDeleted?.()
    } catch {
      setError('Could not delete voice note.')
    }
  }

  const upload = async () => {
    if (!blobRef.current) return
    setStage('uploading')
    setError(null)
    try {
      const blob     = blobRef.current
      const fileType = blob.type || 'audio/webm'
      const fileSize = blob.size

      // 1. Get presigned URL
      const presignRes = await fetch('/api/voice/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fileType, fileSize }),
      })
      const presignData = await presignRes.json()
      if (!presignRes.ok) throw new Error(presignData.error ?? 'Upload URL failed')

      const { url, fields, cloudfrontUrl } = presignData

      // 2. Upload to S3
      const fd = new FormData()
      Object.entries(fields as Record<string, string>).forEach(([k, v]) => fd.append(k, v))
      fd.append('file', blob, 'voice-note')
      const s3Res = await fetch(url, { method: 'POST', body: fd })
      if (!s3Res.ok) throw new Error('Upload to S3 failed')

      // 3. Confirm in DB
      const confirmRes = await fetch('/api/voice/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cloudfrontUrl }),
      })
      const confirmData = await confirmRes.json()
      if (!confirmRes.ok) throw new Error(confirmData.error ?? 'Save failed')

      // Swap blob URL for the persistent CloudFront URL
      URL.revokeObjectURL(audioUrl ?? '')
      setAudioUrl(cloudfrontUrl)
      setStage('saved')
      onSaved(cloudfrontUrl)

    } catch (err: unknown) {
      setStage('recorded')
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  // Audio player controls
  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  const container: React.CSSProperties = {
    borderRadius: 18,
    border: '1.5px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    padding: 18,
  }

  if (!supported) {
    return (
      <div style={{ ...container, display: 'flex', alignItems: 'center', gap: 12 }}>
        <MicOff size={20} color="rgba(240,232,244,0.4)" />
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(240,232,244,0.5)', fontFamily: "'DM Sans',sans-serif" }}>
          Voice notes aren't supported in this browser.
        </p>
      </div>
    )
  }

  return (
    <div style={container}>
      <style>{`
        @keyframes vn-spin  { to { transform: rotate(360deg) } }
        @keyframes vn-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes vn-bar   { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }
      `}</style>

      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Mic size={15} color="#f43f5e" />
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'rgba(240,232,244,0.85)', fontFamily: "'DM Sans',sans-serif", letterSpacing: '0.04em' }}>
          Voice Note
        </p>
        <span style={{ fontSize: 11, color: 'rgba(240,232,244,0.38)', fontFamily: "'DM Sans',sans-serif" }}>
          · 30 sec max
        </span>
        {stage === 'saved' && (
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#34d399', fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>
            <Check size={12} /> Saved
          </span>
        )}
      </div>

      {/* ── IDLE: record button ── */}
      {stage === 'idle' && (
        <button
          onClick={() => setShowPermDialog(true)}
          style={{
            width: '100%', padding: '13px', borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(244,63,94,0.18), rgba(236,72,153,0.12))',
            border: '1.5px solid rgba(244,63,94,0.35)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            color: '#fda4af', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 14,
            transition: 'all 0.15s',
          }}
        >
          <Mic size={17} color="#f43f5e" />
          Start Recording
        </button>
      )}

      {/* ── RECORDING: waveform + stop ── */}
      {stage === 'recording' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Animated waveform */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 36, padding: '0 4px' }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', background: '#f43f5e', flexShrink: 0,
              animation: 'vn-pulse 1s ease-in-out infinite',
              boxShadow: '0 0 0 4px rgba(244,63,94,0.18)',
              marginRight: 8,
            }} />
            {WAVE_HEIGHTS.slice(0, WAVE_COUNT).map((h, i) => (
              <div key={i} style={{
                flex: 1, borderRadius: 3,
                background: 'linear-gradient(180deg,#f43f5e,#ec4899)',
                height: `${h * 0.7}%`,
                transformOrigin: 'center',
                animation: `vn-bar ${0.6 + (i % 5) * 0.12}s ease-in-out ${(i * 0.04).toFixed(2)}s infinite`,
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#fda4af', fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>
              {fmt(elapsed)} / {fmt(MAX_SECONDS)}
            </span>
            {/* Progress bar */}
            <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.1)', margin: '0 14px' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: 'linear-gradient(90deg,#f43f5e,#ec4899)',
                width: `${(elapsed / MAX_SECONDS) * 100}%`,
                transition: 'width 0.8s linear',
              }} />
            </div>
            <button
              onClick={stopRecording}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 100, border: 'none',
                background: '#f43f5e', color: '#fff',
                fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13,
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(244,63,94,0.4)',
              }}
            >
              <Square size={13} fill="#fff" />
              Stop
            </button>
          </div>
        </div>
      )}

      {/* ── RECORDED / UPLOADING / SAVED: audio player ── */}
      {(stage === 'recorded' || stage === 'uploading' || stage === 'saved') && audioUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration)}
            onTimeUpdate={e => {
              const a = e.target as HTMLAudioElement
              setProgress(a.duration ? a.currentTime / a.duration : 0)
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => { setPlaying(false); setProgress(0) }}
          />

          {/* Player row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 12,
            background: 'rgba(244,63,94,0.08)',
            border: '1px solid rgba(244,63,94,0.22)',
          }}>
            {/* Play/pause */}
            <button
              onClick={togglePlay}
              style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: playing
                  ? 'rgba(244,63,94,0.2)'
                  : 'linear-gradient(135deg,#f43f5e,#ec4899)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: playing ? 'none' : '0 4px 12px rgba(244,63,94,0.35)',
              }}
            >
              {playing
                ? <Pause size={16} color="#fda4af" fill="#fda4af" />
                : <Play  size={16} color="#fff"    fill="#fff" style={{ marginLeft: 2 }} />
              }
            </button>

            {/* Waveform / progress */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 22 }}>
                {WAVE_HEIGHTS.slice(0, WAVE_COUNT).map((h, i) => (
                  <div key={i} style={{
                    flex: 1, borderRadius: 2,
                    height: `${h * 0.6}%`,
                    background: i / WAVE_COUNT <= progress
                      ? 'linear-gradient(180deg,#f43f5e,#ec4899)'
                      : 'rgba(255,255,255,0.18)',
                    transition: 'background 0.1s',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: 'rgba(253,164,175,0.7)', fontFamily: "'DM Sans',sans-serif" }}>
                  {fmt(progress * (duration || 0))}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(253,164,175,0.7)', fontFamily: "'DM Sans',sans-serif" }}>
                  {duration ? fmt(duration) : '--:--'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {stage !== 'saved' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={discard}
                disabled={stage === 'uploading'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.18)',
                  background: 'transparent', color: 'rgba(240,232,244,0.6)',
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13,
                  cursor: stage === 'uploading' ? 'default' : 'pointer',
                  opacity: stage === 'uploading' ? 0.5 : 1,
                }}
              >
                <Trash2 size={13} /> Discard
              </button>
              <button
                onClick={upload}
                disabled={stage === 'uploading'}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '9px 14px', borderRadius: 10, border: 'none',
                  background: stage === 'uploading'
                    ? 'rgba(244,63,94,0.3)'
                    : 'linear-gradient(135deg,#f43f5e,#ec4899)',
                  color: '#fff',
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13,
                  cursor: stage === 'uploading' ? 'default' : 'pointer',
                  boxShadow: stage === 'uploading' ? 'none' : '0 4px 14px rgba(244,63,94,0.35)',
                }}
              >
                {stage === 'uploading'
                  ? <><Loader2 size={14} style={{ animation: 'vn-spin 0.8s linear infinite' }} /> Saving…</>
                  : <><Upload size={14} /> Save to Profile</>
                }
              </button>
            </div>
          )}

          {/* Re-record / delete when already saved */}
          {stage === 'saved' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { discard(); setStage('idle') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 14px', borderRadius: 10,
                  border: '1.5px solid rgba(255,255,255,0.18)',
                  background: 'transparent', color: 'rgba(240,232,244,0.6)',
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}
              >
                <Mic size={13} /> Re-record
              </button>
              <button
                onClick={deleteExisting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 14px', borderRadius: 10,
                  border: '1.5px solid rgba(239,68,68,0.35)',
                  background: 'rgba(239,68,68,0.08)', color: '#fca5a5',
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p style={{ marginTop: 10, fontSize: 12, color: '#f87171', fontFamily: "'DM Sans',sans-serif" }}>
          {error}
        </p>
      )}

      {showPermDialog && (
        <PermissionDialog
          type="mic-only"
          onGranted={() => {
            setShowPermDialog(false)
            startRecording()
          }}
          onCancel={() => setShowPermDialog(false)}
        />
      )}
    </div>
  )
}
