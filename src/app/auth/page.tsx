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
import { createClient } from '@/lib/supabase-client'

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
  const supabase = createClient()
  const [resent, setResent]     = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const handleResend = async () => {
    await onResend()
    setResent(true)
    setCooldown(60)
    setTimeout(() => setResent(false), 4000)
  }

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#fdf2f8,#fce7f3)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36, boxShadow: '0 8px 32px rgba(244,63,94,0.15)' }}>📧</div>
      <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 600, color: '#0f172a', margin: '0 0 10px' }}>Check your inbox</h2>
      <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>We sent a confirmation link to:</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 16px', display: 'inline-block', margin: '0 0 24px' }}>{email}</p>
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'left' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>What to do next:</p>
        {[
          { icon: '📬', text: 'Open the email from Crotchet' },
          { icon: '🔗', text: 'Click the "Confirm your email" link' },
          { icon: '🎉', text: "You'll be taken straight into your profile setup" },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 2 ? 10 : 0 }}>
            <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{item.icon}</span>
            <span style={{ fontSize: 13, color: '#475569' }}>{item.text}</span>
          </div>
        ))}
      </div>
      {resent && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Check size={14} color="#16a34a" />
          <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>Confirmation email resent!</span>
        </div>
      )}
      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Didn't get it? Check your spam folder.</p>
      <button
        onClick={handleResend}
        disabled={cooldown > 0}
        style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, color: cooldown > 0 ? '#94a3b8' : '#f43f5e', cursor: cooldown > 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend confirmation email'}
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
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()

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
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    setGoogleLoading(false)
  }

  const handleSignUp = async () => {
    setError('')
    if (password !== confirmPass) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false)
    setAwaiting(true)
  }

  const handleResend = async () => {
    await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
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
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    })
    setResetSent(true)
    setLoading(false)
  }

  const s = {
    wrap:     { fontFamily: "'DM Sans',sans-serif", minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' as const, position: 'relative' as const },
    card:     { background: 'white', borderRadius: 28, width: '100%', maxWidth: 440, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05),0 20px 60px rgba(0,0,0,0.09)' },
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

      <div style={s.wrap}>
        {/* Mesh background blobs */}
        <div style={{ position: 'fixed', top: -200, right: -150, width: 500, height: 500, background: 'radial-gradient(circle,rgba(244,63,94,0.08) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: -150, left: -100, width: 400, height: 400, background: 'radial-gradient(circle,rgba(251,113,133,0.06) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', paddingTop: 40, paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#f43f5e,#e11d48)', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(244,63,94,0.35)' }}>
              <Heart size={22} color="white" fill="white" />
            </div>
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 600, color: '#0f172a' }}>Crotchet</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8px 16px 48px' }}>
          <div className="card-in" style={s.card}>

            {/* ── LANDING ── */}
            {mode === 'landing' && (
              <div style={{ padding: 36 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 32, fontWeight: 600, color: '#0f172a', margin: '0 0 10px', lineHeight: 1.2 }}>Find your person</h2>
                  <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, margin: 0 }}>Real connections. Real people.<br />Across the globe.</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 32, flexWrap: 'wrap' as const }}>
                  {[{ icon: Shield, label: 'End-to-end encrypted' }, { icon: Star, label: '100k+ members' }, { icon: Zap, label: 'Global matching' }].map(({ icon: Icon, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                      <Icon size={13} color="#f43f5e" /><span>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button onClick={() => { setMode('signup'); setError('') }} className="primary-btn" style={s.primary}>
                    Create Account — It's Free
                  </button>
                  <button onClick={() => { setMode('signin'); setError('') }} className="secondary-btn" style={s.secondary}>
                    Sign In
                  </button>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 20, lineHeight: 1.7 }}>
                  By continuing you agree to our{' '}
                  <a href="/terms" target="_blank" style={{ color: '#f43f5e', textDecoration: 'none', fontWeight: 600 }}>Terms</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" style={{ color: '#f43f5e', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
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
                <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px' }}>Sign in to continue your journey</p>

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
                    <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px' }}>Join thousands finding real connections</p>

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
                        {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> : '🎉 Create My Account'}
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
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="#f43f5e" className="animate-spin" />
      </div>
    }>
      <AuthPageInner />
    </Suspense>
  )
}