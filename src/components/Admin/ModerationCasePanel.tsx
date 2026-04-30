'use client'

import { useEffect, useState } from 'react'
import { Flag, X, UserX } from 'lucide-react'
import type { AdminModerationCase, ModerationStatus } from '@/lib/admin-moderation'
import { decideCase } from '@/lib/admin-moderation'
import ModerationDecisionForm from '@/components/Admin/ModerationDecisionForm'
import ModerationFeedbackBanner from '@/components/Admin/ModerationFeedbackBanner'

function formatDate(input: string): string {
  return new Date(input).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const STATUS_BADGE: Record<ModerationStatus, { color: string; bg: string; border: string }> = {
  open:       { color: '#fda4b4', bg: 'rgba(240,56,104,0.15)',  border: 'rgba(240,56,104,0.4)'  },
  in_review:  { color: '#fde68a', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.4)'  },
  resolved:   { color: '#86efac', bg: 'rgba(34,197,94,0.13)',  border: 'rgba(34,197,94,0.38)'  },
  dismissed:  { color: '#c4b5fd', bg: 'rgba(139,92,246,0.13)', border: 'rgba(139,92,246,0.38)' },
}

function StatusBadge({ status }: { status: ModerationStatus }) {
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.open
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'capitalize',
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        letterSpacing: '0.03em',
      }}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        padding: '8px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <span style={{ fontSize: 11, color: 'rgba(240,232,244,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: 'rgba(240,232,244,0.82)', fontFamily: 'ui-monospace, monospace', textAlign: 'right', wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  )
}

export default function ModerationCasePanel(props: {
  item: AdminModerationCase | null
  onDecisionComplete: () => Promise<void>
}) {
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [banConfirmOpen, setBanConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    setNotes('')
    setFeedback(null)
    setBanConfirmOpen(false)
    setSubmitting(false)
  }, [props.item?.case_id])

  useEffect(() => {
    if (!banConfirmOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) setBanConfirmOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [banConfirmOpen, submitting])

  if (!props.item) {
    return (
      <div
        style={{
          border: '1px dashed rgba(255,255,255,0.13)',
          borderRadius: 14,
          padding: '48px 20px',
          color: 'rgba(240,232,244,0.35)',
          fontSize: 13,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Flag size={24} color="rgba(240,232,244,0.15)" strokeWidth={1.5} />
        Select a case to view details.
      </div>
    )
  }

  const item = props.item

  const runDismiss = async () => {
    setSubmitting(true)
    setFeedback(null)
    try {
      await decideCase({ caseId: item.case_id, decision: 'dismiss', notes })
      await props.onDecisionComplete()
      setNotes('')
      setFeedback({ variant: 'success', message: 'Report dismissed.' })
    } catch (err: unknown) {
      setFeedback({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to dismiss report.' })
    } finally {
      setSubmitting(false)
    }
  }

  const runBan = async () => {
    setSubmitting(true)
    setFeedback(null)
    try {
      await decideCase({ caseId: item.case_id, decision: 'ban', notes })
      await props.onDecisionComplete()
      setNotes('')
      setBanConfirmOpen(false)
      setFeedback({ variant: 'success', message: 'User banned and case resolved.' })
    } catch (err: unknown) {
      setFeedback({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to ban user.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section
        style={{
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.02)',
          overflow: 'hidden',
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(240,56,104,0.15)', border: '1px solid rgba(240,56,104,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flag size={14} color="#f03868" strokeWidth={2} />
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.reason}
            </h2>
          </div>
          <StatusBadge status={item.status as ModerationStatus} />
        </div>

        <div style={{ padding: '18px 18px 22px' }}>
          {feedback && (
            <ModerationFeedbackBanner variant={feedback.variant} message={feedback.message} />
          )}

          {/* Metadata grid */}
          <div style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.15)', overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ padding: '0 14px' }}>
              <MetaRow label="Case ID"        value={item.case_id} />
              <MetaRow label="Report ID"      value={item.report_id} />
              <MetaRow label="Reported user"  value={item.reported_id} />
              <MetaRow label="Reporter"       value={item.reporter_id} />
              <MetaRow
                label="Created"
                value={<span style={{ fontFamily: 'inherit', fontSize: 12, color: 'rgba(240,232,244,0.75)' }}>{formatDate(item.created_at)}</span>}
              />
            </div>
          </div>

          {/* Report details */}
          <div style={{ marginBottom: 4 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: 'rgba(240,232,244,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Report Details
            </p>
            <div
              style={{
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.09)',
                background: 'rgba(255,255,255,0.03)',
                padding: '13px 16px',
                color: 'rgba(240,232,244,0.82)',
                fontSize: 13,
                lineHeight: 1.55,
                borderLeft: '3px solid rgba(240,56,104,0.4)',
              }}
            >
              {item.details?.trim() || (
                <span style={{ color: 'rgba(240,232,244,0.35)', fontStyle: 'italic' }}>No additional details provided.</span>
              )}
            </div>
          </div>

          <ModerationDecisionForm
            notes={notes}
            onNotesChange={setNotes}
            submitting={submitting}
            onBanClick={() => setBanConfirmOpen(true)}
            onDismissClick={runDismiss}
          />
        </div>
      </section>

      {/* Ban confirm modal */}
      {banConfirmOpen && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: 16,
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setBanConfirmOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ban-confirm-title"
            style={{
              maxWidth: 440,
              width: '100%',
              borderRadius: 16,
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'linear-gradient(135deg, #181228 0%, #120e1e 100%)',
              padding: '24px 22px 20px',
              boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserX size={18} color="#fca5a5" strokeWidth={2} />
                </div>
                <h3 id="ban-confirm-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  Ban this user?
                </h3>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => !submitting && setBanConfirmOpen(false)}
                style={{ border: 'none', background: 'none', padding: 4, cursor: 'pointer', color: 'rgba(240,232,244,0.4)' }}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <p style={{ margin: '0 0 6px', fontSize: 13, lineHeight: 1.55, color: 'rgba(240,232,244,0.72)' }}>
              This will deactivate the reported account and mark the case resolved.
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(240,232,244,0.45)' }}>
              User ID:{' '}
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'rgba(240,232,244,0.7)', wordBreak: 'break-all' }}>
                {item.reported_id}
              </span>
            </p>

            <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={submitting}
                onClick={() => !submitting && setBanConfirmOpen(false)}
                style={{
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(240,232,244,0.85)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '10px 18px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void runBan()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  border: '1px solid rgba(239,68,68,0.5)',
                  background: submitting ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.3)',
                  color: '#fee2e2',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '10px 18px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                <UserX size={14} strokeWidth={2.2} />
                {submitting ? 'Banning…' : 'Confirm ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
