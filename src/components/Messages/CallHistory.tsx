'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Phone, PhoneIncoming, PhoneMissed, PhoneOff, Video, Clock, Loader2, X } from 'lucide-react'

interface CallRecord {
  id:               string
  conversation_id:  string
  channel_name:     string
  call_type:        'video' | 'voice'
  status:           'initiated' | 'answered' | 'missed' | 'declined' | 'ended'
  started_at:       string
  answered_at:      string | null
  ended_at:         string | null
  duration_seconds: number | null
  caller_id:        string
  callee_id:        string
  caller_name:      string
  caller_photos:    unknown
  callee_name:      string
  callee_photos:    unknown
}

function getFirstPhoto(photos: unknown): string | null {
  if (!Array.isArray(photos) || !photos.length) return null
  const p = photos[0]
  if (typeof p === 'string') return p
  if (typeof p === 'object' && p && 'url' in p) return (p as { url: string }).url
  return null
}

function formatDuration(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem ? `${m}m ${rem}s` : `${m}m`
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const T = {
  bg:      '#0c0a1e',
  panel:   '#100d22',
  border:  'rgba(255,255,255,0.09)',
  text:    '#f0e8f4',
  muted:   'rgba(220,190,210,0.6)',
  faint:   'rgba(180,150,170,0.38)',
  rose:    '#f03868',
  green:   '#22c55e',
  yellow:  '#eab308',
  red:     '#ef4444',
  blue:    '#60a5fa',
}

interface Props {
  onClose?: () => void
  onStartCall?: (conversationId: string) => void
}

export default function CallHistory({ onClose, onStartCall }: Props) {
  const { user } = useAuth()
  const [calls, setCalls]     = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetch('/api/chat/call-history?limit=30')
      .then(r => r.json())
      .then(d => { setCalls(d.calls ?? []); setLoading(false) })
      .catch(() => { setError('Failed to load call history'); setLoading(false) })
  }, [user])

  const StatusIcon = ({ record }: { record: CallRecord }) => {
    const isOutgoing = record.caller_id === user?.id
    if (record.status === 'missed')   return <PhoneMissed size={15} color={T.red}    />
    if (record.status === 'declined') return <PhoneOff    size={15} color={T.red}    />
    if (record.status === 'answered' || record.status === 'ended') {
      return isOutgoing
        ? <Phone size={15} color={T.green} style={{ transform: 'rotate(-135deg)' }} />
        : <PhoneIncoming size={15} color={T.blue} />
    }
    return <Phone size={15} color={T.muted} />
  }

  const StatusLabel = ({ record }: { record: CallRecord }) => {
    const isOutgoing = record.caller_id === user?.id
    const base = record.status === 'missed'   ? { label: 'Missed',    color: T.red }
               : record.status === 'declined' ? { label: 'Declined',  color: T.red }
               : record.status === 'answered' || record.status === 'ended'
                 ? isOutgoing
                   ? { label: 'Outgoing', color: T.green }
                   : { label: 'Incoming', color: T.blue }
               : { label: 'Initiated', color: T.muted }
    return <span style={{ fontSize: 11, color: base.color, fontWeight: 600 }}>{base.label}</span>
  }

  return (
    <div style={{
      background: T.panel,
      border: `1px solid ${T.border}`,
      borderRadius: 20,
      overflow: 'hidden',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(240,56,104,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Phone size={15} color={T.rose} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Call History</span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: T.muted, padding: 4, borderRadius: 8,
            display: 'flex', alignItems: 'center',
          }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ maxHeight: 480, overflowY: 'auto' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
            <Loader2 size={22} color={T.rose} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {!loading && error && (
          <p style={{ color: T.red, fontSize: 13, padding: '24px 20px', margin: 0 }}>{error}</p>
        )}

        {!loading && !error && calls.length === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <Phone size={22} color={T.faint} />
            </div>
            <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>No calls yet</p>
            <p style={{ color: T.faint, fontSize: 12, marginTop: 4 }}>Video calls with your matches will appear here</p>
          </div>
        )}

        {!loading && calls.map((call, idx) => {
          const isOutgoing = call.caller_id === user?.id
          const otherName  = isOutgoing ? call.callee_name : call.caller_name
          const otherPhoto = isOutgoing ? getFirstPhoto(call.callee_photos) : getFirstPhoto(call.caller_photos)

          return (
            <div key={call.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 20px',
              borderBottom: idx < calls.length - 1 ? `1px solid ${T.border}` : 'none',
              cursor: onStartCall ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (onStartCall) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            onClick={() => onStartCall?.(call.conversation_id)}
            >
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {otherPhoto ? (
                  <img src={otherPhoto} alt={otherName}
                    style={{ width: 44, height: 44, borderRadius: 14, objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'linear-gradient(135deg,#f03868,#ff7a50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: 'white',
                  }}>
                    {otherName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                {/* Call type badge */}
                <div style={{
                  position: 'absolute', bottom: -3, right: -3,
                  width: 18, height: 18, borderRadius: 6,
                  background: T.panel,
                  border: `1.5px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {call.call_type === 'video'
                    ? <Video size={9} color={T.muted} />
                    : <Phone size={9} color={T.muted} />
                  }
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <StatusIcon record={call} />
                  <span style={{
                    fontSize: 14, fontWeight: 600, color: T.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {otherName || 'Unknown'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusLabel record={call} />
                  {call.duration_seconds != null && call.duration_seconds > 0 && (
                    <>
                      <span style={{ color: T.faint, fontSize: 11 }}>·</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: T.muted }}>
                        <Clock size={10} />
                        {formatDuration(call.duration_seconds)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Time */}
              <span style={{ fontSize: 11, color: T.faint, flexShrink: 0 }}>
                {formatRelative(call.started_at)}
              </span>
            </div>
          )
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
