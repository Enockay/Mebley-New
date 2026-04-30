'use client'

import { Clock, Flag } from 'lucide-react'
import type { AdminModerationCase } from '@/lib/admin-moderation'

function relativeTime(dateValue: string): string {
  const diff = Math.max(0, Date.now() - new Date(dateValue).getTime())
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function shortId(id: string): string {
  return id.slice(0, 8)
}

export default function ModerationCaseList(props: {
  cases: AdminModerationCase[]
  selectedCaseId: string | null
  onSelect: (caseId: string) => void
}) {
  if (props.cases.length === 0) {
    return (
      <div
        style={{
          border: '1px dashed rgba(255,255,255,0.15)',
          borderRadius: 14,
          padding: '32px 20px',
          color: 'rgba(240,232,244,0.4)',
          fontSize: 13,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Flag size={22} color="rgba(240,232,244,0.18)" strokeWidth={1.5} />
        No cases in this status.
      </div>
    )
  }

  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.09)',
        background: 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
      }}
    >
      {props.cases.map((item, idx) => {
        const active = props.selectedCaseId === item.case_id
        const isLast = idx === props.cases.length - 1
        return (
          <button
            key={item.case_id}
            onClick={() => props.onSelect(item.case_id)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '13px 14px',
              background: active ? 'rgba(240,56,104,0.12)' : 'transparent',
              borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              border: 'none',
              borderLeft: active ? '3px solid rgba(240,56,104,0.8)' : '3px solid transparent',
              transition: 'background 0.12s',
            }}
          >
            {/* Top row: reason + time */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  color: active ? '#fda4b4' : '#fbcfe8',
                  background: active ? 'rgba(240,56,104,0.2)' : 'rgba(240,56,104,0.1)',
                  border: '1px solid rgba(240,56,104,0.3)',
                  borderRadius: 999,
                  padding: '3px 9px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  maxWidth: 160,
                  textOverflow: 'ellipsis',
                }}
              >
                <Flag size={9} strokeWidth={2.5} />
                {item.reason}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: 'rgba(240,232,244,0.38)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Clock size={10} strokeWidth={2} />
                {relativeTime(item.created_at)}
              </span>
            </div>

            {/* Details snippet */}
            <p
              style={{
                margin: '0 0 8px',
                fontSize: 12,
                color: active ? 'rgba(240,232,244,0.8)' : 'rgba(240,232,244,0.55)',
                lineHeight: 1.45,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {item.details?.trim() || 'No additional details provided.'}
            </p>

            {/* IDs row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: 'rgba(240,232,244,0.3)' }}>
                reported <span style={{ color: 'rgba(240,232,244,0.5)' }}>{shortId(item.reported_id)}…</span>
              </span>
              <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: 'rgba(240,232,244,0.3)' }}>
                by <span style={{ color: 'rgba(240,232,244,0.5)' }}>{shortId(item.reporter_id)}…</span>
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
