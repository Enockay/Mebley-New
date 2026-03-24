/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Heart, Mail, Loader2, Eye, EyeOff, Lock,
  ArrowLeft, Check, ShieldCheck, AlertTriangle,
  Shield, Star, Zap,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'

function PrivacyNote({ text }: { text: string }) {
  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '11px 14px' }}
      className="flex items-start gap-2.5 mt-1">
      <ShieldCheck size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontSize: 12, color: '#15803d', lineHeight: 1.6 }}>{text}</p>
    </div>
  )
}

function ConfirmationScreen({ email, onResend }: { email: string; onResend: () => Promise<void> }) {
  const [resent, setResent]     = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const handleResend = async () => {
    if (resending || cooldown > 0) return
    setResending(true)
    try {
      await onResend()
      setResent(true)
      setCooldown(60)
      setTimeout(() => setResent(false), 4000)
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div
        style={{
          width: 84,
          height: 84,
          background: 'radial-gradient(circle at 30% 30%,#ffe9f2,#f7dbe7 58%,#f1ccdb)',
          borderRadius: 26,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 36,
          boxShadow: '0 10px 34px rgba(218,96,131,0.2)',
          border: '1px solid #f2d5e1',
        }}
      >
        📧
      </div>
      <h2
        style={{
          fontFamily: "'Fraunces',serif",
          fontSize: 28,
          fontWeight: 700,
          margin: '0 0 10px',
          background: 'linear-gradient(90deg,#1a1120,#3a1a27,#7a3046)',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}
      >
        Check your inbox
      </h2>
      <p style={{ color: '#62515b', fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>We sent a confirmation link to:</p>
      <p
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#1b1221',
          background: 'linear-gradient(180deg,#ffffff,#f8f1ee)',
          border: '1px solid #dfd3ca',
          borderRadius: 12,
          padding: '10px 16px',
          display: 'inline-block',
          margin: '0 0 24px',
        }}
      >
        {email}
      </p>
      <div
        style={{
          background: 'linear-gradient(145deg,#fbf7f4,#f4edf0)',
          border: '1px solid #ded3d9',
          borderRadius: 18,
          padding: 20,
          marginBottom: 24,
          textAlign: 'left',
          boxShadow: '0 10px 28px rgba(40,19,32,0.06)',
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: '#3a2d36', margin: '0 0 12px' }}>What to do next:</p>
        {[
          { icon: '📬', text: 'Open the email from Mebley' },
          { icon: '🔗', text: 'Click the "Confirm your email" link' },
          { icon: '🎉', text: "You'll be taken straight into your profile setup" },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 2 ? 10 : 0 }}>
            <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{item.icon}</span>
            <span style={{ fontSize: 13, color: '#4a5a70' }}>{item.text}</span>
          </div>
        ))}
      </div>
      {resent && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Check size={14} color="#16a34a" />
          <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>Confirmation email resent!</span>
        </div>
      )}
      <p style={{ fontSize: 13, color: '#8b7d87', marginBottom: 12 }}>Didn't get it? Check your spam folder.</p>
      <button
        onClick={handleResend}
        disabled={cooldown > 0 || resending}
        style={{
          background: cooldown > 0 || resending ? '#f7f2f5' : 'linear-gradient(90deg,#fff6fa,#ffeef4)',
          border: '1.5px solid #e5d3de',
          borderRadius: 12,
          padding: '10px 20px',
          fontSize: 13,
          fontWeight: 700,
          color: cooldown > 0 || resending ? '#9ba1ad' : '#e13f68',
          cursor: cooldown > 0 || resending ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.2s',
          boxShadow: cooldown > 0 || resending ? 'none' : '0 8px 20px rgba(235,86,128,0.14)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
        {resending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Sending...
          </>
        ) : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend confirmation email'}
      </button>
    </div>
  )
}

const Divider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
    <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>or</span>
    <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
  </div>
)

function AuthPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signUp } = useAuth()
  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  const initialMode: 'landing' | 'signin' | 'signup' =
    typeof window !== 'undefined' && searchParams.get('reset') === 'true'
      ? 'signin'
      : 'landing'
  const [mode, setMode]                     = useState<'landing' | 'signin' | 'signup'>(initialMode)
  const [error, setError]                   = useState('')
  const [loading, setLoading]               = useState(false)
  const [googleLoading, setGoogleLoading]   = useState(false)
  const [awaitingConfirmation, setAwaiting] = useState(false)
  const [resetSent, setResetSent]           = useState(false)

  // Sign up fields
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirmPass, setConfirm] = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Sign in fields
  const [loginEmail, setLE] = useState('')
  const [loginPass, setLP]  = useState('')
  const [showLP, setShowLP] = useState(false)

  const passwordStrength = [
    password.length >= 8,
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12,
  ].filter(Boolean).length

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength]
  const strengthColor = ['', '#ef4444', '#f97316', '#84cc16', '#22c55e'][passwordStrength]

  const canSignUp = !!(
    email &&
    password.length >= 8 &&
    password === confirmPass
  )

  const handleGoogle = async () => {
    setGoogleLoading(false)
    setError('Google sign in is temporarily unavailable during auth migration.')
  }

  const handleSignUp = async () => {
    setError('')
    if (password !== confirmPass) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await signUp(email, password)
    if (error) {
      const msg = error.message || 'Sign up failed'
      setError(msg)
      // If account already exists, guide user directly to login.
      if (msg.toLowerCase().includes('already exists')) {
        setMode('signin')
        setLE(email)
      }
      setLoading(false)
      return
    }
    setLoading(false)
    setAwaiting(false)
    router.push('/setup')

    // Optional branded reminder email via Brevo (non-blocking)
    fetch('/api/auth/send-confirmation-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, kind: 'signup' }),
    }).catch(() => {})
  }

  const handleResend = async () => {
    await fetch('/api/auth/send-confirmation-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, kind: 'resend' }),
    }).catch(() => {})
  }

  const handleLogin = async () => {
    setError('')
    if (!loginEmail || !loginPass) { setError('Please fill in all fields'); return }
    setLoading(true)
    const { error } = await signIn(loginEmail, loginPass)
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/discover')
  }

  const handleForgotPassword = async () => {
    if (!loginEmail) { setError('Enter your email address first'); return }
    setResetSent(false)
    setError('Password reset is temporarily unavailable during auth migration.')
  }

  const s = {
    input:    { width: '100%', padding: '14px 14px 14px 42px', border: '1.5px solid #e2e8f0', borderRadius: 16, fontSize: 14, color: '#0f172a', outline: 'none', background: 'white', fontFamily: 'inherit', boxSizing: 'border-box' as const, transition: 'border-color 0.2s' },
    label:    { display: 'block', fontSize: 11, fontWeight: 600 as const, color: '#64748b', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' as const },
    primary:  { width: '100%', padding: '14px', borderRadius: 16, background: 'linear-gradient(135deg,#f43f5e,#e11d48)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600 as const, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(244,63,94,0.3)', fontFamily: 'inherit' },
    secondary: { width: '100%', padding: '14px', borderRadius: 16, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 14, fontWeight: 500 as const, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' },
    google:   { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px 16px', border: '1.5px solid #e2e8f0', borderRadius: 16, fontSize: 14, fontWeight: 500 as const, color: '#374151', background: 'white', cursor: 'pointer', fontFamily: 'inherit' },
    iconPos:  { position: 'absolute' as const, left: 14, top: '50%', transform: 'translateY(-50%)' },
  }

  const Err = () => error ? (
    <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <AlertTriangle size={14} color="#e11d48" style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 13, color: '#be123c' }}>{error}</span>
    </div>
  ) : null

  const GoogleBtn = ({ label }: { label: string }) => (
    <button onClick={handleGoogle} disabled={googleLoading} style={{ ...s.google, opacity: googleLoading ? 0.6 : 1 }}>
      {googleLoading
        ? <Loader2 size={16} color="#94a3b8" className="animate-spin" />
        : <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.2 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.6 0-14.1 4.4-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5l-6.3-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-2.8-11.3-7l-6.6 5.1C9.8 39.5 16.4 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.3 5.2c3.7-3.4 5.9-8.5 5.9-14.5 0-1.4-.1-2.7-.3-3.5z"/>
          </svg>
      }
      {label}
    </button>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        .auth-input:focus { border-color: #f43f5e !important; box-shadow: 0 0 0 4px rgba(244,63,94,0.08); }
        .primary-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(244,63,94,0.4) !important; }
        .primary-btn:disabled { opacity: 0.4 !important; cursor: not-allowed; }
        .google-btn:hover { border-color: #cbd5e1 !important; background: #f8fafc !important; }
        .secondary-btn:hover { background: #f8fafc !important; }
        .card-in { animation: cardIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes cardIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .str-bar { height: 3px; border-radius: 99px; flex: 1; transition: background 0.3s; }
      `}</style>

      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(34%_46%_at_22%_26%,rgba(174,16,127,0.3),transparent_72%),radial-gradient(38%_52%_at_82%_12%,rgba(88,12,120,0.37),transparent_70%),radial-gradient(45%_55%_at_84%_86%,rgba(207,18,111,0.24),transparent_72%),linear-gradient(135deg,#120018_0%,#2b043f_48%,#70004b_78%,#d1005f_100%)] font-['DM_Sans']">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(52%_45%_at_82%_10%,rgba(248,159,196,0.18),transparent_72%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(42%_36%_at_12%_88%,rgba(201,116,187,0.14),transparent_76%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(34%_34%_at_50%_58%,rgba(255,255,255,0.1),transparent_75%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_0%,transparent_25%,transparent_75%,rgba(255,255,255,0.05)_100%)]" />

        {/* Brand */}
        <div className="relative z-10 flex justify-center pb-3 pt-10">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-4 py-2 shadow-[0_8px_28px_rgba(12,4,17,0.35)] backdrop-blur-sm">
            <img src="/icon.svg" alt="Mebley logo" className="h-10 w-10 rounded-full" />
            <span className="font-['Fraunces'] text-3xl font-bold text-[#fff4fb]">Mebley</span>
          </div>
        </div>

        {/* Card */}
        <div className="relative z-10 flex flex-1 items-start justify-center px-4 pb-12 pt-2">
          <div className="card-in w-full max-w-[460px] overflow-hidden rounded-[18px] border border-[#e8d7e3] bg-[linear-gradient(145deg,rgba(255,248,251,0.96),rgba(249,239,246,0.94))] shadow-[0_8px_36px_rgba(18,7,25,0.3),0_24px_90px_rgba(18,7,25,0.22)] backdrop-blur-[3px]">

            {/* ── LANDING ── */}
            {mode === 'landing' && (
              <div className="p-9 md:p-10">
                <div className="mb-8 text-center">
                  <h2 className="m-0 font-['Fraunces'] text-5xl font-black leading-[0.95] tracking-tight text-[#1b1017] md:text-7xl">
                    Find your
                    <span className="mt-1 block bg-gradient-to-r from-[#ef5f7f] via-[#d97a68] to-[#c8915d] bg-clip-text font-semibold italic text-transparent">
                      person
                    </span>
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#5f4f58] md:text-base">
                    Real connections. Real people.
                    <br />
                    Across the globe.
                  </p>
                </div>
                <div className="mb-8 flex flex-wrap justify-center gap-x-5 gap-y-3">
                  {[{ icon: Shield, label: 'End-to-end encrypted' }, { icon: Star, label: '100k+ members' }, { icon: Zap, label: 'Global matching' }].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-[#65545d]">
                      <Icon size={13} color="#e75273" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { setMode('signup'); setError('') }}
                    className="primary-btn w-full rounded-xl bg-gradient-to-r from-[#ee5d7d] to-[#d77b5d] px-4 py-3.5 text-base font-semibold text-white shadow-[0_10px_28px_rgba(231,94,124,0.32)] transition"
                  >
                    Create Account — It's Free
                  </button>
                  <button
                    onClick={() => { setMode('signin'); setError('') }}
                    className="secondary-btn w-full rounded-xl border border-[#e4d8ce] bg-[#fffdfb] px-4 py-3.5 text-base font-medium text-[#493b43] transition hover:bg-[#faf2eb]"
                  >
                    Sign In
                  </button>
                </div>
                <p className="mt-5 text-center text-[11px] leading-relaxed text-[#8a7781]">
                  By continuing you agree to our{' '}
                  <a href="/terms" target="_blank" className="font-semibold text-[#c54e66] no-underline">Terms</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" className="font-semibold text-[#c54e66] no-underline">Privacy Policy</a>
                </p>
              </div>
            )}

            {/* ── SIGN IN ── */}
            {mode === 'signin' && (
              <div style={{ padding: 36 }}>
                <button onClick={() => { setMode('landing'); setError('') }} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0, fontFamily: 'inherit' }}>
                  <ArrowLeft size={15} /> Back
                </button>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>Welcome back</h2>
                <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px' }}>Sign in to continue where you left off.</p>

                {resetSent && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Check size={14} color="#16a34a" />
                    <span style={{ fontSize: 13, color: '#15803d' }}>Reset email sent — check your inbox.</span>
                  </div>
                )}

                <Err />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <GoogleBtn label="Continue with Google" />
                  <Divider />

                  <div>
                    <label style={s.label}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={14} color="#94a3b8" style={s.iconPos} />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={e => setLE(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="auth-input"
                        style={s.input}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...s.label, margin: 0 }}>Password</label>
                      <button onClick={handleForgotPassword} style={{ fontSize: 12, color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} color="#94a3b8" style={s.iconPos} />
                      <input
                        type={showLP ? 'text' : 'password'}
                        value={loginPass}
                        onChange={e => setLP(e.target.value)}
                        placeholder="Enter your password"
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        autoComplete="current-password"
                        className="auth-input"
                        style={s.input}
                      />
                      <button type="button" onClick={() => setShowLP(!showLP)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                        {showLP ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <button onClick={handleLogin} disabled={loading} className="primary-btn" style={s.primary}>
                    {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : 'Sign In'}
                  </button>
                </div>

                <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                  No account?{' '}
                  <button onClick={() => { setMode('signup'); setError('') }} style={{ color: '#f43f5e', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                    Create one
                  </button>
                </p>
              </div>
            )}

            {/* ── SIGN UP ── */}
            {mode === 'signup' && (
              <div style={{ padding: 36 }}>
                {awaitingConfirmation ? (
                  <ConfirmationScreen email={email} onResend={handleResend} />
                ) : (
                  <>
                    <button onClick={() => { setMode('landing'); setError('') }} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0, fontFamily: 'inherit' }}>
                      <ArrowLeft size={15} /> Back
                    </button>
                    <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>Create your account</h2>
                    <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px' }}>Join thousands building meaningful connections.</p>

                    <Err />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <GoogleBtn label="Sign up with Google" />
                      <Divider />

                      {/* Email */}
                      <div>
                        <label style={s.label}>Email address</label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={14} color="#94a3b8" style={s.iconPos} />
                          <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            className="auth-input"
                            style={s.input}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label style={s.label}>Password</label>
                        <div style={{ position: 'relative' }}>
                          <Lock size={14} color="#94a3b8" style={s.iconPos} />
                          <input
                            type={showPass ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            className="auth-input"
                            style={s.input}
                          />
                          <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        {password.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                              {[1,2,3,4].map(i => (
                                <div key={i} className="str-bar" style={{ background: i <= passwordStrength ? strengthColor : '#e2e8f0' }} />
                              ))}
                            </div>
                            {passwordStrength > 0 && <p style={{ fontSize: 12, fontWeight: 600, color: strengthColor, margin: 0 }}>{strengthLabel}</p>}
                          </div>
                        )}
                      </div>

                      {/* Confirm password */}
                      <div>
                        <label style={s.label}>Confirm password</label>
                        <div style={{ position: 'relative' }}>
                          <Lock size={14} color="#94a3b8" style={s.iconPos} />
                          <input
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPass}
                            onChange={e => setConfirm(e.target.value)}
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                            className="auth-input"
                            style={s.input}
                          />
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                            {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        {confirmPass.length > 0 && password !== confirmPass && (
                          <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>Passwords do not match</p>
                        )}
                        {confirmPass.length > 0 && password === confirmPass && password.length >= 8 && (
                          <p style={{ fontSize: 12, color: '#16a34a', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={12} /> Passwords match
                          </p>
                        )}
                      </div>

                      <PrivacyNote text="Your email is encrypted at rest and in transit. Used only for login and account recovery — never shown to other users." />

                      <button
                        onClick={handleSignUp}
                        disabled={!canSignUp || loading}
                        className="primary-btn"
                        style={s.primary}>
                        {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> : 'Create account'}
                      </button>

                      <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.7, margin: 0 }}>
                        By creating an account you agree to our{' '}
                        <a href="/terms" target="_blank" style={{ color: '#f43f5e', fontWeight: 600, textDecoration: 'none' }}>Terms</a>
                        {' '}and{' '}
                        <a href="/privacy" target="_blank" style={{ color: '#f43f5e', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#120018 0%,#2b043f 48%,#70004b 78%,#d1005f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="#f43f5e" className="animate-spin" />
      </div>
    }>
      <AuthPageInner />
    </Suspense>
  )
}