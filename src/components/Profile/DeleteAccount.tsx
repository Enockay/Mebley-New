'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

export default function DeleteAccount({ embedded = false }: { embedded?: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const CONFIRM_WORD = 'DELETE'
  const canDelete    = confirm === CONFIRM_WORD

  const handleDelete = async () => {
    if (!canDelete) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // Sign out locally then redirect to auth
      await supabase.auth.signOut()
      router.push('/auth?deleted=true')

    } catch (err: any) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Trigger button ── */}
      <div className={embedded ? 'border border-white/25 rounded-2xl p-5 bg-white/10 backdrop-blur-md' : 'border border-red-200 rounded-2xl p-5 bg-red-50/40'}>
        <div className="flex items-start gap-3 mb-4">
          <div className={embedded ? 'w-9 h-9 bg-pink-200/20 rounded-full flex items-center justify-center flex-shrink-0' : 'w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0'}>
            <Trash2 size={16} className={embedded ? 'text-pink-200' : 'text-red-500'} />
          </div>
          <div>
            <p className={embedded ? 'text-sm font-semibold text-pink-50' : 'text-sm font-semibold text-gray-900'}>Delete Account</p>
            <p className={embedded ? 'text-xs text-pink-100/85 mt-0.5 leading-relaxed' : 'text-xs text-gray-500 mt-0.5 leading-relaxed'}>
              Permanently delete your profile, photos, and all messages. This cannot be undone.
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowModal(true); setConfirm(''); setError('') }}
          className={embedded
            ? 'w-full py-2.5 border-2 border-pink-300/70 text-pink-100 rounded-xl text-sm font-semibold hover:bg-pink-300/10 transition-colors'
            : 'w-full py-2.5 border-2 border-red-300 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors'}
        >
          Delete My Account
        </button>
      </div>

      {/* ── Confirmation modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7">

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Delete Account</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Warning */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-sm font-semibold text-red-700 mb-2">This will permanently delete:</p>
              <ul className="space-y-1">
                {[
                  'Your profile and all personal data',
                  'All your photos and videos',
                  'All your matches and conversations',
                  'Your account login',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-red-600">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Confirm input */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">{CONFIRM_WORD}</span> to confirm
              </label>
              <input
                type="text"
                value={confirm}
                onChange={e => setConfirm(e.target.value.toUpperCase())}
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-400 focus:outline-none transition-colors font-mono text-sm tracking-widest"
                placeholder={CONFIRM_WORD}
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm mb-4 flex items-center gap-2">
                <AlertTriangle size={13} className="flex-shrink-0" /> {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!canDelete || loading}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Deleting...</>
                  : <><Trash2 size={15} /> Delete Forever</>
                }
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
