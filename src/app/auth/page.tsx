/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Mail, Loader2, Eye, EyeOff, Lock,
  ArrowLeft, Check, ShieldCheck, AlertTriangle,
  ArrowUpLeft,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase-client'

/* ── Design tokens (match landing page) ────────────────────────── */
const T = {
  bg:         '#0c0a1e',
  bgPanel:    '#100d22',
  bgInput:    'rgba(255,255,255,0.07)',
  border:     'rgba(255,255,255,0.1)',
  borderFocus:'#f03868',
  rose:       '#f03868',
  coral:      '#ff7a50',
  text:       '#f0e8f4',
  muted:      'rgba(220,190,210,0.65)',
  faint:      'rgba(180,150,170,0.4)',
}

/* ── Small helpers ──────────────────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.faint, marginBottom: 7, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {children}
    </label>
  )
}

function DarkInput({ icon: Icon, ...props }: { icon: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: T.faint, pointerEvents: 'none' }} />
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '12px 12px 12px 38px',
          background: focused ? 'rgba(255,255,255,0.1)' : T.bgInput,
          border: `1.5px solid ${focused ? T.borderFocus : T.border}`,
          borderRadius: 12,
          fontSize: 14, color: T.text,
          outline: 'none',
          fontFamily: 'inherit',
          boxShadow: focused ? '0 0 0 3px rgba(240,56,104,0.14)' : 'none',
          transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
          ...props.style,
        }}
      />
    </div>
  )
}

function RightInput({ show, onToggle, ...props }: { show: boolean; onToggle: () => void } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: T.faint, pointerEvents: 'none' }} />
      <input
        {...props}
        type={show ? 'text' : 'password'}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '12px 42px 12px 38px',
          background: focused ? 'rgba(255,255,255,0.1)' : T.bgInput,
          border: `1.5px solid ${focused ? T.borderFocus : T.border}`,
          borderRadius: 12,
          fontSize: 14, color: T.text,
          outline: 'none',
          fontFamily: 'inherit',
          boxShadow: focused ? '0 0 0 3px rgba(240,56,104,0.14)' : 'none',
          transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
        }}
      />
      <button type="button" onClick={onToggle} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.faint, padding: 0 }}>
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

function PrimaryBtn({ children, loading, disabled, onClick }: { children: React.ReactNode; loading?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ width: '100%', padding: '14px', borderRadius: 14, background: `linear-gradient(135deg, ${T.rose}, ${T.coral})`, color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: disabled || loading ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 10px 30px rgba(240,56,104,0.32)', fontFamily: 'inherit', transition: 'opacity 0.2s, transform 0.15s' }}
      onMouseEnter={e => { if (!disabled && !loading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
      {loading ? <><Loader2 size={15} className="animate-spin" /> {children}</> : children}
    </button>
  )
}

function GoogleBtn({ label, loading, onClick }: { label: string; loading?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 16px', border: `1.5px solid ${T.border}`, borderRadius: 14, fontSize: 14, fontWeight: 500, color: T.text, background: T.bgInput, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.18s, background 0.18s' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.22)'; el.style.background = 'rgba(255,255,255,0.1)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.border; el.style.background = T.bgInput }}>
      {loading
        ? <Loader2 size={16} className="animate-spin" style={{ color: T.muted }} />
        : <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.2 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.6 0-14.1 4.4-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5l-6.3-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-2.8-11.3-7l-6.6 5.1C9.8 39.5 16.4 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.3 5.2c3.7-3.4 5.9-8.5 5.9-14.5 0-1.4-.1-2.7-.3-3.5z"/>
          </svg>}
      {label}
    </button>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      <span style={{ fontSize: 11, color: T.faint, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>or</span>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div style={{ background: 'rgba(240,56,104,0.1)', border: '1px solid rgba(240,56,104,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <AlertTriangle size={14} color={T.rose} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 13, color: '#ff8aaa' }}>{msg}</span>
    </div>
  )
}

/* ── Confirmation screen ────────────────────────────────────────── */
function ConfirmationScreen({ email, onResend }: { email: string; onResend: () => Promise<void> }) {
  const [resent, setResent]       = useState(false)
  const [cooldown, setCooldown]   = useState(0)
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
    } finally { setResending(false) }
  }

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ width: 72, height: 72, background: 'rgba(240,56,104,0.15)', border: '1px solid rgba(240,56,104,0.25)', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 30 }}>
        📧
      </div>
      <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: '#ffffff' }}>
        Check your inbox
      </h2>
      <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>We sent a confirmation link to:</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: T.text, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: '9px 16px', display: 'inline-block', margin: '0 0 24px' }}>
        {email}
      </p>
      <div style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, marginBottom: 24, textAlign: 'left' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: '0 0 12px' }}>What to do next:</p>
        {[
          { icon: '📬', text: 'Open the email from Mebley' },
          { icon: '🔗', text: 'Click "Confirm your email"' },
          { icon: '🎉', text: "You'll land straight in profile setup" },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 2 ? 10 : 0 }}>
            <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{item.icon}</span>
            <span style={{ fontSize: 13, color: T.muted }}>{item.text}</span>
          </div>
        ))}
      </div>
      {resent && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Check size={13} color="#4ade80" />
          <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>Confirmation email resent!</span>
        </div>
      )}
      <p style={{ fontSize: 12, color: T.faint, marginBottom: 12 }}>Didn't get it? Check your spam folder.</p>
      <button onClick={handleResend} disabled={cooldown > 0 || resending}
        style={{ background: T.bgInput, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, color: cooldown > 0 ? T.faint : T.rose, cursor: cooldown > 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {resending ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend confirmation email'}
      </button>
    </div>
  )
}

/* ── Left branding panel ────────────────────────────────────────── */
function BrandPanel() {
  return (
    <div style={{
      display: 'none',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '40px 48px',
      background: `
        radial-gradient(ellipse 80% 60% at 10% 10%, rgba(240,56,104,0.2) 0%, transparent 55%),
        radial-gradient(ellipse 60% 50% at 90% 5%, rgba(100,60,200,0.16) 0%, transparent 52%),
        ${T.bg}
      `,
      borderRight: `1px solid ${T.border}`,
    }}
    className="auth-brand-panel">
      {/* logo */}
      <div>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/icon.svg" alt="Mebley" style={{ height: 36, width: 36, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: '#ff6b96' }}>Mebley</span>
        </a>
      </div>

      {/* headline */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 48 }}>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 52, fontWeight: 700, lineHeight: 1.04, margin: '0 0 16px', color: '#ffffff' }}>
          Find your
          <span style={{ display: 'block', background: 'linear-gradient(118deg, #ff6b96 0%, #f03868 40%, #ff7a50 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>
            person.
          </span>
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(220,190,210,0.7)', lineHeight: 1.7, maxWidth: 280, margin: '0 0 40px' }}>
          Thoughtful profiles, voice chemistry, and matches ranked by depth — not by who swiped last.
        </p>

        {/* mock profile card */}
        <div style={{ background: 'linear-gradient(150deg, #bf4578 0%, #8b2556 55%, #4a0e38 100%)', borderRadius: 20, overflow: 'hidden', maxWidth: 240, boxShadow: '0 24px 60px rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ position: 'relative', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 64, fontWeight: 700, color: 'rgba(255,255,255,0.1)' }}>A</span>
            <div style={{ position: 'absolute', inset: '0 0 0 0', background: 'linear-gradient(to top, rgba(12,3,22,0.88) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: 'white', border: '1px solid rgba(255,255,255,0.28)' }}>94% match</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Amara, 27</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Nairobi · Kenya</div>
            </div>
          </div>
          <div style={{ padding: '12px 14px 14px', background: '#130620' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Art lover', 'Traveller', 'Bookworm'].map(t => (
                <span key={t} style={{ borderRadius: 20, padding: '3px 10px', fontSize: 10, color: 'rgba(255,255,255,0.58)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* trust */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { icon: '🔒', text: 'End-to-end encrypted' },
          { icon: '🌍', text: '40+ countries, one platform' },
          { icon: '⭐', text: '4.8 rated experience' },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14 }}>{icon}</span>
            <span style={{ fontSize: 12, color: 'rgba(180,150,170,0.55)' }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   MAIN AUTH INNER
══════════════════════════════════════════════════════════════════ */
function AuthPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signUp } = useAuth()

  const initialMode: 'landing' | 'signin' | 'signup' =
    typeof window !== 'undefined' && searchParams.get('reset') === 'true' ? 'signin' : 'landing'

  const [mode, setMode]                     = useState<'landing' | 'signin' | 'signup'>(initialMode)
  const [error, setError]                   = useState('')
  const [loading, setLoading]               = useState(false)
  const [googleLoading, setGoogleLoading]   = useState(false)
  const [awaitingConfirmation, setAwaiting] = useState(false)
  const [resetSent, setResetSent]           = useState(false)

  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPass, setConfirm]     = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
  const canSignUp     = !!(email && password.length >= 8 && password === confirmPass)

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const supabase   = createClient()
      const redirectTo = `${window.location.origin}/auth/callback`
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, queryParams: { access_type: 'offline', prompt: 'consent' } },
      })
      if (error) { setError(error.message || 'Google sign in failed'); setGoogleLoading(false); return }
      if (data?.url) { window.location.assign(data.url); return }
      setError('Could not start Google sign in. Please try again.')
    } catch (e: any) {
      setError(e?.message || 'Google sign in failed')
    } finally { setGoogleLoading(false) }
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
      if (msg.toLowerCase().includes('already exists')) { setMode('signin'); setLE(email) }
      setLoading(false)
      return
    }
    setLoading(false)
    setAwaiting(false)
    router.push('/setup')
    fetch('/api/auth/send-confirmation-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, kind: 'signup' }),
    }).catch(() => {})
  }

  const handleResend = async () => {
    await fetch('/api/auth/send-confirmation-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
    router.push('/browse')
  }

  const handleForgotPassword = async () => {
    if (!loginEmail) { setError('Enter your email address first'); return }
    setResetSent(false)
    setError('Password reset is temporarily unavailable during auth migration.')
  }

  const back = () => { setMode('landing'); setError('') }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        ::placeholder { color: rgba(180,150,170,0.4); }
        .auth-brand-panel { display: none; }
        @media (min-width: 900px) {
          .auth-brand-panel { display: flex !important; width: 45%; }
          .auth-form-panel  { width: 55%; }
          .auth-mobile-header { display: none !important; }
        }
        .auth-form-in { animation: fIn 0.38s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes fIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .str-bar { height: 3px; border-radius: 99px; flex: 1; transition: background 0.3s; }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', background: T.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* ── LEFT BRAND PANEL ── */}
        <BrandPanel />

        {/* ── RIGHT FORM PANEL ── */}
        <div className="auth-form-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', background: T.bgPanel }}>

          {/* top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: `1px solid ${T.border}` }}>
            {/* back to home */}
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none', color: T.muted, fontSize: 13, fontWeight: 500, transition: 'color 0.18s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.text }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.muted }}>
              <ArrowUpLeft size={15} />
              Back to Mebley
            </a>

            {/* mobile logo */}
            <a href="/" className="auth-mobile-header" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <img src="/icon.svg" alt="Mebley" style={{ height: 28, width: 28, borderRadius: '50%' }} />
              <span style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 700, color: '#ff6b96' }}>Mebley</span>
            </a>
          </div>

          {/* form area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
            <div className="auth-form-in" style={{ width: '100%', maxWidth: 420 }}>

              {/* ══ LANDING ══ */}
              {mode === 'landing' && (
                <div>
                  {/* mobile: show tagline */}
                  <div className="auth-mobile-header" style={{ marginBottom: 32, textAlign: 'center' }}>
                    <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 700, lineHeight: 1.06, margin: '0 0 10px', color: '#ffffff' }}>
                      Find your
                      <span style={{ display: 'inline-block', background: 'linear-gradient(118deg, #ff6b96, #f03868, #ff7a50)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent', marginLeft: 8 }}>
                        person.
                      </span>
                    </h1>
                    <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, margin: 0 }}>Real connections. Real people.</p>
                  </div>

                  {/* desktop heading */}
                  <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 700, color: '#ffffff', margin: '0 0 8px' }}>Get started</h2>
                    <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>Join thousands building something real.</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <GoogleBtn label="Continue with Google" loading={googleLoading} onClick={handleGoogle} />

                    <Divider />

                    <PrimaryBtn onClick={() => { setMode('signup'); setError('') }}>
                      Create account — It's free
                    </PrimaryBtn>

                    <button
                      onClick={() => { setMode('signin'); setError('') }}
                      style={{ width: '100%', padding: '13px', borderRadius: 14, border: `1.5px solid ${T.border}`, background: 'transparent', fontSize: 14, fontWeight: 500, color: T.muted, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.18s, color 0.18s' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.22)'; el.style.color = T.text }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.border; el.style.color = T.muted }}>
                      Sign in to your account
                    </button>
                  </div>

                  <p style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: T.faint, lineHeight: 1.7 }}>
                    By continuing you agree to our{' '}
                    <a href="/terms" target="_blank" style={{ color: T.rose, fontWeight: 600, textDecoration: 'none' }}>Terms</a>
                    {' '}and{' '}
                    <a href="/privacy" target="_blank" style={{ color: T.rose, fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>
                  </p>

                  {/* trust row */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 28, flexWrap: 'wrap' }}>
                    {[['🔒','Encrypted'],['⭐','4.8 rated'],['🌍','40+ countries']].map(([icon, label]) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.faint }}>
                        <span>{icon}</span><span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ SIGN IN ══ */}
              {mode === 'signin' && (
                <div>
                  <button onClick={back} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 28, padding: 0, fontFamily: 'inherit', transition: 'color 0.18s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.text }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.muted }}>
                    <ArrowLeft size={14} /> Back
                  </button>

                  <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>Welcome back</h2>
                  <p style={{ color: T.muted, fontSize: 14, margin: '0 0 28px' }}>Sign in to continue where you left off.</p>

                  {resetSent && (
                    <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Check size={13} color="#4ade80" />
                      <span style={{ fontSize: 13, color: '#4ade80' }}>Reset email sent — check your inbox.</span>
                    </div>
                  )}

                  <ErrorBox msg={error} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <GoogleBtn label="Continue with Google" loading={googleLoading} onClick={handleGoogle} />
                    <Divider />

                    <div>
                      <Label>Email</Label>
                      <DarkInput icon={Mail} type="email" value={loginEmail} onChange={e => setLE(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                        <Label>Password</Label>
                        <button onClick={handleForgotPassword} style={{ fontSize: 12, color: T.rose, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', padding: 0 }}>
                          Forgot password?
                        </button>
                      </div>
                      <RightInput show={showLP} onToggle={() => setShowLP(!showLP)} value={loginPass} onChange={e => setLP(e.target.value)} placeholder="Your password" onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleLogin()} autoComplete="current-password" />
                    </div>

                    <PrimaryBtn loading={loading} onClick={handleLogin}>Sign in</PrimaryBtn>
                  </div>

                  <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: T.faint }}>
                    No account?{' '}
                    <button onClick={() => { setMode('signup'); setError('') }} style={{ color: T.rose, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                      Create one
                    </button>
                  </p>
                </div>
              )}

              {/* ══ SIGN UP ══ */}
              {mode === 'signup' && (
                <div>
                  {awaitingConfirmation ? (
                    <ConfirmationScreen email={email} onResend={handleResend} />
                  ) : (
                    <>
                      <button onClick={back} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 28, padding: 0, fontFamily: 'inherit', transition: 'color 0.18s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.text }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.muted }}>
                        <ArrowLeft size={14} /> Back
                      </button>

                      <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>Create your account</h2>
                      <p style={{ color: T.muted, fontSize: 14, margin: '0 0 28px' }}>Join thousands building meaningful connections.</p>

                      <ErrorBox msg={error} />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <GoogleBtn label="Sign up with Google" loading={googleLoading} onClick={handleGoogle} />
                        <Divider />

                        <div>
                          <Label>Email address</Label>
                          <DarkInput icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                        </div>

                        <div>
                          <Label>Password</Label>
                          <RightInput show={showPass} onToggle={() => setShowPass(!showPass)} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
                          {password.length > 0 && (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                                {[1,2,3,4].map(i => (
                                  <div key={i} className="str-bar" style={{ background: i <= passwordStrength ? strengthColor : T.border }} />
                                ))}
                              </div>
                              {passwordStrength > 0 && <p style={{ fontSize: 11, fontWeight: 600, color: strengthColor, margin: 0 }}>{strengthLabel}</p>}
                            </div>
                          )}
                        </div>

                        <div>
                          <Label>Confirm password</Label>
                          <RightInput show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} value={confirmPass} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password" />
                          {confirmPass.length > 0 && password !== confirmPass && (
                            <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>Passwords do not match</p>
                          )}
                          {confirmPass.length > 0 && password === confirmPass && password.length >= 8 && (
                            <p style={{ fontSize: 12, color: '#4ade80', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Check size={12} /> Passwords match
                            </p>
                          )}
                        </div>

                        {/* privacy note */}
                        <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '10px 13px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <ShieldCheck size={13} color="#4ade80" style={{ flexShrink: 0, marginTop: 1 }} />
                          <p style={{ fontSize: 11, color: 'rgba(134,239,172,0.85)', lineHeight: 1.6, margin: 0 }}>
                            Your email is encrypted at rest and in transit — never shown to other users.
                          </p>
                        </div>

                        <PrimaryBtn loading={loading} disabled={!canSignUp} onClick={handleSignUp}>
                          {loading ? 'Creating account…' : 'Create account'}
                        </PrimaryBtn>

                        <p style={{ fontSize: 11, color: T.faint, textAlign: 'center', lineHeight: 1.7, margin: 0 }}>
                          By creating an account you agree to our{' '}
                          <a href="/terms" target="_blank" style={{ color: T.rose, fontWeight: 600, textDecoration: 'none' }}>Terms</a>
                          {' '}and{' '}
                          <a href="/privacy" target="_blank" style={{ color: T.rose, fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="#f03868" className="animate-spin" />
      </div>
    }>
      <AuthPageInner />
    </Suspense>
  )
}
