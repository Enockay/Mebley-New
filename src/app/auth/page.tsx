/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/static-components */
/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Heart, Mail, Loader2, Eye, EyeOff, Lock,
  ArrowLeft, ArrowRight, Check, ShieldCheck, ChevronDown,
  User, MapPin, Globe, AlertTriangle, Shield, Star, Zap, Flag
} from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'

type AuthMode   = 'landing' | 'signin' | 'signup'
type SignupStep = 1 | 2 | 3 | 4 | 5 | 6

const AGE_RANGES = [
  { value: 'under_18', label: 'Under 18',  blocked: true  },
  { value: '18_24',    label: '18 – 24',   blocked: false },
  { value: '25_34',    label: '25 – 34',   blocked: false },
  { value: '35_40',    label: '35 – 40',   blocked: false },
  { value: '40_50',    label: '40 – 50',   blocked: false },
  { value: '50_65',    label: '50 – 65',   blocked: false },
  { value: '65_plus',  label: '65+',       blocked: false },
]

const GENDERS = [
  { value: 'male',       label: 'Man',        emoji: '👨' },
  { value: 'female',     label: 'Woman',      emoji: '👩' },
  { value: 'non-binary', label: 'Non-binary', emoji: '🧑' },
  { value: 'other',      label: 'Other',      emoji: '✨' },
]

const INTERESTS_IN = [
  { value: 'male',     label: 'Men',      emoji: '👨' },
  { value: 'female',   label: 'Women',    emoji: '👩' },
  { value: 'everyone', label: 'Everyone', emoji: '💫' },
]

const SIGNUP_STEPS = [
  { title: 'Create your account',  subtitle: 'Join thousands finding real connections' },
  { title: "What's your name?",    subtitle: "This is how you'll appear to others" },
  { title: 'A bit about you',      subtitle: 'Help us find your perfect matches' },
  { title: 'Where are you from?',  subtitle: 'Connect with people near you and around the world' },
  { title: 'Secure your account',  subtitle: 'Create your email & password' },
  { title: 'Almost done!',         subtitle: 'Review and confirm your details' },
]

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 2, flex: 1, borderRadius: 99,
          background: i < step ? 'linear-gradient(90deg,#f43f5e,#e11d48)' : '#e5e7eb',
          transition: 'background 0.4s'
        }} />
      ))}
    </div>
  )
}

function PrivacyNote({ text }: { text: string }) {
  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '11px 14px' }}
      className="flex items-start gap-2.5 mt-1">
      <ShieldCheck size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontSize: 12, color: '#15803d', lineHeight: 1.6 }}>{text}</p>
    </div>
  )
}

async function captureCoordinates(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      ()    => resolve(null),
      { timeout: 8000, maximumAge: 300_000 }
    )
  })
}

