'use client'

import { CheckCircle2, UserX } from 'lucide-react'

export default function ModerationDecisionForm(props: {
  notes: string
  onNotesChange: (value: string) => void
  submitting: boolean
  onBanClick: () => void
  onDismissClick: () => void
}) {
  return (
    <div style={{ marginTop: 20 }}>
      <label
        htmlFor="moderation-notes"
        style={{
          display: 'block',
          marginBottom: 6,
          fontSize: 11,
          fontWeight: 600,
          color: 'rgba(240,232,244,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        Decision notes (optional)
      </label>
      <textarea
        id="moderation-notes"
        value={props.notes}
        onChange={(e) => props.onNotesChange(e.target.value)}
        disabled={props.submitting}
        rows={3}
        placeholder="Internal notes — visible in case resolution record."
        style={{
          width: '100%',
          boxSizing: 'border-box',
          resize: 'vertical',
          minHeight: 80,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.04)',
          color: '#f0e8f4',
          fontSize: 13,
          padding: '10px 14px',
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />

      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          disabled={props.submitting}
          onClick={props.onBanClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            border: '1px solid rgba(239,68,68,0.5)',
            background: props.submitting ? 'rgba(239,68,68,0.07)' : 'rgba(239,68,68,0.18)',
            color: '#fca5a5',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            padding: '10px 18px',
            cursor: props.submitting ? 'not-allowed' : 'pointer',
            opacity: props.submitting ? 0.65 : 1,
            transition: 'background 0.15s',
          }}
        >
          <UserX size={14} strokeWidth={2.2} />
          Ban user
        </button>
        <button
          type="button"
          disabled={props.submitting}
          onClick={props.onDismissClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            border: '1px solid rgba(255,255,255,0.18)',
            background: props.submitting ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
            color: 'rgba(240,232,244,0.85)',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            padding: '10px 18px',
            cursor: props.submitting ? 'not-allowed' : 'pointer',
            opacity: props.submitting ? 0.65 : 1,
            transition: 'background 0.15s',
          }}
        >
          <CheckCircle2 size={14} strokeWidth={2.2} />
          Dismiss report
        </button>
      </div>
    </div>
  )
}
