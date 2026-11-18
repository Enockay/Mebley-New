'use client'
/**
 * Me (2026 redesign): your profile summary, stats, credits and boosts,
 * profile strength, and settings. The previous implementation is in git
 * history. Editing still uses the EditProfile dialog.
 */
import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BadgeCheck, ChevronRight, Crown, Eye, Flame, LogOut, Settings, ShieldCheck, Star, Pencil, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePaywall } from '@/hooks/usePaywall'
import { usePlan } from '@/hooks/usePlan'
import EditProfile from '@/components/Profile/EditProfile'
import { initials } from '@/components/App/AppFrame'
import { AGE_RANGE_LABELS } from '@/components/App/discover-model'

/* eslint-disable @next/next/no-img-element */

type EditTab = 'basics' | 'prompts' | 'intents' | 'interests' | 'photos' | 'videos' | 'voice'

const until = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `On until ${d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })}`
}

function Toggle({ on, busy, onChange, label }: { on: boolean; busy?: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={busy} onClick={onChange} className="ma-switch" data-on={on}>
      <span />
    </button>
  )
}

function MeContent() {
  const { user, profile, loading, refreshProfile, creditBalance, signOut } = useAuth()
  const { openPaywall } = usePaywall()
  const { tier } = usePlan()
  const router = useRouter()
  const params = useSearchParams()
  const [edit, setEdit] = useState<EditTab | null>(params.get('edit') ? 'prompts' : null)
  const [stats, setStats] = useState({ likes: 0, matches: 0, views: 0 })
  const [here, setHere] = useState<{ active: boolean; until: string | null; busy: boolean }>({ active: false, until: null, busy: false })
  const [spot, setSpot] = useState<{ active: boolean; until: string | null; busy: boolean }>({ active: false, until: null, busy: false })
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null)
  const [visBusy, setVisBusy] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const selfieRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!loading && !user) router.push('/auth') }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const get = (url: string) => fetch(url, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null)
    get('/api/likes/received').then(d => d && setStats(s => ({ ...s, likes: Number(d.count) || 0 })))
    get('/api/chat/conversations').then(d => d && setStats(s => ({ ...s, matches: Array.isArray(d.conversations) ? d.conversations.length : 0 })))
    get('/api/profile/view').then(d => d && setStats(s => ({ ...s, views: Number(d.count) || 0 })))
    get('/api/presence/here-tonight').then(d => d && setHere(h => ({ ...h, active: !!d.active, until: d.expiresAt ?? null })))
    get('/api/presence/spotlight').then(d => d && setSpot(h => ({ ...h, active: !!d.active, until: d.expiresAt ?? null })))
    get('/api/verification/selfie').then(d => d && setVerified(!!d.verified))
  }, [user])

  if (loading || !profile) {
    return <div className="ma" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}><div className="ma-spinner" /></div>
  }

  const p = profile as unknown as {
    full_name?: string; username?: string; age_range?: string; location?: string; visible?: boolean
    profile_completeness?: number; photos?: { url: string; slot: number }[]; prompts?: { question: string; answer: string }[]
  }
  const name = p.full_name ?? 'Me'
  const photo = [...(p.photos ?? [])].sort((a, b) => a.slot - b.slot)[0]?.url ?? null
  const completeness = Math.max(0, Math.min(100, Number(p.profile_completeness ?? 0)))
  const sub = [AGE_RANGE_LABELS[p.age_range ?? ''], p.location?.split(',')[0], p.username ? `@${p.username}` : null].filter(Boolean).join(' · ')
  const prompts = (p.prompts ?? []).filter(Boolean)
  const nextStep = prompts.length < 3 ? { text: 'Answer a prompt', tab: 'prompts' as EditTab }
    : (p.photos?.length ?? 0) < 3 ? { text: 'Add more photos', tab: 'photos' as EditTab }
    : { text: 'Add your details', tab: 'basics' as EditTab }

  const buyHereTonight = async () => {
    if (here.busy || here.active) return
    if (!window.confirm('Use 80 credits to show you’re free this evening?')) return
    setHere(h => ({ ...h, busy: true }))
    try {
      const res = await fetch('/api/presence/here-tonight', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (res.status === 402) { openPaywall('general', 'credits'); return }
      if (!res.ok) { window.alert(body?.error ?? 'Could not turn on Here tonight'); return }
      setHere({ active: !!body.active, until: body.expiresAt ?? null, busy: false })
      await refreshProfile()
    } finally {
      setHere(h => ({ ...h, busy: false }))
    }
  }

  const buySpotlight = async () => {
    if (spot.busy || spot.active) return
    if (!window.confirm('Use 120 credits to be at the top of Discover for 24 hours?')) return
    setSpot(s => ({ ...s, busy: true }))
    try {
      const res = await fetch('/api/credits/spend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: 'spotlight', type: 'boost' }) })
      if (res.status === 402) { openPaywall('spotlight', 'credits'); return }
      if (!res.ok) { const b = await res.json().catch(() => ({})); window.alert(b?.error ?? 'Could not start Spotlight'); return }
      const st = await fetch('/api/presence/spotlight').then(r => r.json()).catch(() => ({}))
      setSpot({ active: !!st.active, until: st.expiresAt ?? null, busy: false })
      await refreshProfile()
    } finally {
      setSpot(s => ({ ...s, busy: false }))
    }
  }

  const toggleVisible = async () => {
    setVisBusy(true)
    try {
      const res = await fetch('/api/profile/visibility', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visible: !p.visible }) })
      if (res.ok) await refreshProfile()
    } finally {
      setVisBusy(false)
    }
  }

  const verifySelfie = async (file: File) => {
    setVerifying(true)
    setVerifyMsg(null)
    try {
      const fd = new FormData()
      fd.append('selfie', file)
      const res = await fetch('/api/verification/selfie', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setVerifyMsg(data.error ?? 'Verification failed. Try again.'); return }
      setVerified(!!data.verified)
      setVerifyMsg(data.message ?? null)
    } catch {
      setVerifyMsg('Verification failed. Try again.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="ma-me">
      <div className="ma-me__head">
        <h1 className="ma-title">Me</h1>
        <div className="ma-menu">
          <button type="button" className="ma-iconbtn" aria-label="Settings" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}><Settings size={20} /></button>
          {menuOpen ? (
            <div className="ma-menu__list" role="menu" onMouseLeave={() => setMenuOpen(false)}>
              <button role="menuitem" onClick={() => { setMenuOpen(false); setEdit('basics') }}><Pencil size={16} /> Edit profile</button>
              <button role="menuitem" onClick={() => { setMenuOpen(false); openPaywall('general', 'plans') }}><Crown size={16} /> Plans and credits</button>
              <button role="menuitem" onClick={() => { setMenuOpen(false); router.push('/safety') }}><ShieldCheck size={16} /> Safety centre</button>
              <button role="menuitem" className="ma-danger" onClick={async () => { setMenuOpen(false); await signOut(); router.push('/auth') }}><LogOut size={16} /> Sign out</button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="ma-me__grid">
        <div className="ma-me__col">
          <section className="ma-card ma-me__id">
            <span className="ma-face ma-face--coral" style={{ width: 84, height: 84 }}>
              {photo ? <img src={photo} alt="" /> : <span className="ma-face__init ma-display" style={{ fontSize: 26, color: 'var(--ma-text-1)' }}>{initials(name)}</span>}
            </span>
            <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
              <h2 className="ma-display" style={{ margin: 0, fontSize: 24, lineHeight: '30px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {name}{verified ? <BadgeCheck size={20} color="var(--ma-blue)" aria-label="Photo verified" /> : null}
              </h2>
              {sub ? <p className="ma-muted" style={{ margin: 0 }}>{sub}</p> : null}
              <button type="button" className="ma-link" onClick={() => setEdit('photos')}>Edit profile &amp; photos</button>
            </div>
          </section>

          <ul className="ma-stats" aria-label="Your stats">
            <li><b>{stats.likes}</b><span>Likes</span></li>
            <li><b>{stats.matches}</b><span>Matches</span></li>
            <li><b>{stats.views}</b><span>Views</span></li>
          </ul>

          <section className="ma-card ma-wallet" aria-label="Credits">
            <div className="ma-wallet__top">
              <div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ma-gold)' }}>Credit balance</p>
                <p className="ma-display" style={{ margin: 0, fontSize: 40, lineHeight: '46px', color: 'var(--ma-gold)' }}>{Math.max(0, Number(creditBalance ?? 0)).toLocaleString('en-US')}</p>
              </div>
              <button type="button" className="ma-btn ma-btn--gold" onClick={() => openPaywall('general', 'credits')}>Top up</button>
            </div>
            <div className="ma-wallet__row">
              <span className="ma-wallet__icon"><Flame size={20} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>Here tonight</b>
                <span>{here.active ? until(here.until) : 'Show you’re free this evening'}</span>
              </span>
              <button type="button" className="ma-cost" onClick={buyHereTonight} disabled={here.busy || here.active} aria-label={here.active ? 'Here tonight is on' : 'Turn on Here tonight for 80 credits'}>
                {here.busy ? <Loader2 size={16} className="ma-spin" /> : here.active ? 'On' : '80'}
              </button>
            </div>
            <div className="ma-wallet__row">
              <span className="ma-wallet__icon"><Star size={20} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>Spotlight</b>
                <span>{spot.active ? until(spot.until) : 'Top of Discover for 24 hours'}</span>
              </span>
              <button type="button" className="ma-cost" onClick={buySpotlight} disabled={spot.busy || spot.active} aria-label={spot.active ? 'Spotlight is on' : 'Turn on Spotlight for 120 credits'}>
                {spot.busy ? <Loader2 size={16} className="ma-spin" /> : spot.active ? 'On' : '120'}
              </button>
            </div>
          </section>
        </div>

        <div className="ma-me__col">
          <section className="ma-card" style={{ display: 'grid', gap: 12 }} aria-label="Profile strength">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <b style={{ fontSize: 16 }}>Profile strength</b>
              <b className="ma-display" style={{ fontSize: 24 }}>{completeness}%</b>
            </div>
            <div className="ma-bar" role="progressbar" aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100} aria-label="Profile strength"><span style={{ width: `${completeness}%` }} /></div>
            {completeness < 100 ? (
              <button type="button" className="ma-link" onClick={() => setEdit(nextStep.tab)}>{nextStep.text} to reach 100% <ChevronRight size={16} /></button>
            ) : null}
          </section>

          <section className="ma-card ma-settings" aria-label="Settings">
            <div className="ma-setting">
              <span className="ma-setting__icon" style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--ma-green)' }}><Eye size={20} /></span>
              <span className="ma-setting__text"><b>Visible in Discover</b><span>{p.visible ? 'People can find you' : 'You’re hidden from Discover'}</span></span>
              <Toggle on={!!p.visible} busy={visBusy} onChange={toggleVisible} label="Visible in Discover" />
            </div>
            <div className="ma-setting">
              <span className="ma-setting__icon" style={{ background: 'rgba(79,142,247,0.12)', color: 'var(--ma-blue)' }}><BadgeCheck size={20} /></span>
              <span className="ma-setting__text"><b>Verify your photos</b><span>{verifyMsg ?? (verified ? 'You have the verified badge' : 'Take a selfie to get the badge')}</span></span>
              {verified ? <span className="ma-tag ma-tag--sm" style={{ color: 'var(--ma-blue)' }}>Verified</span> : (
                <>
                  <button type="button" className="ma-link" style={{ color: '#7fb0ff' }} onClick={() => selfieRef.current?.click()} disabled={verifying}>
                    {verifying ? 'Checking…' : 'Get the badge'}
                  </button>
                  <input ref={selfieRef} type="file" accept="image/*" capture="user" hidden onChange={e => { const f = e.target.files?.[0]; if (f) verifySelfie(f); e.target.value = '' }} />
                </>
              )}
            </div>
            <button type="button" className="ma-setting" onClick={() => openPaywall('general', 'plans')}>
              <span className="ma-setting__icon" style={{ background: 'var(--ma-gold-bg)', color: 'var(--ma-gold)' }}><Crown size={20} /></span>
              <span className="ma-setting__text"><b>Your plan</b><span>{tier === 'free' ? 'Free. Upgrade for more credits and features' : `${tier.charAt(0).toUpperCase()}${tier.slice(1)}`}</span></span>
              <ChevronRight size={18} className="ma-muted" />
            </button>
            <Link href="/safety" className="ma-setting">
              <span className="ma-setting__icon" style={{ background: 'var(--ma-coral-bg)', color: 'var(--ma-coral-ink)' }}><ShieldCheck size={20} /></span>
              <span className="ma-setting__text"><b>Safety centre</b><span>Reporting, blocking and meeting safely</span></span>
              <ChevronRight size={18} className="ma-muted" />
            </Link>
            <button type="button" className="ma-setting" onClick={async () => { await signOut(); router.push('/auth') }}>
              <span className="ma-setting__icon" style={{ background: 'var(--ma-panel-3)', color: 'var(--ma-text-2)' }}><LogOut size={20} /></span>
              <span className="ma-setting__text"><b>Sign out</b></span>
            </button>
          </section>

          {prompts.length > 0 ? (
            <section className="ma-section" aria-label="Your prompts">
              <p className="ma-label">Your prompts</p>
              {prompts.map(pr => (
                <article key={pr.question} className="ma-prompt">
                  <p className="ma-prompt__q">{pr.question}</p>
                  <p className="ma-prompt__a">{pr.answer}</p>
                </article>
              ))}
            </section>
          ) : null}
        </div>
      </div>

      {edit ? (
        <EditProfile
          initialTab={edit}
          onClose={() => { setEdit(null); refreshProfile(); if (params.get('edit')) router.replace('/profile') }}
        />
      ) : null}
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <MeContent />
    </Suspense>
  )
}
