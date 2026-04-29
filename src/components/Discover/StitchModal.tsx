'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Sparkles, Send, Loader2 } from 'lucide-react'

interface StitchModalProps {
  targetName: string
  onSend: (note: string) => Promise<void>
  onClose: () => void
}

const MAX = 280

export default function StitchModal({ targetName, onSend, onClose }: StitchModalProps) {
  const [note, setNote]       = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const textareaRef           = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSend = async () => {
    const trimmed = note.trim()
    if (!trimmed) { setError('Add a personal note to send a Stitch'); return }
    setSending(true)
    setError(null)
    try {
      await onSend(trimmed)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSending(false)
    }
  }

  const remaining = MAX - note.length
  const nearLimit = remaining <= 40

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(8,4,20,0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 max(24px, env(safe-area-inset-bottom))',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 480,
          background: 'linear-gradient(170deg, #1a0a2d 0%, #0e0620 100%)',
          border: '1.5px solid rgba(167,139,250,0.25)',
          borderRadius: '24px 24px 20px 20px',
          padding: '20px 20px 24px',
          boxShadow: '0 -12px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(167,139,250,0.08)',
          animation: 'slideUpModal 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideUpModal {
            from { opacity: 0; transform: translateY(32px) }
            to   { opacity: 1; transform: translateY(0) }
          }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(240,56,104,0.18))',
              border: '1.5px solid rgba(167,139,250,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={17} color="#c4b5fd" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff4ff', fontFamily: "'Fraunces', serif" }}>
                Send a Stitch
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(240,232,244,0.5)', fontFamily: "'DM Sans', sans-serif" }}>
                to {targetName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={15} color="rgba(240,232,244,0.7)" />
          </button>
        </div>

        {/* Hint */}
        <p style={{
          fontSize: 13, color: 'rgba(240,232,244,0.55)',
          fontFamily: "'DM Sans', sans-serif",
          margin: '0 0 14px', lineHeight: 1.5,
        }}>
          A Stitch jumps to the top of their stack. Write something genuine — they'll see it before anything else.
        </p>

        {/* Textarea */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <textarea
            ref={textareaRef}
            value={note}
            onChange={e => { setNote(e.target.value.slice(0, MAX)); setError(null) }}
            placeholder={`What stood out about ${targetName.split(' ')[0]}?`}
            rows={4}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: 'rgba(255,255,255,0.07)',
              border: `1.5px solid ${error ? 'rgba(240,56,104,0.6)' : 'rgba(167,139,250,0.25)'}`,
              color: '#fff4ff', fontSize: 14, lineHeight: 1.6,
              fontFamily: "'DM Sans', sans-serif",
              resize: 'none', outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(167,139,250,0.55)' }}
            onBlur={e  => { if (!error) e.target.style.borderColor = 'rgba(167,139,250,0.25)' }}
            disabled={sending}
          />
          <span style={{
            position: 'absolute', bottom: 10, right: 12,
            fontSize: 11, fontFamily: "'DM Sans', sans-serif",
            color: nearLimit ? (remaining <= 10 ? '#f03868' : '#fbbf24') : 'rgba(240,232,244,0.35)',
            transition: 'color 0.2s',
          }}>
            {remaining}
          </span>
        </div>

        {error && (
          <p style={{ fontSize: 12, color: '#f87171', margin: '0 0 12px', fontFamily: "'DM Sans', sans-serif" }}>
            {error}
          </p>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || note.trim().length === 0}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: sending || note.trim().length === 0
              ? 'rgba(167,139,250,0.2)'
              : 'linear-gradient(135deg, #7c3aed, #a855f7)',
            border: 'none', cursor: sending || !note.trim() ? 'default' : 'pointer',
            color: '#fff', fontSize: 15, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: sending || !note.trim() ? 'none' : '0 6px 22px rgba(124,58,237,0.4)',
            transition: 'all 0.2s',
          }}
        >
          {sending
            ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Sending…</>
            : <><Send size={15} /> Send Stitch</>
          }
        </button>
      </div>
    </div>
  )
}
