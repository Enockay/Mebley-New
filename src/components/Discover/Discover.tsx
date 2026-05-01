'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getDiscoverProfiles, likeProfile, passProfile, ScoredProfile } from '@/services/matchingService'
import { Heart, X, Star, MapPin, RefreshCw, Sparkles } from 'lucide-react'
import StitchModal from './StitchModal'
import VoiceNotePlayer from '@/components/UI/VoiceNotePlayer'

function isUserOnline(lastActive?: string | null): boolean {
  if (!lastActive) return false
  const ts = new Date(lastActive).getTime()
  if (Number.isNaN(ts)) return false
  return Date.now() - ts <= 5 * 60 * 1000
}

export default function Discover() {
  const [profiles, setProfiles]           = useState<ScoredProfile[]>([])
  const [currentIndex, setCurrentIndex]   = useState(0)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [page, setPage]                   = useState(1)
  const [hasMore, setHasMore]             = useState(true)
  const [matchAlert, setMatchAlert]       = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [pendingNext, setPendingNext]     = useState(false)
  const [showDetails, setShowDetails]     = useState(false)
  const [showStitch, setShowStitch]       = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  const loadProfiles = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDiscoverProfiles(pageNum, 20)
      if (pageNum === 1) {
        setProfiles(data.profiles)
        setCurrentIndex(0)
      } else {
        setProfiles(prev => [...prev, ...data.profiles])
      }
      setHasMore(data.profiles.length >= 20)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProfiles(1) }, [loadProfiles])

  const current = profiles[currentIndex]

  useEffect(() => {
    setShowDetails(false)
  }, [currentIndex])

  useEffect(() => {
    // Keep Discover content anchored after layout/viewport changes.
    containerRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [currentIndex, showDetails])

  const handleLike = async () => {
    if (!current || actionLoading || pendingNext) return
    setActionLoading(true)
    try {
      const result = await likeProfile(current.profile.id)
      if (result.isMatch) {
        setMatchAlert(`🎉 It's a match with ${current.profile.full_name}!`)
        setTimeout(() => setMatchAlert(null), 3000)
      }
      setPendingNext(true)
    } catch (err: any) {
      console.error('Like error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePass = async () => {
    if (!current || actionLoading || pendingNext) return
    setActionLoading(true)
    try {
      await passProfile(current.profile.id)
      setPendingNext(true)
    } finally {
      setActionLoading(false)
    }
  }

  const handleStitchSend = async (note: string) => {
    if (!current) return
    const res = await fetch('/api/likes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ likeeId: current.profile.id, stitch: true, note }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error ?? 'Failed to send Stitch')
    setShowStitch(false)
    if (data?.isMatch) {
      setMatchAlert(`🎉 It's a match with ${current.profile.full_name}!`)
      setTimeout(() => setMatchAlert(null), 3000)
    } else {
      setMatchAlert(`🧵 Stitch sent to ${current.profile.full_name}!`)
      setTimeout(() => setMatchAlert(null), 2500)
    }
    setPendingNext(true)
  }

  const nextProfile = () => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= profiles.length - 3 && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadProfiles(nextPage)
    }
    setCurrentIndex(nextIndex)
  }

  const handleContainerScroll = () => {
    if (!pendingNext || !containerRef.current) return
    const el = containerRef.current
    // Move to next card only after an intentional downward scroll.
    if (el.scrollTop > 120) {
      nextProfile()
      setPendingNext(false)
      el.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (!pendingNext) return

    const triggerNext = () => {
      nextProfile()
      setPendingNext(false)
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 30) triggerNext()
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0]?.clientY ?? null
    }

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current == null) return
      const currentY = e.touches[0]?.clientY
      if (typeof currentY !== 'number') return
      // Finger moves up => user scroll intent is down.
      if (touchStartYRef.current - currentY > 24) triggerNext()
    }

    const onTouchEnd = () => {
      touchStartYRef.current = null
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [pendingNext])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && profiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-pink-500 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Finding your matches…</p>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={() => loadProfiles(1)}
            className="flex items-center gap-2 mx-auto bg-pink-500 text-white px-6 py-2 rounded-full text-sm">
            <RefreshCw size={15} /> Try Again
          </button>
        </div>
      </div>
    )
  }

  // ── Empty — API returned 0 profiles ───────────────────────────────────────
  if (!loading && profiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-[radial-gradient(44%_50%_at_8%_90%,rgba(236,72,153,0.24),transparent_72%),radial-gradient(38%_44%_at_92%_10%,rgba(139,92,246,0.22),transparent_74%),linear-gradient(140deg,#12022a_0%,#24033f_38%,#3f0752_72%,#5f0b5f_100%)]">
        <div className="text-center p-8 max-w-xs">
          <div className="text-6xl mb-4">🔍</div>
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: '#fff6fb', textShadow: '0 6px 18px rgba(255,120,196,0.25), 0 2px 10px rgba(0,0,0,0.36)' }}
          >
            No profiles yet
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,233,246,0.88)' }}>
            We're still growing — check back soon or adjust your preferences.
          </p>
          <button onClick={() => loadProfiles(1)}
            className="flex items-center gap-2 mx-auto bg-pink-500 text-white px-6 py-2 rounded-full text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>
    )
  }

  // ── All swiped through ─────────────────────────────────────────────────────
  if (!current || currentIndex >= profiles.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 max-w-xs">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">You're all caught up!</h2>
          <p className="text-gray-400 text-sm mb-6">Check back later for new people</p>
          <button onClick={() => { setPage(1); loadProfiles(1) }}
            className="flex items-center gap-2 mx-auto bg-pink-500 text-white px-6 py-2 rounded-full text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>
    )
  }

  // ── Profile card ───────────────────────────────────────────────────────────
  const { profile, score, reasons } = current

  const safeScore = Math.max(0, Math.min(100, Math.round(score)))
  const scoreRing = { background: `conic-gradient(#f357d8 ${safeScore * 3.6}deg, rgba(255,255,255,0.15) 0deg)` }
  const online = isUserOnline((profile as any).last_active)

  return (
    <div
      ref={containerRef}
      onScroll={handleContainerScroll}
      className="relative overflow-y-auto bg-[radial-gradient(44%_50%_at_8%_90%,rgba(236,72,153,0.24),transparent_72%),radial-gradient(38%_44%_at_92%_10%,rgba(139,92,246,0.22),transparent_74%),linear-gradient(140deg,#0a031a_0%,#16042b_36%,#2b0644_70%,#3f0854_100%)] px-3 sm:px-4 pt-4 pb-6"
      style={{ minHeight: 'calc(100dvh - 62px - env(safe-area-inset-bottom))' }}
    >
      {matchAlert && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-fuchsia-300/40 bg-fuchsia-500/80 px-6 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur">
          {matchAlert}
        </div>
      )}
      {pendingNext && (
        <div className="fixed top-36 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/25 bg-black/45 px-4 py-2 text-xs font-semibold text-fuchsia-100 shadow-xl backdrop-blur">
          Scroll down or swipe up to view the next profile
        </div>
      )}

      <div className="mx-auto w-full max-w-[27.5rem] sm:max-w-[31rem] px-0">
        <div
          className="overflow-hidden rounded-[1.65rem] border bg-[linear-gradient(165deg,rgba(26,10,45,0.95),rgba(14,6,30,0.95))]"
          style={{
            borderColor: (profile as any).spotlight ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.15)',
            boxShadow: (profile as any).spotlight
              ? '0 24px 68px rgba(7,2,20,0.55), 0 0 0 2px rgba(251,191,36,0.5), 0 0 32px rgba(251,191,36,0.22)'
              : '0 24px 68px rgba(7,2,20,0.55), 0 8px 26px rgba(236,72,153,0.16)',
          }}
        >
          <div className="discover-photo relative">
            {profile.photos && profile.photos.length > 0 ? (
              <img
                src={(profile.photos[0] as any).url}
                alt={profile.full_name}
                className="h-full w-full object-cover object-top brightness-[1.06] contrast-[1.05]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#271046] to-[#161332] text-8xl">
                {profile.gender === 'female' ? '👩' : profile.gender === 'male' ? '👨' : '🧑'}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080410b3] via-[#08041040] to-transparent" />

            {/* Here Tonight badge */}
            {(profile as any).here_tonight && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-2xl px-3 py-1 text-[0.82rem] font-bold text-white backdrop-blur"
                style={{
                  background: 'linear-gradient(135deg,rgba(240,56,104,0.75),rgba(184,32,60,0.75))',
                  border: '1px solid rgba(240,56,104,0.5)',
                  boxShadow: '0 2px 12px rgba(240,56,104,0.4)',
                }}>
                🔥 <span>Here Tonight</span>
              </div>
            )}

            {/* Spotlight badge */}
            {(profile as any).spotlight && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-2xl px-3 py-1 text-[0.82rem] font-bold backdrop-blur"
                style={{
                  background: 'linear-gradient(135deg,rgba(251,191,36,0.22),rgba(245,158,11,0.22))',
                  border: '1px solid rgba(251,191,36,0.5)',
                  color: '#fde68a',
                  boxShadow: '0 2px 12px rgba(251,191,36,0.3)',
                  marginTop: (profile as any).here_tonight ? 34 : 0,
                }}>
                ✦ <span>Spotlight</span>
              </div>
            )}

            {/* Card index — only when no here_tonight badge */}
            {!(profile as any).here_tonight && !(profile as any).spotlight && (
              <div className="absolute left-3 top-3 rounded-2xl border border-white/20 bg-black/35 px-3 py-1 text-[0.95rem] font-semibold text-fuchsia-50 backdrop-blur">
                {currentIndex + 1}/{profiles.length}
              </div>
            )}

            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-2xl border border-yellow-300/55 bg-[#080410aa] px-3 py-1 text-[0.95rem] font-bold text-yellow-300 backdrop-blur">
              <Star size={13} className="fill-yellow-300 text-yellow-300" />
              {safeScore}% match
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="rounded-2xl border border-white/20 bg-black/40 px-4 py-3 backdrop-blur-sm">
                <div className="mb-1 flex items-end justify-between gap-3">
                  <h2
                    className="truncate font-serif text-[2rem] font-bold leading-[1.05] text-white sm:text-[2.2rem]"
                    style={{
                      color: '#ffffff',
                      WebkitTextFillColor: '#ffffff',
                      textShadow: '0 3px 14px rgba(0,0,0,0.62)',
                    }}
                  >
                    {profile.full_name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em]"
                      style={{
                        color: online ? '#a7f3d0' : 'rgba(246,223,252,0.72)',
                        borderColor: online ? 'rgba(52,211,153,0.45)' : 'rgba(255,255,255,0.22)',
                        background: online ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: online ? '#34d399' : 'rgba(246,223,252,0.5)',
                          boxShadow: online ? '0 0 0 2px rgba(52,211,153,0.16)' : 'none',
                        }}
                      />
                      {online ? 'Online' : 'Offline'}
                    </span>
                    {(profile as any).age && <span className="font-serif text-[1.35rem] leading-none text-fuchsia-100/85 sm:text-[1.5rem]">{(profile as any).age}</span>}
                  </div>
                </div>
                {profile.location && (
                  <div className="flex items-center gap-1.5 text-[0.92rem] text-fuchsia-100/88 sm:text-[0.98rem]">
                    <MapPin size={13} className="text-rose-300/90" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 pt-3 sm:px-5">
            <button
              onClick={() => setShowDetails(v => !v)}
              className="mb-3 w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-fuchsia-50 transition hover:bg-white/15"
            >
              View profile
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2.5 sm:gap-3">
          {/* Pass */}
          <button
            onClick={handlePass}
            disabled={actionLoading || pendingNext}
            className="grid h-[3.5rem] w-[3.5rem] place-items-center rounded-xl border-2 border-white/30 bg-black/35 text-fuchsia-50 shadow-xl transition hover:bg-red-500/15 disabled:opacity-50 sm:h-[4rem] sm:w-[4rem]"
            title="Pass"
          >
            <X size={18} />
          </button>

          {/* Like (main) */}
          <button
            onClick={handleLike}
            disabled={actionLoading || pendingNext}
            className="grid h-[4.6rem] w-[4.6rem] place-items-center rounded-xl border-2 border-white/20 bg-[linear-gradient(145deg,rgba(12,5,24,0.95),rgba(26,8,42,0.95))] text-fuchsia-50 shadow-[0_0_0_6px_rgba(243,87,216,0.16),0_16px_34px_rgba(7,2,20,0.45)] transition hover:scale-[1.03] disabled:opacity-50 sm:h-[5.2rem] sm:w-[5.2rem]"
            title="Like"
          >
            <Heart size={23} className="fill-current sm:h-7 sm:w-7" />
          </button>

          {/* Stitch — super-like with note */}
          <button
            onClick={() => !actionLoading && !pendingNext && setShowStitch(true)}
            disabled={actionLoading || pendingNext}
            className="grid h-[3.5rem] w-[3.5rem] place-items-center rounded-xl border-2 border-violet-400/40 bg-black/35 text-violet-200 shadow-xl transition hover:bg-violet-500/15 disabled:opacity-50 sm:h-[4rem] sm:w-[4rem]"
            title="Send a Stitch"
            style={{ boxShadow: '0 0 0 3px rgba(167,139,250,0.12), 0 8px 24px rgba(0,0,0,0.35)' }}
          >
            <Sparkles size={17} />
          </button>

          {/* Refresh */}
          <button
            onClick={() => { setPage(1); loadProfiles(1) }}
            disabled={actionLoading}
            className="grid h-[3.5rem] w-[3.5rem] place-items-center rounded-xl border-2 border-white/30 bg-black/35 text-fuchsia-50 shadow-xl transition hover:bg-fuchsia-500/15 disabled:opacity-50 sm:h-[4rem] sm:w-[4rem]"
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {showStitch && current && (
        <StitchModal
          targetName={current.profile.full_name}
          onSend={handleStitchSend}
          onClose={() => setShowStitch(false)}
        />
      )}

      {showDetails && (
        <div className="fixed left-0 top-16 bottom-20 z-[70] w-full pointer-events-none">
          <aside className="pointer-events-auto absolute left-0 top-0 h-full w-full max-w-[28rem] overflow-y-auto border-r border-white/15 bg-[linear-gradient(165deg,rgba(26,10,45,0.98),rgba(14,6,30,0.98))] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-2xl font-bold text-white">Profile</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 text-fuchsia-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4 overflow-hidden rounded-2xl border border-white/15 bg-black/25">
              <img
                src={(profile.photos?.[0] as any)?.url ?? ''}
                alt={profile.full_name}
                className="h-64 w-full object-cover object-top"
              />
            </div>

            {Array.isArray(profile.photos) && profile.photos.length > 1 && (
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {profile.photos.slice(0, 6).map((photo: any, i: number) => (
                  <img
                    key={`${photo?.url ?? 'photo'}-${i}`}
                    src={photo?.url}
                    alt=""
                    className="h-16 w-16 flex-shrink-0 rounded-lg border border-white/20 object-cover"
                  />
                ))}
              </div>
            )}

            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-serif text-[2rem] font-bold leading-none text-white">{profile.full_name}</p>
                {profile.location && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-fuchsia-100/90">
                    <MapPin size={13} className="text-rose-300/90" />
                    {profile.location}
                  </p>
                )}
              </div>
              <div className="grid h-[4.6rem] w-[4.6rem] place-items-center rounded-full p-[5px]" style={scoreRing}>
                <div className="grid h-full w-full place-items-center rounded-full bg-[#12071f]/95 text-[1.35rem] font-extrabold text-fuchsia-50">
                  {safeScore}%
                </div>
              </div>
            </div>

            {(profile as any).voice_note_url && (
              <div className="mb-4">
                <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-fuchsia-200/60">Voice Note</p>
                <VoiceNotePlayer url={(profile as any).voice_note_url} accent="#f43f5e" />
              </div>
            )}

            {profile.bio && (
              <div className="mb-4 rounded-xl border border-white/15 bg-white/5 p-3">
                <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-fuchsia-200/60">About</p>
                <p className="text-[0.92rem] leading-relaxed text-fuchsia-50">{profile.bio}</p>
              </div>
            )}

            <div className="mb-4 rounded-xl border border-white/15 bg-white/5 p-3">
              <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-fuchsia-200/60">Activities & Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.looking_for?.slice(0, 1).map((intent, i) => (
                  <span key={`${intent}-${i}`} className="rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 px-3 py-1 text-[0.8rem] font-semibold text-fuchsia-50">
                    {intent}
                  </span>
                ))}
                {profile.interests?.slice(0, 8).map((interest, i) => (
                  <span key={`${interest}-${i}`} className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[0.8rem] text-fuchsia-100/95">
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {reasons.length > 0 && (
              <div className="rounded-xl border border-white/20 bg-white/5 p-3">
                <p className="mb-2 text-xs font-bold tracking-[0.16em] text-fuchsia-200/60">WHY YOU MATCH</p>
                {reasons.slice(0, 5).map((reason, i) => (
                  <p key={i} className="mb-1 flex items-center gap-2 text-[0.9rem] text-fuchsia-50 last:mb-0">
                    <span className="h-2 w-2 rounded-full bg-fuchsia-500" />
                    {reason}
                  </p>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}