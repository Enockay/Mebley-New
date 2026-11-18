'use client'
/**
 * Likes you (2026 redesign). Paid plans (or a credit unlock) see everyone who
 * liked them, including Stitch notes; others see a count and blurred preview.
 * Liking back creates a match. Logic moved here from the old Matches page.
 */
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Lock, MapPin, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePaywall } from '@/hooks/usePaywall'
import { WHO_LIKED_YOU_UNLOCK_CREDITS } from '@/lib/who-liked-you-unlock.constants'
import { AGE_RANGE_LABELS } from '@/components/App/discover-model'
import { initials } from '@/components/App/AppFrame'

/* eslint-disable @next/next/no-img-element */

type Liker = {
  id: string; full_name: string; age_range: string | null; location: string | null
  photos: unknown; liked_at: string; is_stitch: boolean; stitch_note: string | null
}

const photoOf = (photos: unknown): string | null => {
  if (!Array.isArray(photos) || !photos[0]) return null
  const f = photos[0] as { url?: string } | string
  return typeof f === 'string' ? f : f.url ?? null
}

function LikesContent() {
  const { user, loading, refreshProfile } = useAuth()
  const { openPaywall } = usePaywall()
  const router = useRouter()
  const [likers, setLikers] = useState<Liker[]>([])
  const [count, setCount] = useState(0)
  const [locked, setLocked] = useState(true)
  const [fetching, setFetching] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { if (!loading && !user) router.push('/auth') }, [user, loading, router])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/likes/received', { cache: 'no-store' })
      const d = await res.json()
      setLikers(Array.isArray(d?.likers) ? d.likers : [])
      setCount(Number(d?.count) || 0)
      setLocked(d?.locked ?? true)
    } catch { /* keep state */ } finally {
      setFetching(false)
    }
  }, [])
  useEffect(() => { if (user) load() }, [user, load])

  const unlock = async () => {
    setUnlocking(true)
    try {
      const res = await fetch('/api/likes/received/unlock', { method: 'POST' })
      const d = await res.json().catch(() => ({}))
      if (res.status === 402) { openPaywall('general', 'credits'); return }
      if (!res.ok || !d.unlocked) { openPaywall('general', 'plans'); return }
      await refreshProfile()
      await load()
    } finally {
      setUnlocking(false)
    }
  }

  const likeBack = async (l: Liker) => {
    setBusy(l.id)
    try {
      const res = await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ likeeId: l.id }) })
      const d = await res.json().catch(() => ({}))
      if (res.status === 402) { openPaywall('general', 'credits'); return }
      if (!res.ok) { setToast(d?.error ?? 'That didn’t go through. Please try again.'); return }
      setLikers(prev => prev.filter(x => x.id !== l.id))
      setCount(c => Math.max(0, c - 1))
      setToast(d?.isMatch ? `It’s a match! Say hi to ${l.full_name.split(' ')[0]} in Chats.` : `You liked ${l.full_name.split(' ')[0]} back.`)
      await refreshProfile()
    } finally {
      setBusy(null)
      setTimeout(() => setToast(null), 3500)
    }
  }

  const pass = (l: Liker) => {
    setLikers(prev => prev.filter(x => x.id !== l.id))
    setCount(c => Math.max(0, c - 1))
    fetch('/api/passes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passedId: l.id }) }).catch(() => {})
  }

  return (
    <div className="ma-likes">
      <div>
        <h1 className="ma-title">Likes you</h1>
        <p className="ma-sub">
          {fetching ? 'Loading…' : count === 0 ? 'No new likes yet. Complete your profile to get noticed.' : `${count} ${count === 1 ? 'person likes' : 'people like'} you. Like them back to match.`}
        </p>
      </div>

      {locked && count > 0 ? (
        <section className="ma-card ma-likes__lock" aria-label="See who likes you">
          <div className="ma-likes__blur" aria-hidden="true">
            {Array.from({ length: Math.min(count, 6) }, (_, i) => <span key={i} />)}
          </div>
          <div className="ma-likes__lockbody">
            <span className="ma-wallet__icon"><Lock size={20} /></span>
            <h2 className="ma-display" style={{ margin: 0, fontSize: 24 }}>See who likes you</h2>
            <p style={{ margin: 0, color: 'var(--ma-text-2)' }}>Premium and VIP members see everyone who likes them. Or unlock this list for {WHO_LIKED_YOU_UNLOCK_CREDITS} credits.</p>
            <div className="ma-chips" style={{ justifyContent: 'center' }}>
              <button type="button" className="ma-btn ma-btn--primary ma-btn--pill" onClick={() => openPaywall('general', 'plans')}>See plans</button>
              <button type="button" className="ma-btn ma-btn--pill" onClick={unlock} disabled={unlocking}>
                {unlocking ? <Loader2 size={18} className="ma-spin" /> : null} Unlock for {WHO_LIKED_YOU_UNLOCK_CREDITS} credits
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {!locked ? (
        <ul className="ma-grid ma-likes__grid">
          {likers.map(l => {
            const photo = photoOf(l.photos)
            const first = l.full_name.split(' ')[0]
            return (
              <li key={l.id} className="ma-likecard">
                <div className="ma-gcard" style={{ aspectRatio: '4 / 5' }}>
                  {photo ? <img src={photo} alt="" /> : <span className="ma-likecard__init ma-display">{initials(l.full_name)}</span>}
                  {l.is_stitch ? <span className="ma-pcard__badges" style={{ top: 12 }}><span className="ma-pill">Stitch</span><span /></span> : null}
                  <span className="ma-gcard__info">
                    <b>{first}{l.age_range && AGE_RANGE_LABELS[l.age_range] ? `, ${AGE_RANGE_LABELS[l.age_range]}` : ''}</b>
                    {l.location ? <span><MapPin size={12} style={{ verticalAlign: '-1px' }} /> {l.location.split(',')[0]}</span> : null}
                  </span>
                </div>
                {l.stitch_note ? <p className="ma-likecard__note">&ldquo;{l.stitch_note}&rdquo;</p> : null}
                <div className="ma-likecard__actions">
                  <button type="button" className="ma-act ma-act--pass" style={{ width: 48, height: 48 }} onClick={() => pass(l)} aria-label={`Pass on ${first}`}><X size={20} /></button>
                  <button type="button" className="ma-btn ma-btn--primary ma-btn--pill" style={{ flex: 1, height: 48 }} onClick={() => likeBack(l)} disabled={busy === l.id}>
                    {busy === l.id ? <Loader2 size={18} className="ma-spin" /> : <Heart size={18} fill="currentColor" strokeWidth={0} />} Like back
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      {!fetching && count === 0 ? (
        <div className="ma-empty">
          <Heart size={40} color="var(--ma-coral)" />
          <h2>No likes yet</h2>
          <p>People who like you will show up here. A strong profile with prompts and a voice note gets more likes.</p>
          <button type="button" className="ma-btn ma-btn--primary ma-btn--pill" onClick={() => router.push('/profile?edit=1')}>Improve my profile</button>
        </div>
      ) : null}

      {toast ? <div className="ma ma-toast" role="status"><Heart size={18} color="#e8355f" fill="#e8355f" /> {toast}</div> : null}
    </div>
  )
}

export default function LikesPage() {
  return (
    <Suspense fallback={null}>
      <LikesContent />
    </Suspense>
  )
}
