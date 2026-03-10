'use client'

import { useState } from 'react'
import { Mail, Eye, EyeOff, ShieldCheck, Loader2, Check, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface LinkAccountProps {
  onComplete: () => void
  signupMethod: 'email' | 'google'
}

export default function LinkAccount({ onComplete, signupMethod }: LinkAccountProps) {
  const { user, linkEmail } = useAuth()

  const [email, setEmail]       = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [emailDone, setEmailDone] = useState(
    signupMethod === 'email' || signupMethod === 'google'
  )

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const handleLinkEmail = async () => {
    if (!email || !password) { setError('Enter your email and a password'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }
    setError(''); setLoading(true)
    const { error } = await linkEmail(email, password)
    setLoading(false)
    if (error) { setError(error); return }
    setEmailDone(true)
    setSuccess('Email linked!'); setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ShieldCheck size={26} className="text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Secure your account</h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          {signupMethod === 'google'
            ? 'Your Google account is connected. You can sign in with Google anytime.'
            : 'Your email is set. You can sign in with your email and password anytime.'}
        </p>
      </div>

      {error   && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <Check size={14}/>{success}
        </div>
      )}

      {/* Email card */}
      <div className={`border-2 rounded-2xl p-4 transition-all ${
        emailDone ? 'border-green-300 bg-green-50' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mail size={17} className={emailDone ? 'text-green-500' : 'text-gray-400'} />
            <span className="font-semibold text-gray-800 text-sm">Email address</span>
          </div>
          {emailDone && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
          )}
        </div>

        {emailDone ? (
          <p className="text-sm text-green-700 font-medium">{user?.email ?? email} — verified ✓</p>
        ) : (
          // Only shown if somehow email isn't confirmed yet
          <div className="space-y-3">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-pink-400 focus:outline-none"
              placeholder="you@example.com" />
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border-2 border-gray-200 rounded-xl text-sm focus:border-pink-400 focus:outline-none"
                placeholder="Create a password (min 8 chars)" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
            <button onClick={handleLinkEmail} disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Confirm Email
            </button>
          </div>
        )}
      </div>

      {/* Continue — always available */}
      <button onClick={onComplete}
        className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/25 transition-all">
        Continue <ArrowRight size={17}/>
      </button>
    </div>
  )
}
