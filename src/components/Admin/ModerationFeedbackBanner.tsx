'use client'

import { CheckCircle2, AlertCircle } from 'lucide-react'

export type ModerationFeedbackVariant = 'success' | 'error'

export default function ModerationFeedbackBanner({
  variant,
  message,
}: {
  variant: ModerationFeedbackVariant
  message: string
}) {
  const ok = variant === 'success'
  return (
    <div
      role="status"
      style={{
        marginBottom: 14,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 9,
        borderRadius: 10,
        padding: '11px 14px',
        fontSize: 13,
        lineHeight: 1.45,
        border: ok ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(248,113,113,0.45)',
        background: ok ? 'rgba(34,197,94,0.08)' : 'rgba(127,29,29,0.32)',
        color: ok ? '#86efac' : '#fecaca',
      }}
    >
      {ok ? (
        <CheckCircle2 size={14} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
      ) : (
        <AlertCircle size={14} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
      )}
      {message}
    </div>
  )
}
