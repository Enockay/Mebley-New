'use client'

import { useState } from 'react'
import { X, ShieldAlert, Flag, ShieldX, ChevronRight, Check, Loader2, AlertTriangle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlockReportProps {
  targetId:   string
  targetName: string
  onClose:    () => void
  // Called after a successful block so the parent can remove the card
  onBlocked?: (targetId: string) => void
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function BlockReport({
  targetId,
  targetName,
  onClose,
  onBlocked,
}: BlockReportProps) {
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

      // Notify parent to remove card from browse list if blocked
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {step === 'menu'           && `Report or block`}
            {step === 'report_reason'  && 'What\'s the issue?'}
            {step === 'report_details' && 'Any more details?'}
            {step === 'confirm_block'  && 'Block this person?'}
            {step === 'done'           && 'Done'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-5">

          {/* ── Step: menu ─────────────────────────────────────────────── */}
          {step === 'menu' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                What would you like to do about <span className="font-semibold text-gray-800">{targetName}</span>?
              </p>

              {/* Report */}
              <button
                onClick={() => { setAction('report'); setStep('report_reason') }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left group">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                  <Flag size={18} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">Report</p>
                  <p className="text-xs text-gray-500 mt-0.5">Let us know about harmful behaviour</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
              </button>

              {/* Block */}
              <button
                onClick={() => { setAction('block'); setStep('confirm_block') }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all text-left group">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 transition-colors">
                  <ShieldX size={18} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">Block</p>
                  <p className="text-xs text-gray-500 mt-0.5">They won't appear in your discover</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
              </button>

              {/* Report + block */}
              <button
                onClick={() => { setAction('block_and_report'); setStep('report_reason') }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-left group">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-rose-200 transition-colors">
                  <ShieldAlert size={18} className="text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">Report & Block</p>
                  <p className="text-xs text-gray-500 mt-0.5">Report the issue and block them</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
              </button>
            </div>
          )}

          {/* ── Step: report_reason ────────────────────────────────────── */}
          {step === 'report_reason' && (
            <div className="space-y-2">
              {REPORT_REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => { setReason(r.value); setStep('report_details') }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    reason === r.value
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <span className="text-lg">{r.emoji}</span>
                  <span className="text-sm text-gray-800 font-medium flex-1">{r.label}</span>
                  {reason === r.value && <Check size={14} className="text-rose-500 flex-shrink-0" />}
                </button>
              ))}

              <button
                onClick={() => setStep('menu')}
                className="w-full mt-2 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                ← Back
              </button>
            </div>
          )}

          {/* ── Step: report_details ───────────────────────────────────── */}
          {step === 'report_details' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">Reporting for</p>
                <p className="text-sm font-semibold text-gray-800">
                  {REPORT_REASONS.find(r => r.value === reason)?.label}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional details <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-rose-400 focus:outline-none resize-none transition-colors"
                  placeholder="Anything else we should know…"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{details.length}/500</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
                  <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('report_reason')}
                  className="px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:from-rose-600 hover:to-pink-600 disabled:opacity-40 transition-all">
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
              <div className="bg-red-50 rounded-2xl px-4 py-4 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldX size={22} className="text-red-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Block {targetName}?
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  They won't appear in your discover feed and won't be able to match with you.
                  You can unblock from your settings.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
                  <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('menu')}
                  className="px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-40 transition-all">
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
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check size={26} className="text-green-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-1">
                  {action === 'block'            && 'Blocked'}
                  {action === 'report'           && 'Report submitted'}
                  {action === 'block_and_report' && 'Reported & blocked'}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {action === 'block' &&
                    `${targetName} won't appear in your discover feed anymore.`}
                  {action === 'report' &&
                    'Thanks for keeping Crotchet safe. We review every report.'}
                  {action === 'block_and_report' &&
                    `${targetName} has been blocked and your report has been submitted.`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:from-rose-600 hover:to-pink-600 transition-all mt-2">
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
