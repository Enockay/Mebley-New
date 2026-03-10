'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import {
  Heart, X, Search, SlidersHorizontal, MapPin,
  RefreshCw, ChevronDown, Sparkles, MessageCircle,
  MoreVertical, LayoutGrid, Layers,
} from 'lucide-react'
import { RELATIONSHIP_INTENTS, INTERESTS_BY_CATEGORY } from '@/types/app-constants'
import BlockReport from '@/components/Moderation/BlockReport'

// ── Types ────────────────────────────────────────────────────────────────────

interface PromptAnswer {
  id:       string
  question: string
  answer:   string
}

interface BrowseProfile {
  id:                   string
  full_name:            string
  age_range:            string
  gender:               string
  bio:                  string | null
  location:             string | null
  nationality:          string | null
  interests:            string[]
  looking_for:          string[]
  photos:               { url: string; slot: number }[]
  prompts:              PromptAnswer[]
  last_active:          string | null
  profile_completeness: number | null
}

interface ScoredProfile {
  score:   number
  reasons: string[]
  profile: BrowseProfile
}

interface Filters {
  location:  string
  intents:   string[]
  interests: string[]
  ageRanges: string[]
}

type ViewMode = 'stack' | 'grid'

// ── Constants ─────────────────────────────────────────────────────────────────

const AGE_RANGE_LABELS: Record<string, string> = {
  '18_24':   '18–24',
  '25_34':   '25–34',
  '35_40':   '35–40',
  '40_50':   '40–50',
  '50_65':   '50–65',
  '65_plus': '65+',
}
const AGE_RANGE_OPTIONS = Object.entries(AGE_RANGE_LABELS).map(([value, label]) => ({ value, label }))
const PAGE_SIZE         = 20
const SWIPE_THRESHOLD   = 0.38

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPhotoUrl(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null
  const first = photos[0]
  if (!first) return null
  if (typeof first === 'string') return first
  if (typeof first === 'object' && 'url' in first && typeof (first as any).url === 'string')
    return (first as any).url
  return null
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

async function captureAndSaveCoordinates(userId: string) {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      await (supabase as any)
        .from('profiles')
        .update({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, updated_at: new Date().toISOString() })
        .eq('id', userId)
    },
    () => {},
    { timeout: 8000, maximumAge: 300_000 }
  )
}

function buildDiscoverUrl(page: number, filters: Filters): string {
  const params = new URLSearchParams()
  params.set('page',  String(page))
  params.set('limit', String(PAGE_SIZE))
  if (filters.location.trim())      params.set('location',  filters.location.trim())
  if (filters.intents.length > 0)   params.set('intents',   filters.intents.join(','))
  if (filters.interests.length > 0) params.set('interests', filters.interests.join(','))
  if (filters.ageRanges.length > 0) params.set('ageRanges', filters.ageRanges.join(','))
  return `/api/discover?${params.toString()}`
}

// ── SwipeCard ─────────────────────────────────────────────────────────────────

interface SwipeCardProps {
  sp:          ScoredProfile
  onLike:      (sp: ScoredProfile) => void
  onPass:      (id: string) => void
  onReport:    (id: string, name: string) => void
  isTop:       boolean
  stackOffset: number
}

