'use client'

import type { ModerationStatus } from '@/lib/admin-moderation'

const STATUS_CONFIG: Array<{
  id: ModerationStatus
  label: string
  color: string
  bg: string
  border: string
  dot: string
}> = [
  { id: 'open',      label: 'Open',       color: '#fda4b4', bg: 'rgba(240,56,104,0.18)',  border: 'rgba(240,56,104,0.45)',  dot: '#f03868'  },
  { id: 'in_review', label: 'In Review',  color: '#fde68a', bg: 'rgba(245,158,11,0.16)', border: 'rgba(245,158,11,0.42)', dot: '#f59e0b'  },
  { id: 'resolved',  label: 'Resolved',   color: '#86efac', bg: 'rgba(34,197,94,0.14)',  border: 'rgba(34,197,94,0.4)',   dot: '#22c55e'  },
  { id: 'dismissed', label: 'Dismissed',  color: '#c4b5fd', bg: 'rgba(139,92,246,0.14)', border: 'rgba(139,92,246,0.4)',  dot: '#8b5cf6'  },
]

export default function ModerationStatusTabs(props: {
  value: ModerationStatus
  onChange: (next: ModerationStatus) => void
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 4,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 5,
      }}
    >
      {STATUS_CONFIG.map((s) => {
        const active = props.value === s.id
        return (
          <button
            key={s.id}
            onClick={() => props.onChange(s.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              border: active ? `1px solid ${s.border}` : '1px solid transparent',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 700,
              color: active ? s.color : 'rgba(240,232,244,0.45)',
              background: active ? s.bg : 'transparent',
              cursor: active ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: active ? s.dot : 'rgba(255,255,255,0.18)',
                flexShrink: 0,
                transition: 'background 0.15s',
                boxShadow: active ? `0 0 6px ${s.dot}` : 'none',
              }}
            />
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