function ConfirmationScreen({ email, onResend }: { email: string; onResend: () => Promise<void> }) {
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
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 600, color: '#0f172a', margin: '0 0 10px' }}>Check your inbox</h2>
      <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>We sent a confirmation link to:</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 16px', display: 'inline-block', margin: '0 0 24px' }}>{email}</p>
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'left' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>What to do next:</p>
        {[{ icon: '📬', text: 'Open the email from Crotchet' }, { icon: '🔗', text: 'Click the "Confirm your email" link' }, { icon: '🎉', text: "You'll be taken straight into your profile setup" }].map((item, i) => (
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
      <button onClick={handleResend} disabled={cooldown > 0} style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, color: cooldown > 0 ? '#94a3b8' : '#f43f5e', cursor: cooldown > 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend confirmation email'}
      </button>
    </div>
  )
}

function AuthPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()

  const [mode, setMode]               = useState<AuthMode>('landing')
  const [signupStep, setStep]         = useState<SignupStep>(1)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [googleLoading, setGoogle]    = useState(false)
  const [animKey, setAnimKey]         = useState(0)
  const [awaitingConfirmation, setAwaiting] = useState(false)
  const [agreedToTerms, setAgreed]    = useState(false)
  const [termsTouched, setTermsTouched] = useState(false)

  const [fullName, setFullName]       = useState('')
  const [username, setUsername]       = useState('')
  const [ageRange, setAgeRange]       = useState('')
  const [gender, setGender]           = useState('')
  const [interestedIn, setInterest]   = useState('')
  // ✅ Three separate location fields — no placeholder text
  const [city, setCity]               = useState('')
  const [country, setCountry]         = useState('')
  const [nationality, setNat]         = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPass, setConfirm]     = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [resetSent, setResetSent]     = useState(false)
  const [loginEmail, setLE]           = useState('')
  const [loginPass, setLP]            = useState('')
  const [showLP, setShowLP]           = useState(false)
  const [underageBlocked, setUnderage] = useState(false)
  const [coords, setCoords]           = useState<{ latitude: number; longitude: number } | null>(null)

  // Combined "City, Country" for storage
  const combinedLocation = [city, country].filter(Boolean).join(', ')

  useEffect(() => {
    if (searchParams.get('reset') === 'true') setMode('signin')
  }, [searchParams])

  const goToStep = (next: SignupStep) => {
    setAnimKey(k => k + 1); setStep(next); setError('')
    if (next === 4) captureCoordinates().then(r => { if (r) setCoords(r) })
  }

  const strength = [password.length >= 8, /\d/.test(password), /[^A-Za-z0-9]/.test(password), password.length >= 12].filter(Boolean).length
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', '#ef4444', '#f97316', '#84cc16', '#22c55e'][strength]
  const passwordRules = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains a special character', pass: /[^A-Za-z0-9]/.test(password) },
  ]

  const canProceed = (step: SignupStep) => {
    if (step === 1) return agreedToTerms
    if (step === 2) return !!(fullName.trim() && username.trim() && ageRange && !underageBlocked)
    if (step === 3) return !!(gender && interestedIn)
    if (step === 4) return !!(city.trim() && country.trim() && nationality.trim())
    if (step === 5) return !!(email && password && password === confirmPass && password.length >= 8)
    return true
  }

  const handleGoogle = async () => {
    if (!agreedToTerms) { setTermsTouched(true); setError('Please agree to the Terms of Service and confirm you are 18+ before continuing.'); return }
    setGoogle(true)
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
    setGoogle(false)
  }

  const handleStep1Continue = () => {
    if (!agreedToTerms) { setTermsTouched(true); setError('You must confirm you are 18+ and agree to the Terms of Service to continue.'); return }
    goToStep(2)
  }

  const handleEmailSignup = async () => {
    setError(''); setLoading(true)
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (signupError) { setError(signupError.message); setLoading(false); return }
    const userId = signupData.user?.id
    if (!userId) { setError('Signup failed — please try again.'); setLoading(false); return }

    // ✅ Save city/country combined + nationality separately
    const { error: pendingError } = await (supabase as any).from('pending_profiles').upsert({
      user_id:           userId,
      full_name:         fullName.trim(),
      username:          username.toLowerCase().trim(),
      age_range:         ageRange,
      gender,
      gender_preference: interestedIn === 'everyone' ? ['male', 'female', 'non-binary'] : [interestedIn],
      location:          combinedLocation,
      nationality:       nationality.trim(),
      latitude:          coords?.latitude  ?? null,
      longitude:         coords?.longitude ?? null,
    })
    if (pendingError) console.error('pending_profiles save error:', pendingError)
    setLoading(false)
    setAwaiting(true)
  }

  const handleResend = async () => {
    await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
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
    if (!loginEmail) { setError('Enter your email first'); return }
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(loginEmail, { redirectTo: `${window.location.origin}/auth?reset=true` })
    setResetSent(true); setLoading(false)
  }

  const Err = () => error ? (
    <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <AlertTriangle size={14} color="#e11d48" style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 13, color: '#be123c' }}>{error}</span>
    </div>
  ) : null

  const GoogleBtn = ({ label }: { label: string }) => (
    <button onClick={handleGoogle} disabled={googleLoading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px 16px', border: '1.5px solid #e2e8f0', borderRadius: 16, fontSize: 14, fontWeight: 500, color: '#374151', background: 'white', cursor: 'pointer', transition: 'all 0.2s', opacity: googleLoading ? 0.5 : 1, fontFamily: 'inherit' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#cbd5e1')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}>
      {googleLoading ? <Loader2 size={16} color="#94a3b8" className="animate-spin" /> :
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.2 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.6 0-14.1 4.4-17.7 10.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5l-6.3-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-2.8-11.3-7l-6.6 5.1C9.8 39.5 16.4 44 24 44z" /><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.3 5.2c3.7-3.4 5.9-8.5 5.9-14.5 0-1.4-.1-2.7-.3-3.5z" /></svg>}
      {label}
    </button>
  )

  const Divider = ({ label = 'or' }: { label?: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
      <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
    </div>
  )

  const inputStyle = { width: '100%', padding: '14px 14px 14px 42px', border: '1.5px solid #e2e8f0', borderRadius: 16, fontSize: 14, color: '#0f172a', outline: 'none', transition: 'border-color 0.2s', background: 'white', fontFamily: 'inherit', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600 as const, color: '#64748b', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' as const }
  const primaryBtn = (extra: Record<string, unknown> = {}) => ({ width: '100%', padding: '14px', borderRadius: 16, background: 'linear-gradient(135deg,#f43f5e,#e11d48)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600 as const, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(244,63,94,0.3)', transition: 'all 0.2s', fontFamily: 'inherit', ...extra })
  const pillBtn = (selected: boolean) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 14, cursor: 'pointer', border: selected ? '1.5px solid #f43f5e' : '1.5px solid #e2e8f0', background: selected ? '#fff1f2' : 'white', transition: 'all 0.15s', fontFamily: 'inherit', color: selected ? '#be123c' : '#374151', fontSize: 13, fontWeight: 500 as const })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        .auth-wrap { font-family:'DM Sans',sans-serif; min-height:100vh; background:#f8fafc; display:flex; flex-direction:column; position:relative; }
        .auth-wrap::before { content:''; position:fixed; top:-200px; right:-150px; width:500px; height:500px; background:radial-gradient(circle,rgba(244,63,94,0.08) 0%,transparent 65%); pointer-events:none; z-index:0; }
        .auth-wrap::after  { content:''; position:fixed; bottom:-150px; left:-100px; width:400px; height:400px; background:radial-gradient(circle,rgba(251,113,133,0.06) 0%,transparent 65%); pointer-events:none; z-index:0; }
        .card-in { animation: cardIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes cardIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .step-in { animation: stepIn 0.22s ease forwards; }
        @keyframes stepIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
        .display { font-family:'Playfair Display',serif; }
        input:focus { border-color:#f43f5e !important; box-shadow:0 0 0 4px rgba(244,63,94,0.08); }
        select:focus { border-color:#f43f5e !important; outline:none; box-shadow:0 0 0 4px rgba(244,63,94,0.08); }
        .primary-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 28px rgba(244,63,94,0.4) !important; }
        .primary-btn:disabled { opacity:0.4 !important; cursor:not-allowed; }
        .review-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f1f5f9; font-size:14px; }
        .review-row:last-child { border-bottom:none; }
        .str-bar { height:3px; border-radius:99px; flex:1; transition:background 0.3s; }
        .trust-item { display:flex; align-items:center; gap:6px; font-size:12px; color:#64748b; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .terms-shake { animation: shake 0.4s ease; }
      `}</style>
      <div className="auth-wrap">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', paddingTop: 40, paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#f43f5e,#e11d48)', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(244,63,94,0.35)' }}>
              <Heart size={22} color="white" fill="white" />
            </div>
            <span className="display" style={{ fontSize: 26, fontWeight: 600, color: '#0f172a' }}>Crotchet</span>
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8px 16px 48px' }}>
          <div className="card-in" style={{ background: 'white', borderRadius: 28, width: '100%', maxWidth: 440, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05),0 20px 60px rgba(0,0,0,0.09)' }}>

            {/* LANDING */}
            {mode === 'landing' && (
              <div style={{ padding: 36 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <h2 className="display" style={{ fontSize: 32, fontWeight: 600, color: '#0f172a', margin: '0 0 10px', lineHeight: 1.2 }}>Find your person</h2>
                  <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, margin: 0 }}>Real connections. Real people.<br />Across the globe.</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
                  <div className="trust-item"><Shield size={13} color="#f43f5e" /><span>End-to-end encrypted</span></div>
                  <div className="trust-item"><Star size={13} color="#f43f5e" /><span>100k+ members</span></div>
                  <div className="trust-item"><Zap size={13} color="#f43f5e" /><span>Global matching</span></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button onClick={() => { setMode('signup'); setStep(1) }} className="primary-btn" style={primaryBtn()}>Create Account — It's Free</button>
                  <button onClick={() => setMode('signin')} style={{ width: '100%', padding: 14, borderRadius: 16, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 14, fontWeight: 500, color: '#475569', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'white')}>Sign In</button>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 20, lineHeight: 1.7 }}>
                  By continuing you agree to our <a href="/terms" target="_blank" style={{ color: '#f43f5e', textDecoration: 'none', fontWeight: 600 }}>Terms</a> and <a href="/privacy" target="_blank" style={{ color: '#f43f5e', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
                </p>
              </div>
            )}

            {/* SIGN IN */}
            {mode === 'signin' && (
              <div style={{ padding: 36 }}>
                <button onClick={() => setMode('landing')} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0, fontFamily: 'inherit' }}><ArrowLeft size={15} /> Back</button>
                <h2 className="display" style={{ fontSize: 26, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>Welcome back</h2>
                <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px' }}>Sign in to continue your journey</p>
                {resetSent && (<div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}><Check size={14} color="#16a34a" /><span style={{ fontSize: 13, color: '#15803d' }}>Reset email sent — check your inbox.</span></div>)}
                <Err />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <GoogleBtn label="Continue with Google" />
                  <Divider />
                  <div>
                    <label style={labelStyle}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={14} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="email" value={loginEmail} onChange={e => setLE(e.target.value)} autoComplete="email" style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, margin: 0 }}>Password</label>
                      <button onClick={handleForgotPassword} style={{ fontSize: 12, color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Forgot password?</button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type={showLP ? 'text' : 'password'} value={loginPass} onChange={e => setLP(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoComplete="current-password" style={inputStyle} />
                      <button type="button" onClick={() => setShowLP(!showLP)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>{showLP ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                    </div>
                  </div>
                  <button onClick={handleLogin} disabled={loading} className="primary-btn" style={primaryBtn()}>{loading ? <><Loader2 size={15} className="animate-spin" />Signing in...</> : 'Sign In'}</button>
                </div>
                <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#64748b' }}>No account? <button onClick={() => { setMode('signup'); setStep(1); setError('') }} style={{ color: '#f43f5e', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Create one</button></p>
              </div>
            )}

            {/* SIGNUP */}
            {mode === 'signup' && (
              <div style={{ padding: 36 }}>
                {awaitingConfirmation ? (
                  <ConfirmationScreen email={email} onResend={handleResend} />
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <button onClick={() => signupStep === 1 ? setMode('landing') : goToStep((signupStep - 1) as SignupStep)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: 'none', background: '#f8fafc', cursor: 'pointer', color: '#64748b' }}><ArrowLeft size={16} /></button>
                      <div style={{ flex: 1 }}><ProgressBar step={signupStep} total={6} /></div>
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{signupStep}/6</span>
                    </div>
                    <div key={animKey} className="step-in">
                      <h2 className="display" style={{ fontSize: 24, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>{SIGNUP_STEPS[signupStep - 1].title}</h2>
                      <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px' }}>{SIGNUP_STEPS[signupStep - 1].subtitle}</p>
                      <Err />

                      {/* Step 1 */}
                      {signupStep === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <GoogleBtn label="Sign up with Google" />
                          <Divider label="or sign up with email" />
                          <div onClick={() => { setAgreed(!agreedToTerms); setTermsTouched(false); setError('') }} className={termsTouched && !agreedToTerms ? 'terms-shake' : ''} style={{ border: `1.5px solid ${agreedToTerms ? '#f43f5e' : termsTouched ? '#ef4444' : '#e2e8f0'}`, background: agreedToTerms ? '#fff1f2' : termsTouched ? '#fef2f2' : 'white', borderRadius: 16, padding: '13px 15px', cursor: 'pointer', transition: 'all 0.15s', marginTop: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                              <div style={{ width: 20, height: 20, borderRadius: 6, background: agreedToTerms ? '#f43f5e' : 'transparent', border: agreedToTerms ? 'none' : '1.5px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{agreedToTerms && <Check size={11} color="white" />}</div>
                              <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, margin: 0 }}>I confirm I am <strong>18 years or older</strong> and I agree to Crotchet's <a href="/terms" target="_blank" onClick={e => e.stopPropagation()} style={{ color: '#f43f5e', fontWeight: 700, textDecoration: 'none' }}>Terms of Service</a> and <a href="/privacy" target="_blank" onClick={e => e.stopPropagation()} style={{ color: '#f43f5e', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</a>.</p>
                            </div>
                            {!agreedToTerms && <p style={{ fontSize: 11, color: termsTouched ? '#ef4444' : '#94a3b8', marginTop: 8, marginLeft: 32 }}>{termsTouched ? '⚠ This is required to create an account.' : 'Required to continue'}</p>}
                          </div>
                          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                              <ShieldCheck size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                              <div><p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', margin: '0 0 3px' }}>Your data is protected</p><p style={{ fontSize: 12, color: '#16a34a', margin: 0, lineHeight: 1.6 }}>Bank-level encryption. We never sell your personal information.</p></div>
                            </div>
                          </div>
                          <button onClick={handleStep1Continue} className="primary-btn" disabled={!agreedToTerms} style={{ ...primaryBtn(), marginTop: 4 }}>Continue with Email <ArrowRight size={15} /></button>
                        </div>
                      )}

                      {/* Step 2 */}
                      {signupStep === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div>
                            <label style={labelStyle}>Full name</label>
                            <div style={{ position: 'relative' }}><User size={14} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} /><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} /></div>
                          </div>
                          <div>
                            <label style={labelStyle}>Username</label>
                            <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700, fontSize: 14 }}>@</span><input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} style={{ ...inputStyle, paddingLeft: 32 }} /></div>
                            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Letters, numbers, dots and underscores only</p>
                          </div>
                          <div>
                            <label style={labelStyle}>Age range</label>
                            <div style={{ position: 'relative' }}>
                              <select value={ageRange} onChange={e => { const v = e.target.value; setAgeRange(v); setUnderage(v === 'under_18') }} style={{ ...inputStyle, paddingLeft: 14, appearance: 'none', cursor: 'pointer' }}>
                                <option value="">Select your age range</option>
                                {AGE_RANGES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                              </select>
                              <ChevronDown size={14} color="#94a3b8" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                            {underageBlocked && (<div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 13px', marginTop: 8, display: 'flex', gap: 8 }}><AlertTriangle size={13} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} /><p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, margin: 0 }}>You must be 18 or older to use Crotchet.</p></div>)}
                          </div>
                          <PrivacyNote text="Your full name is only visible to your matches. Your @username is public on your profile." />
                          <button onClick={() => canProceed(2) ? goToStep(3) : setError('Please fill in all fields')} disabled={underageBlocked} className="primary-btn" style={primaryBtn()}>Continue <ArrowRight size={15} /></button>
                        </div>
                      )}

                      {/* Step 3 */}
                      {signupStep === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                          <div>
                            <label style={{ ...labelStyle, marginBottom: 12 }}>I identify as</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              {GENDERS.map(g => (<button key={g.value} onClick={() => setGender(g.value)} style={pillBtn(gender === g.value)}><span style={{ fontSize: 18 }}>{g.emoji}</span><span>{g.label}</span>{gender === g.value && <Check size={12} color="#e11d48" style={{ marginLeft: 'auto' }} />}</button>))}
                            </div>
                          </div>
                          <div>
                            <label style={{ ...labelStyle, marginBottom: 12 }}>I'm interested in</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                              {INTERESTS_IN.map(i => (<button key={i.value} onClick={() => setInterest(i.value)} style={{ ...pillBtn(interestedIn === i.value), flexDirection: 'column', gap: 6, padding: '14px 8px', justifyContent: 'center' }}><span style={{ fontSize: 22 }}>{i.emoji}</span><span style={{ fontSize: 12 }}>{i.label}</span></button>))}
                            </div>
                          </div>
                          <PrivacyNote text="Your preferences are used only for matching. Never shared with advertisers or third parties." />
                          <button onClick={() => canProceed(3) ? goToStep(4) : setError('Please select both options')} className="primary-btn" style={primaryBtn()}>Continue <ArrowRight size={15} /></button>
                        </div>
                      )}

                      {/* ✅ Step 4 — City + Country + Nationality — NO placeholders */}
                      {signupStep === 4 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div>
                            <label style={labelStyle}>City</label>
                            <div style={{ position: 'relative' }}><MapPin size={14} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} /><input type="text" value={city} onChange={e => setCity(e.target.value)} style={inputStyle} /></div>
                          </div>
                          <div>
                            <label style={labelStyle}>Country</label>
                            <div style={{ position: 'relative' }}><Globe size={14} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} /><input type="text" value={country} onChange={e => setCountry(e.target.value)} style={inputStyle} /></div>
                          </div>
                          <div>
                            <label style={labelStyle}>Nationality</label>
                            <div style={{ position: 'relative' }}><Flag size={14} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} /><input type="text" value={nationality} onChange={e => setNat(e.target.value)} style={inputStyle} /></div>
                          </div>
                          {coords && (<div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}><Check size={13} color="#16a34a" /><p style={{ fontSize: 12, color: '#15803d', margin: 0 }}>Location detected — this helps find people near you.</p></div>)}
                          <PrivacyNote text="We use your location to show you people nearby. Your exact coordinates are never shown to other users." />
                          <button onClick={() => canProceed(4) ? goToStep(5) : setError('Please fill in your city, country and nationality')} className="primary-btn" style={primaryBtn()}>Continue <ArrowRight size={15} /></button>
                        </div>
                      )}

                      {/* Step 5 */}
                      {signupStep === 5 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div>
                            <label style={labelStyle}>Email address</label>
                            <div style={{ position: 'relative' }}><Mail size={14} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" style={inputStyle} /></div>
                          </div>
                          <div>
                            <label style={labelStyle}>Create password</label>
                            <div style={{ position: 'relative' }}><Lock size={14} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} /><input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" style={inputStyle} /><button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
                            {password.length > 0 && (<div style={{ marginTop: 10 }}><div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>{[1,2,3,4].map(i => <div key={i} className="str-bar" style={{ background: i <= strength ? strengthColor : '#e2e8f0' }} />)}</div>{strength > 0 && <p style={{ fontSize: 12, fontWeight: 600, color: strengthColor, margin: '0 0 8px' }}>{strengthLabel}</p>}<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{passwordRules.map(r => (<div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: r.pass ? '#16a34a' : '#94a3b8' }}><div style={{ width: 14, height: 14, borderRadius: '50%', background: r.pass ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.pass && <Check size={8} color="#16a34a" />}</div>{r.label}</div>))}</div></div>)}
                          </div>
                          <div>
                            <label style={labelStyle}>Confirm password</label>
                            <div style={{ position: 'relative' }}><Lock size={14} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} /><input type="password" value={confirmPass} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" style={inputStyle} />{confirmPass.length > 0 && (<div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>{password === confirmPass ? <Check size={14} color="#16a34a" /> : <AlertTriangle size={14} color="#ef4444" />}</div>)}</div>
                            {confirmPass.length > 0 && password !== confirmPass && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>Passwords do not match</p>}
                          </div>
                          <PrivacyNote text="Your email is encrypted at rest and in transit. Used only for login and account recovery — never shown to other users." />
                          {canProceed(5) && (<button onClick={() => goToStep(6)} className="primary-btn" style={primaryBtn()}>Continue <ArrowRight size={15} /></button>)}
                        </div>
                      )}

                      {/* ✅ Step 6 — Review with separate City / Country / Nationality rows */}
                      {signupStep === 6 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 16, padding: '4px 16px' }}>
                            {[
                              { label: 'Name',        value: fullName },
                              { label: 'Username',    value: `@${username}` },
                              { label: 'Age range',   value: AGE_RANGES.find(a => a.value === ageRange)?.label ?? '' },
                              { label: 'Gender',      value: GENDERS.find(g => g.value === gender)?.label ?? '' },
                              { label: 'Looking for', value: INTERESTS_IN.find(i => i.value === interestedIn)?.label ?? '' },
                              { label: 'City',        value: city },
                              { label: 'Country',     value: country },
                              { label: 'Nationality', value: nationality },
                              { label: 'Email',       value: email },
                            ].map(row => (
                              <div key={row.label} className="review-row">
                                <span style={{ color: '#64748b' }}>{row.label}</span>
                                <span style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <Zap size={14} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
                            <p style={{ fontSize: 12, color: '#1d4ed8', lineHeight: 1.6, margin: 0 }}><strong>Next up:</strong> Confirm your email, then add interests, a photo and bio to start matching.</p>
                          </div>
                          <button onClick={handleEmailSignup} disabled={loading} className="primary-btn" style={primaryBtn()}>{loading ? <><Loader2 size={15} className="animate-spin" />Creating account...</> : <>🎉 Create My Account</>}</button>
                          <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.7 }}>By creating an account you agree to our <a href="/terms" target="_blank" style={{ color: '#f43f5e', fontWeight: 600, textDecoration: 'none' }}>Terms</a> and <a href="/privacy" target="_blank" style={{ color: '#f43f5e', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a></p>
                        </div>
                      )}

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
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={28} color="#f43f5e" className="animate-spin" /></div>}>
      <AuthPageInner />
    </Suspense>
  )
}
