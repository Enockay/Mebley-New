'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Mic } from 'lucide-react'

const WAVE = [30,55,72,44,88,62,38,78,52,90,42,66,58,82,36,60,74,46,70,34,84,54,42,74,60,36,78,50]

function fmt(s: number) {
  if (!isFinite(s) || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

interface VoiceNotePlayerProps {
  url: string
  /** compact = small pill, default = full-width bar */
  size?: 'compact' | 'full'
  accent?: string
}

export default function VoiceNotePlayer({ url, size = 'full', accent = '#f43f5e' }: VoiceNotePlayerProps) {
  const audioRef            = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!audioRef.current) return
    if (playing) audioRef.current.pause()
    else audioRef.current.play()
  }

  const barCount = size === 'compact' ? 16 : 28
  const btnSize  = size === 'compact' ? 30 : 38

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: size === 'compact' ? 8 : 12,
        padding: size === 'compact' ? '8px 12px' : '12px 14px',
        borderRadius: size === 'compact' ? 100 : 14,
        background: size === 'compact'
          ? `rgba(0,0,0,0.28)`
          : `rgba(0,0,0,0.22)`,
        border: `1px solid ${accent}30`,
        backdropFilter: 'blur(6px)',
        cursor: 'default',
      }}
      onClick={e => e.stopPropagation()}
    >
      <audio
        ref={audioRef}
        src={url}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration)}
        onTimeUpdate={e => {
          const a = e.target as HTMLAudioElement
          setProgress(a.duration ? a.currentTime / a.duration : 0)
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0) }}
      />

      {/* Mic icon label */}
      <Mic size={12} color={accent} style={{ flexShrink: 0 }} />

      {/* Play/pause */}
      <button
        onClick={toggle}
        style={{
          width: btnSize, height: btnSize, borderRadius: '50%', flexShrink: 0,
          background: playing ? `${accent}22` : accent,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: playing ? 'none' : `0 3px 10px ${accent}55`,
          transition: 'all 0.15s',
        }}
      >
        {playing
          ? <Pause size={size === 'compact' ? 11 : 14} color={accent} fill={accent} />
          : <Play  size={size === 'compact' ? 11 : 14} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
        }
      </button>

      {/* Waveform */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, height: size === 'compact' ? 18 : 22 }}>
        {WAVE.slice(0, barCount).map((h, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: 2,
            height: `${h * 0.65}%`,
            background: i / barCount <= progress
              ? accent
              : 'rgba(255,255,255,0.2)',
            transition: 'background 0.1s',
          }} />
        ))}
      </div>

      {/* Duration */}
      <span style={{
        fontSize: 11, flexShrink: 0,
        color: 'rgba(255,255,255,0.55)',
        fontFamily: "'DM Sans',sans-serif",
        fontVariantNumeric: 'tabular-nums',
      }}>
        {duration ? fmt(playing ? progress * duration : duration) : '…'}
      </span>
    </div>
  )
}
