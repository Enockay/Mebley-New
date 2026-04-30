'use client'

import { useState, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ShieldAlert, Flag, ShieldX, ChevronRight, Check, Loader2, AlertTriangle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlockReportProps {
  targetId:   string
  targetName: string
  onClose:    () => void
  onBlocked?: (targetId: string) => void
  /** Called after a successful submit that included filing a report (`report` or `block_and_report`). */
  onReportSubmitted?: () => void
  /** Host element — when set (Browse embedded chat), modal stays inside the chat column. */
  portalRoot?: HTMLElement | null
}

type Step = 'menu' | 'report_reason' | 'report_details' | 'confirm_block' | 'done'
type ActionType = 'block' | 'report' | 'block_and_report'

const REPORT_REASONS = [
  { value: 'fake_profile',    label: 'Fake profile or impersonation', emoji: '🎭' },
  { value: 'inappropriate',   label: 'Inappropriate photos or content', emoji: '🔞' },
  { value: 'harassment',      label: 'Harassment or threatening behaviour', emoji: '😡' },
  { value: 'spam',            label: 'Spam or scam', emoji: '🤖' },
  { value: 'underage',        label: 'Appears to be under 18', emoji: '🚫' },
  { value: 'hate_speech',     label: 'Hate speech or discrimination', emoji: '⚠️' },
  { value: 'other',           label: 'Something else', emoji: '💬' },
]

/** Matches `globals.css` — `--grad-rose` + `--shadow-rose` */
const SYSTEM_PRIMARY_BASE =
  'rounded-xl text-sm font-semibold text-white transition-[filter,box-shadow] hover:brightness-105 active:brightness-95 disabled:opacity-40 disabled:hover:brightness-100'

function systemPrimaryStyle() {
  return {
    background: 'var(--grad-rose)',
    boxShadow: 'var(--shadow-rose)',
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BlockReport({
  targetId,
  targetName,
  onClose,
  onBlocked,
  onReportSubmitted,
  portalRoot,
}: BlockReportProps) {
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => {
    setMounted(true)
  }, [])
  const [step, setStep]           = useState<Step>('menu')
  const [action, setAction]       = useState<ActionType>('report')
  const [reason, setReason]       = useState('')
  const [details, setDetails]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  // ── Submit to API ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/moderation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          targetId,
          reason:  reason || 'blocked',
          details: details.trim() || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong')

      setStep('done')

      if (action === 'report' || action === 'block_and_report') {
        onReportSubmitted?.()
      }

      if ((action === 'block' || action === 'block_and_report') && onBlocked) {
        onBlocked(targetId)
      }

    } catch (err: any) {
      setError(err.message ?? 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  // Prefer portalRoot (Browse chat column) so the sheet stays in the chat section; else body (full viewport).

  const inChatPane = Boolean(portalRoot)
  const overlay = (
    <div
      className={
        inChatPane
          ? 'pointer-events-auto absolute inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4'
          : 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4'
      }
      style={{ zIndex: inChatPane ? 2 : 10000 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-report-heading"
    >
      <div
        className="rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm overflow-hidden font-[family-name:var(--font-body)]"
        style={{
          color: '#f0e8f4',
          background:
            'radial-gradient(ellipse 65% 45% at 12% 88%, rgba(240,56,104,0.12) 0%, transparent 65%), radial-gradient(ellipse 45% 55% at 88% 12%, rgba(100,40,180,0.1) 0%, transparent 65%), #0c0a1e',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 id="block-report-heading" className="text-base font-bold text-white font-[family-name:var(--font-display)]">
            {step === 'menu'           && `Report spam or block`}
            {step === 'report_reason'  && 'What\'s the issue?'}
            {step === 'report_details' && 'Any more details?'}
            {step === 'confirm_block'  && 'Block this person?'}
            {step === 'done'           && 'Done'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={18} className="text-[rgba(246,223,252,0.65)]" />
          </button>
        </div>

        <div className="px-5 py-5">

          {/* ── Step: menu ─────────────────────────────────────────────── */}
          {step === 'menu' && (
            <div className="space-y-3">
              <p className="text-sm text-[rgba(246,223,252,0.72)] mb-4">
                What would you like to do about <span className="font-semibold text-[#fff6fb]">{targetName}</span>?
              </p>

              {/* Report */}
              <button
                type="button"
                onClick={() => { setAction('report'); setStep('report_reason') }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border border-white/14 bg-white/[0.06] hover:bg-white/[0.09] hover:border-rose-400/40 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-rose-500/15 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500/25 transition-colors">
                  <Flag size={18} className="text-[color:var(--rose)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#fff6fb] text-sm">Report</p>
                  <p className="text-xs text-[rgba(246,223,252,0.58)] mt-0.5">Let us know about harmful behaviour</p>
                </div>
                <ChevronRight size={16} className="text-[rgba(246,223,252,0.4)] flex-shrink-0" />
              </button>

              {/* Block */}
              <button
                type="button"
                onClick={() => { setAction('block'); setStep('confirm_block') }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border border-white/14 bg-white/[0.06] hover:bg-red-500/10 hover:border-red-400/35 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/25 transition-colors">
                  <ShieldX size={18} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#fff6fb] text-sm">Block</p>
                  <p className="text-xs text-[rgba(246,223,252,0.58)] mt-0.5">They won't appear in your discover</p>
                </div>
                <ChevronRight size={16} className="text-[rgba(246,223,252,0.4)] flex-shrink-0" />
              </button>

              {/* Report + block */}
              <button
                type="button"
                onClick={() => { setAction('block_and_report'); setStep('report_reason') }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border border-white/14 bg-white/[0.06] hover:bg-white/[0.09] hover:border-rose-400/40 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-rose-500/15 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500/25 transition-colors">
                  <ShieldAlert size={18} className="text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#fff6fb] text-sm">Report & Block</p>
                  <p className="text-xs text-[rgba(246,223,252,0.58)] mt-0.5">Report the issue and block them</p>
                </div>
                <ChevronRight size={16} className="text-[rgba(246,223,252,0.4)] flex-shrink-0" />
              </button>
            </div>
          )}

          {/* ── Step: report_reason ────────────────────────────────────── */}
          {step === 'report_reason' && (
            <div className="space-y-2">
              {REPORT_REASONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => { setReason(r.value); setStep('report_details') }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    reason === r.value
                      ? 'border-rose-400/55 bg-rose-500/15'
                      : 'border-white/12 hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-lg">{r.emoji}</span>
                  <span className="text-sm text-[#f0e8f4] font-medium flex-1">{r.label}</span>
                  {reason === r.value && <Check size={14} className="text-rose-400 flex-shrink-0" />}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setStep('menu')}
                className="w-full mt-2 py-2.5 text-sm text-[rgba(246,223,252,0.55)] hover:text-[rgba(246,223,252,0.88)] transition-colors"
              >
                ← Back
              </button>
            </div>
          )}

          {/* ── Step: report_details ───────────────────────────────────── */}
          {step === 'report_details' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
                <p className="text-xs text-[rgba(246,223,252,0.52)] mb-0.5">Reporting for</p>
                <p className="text-sm font-semibold text-[#f0e8f4]">
                  {REPORT_REASONS.find(r => r.value === reason)?.label}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[rgba(246,223,252,0.88)] mb-2">
                  Additional details <span className="text-[rgba(246,223,252,0.45)] font-normal">(optional)</span>
                </label>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-black/35 border-2 border-white/14 text-[#f0e8f4] placeholder:text-[rgba(246,223,252,0.38)] focus:border-[color:var(--rose)] focus:outline-none focus:ring-2 focus:ring-rose-500/25 resize-none transition-colors"
                  placeholder="Anything else we should know…"
                />
                <p className="text-xs text-[rgba(246,223,252,0.42)] text-right mt-1">{details.length}/500</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-950/40 px-3 py-2.5">
                  <AlertTriangle size={13} className="text-red-300 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('report_reason')}
                  className="px-4 py-2.5 border border-white/18 text-[#f0e8f4] rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={systemPrimaryStyle()}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 ${SYSTEM_PRIMARY_BASE}`}
                >
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                    : action === 'block_and_report'
                      ? 'Report & Block'
                      : 'Submit Report'
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── Step: confirm_block ────────────────────────────────────── */}
          {step === 'confirm_block' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-400/25 bg-red-950/35 px-4 py-4 text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldX size={22} className="text-red-400" />
                </div>
                <p className="text-sm font-semibold text-[#fff6fb] mb-1">
                  Block {targetName}?
                </p>
                <p className="text-xs text-[rgba(246,223,252,0.65)] leading-relaxed">
                  They won't appear in your discover feed and won't be able to match with you.
                  You can unblock from your settings.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-950/40 px-3 py-2.5">
                  <AlertTriangle size={13} className="text-red-300 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('menu')}
                  className="px-4 py-2.5 border border-white/18 text-[#f0e8f4] rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={systemPrimaryStyle()}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 ${SYSTEM_PRIMARY_BASE}`}
                >
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Blocking…</>
                    : 'Yes, block them'
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── Step: done ─────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto">
                <Check size={26} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-[#fff6fb] mb-1 font-[family-name:var(--font-display)]">
                  {action === 'block'            && 'Blocked'}
                  {action === 'report'           && 'Report submitted'}
                  {action === 'block_and_report' && 'Reported & blocked'}
                </p>
                <p className="text-sm text-[rgba(246,223,252,0.72)] leading-relaxed">
                  {action === 'block' &&
                    `${targetName} won't appear in your discover feed anymore.`}
                  {action === 'report' &&
                    'Thanks for keeping Crotchet safe. We review every report.'}
                  {action === 'block_and_report' &&
                    `${targetName} has been blocked and your report has been submitted.`}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={systemPrimaryStyle()}
                className={`w-full py-3 mt-2 flex items-center justify-center ${SYSTEM_PRIMARY_BASE}`}
              >
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )

  const mountNode = portalRoot ?? (mounted ? document.body : null)
  if (!mountNode) return null
  return createPortal(overlay, mountNode)
}
