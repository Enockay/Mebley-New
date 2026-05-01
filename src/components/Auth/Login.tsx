'use client'

import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
interface LoginProps {
  onToggle: () => void
  onBack: () => void
}

export default function Login({ onToggle, onBack }: LoginProps) {
  const { signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setError(''); setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email address first'); return }
    setLoading(true)
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setResetSent(true)
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md mx-auto px-6 py-4">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft size={18} /> Back
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
      <p className="text-gray-500 mb-6">Sign in with your email</p>

      {resetSent && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
          Password reset email sent! Check your inbox.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full pl-10 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none transition-colors"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs text-pink-500 hover:text-pink-600 mt-1.5 float-right"
          >
            Forgot password?
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <button onClick={onToggle} className="text-pink-500 font-semibold hover:text-pink-600">
          Sign up
        </button>
      </p>
    </div>
  )
}
