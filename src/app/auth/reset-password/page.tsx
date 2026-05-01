'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock, Loader2, Check } from 'lucide-react'

function ResetPasswordContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [password, setPassword]       = useState('')
  const [confirmPassword, setConfirm] = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [success, setSuccess]         = useState(false)

  const rules = [
    { label: 'At least 8 characters',       pass: password.length >= 8 },
    { label: 'One uppercase letter',         pass: /[A-Z]/.test(password) },
    { label: 'Contains a number',            pass: /\d/.test(password) },
    { label: 'Contains a special character', pass: /[^A-Za-z0-9]/.test(password) },
  ]

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid reset link</h2>
          <p className="text-gray-500 text-sm mb-6">This link is missing a token. Please request a new password reset.</p>
          <button onClick={() => router.push('/auth')}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold">
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  const handleReset = async () => {
    setError('')
    if (!password || !confirmPassword) { setError('Please fill in all fields'); return }
    if (password !== confirmPassword)  { setError('Passwords do not match'); return }
    if (rules.some(r => !r.pass))      { setError('Please meet all password requirements'); return }

    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok || !data.success) {
      setError(data.message ?? 'Something went wrong. Please try again.')
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/auth'), 3000)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password updated!</h2>
          <p className="text-gray-500 text-sm mb-6">Your password has been changed. Redirecting you to sign in…</p>
          <Loader2 className="w-6 h-6 text-pink-500 animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl px-6 py-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
          <p className="text-gray-500 text-sm mt-1">Choose a strong password for your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showPass ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none transition-colors"
                placeholder="••••••••" autoFocus autoComplete="new-password" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                {rules.map(r => (
                  <div key={r.label} className={`flex items-center gap-2 text-xs ${r.pass ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${r.pass ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {r.pass && <Check size={10} />}
                    </div>
                    {r.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" value={confirmPassword}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReset()}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-gray-200 focus:border-pink-400'
                }`}
                placeholder="••••••••" autoComplete="new-password" />
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
            )}
          </div>

          <div className="pt-1">
            <button onClick={handleReset} disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Updating…</> : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
