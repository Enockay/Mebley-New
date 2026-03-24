'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDiscoverProfiles, likeProfile, passProfile, ScoredProfile } from '@/services/matchingService'
import { Heart, X, Star, MapPin, Briefcase, RefreshCw } from 'lucide-react'

export default function Discover() {
  const [profiles, setProfiles]           = useState<ScoredProfile[]>([])
  const [currentIndex, setCurrentIndex]   = useState(0)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [page, setPage]                   = useState(1)
  const [hasMore, setHasMore]             = useState(true)
  const [matchAlert, setMatchAlert]       = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

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

  const handleLike = async () => {
    if (!current || actionLoading) return
    setActionLoading(true)
    try {
      const result = await likeProfile(current.profile.id)
      if (result.isMatch) {
        setMatchAlert(`🎉 It's a match with ${current.profile.full_name}!`)
        setTimeout(() => setMatchAlert(null), 3000)
      }
      nextProfile()
    } catch (err: any) {
      console.error('Like error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePass = async () => {
    if (!current || actionLoading) return
    setActionLoading(true)
    try {
      await passProfile(current.profile.id)
      nextProfile()
    } finally {
      setActionLoading(false)
    }
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

  return (
    <div className="relative min-h-screen overflow-y-auto bg-[radial-gradient(44%_50%_at_8%_90%,rgba(236,72,153,0.24),transparent_72%),radial-gradient(38%_44%_at_92%_10%,rgba(139,92,246,0.22),transparent_74%),linear-gradient(140deg,#0a031a_0%,#16042b_36%,#2b0644_70%,#3f0854_100%)] px-4 pt-5 pb-10 sm:pt-8">
      {matchAlert && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-fuchsia-300/40 bg-fuchsia-500/80 px-6 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur">
          {matchAlert}
        </div>
      )}

      <div className="mx-auto w-full max-w-[31rem] sm:max-w-[33rem]">
        <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(165deg,rgba(26,10,45,0.95),rgba(14,6,30,0.95))] shadow-[0_24px_68px_rgba(7,2,20,0.55),0_8px_26px_rgba(236,72,153,0.16)]">
          <div className="relative h-64 sm:h-[22rem]">
            {profile.photos && profile.photos.length > 0 ? (
              <img
                src={(profile.photos[0] as any).url}
                alt={profile.full_name}
                className="h-full w-full object-cover brightness-[1.06] contrast-[1.05]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#271046] to-[#161332] text-8xl">
                {profile.gender === 'female' ? '👩' : profile.gender === 'male' ? '👨' : '🧑'}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080410b3] via-[#08041040] to-transparent" />
            <div className="absolute left-3 top-3 rounded-2xl border border-white/20 bg-black/35 px-3 py-1 text-[0.95rem] font-semibold text-fuchsia-50 backdrop-blur">
              {currentIndex + 1}/{profiles.length}
            </div>
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-2xl border border-yellow-300/55 bg-[#080410aa] px-3 py-1 text-[0.95rem] font-bold text-yellow-300 backdrop-blur">
              <Star size={13} className="fill-yellow-300 text-yellow-300" />
              {safeScore}% match
            </div>
          </div>

          <div className="px-5 pb-5 pt-4 sm:px-6">
            <div className="mb-3 flex justify-center">
              <div className="grid h-[5.2rem] w-[5.2rem] place-items-center rounded-full p-[6px] sm:h-[5.6rem] sm:w-[5.6rem]" style={scoreRing}>
                <div className="grid h-full w-full place-items-center rounded-full bg-[#12071f]/95 text-[1.65rem] font-extrabold text-fuchsia-50 sm:text-[1.75rem]">
                  {safeScore}%
                </div>
              </div>
            </div>

            <div className="mb-1 flex items-end justify-between gap-3">
              <h2 className="truncate bg-gradient-to-r from-[#fff6b0] via-[#ffd94d] to-[#f7b500] bg-clip-text font-serif text-[2.15rem] font-bold leading-[1.05] text-transparent sm:text-[2.45rem]">
                {profile.full_name}
              </h2>
              {(profile as any).age && <span className="font-serif text-[2.05rem] leading-none text-fuchsia-100/80 sm:text-[2.3rem]">{(profile as any).age}</span>}
            </div>

            {profile.location && (
              <div className="mb-3 flex items-center gap-1.5 text-[1.05rem] text-fuchsia-100/85 sm:text-[1.08rem]">
                <MapPin size={13} className="text-rose-300/90" />
                <span>{profile.location}</span>
                {reasons[0] && <span className="text-fuchsia-200/70">• {reasons[0]}</span>}
              </div>
            )}

            {profile.bio && (
              <p className="mb-3 text-[0.95rem] leading-relaxed text-fuchsia-100/90 sm:text-[1rem]">{profile.bio}</p>
            )}

            <div className="mb-4 flex flex-wrap gap-2">
              {profile.looking_for?.slice(0, 1).map((intent, i) => (
                <span key={`${intent}-${i}`} className="rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 px-3.5 py-1.5 text-[0.86rem] font-semibold text-fuchsia-50 sm:text-[0.9rem]">
                  {intent}
                </span>
              ))}
              {profile.interests?.slice(0, 4).map((interest, i) => (
                <span key={`${interest}-${i}`} className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[0.86rem] text-fuchsia-100/95 sm:text-[0.9rem]">
                  {interest}
                </span>
              ))}
            </div>

            {reasons.length > 0 && (
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
                <p className="mb-2 text-xs font-bold tracking-[0.16em] text-fuchsia-200/60">WHY YOU MATCH</p>
                {reasons.slice(0, 3).map((reason, i) => (
                  <p key={i} className="mb-1 flex items-center gap-2 text-[0.95rem] text-fuchsia-50 sm:text-[1.02rem] last:mb-0">
                    <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500" />
                    {reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={handlePass}
            disabled={actionLoading}
            className="grid h-[4rem] w-[4rem] place-items-center rounded-2xl border-2 border-white/30 bg-black/35 text-fuchsia-50 shadow-xl transition hover:bg-red-500/15 disabled:opacity-50 sm:h-[4.5rem] sm:w-[4.5rem]"
          >
            <X size={20} />
          </button>
          <button
            onClick={handleLike}
            disabled={actionLoading}
            className="grid h-[5.2rem] w-[5.2rem] place-items-center rounded-2xl border-2 border-white/20 bg-[linear-gradient(145deg,rgba(12,5,24,0.95),rgba(26,8,42,0.95))] text-fuchsia-50 shadow-[0_0_0_6px_rgba(243,87,216,0.16),0_16px_34px_rgba(7,2,20,0.45)] transition hover:scale-[1.03] disabled:opacity-50 sm:h-[5.8rem] sm:w-[5.8rem]"
          >
            <Heart size={26} className="fill-current sm:h-8 sm:w-8" />
          </button>
          <button
            onClick={() => { setPage(1); loadProfiles(1) }}
            disabled={actionLoading}
            className="grid h-[4rem] w-[4rem] place-items-center rounded-2xl border-2 border-white/30 bg-black/35 text-fuchsia-50 shadow-xl transition hover:bg-fuchsia-500/15 disabled:opacity-50 sm:h-[4.5rem] sm:w-[4.5rem]"
          >
            <RefreshCw size={19} />
          </button>
        </div>
      </div>
    </div>
  )
}