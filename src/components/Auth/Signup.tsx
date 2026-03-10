'use client'

import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface SignupProps {
  onToggle: () => void
  onBack: () => void
  onProfileSetup: () => void
}

export default function Signup({ onToggle, onBack, onProfileSetup }: SignupProps) {
  const { signUp } = useAuth()
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirm]   = useState('')
  const [showPass, setShowPass]         = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  const rules = [
    { label: 'At least 8 characters',        pass: password.length >= 8 },
    { label: 'Contains a number',             pass: /\d/.test(password) },
    { label: 'Contains a special character',  pass: /[^A-Za-z0-9]/.test(password) },
  ]

  const handleSubmit = async () => {
    setError('')
    if (!email || !password || !confirmPassword) { setError('Please fill in all fields'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await signUp(email, password)
    if (error) { setError(error.message); setLoading(false) }
    else onProfileSetup()
  }

  return (
    <div className="w-full max-w-md mx-auto px-6 py-4">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft size={18} /> Back
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
      <p className="text-gray-500 mb-6">Sign up with your email address</p>

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
              className="w-full pl-10 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none transition-colors"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Password strength rules */}
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
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : 'Create Account'}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <button onClick={onToggle} className="text-pink-500 font-semibold hover:text-pink-600">Sign in</button>
      </p>
    </div>
  )
}