function SwipeCard({ sp, onLike, onPass, onReport, isTop, stackOffset }: SwipeCardProps) {
  const p           = sp.profile
  const ageLabel    = AGE_RANGE_LABELS[p.age_range] ?? ''
  const initials    = getInitials(p.full_name)
  const firstPrompt = p.prompts?.[0] ?? null
  const isActive    = p.last_active
    ? Date.now() - new Date(p.last_active).getTime() < 86_400_000
    : false

  const cardRef    = useRef<HTMLDivElement>(null)
  const startX     = useRef(0)
  const currentX   = useRef(0)
  const isDragging = useRef(false)

  const [dragDelta, setDragDelta]     = useState(0)
  const [isFlying, setIsFlying]       = useState(false)
  const [flyDir, setFlyDir]           = useState<'left' | 'right' | null>(null)
  const [showPrompts, setShowPrompts] = useState(false)
  const [photoIdx, setPhotoIdx]       = useState(0)

  const sortedPhotos = [...(p.photos ?? [])].sort((a, b) => a.slot - b.slot)

  const triggerFly = useCallback((dir: 'left' | 'right') => {
    setFlyDir(dir)
    setIsFlying(true)
    setTimeout(() => {
      if (dir === 'right') onLike(sp)
      else                 onPass(p.id)
    }, 300)
  }, [sp, p.id, onLike, onPass])

  const onPointerDown = (e: React.PointerEvent) => {
    if (!isTop || isFlying) return
    if ((e.target as HTMLElement).closest('button')) return
    isDragging.current = true
    startX.current     = e.clientX
    currentX.current   = e.clientX
    cardRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    currentX.current = e.clientX
    setDragDelta(e.clientX - startX.current)
  }

  const onPointerUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    const delta    = currentX.current - startX.current
    const cardW    = cardRef.current?.offsetWidth ?? 360
    const fraction = Math.abs(delta) / cardW
    if (fraction >= SWIPE_THRESHOLD) {
      triggerFly(delta > 0 ? 'right' : 'left')
    } else {
      setDragDelta(0)
    }
  }

  useEffect(() => {
    if (!isTop) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') triggerFly('right')
      if (e.key === 'ArrowLeft')  triggerFly('left')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isTop, triggerFly])

  const rotation        = dragDelta * 0.06
  const likeOpacity     = Math.max(0, Math.min(1, dragDelta / 80))
  const passOpacity     = Math.max(0, Math.min(1, -dragDelta / 80))
  const stackScale      = 1 - stackOffset * 0.04
  const stackTranslateY = stackOffset * 10

  const cardTransform = isFlying
    ? flyDir === 'right'
      ? 'translateX(120%) rotate(20deg)'
      : 'translateX(-120%) rotate(-20deg)'
    : isTop
      ? `translateX(${dragDelta}px) rotate(${rotation}deg)`
      : `translateY(${stackTranslateY}px) scale(${stackScale})`

  const displayPhoto = sortedPhotos[photoIdx] ?? null

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 bg-white rounded-3xl shadow-xl overflow-hidden select-none"
      style={{
        transform:     cardTransform,
        transition:    isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor:        isTop ? (isDragging.current ? 'grabbing' : 'grab') : 'default',
        zIndex:        10 - stackOffset,
        pointerEvents: isTop ? 'auto' : 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Photo area */}
      <div className="relative bg-black" style={{ height: '62%' }}>
        {displayPhoto ? (
          <img src={displayPhoto.url} alt={p.full_name} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {sortedPhotos.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {sortedPhotos.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === photoIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        )}

        {sortedPhotos.length > 1 && (
          <>
            <button className="absolute left-0 top-0 w-1/3 h-full z-10"
              onClick={e => { e.stopPropagation(); setPhotoIdx(i => Math.max(0, i - 1)) }} />
            <button className="absolute right-0 top-0 w-1/3 h-full z-10"
              onClick={e => { e.stopPropagation(); setPhotoIdx(i => Math.min(sortedPhotos.length - 1, i + 1)) }} />
          </>
        )}

        {isActive && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full z-20">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-600">Active</span>
          </div>
        )}

        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={e => { e.stopPropagation(); onReport(p.id, p.full_name) }}
            className="w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-all">
            <MoreVertical size={14} className="text-white" />
          </button>
        </div>

        {/* Stamps */}
        <div className="absolute top-6 left-6 border-4 border-green-400 rounded-2xl px-4 py-1.5 rotate-[-20deg] pointer-events-none"
          style={{ opacity: likeOpacity }}>
          <span className="text-green-400 font-black text-2xl tracking-widest">LIKE</span>
        </div>
        <div className="absolute top-6 right-6 border-4 border-red-400 rounded-2xl px-4 py-1.5 rotate-[20deg] pointer-events-none"
          style={{ opacity: passOpacity }}>
          <span className="text-red-400 font-black text-2xl tracking-widest">PASS</span>
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-3 left-4 right-4 pointer-events-none">
          <h3 className="text-xl font-bold text-white">
            {p.full_name}{ageLabel ? `, ${ageLabel}` : ''}
          </h3>
          {p.location && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-white/70" />
              <span className="text-xs text-white/80">{p.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col" style={{ height: '38%' }}>
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-1 space-y-3">
          {firstPrompt ? (
            <div>
              <button onClick={e => { e.stopPropagation(); setShowPrompts(v => !v) }} className="w-full text-left">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageCircle size={11} className="text-pink-400" />
                  <span className="text-xs text-pink-500 font-semibold">{firstPrompt.question}</span>
                </div>
                <p className="text-sm text-gray-800 font-medium leading-snug line-clamp-2">{firstPrompt.answer}</p>
              </button>
              {showPrompts && p.prompts.slice(1).map(prompt => (
                <div key={prompt.id} className="mt-2 pl-3 border-l-2 border-rose-200">
                  <p className="text-xs text-pink-500 font-semibold mb-0.5">{prompt.question}</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{prompt.answer}</p>
                </div>
              ))}
            </div>
          ) : sp.reasons.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {sp.reasons.slice(0, 3).map((r, i) => (
                <span key={i} className="flex items-center gap-1 text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-100">
                  <Sparkles size={9} /> {r}
                </span>
              ))}
            </div>
          ) : null}

          {p.interests.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {p.interests.slice(0, 4).map(interest => (
                <span key={interest} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{interest}</span>
              ))}
              {p.interests.length > 4 && <span className="text-xs text-gray-400">+{p.interests.length - 4}</span>}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 flex items-center justify-center gap-5 px-4 py-3 border-t border-gray-50">
          <button
            onClick={e => { e.stopPropagation(); triggerFly('left') }}
            className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-all shadow-sm active:scale-95">
            <X size={22} className="text-gray-400" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); triggerFly('right') }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30 hover:from-rose-600 hover:to-pink-600 transition-all active:scale-95">
            <Heart size={26} className="text-white fill-white" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); triggerFly('right') }}
            className="w-14 h-14 rounded-full border-2 border-rose-200 bg-rose-50 flex items-center justify-center hover:border-rose-400 hover:bg-rose-100 transition-all shadow-sm active:scale-95">
            <Sparkles size={18} className="text-rose-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Browse Page ───────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  const [scored, setScored]               = useState<ScoredProfile[]>([])
  const [fetching, setFetching]           = useState(true)
  const [loadingMore, setLoadingMore]     = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [hasMore, setHasMore]             = useState(true)
  const [page, setPage]                   = useState(1)
  const [likedIds, setLikedIds]           = useState<Set<string>>(new Set())
  const [passedIds, setPassedIds]         = useState<Set<string>>(new Set())
  const [blockedIds, setBlockedIds]       = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters]     = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [matchAlert, setMatchAlert]       = useState<{ name: string; photo: string | null } | null>(null)
  const [expandedCard, setExpandedCard]   = useState<string | null>(null)
  const [openMenu, setOpenMenu]           = useState<string | null>(null)
  const [moderationTarget, setModerationTarget] = useState<{ id: string; name: string } | null>(null)
  const [viewMode, setViewMode]           = useState<ViewMode>('stack')

  const [filters, setFilters] = useState<Filters>({
    location: '', intents: [], interests: [], ageRanges: [],
  })
  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (user) captureAndSaveCoordinates(user.id)
  }, [user])

  // Load liked IDs
  useEffect(() => {
    if (!user) return
    supabase.from('likes').select('likee_id').eq('liker_id', user.id)
      .then(({ data }) => { if (data) setLikedIds(new Set(data.map(r => r.likee_id))) })
  }, [user])

  // Load passed IDs
  useEffect(() => {
    if (!user) return
    fetch('/api/passes').then(r => r.json())
      .then(json => { if (json.passedIds) setPassedIds(new Set(json.passedIds)) })
      .catch(() => {})
  }, [user])

  // Load blocked IDs
  useEffect(() => {
    if (!user) return
    fetch('/api/moderation').then(r => r.json())
      .then(json => { if (json.blockedIds) setBlockedIds(new Set(json.blockedIds)) })
      .catch(() => {})
  }, [user])

  const fetchProfiles = useCallback(async (
    pageNum: number,
    currentFilters: Filters,
    append: boolean
  ) => {
    if (!user || !profile) return
    append ? setLoadingMore(true) : setFetching(true)
    setError(null)

    try {
      const res  = await fetch(buildDiscoverUrl(pageNum, currentFilters))
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load profiles')

      const incoming: ScoredProfile[] = json.profiles ?? []
      const filtered = incoming.filter(sp =>
        !likedIds.has(sp.profile.id) &&
        !passedIds.has(sp.profile.id) &&
        !blockedIds.has(sp.profile.id)
      )
      setScored(prev => append ? [...prev, ...filtered] : filtered)
      setHasMore((json.profiles ?? []).length === PAGE_SIZE)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles')
    } finally {
      setFetching(false)
      setLoadingMore(false)
    }
  }, [user, profile, likedIds, passedIds, blockedIds])

  useEffect(() => {
    if (!user || !profile) return
    setPage(1)
    fetchProfiles(1, appliedFilters, false)
  }, [user, profile, appliedFilters]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!openMenu) return
    const handler = () => setOpenMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openMenu])

  // ── handleLike — now calls /api/likes server-side ─────────────────────────
  const handleLike = useCallback(async (sp: ScoredProfile) => {
    if (!user || actionLoading) return
    const targetProfile = sp.profile

    // Optimistic UI update
    setActionLoading(targetProfile.id)
    setScored(prev => prev.filter(s => s.profile.id !== targetProfile.id))
    setLikedIds(prev => new Set([...prev, targetProfile.id]))

    try {
      const res  = await fetch('/api/likes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ likeeId: targetProfile.id }),
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Like failed')

      if (json.isMatch) {
        // Show rich match alert with photo
        const photoUrl = getPhotoUrl(targetProfile.photos)
        setMatchAlert({ name: targetProfile.full_name, photo: photoUrl })
        setTimeout(() => setMatchAlert(null), 4000)
      }
    } catch (err) {
      console.error('Like error:', err)
      // Roll back optimistic update
      setScored(prev => [sp, ...prev])
      setLikedIds(prev => { const s = new Set(prev); s.delete(targetProfile.id); return s })
    } finally {
      setActionLoading(null)
    }
  }, [user, actionLoading])

  // ── handlePass ────────────────────────────────────────────────────────────
  const handlePass = useCallback((profileId: string) => {
    setPassedIds(prev => new Set([...prev, profileId]))
    setScored(prev => prev.filter(s => s.profile.id !== profileId))

    fetch('/api/passes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ passedId: profileId }),
    }).catch(err => console.error('[Pass] failed to persist:', err))
  }, [])

  const handleBlocked = (targetId: string) => {
    setBlockedIds(prev => new Set([...prev, targetId]))
    setScored(prev => prev.filter(s => s.profile.id !== targetId))
    setModerationTarget(null)
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchProfiles(nextPage, appliedFilters, true)
  }

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters })
    setShowFilters(false)
  }

  const handleResetFilters = () => {
    const reset: Filters = { location: '', intents: [], interests: [], ageRanges: [] }
    setFilters(reset)
    setAppliedFilters(reset)
    setShowFilters(false)
  }

  const activeFilterCount = [
    appliedFilters.location.trim() !== '',
    appliedFilters.intents.length > 0,
    appliedFilters.interests.length > 0,
    appliedFilters.ageRanges.length > 0,
  ].filter(Boolean).length

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-4">

        {/* Match alert — richer than before, shows photo */}
        {matchAlert && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border-2 border-pink-200 px-5 py-3 rounded-2xl shadow-xl animate-bounce whitespace-nowrap">
            {matchAlert.photo && (
              <img src={matchAlert.photo} alt={matchAlert.name} className="w-10 h-10 rounded-full object-cover border-2 border-pink-300" />
            )}
            <div>
              <p className="text-sm font-bold text-gray-900">🎉 It's a match!</p>
              <p className="text-xs text-pink-500">You and {matchAlert.name} liked each other</p>
            </div>
          </div>
        )}

        {moderationTarget && (
          <BlockReport
            targetId={moderationTarget.id}
            targetName={moderationTarget.name}
            onClose={() => setModerationTarget(null)}
            onBlocked={handleBlocked}
          />
        )}

        {/* Filter bar + view toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-pink-500 bg-pink-50 text-pink-600'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            <SlidersHorizontal size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by location..."
              value={filters.location}
              onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
              className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 rounded-full text-sm focus:border-pink-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center bg-gray-100 rounded-full p-1 gap-0.5 flex-shrink-0">
            <button
              onClick={() => setViewMode('stack')}
              title="Stack view"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                viewMode === 'stack' ? 'bg-white shadow-sm text-pink-500' : 'text-gray-400 hover:text-gray-600'
              }`}>
              <Layers size={15} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-pink-500' : 'text-gray-400 hover:text-gray-600'
              }`}>
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Age range</label>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGE_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => setFilters(f => ({
                      ...f,
                      ageRanges: f.ageRanges.includes(opt.value)
                        ? f.ageRanges.filter(r => r !== opt.value)
                        : [...f.ageRanges, opt.value],
                    }))}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                      filters.ageRanges.includes(opt.value)
                        ? 'border-pink-500 bg-pink-500 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-pink-300'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Looking for</label>
              <div className="flex flex-wrap gap-2">
                {RELATIONSHIP_INTENTS.map(intent => (
                  <button key={intent.value}
                    onClick={() => setFilters(f => ({
                      ...f,
                      intents: f.intents.includes(intent.value)
                        ? f.intents.filter(i => i !== intent.value)
                        : [...f.intents, intent.value],
                    }))}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                      filters.intents.includes(intent.value)
                        ? 'border-pink-500 bg-pink-500 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-pink-300'
                    }`}>
                    {intent.emoji} {intent.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Interests</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {INTERESTS_BY_CATEGORY.flatMap(cat =>
                  cat.tags.map(tag => (
                    <button key={tag}
                      onClick={() => setFilters(f => ({
                        ...f,
                        interests: f.interests.includes(tag)
                          ? f.interests.filter(i => i !== tag)
                          : [...f.interests, tag],
                      }))}
                      className={`px-3 py-1 rounded-full text-sm border-2 transition-all ${
                        filters.interests.includes(tag)
                          ? 'border-pink-500 bg-pink-500 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-pink-300'
                      }`}>
                      {tag}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={handleResetFilters}
                className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
                Reset
              </button>
              <button onClick={handleApplyFilters}
                className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all">
                Apply filters
              </button>
            </div>
          </div>
        )}

        {/* States */}
        {fetching ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
            <p className="text-gray-500 text-sm">Finding your best matches…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={() => fetchProfiles(1, appliedFilters, false)}
              className="flex items-center gap-2 bg-pink-500 text-white px-5 py-2 rounded-full text-sm">
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        ) : scored.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="text-5xl">🎯</div>
            <h3 className="text-lg font-semibold text-gray-800">No profiles found</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              {activeFilterCount > 0
                ? 'Try adjusting your filters to see more people.'
                : 'Check back later — new people join every day.'}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={handleResetFilters}
                className="mt-2 px-5 py-2 bg-pink-500 text-white rounded-full text-sm font-medium">
                Clear filters
              </button>
            )}
          </div>

        ) : viewMode === 'stack' ? (

          // STACK MODE
          <div className="flex flex-col items-center">
            <p className="text-xs text-gray-400 mb-3 self-start">
              {scored.length} match{scored.length !== 1 ? 'es' : ''} · swipe or use ← → keys
              {activeFilterCount > 0 ? ' · filtered' : ''}
            </p>
            <div className="relative w-full" style={{ height: '560px' }}>
              {scored.slice(0, 3).map((sp, idx) => (
                <SwipeCard
                  key={sp.profile.id}
                  sp={sp}
                  onLike={handleLike}
                  onPass={handlePass}
                  onReport={(id, name) => setModerationTarget({ id, name })}
                  isTop={idx === 0}
                  stackOffset={idx}
                />
              )).reverse()}
            </div>
            {scored.length <= 5 && hasMore && (
              <button onClick={handleLoadMore} disabled={loadingMore}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-gray-600 rounded-full text-sm font-medium hover:border-pink-300 hover:text-pink-500 transition-all disabled:opacity-40">
                {loadingMore
                  ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin" /> Loading more…</>
                  : 'Load more matches'
                }
              </button>
            )}
          </div>

        ) : (

          // GRID MODE
          <>
            <p className="text-xs text-gray-400 mb-3">
              {scored.length} profile{scored.length !== 1 ? 's' : ''} · sorted by compatibility
              {activeFilterCount > 0 ? ' · filtered' : ''}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {scored.map(sp => {
                const p         = sp.profile
                const photoUrl  = getPhotoUrl(p.photos)
                const ageLabel  = AGE_RANGE_LABELS[p.age_range] ?? ''
                const initials  = getInitials(p.full_name)
                const isActing  = actionLoading === p.id
                const isActive  = p.last_active
                  ? Date.now() - new Date(p.last_active).getTime() < 86_400_000
                  : false
                const isExpanded  = expandedCard === p.id
                const isMenuOpen  = openMenu === p.id
                const firstPrompt = p.prompts?.[0] ?? null

                return (
                  <div key={p.id}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-pink-100 to-purple-100">
                      {photoUrl ? (
                        <img src={photoUrl} alt={p.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">{initials}</span>
                          </div>
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          <span className="text-xs text-gray-600">Active</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={e => { e.stopPropagation(); setOpenMenu(prev => prev === p.id ? null : p.id) }}
                          className="w-7 h-7 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-all">
                          <MoreVertical size={13} className="text-white" />
                        </button>
                        {isMenuOpen && (
                          <div className="absolute top-9 right-0 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10 min-w-36"
                            onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => { setOpenMenu(null); setModerationTarget({ id: p.id, name: p.full_name }) }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                              <span>🚩</span> Report
                            </button>
                            <button
                              onClick={() => { setOpenMenu(null); setModerationTarget({ id: p.id, name: p.full_name }) }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-100">
                              <span>🚫</span> Block
                            </button>
                          </div>
                        )}
                      </div>
                      {firstPrompt && !isExpanded && (
                        <button
                          onClick={() => setExpandedCard(p.id)}
                          className="absolute bottom-2 left-2 right-2 bg-black/65 backdrop-blur-sm px-2.5 py-1.5 rounded-xl text-left hover:bg-black/75 transition-all">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <MessageCircle size={9} className="text-pink-300 flex-shrink-0" />
                            <span className="text-pink-200 text-xs truncate">{firstPrompt.question}</span>
                          </div>
                          <p className="text-white text-xs leading-snug line-clamp-2 font-medium">{firstPrompt.answer}</p>
                        </button>
                      )}
                      {(!firstPrompt || isExpanded) && sp.reasons.length > 0 && (
                        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                          <Sparkles size={10} className="text-pink-300 flex-shrink-0" />
                          <span className="text-white text-xs truncate">{sp.reasons[0]}</span>
                        </div>
                      )}
                    </div>
                    {isExpanded && p.prompts.length > 0 && (
                      <div className="border-b border-gray-100">
                        {p.prompts.map((prompt, i) => (
                          <div key={prompt.id}
                            className={`px-3 py-2.5 ${i < p.prompts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                            <p className="text-xs text-pink-500 font-semibold mb-0.5">{prompt.question}</p>
                            <p className="text-xs text-gray-700 leading-relaxed">{prompt.answer}</p>
                          </div>
                        ))}
                        <button onClick={() => setExpandedCard(null)}
                          className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                          Show less ↑
                        </button>
                      </div>
                    )}
                    <div className="p-3">
                      <div className="mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {p.full_name}{ageLabel ? `, ${ageLabel}` : ''}
                        </h3>
                        {p.location && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <MapPin size={11} />
                            <span className="text-xs truncate">{p.location}</span>
                          </div>
                        )}
                      </div>
                      {p.interests?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {p.interests.slice(0, 2).map(interest => (
                            <span key={interest} className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">
                              {interest}
                            </span>
                          ))}
                          {p.interests.length > 2 && (
                            <span className="text-xs text-gray-400">+{p.interests.length - 2}</span>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handlePass(p.id)} disabled={!!isActing}
                          className="flex-1 flex items-center justify-center py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40">
                          <X size={16} className="text-gray-400" />
                        </button>
                        <button onClick={() => handleLike(sp)} disabled={!!isActing}
                          className="flex-1 flex items-center justify-center py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-40">
                          {isActing
                            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <Heart size={16} className="text-white fill-white" />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button onClick={handleLoadMore} disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-full text-sm font-medium hover:border-pink-300 hover:text-pink-500 transition-all disabled:opacity-40">
                  {loadingMore
                    ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin" /> Loading…</>
                    : 'Load more'
                  }
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
