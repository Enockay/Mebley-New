/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import Image from 'next/image'
import Chat from '@/components/Messages/Chat'
import MatchesPage from '@/app/matches/page'

import {
  Heart, X, Search, SlidersHorizontal, MapPin,
  RefreshCw, ChevronDown, Sparkles,
  MoreVertical, LayoutGrid, Layers, ChevronUp,
} from 'lucide-react'
import { RELATIONSHIP_INTENTS, INTERESTS_BY_CATEGORY } from '@/types/app-constants'
import BlockReport from '@/components/Moderation/BlockReport'
import StitchDivider from '@/components/UI/StitchDivider'

// ── Types ─────────────────────────────────────────────────────────
interface PromptAnswer { id: string; question: string; answer: string }

interface BrowseProfile {
  id: string; full_name: string; age_range: string; gender: string
  bio: string | null; location: string | null; nationality: string | null
  interests: string[]; looking_for: string[]
  photos: { url: string; slot: number }[]; prompts: PromptAnswer[]
  last_active: string | null; profile_completeness: number | null
  here_tonight?: boolean
}

interface ScoredProfile { score: number; reasons: string[]; profile: BrowseProfile }

interface Filters { location: string; intents: string[]; interests: string[]; ageRanges: string[] }

type ViewMode = 'stack' | 'grid'

// ── Constants ─────────────────────────────────────────────────────
const AGE_RANGE_LABELS: Record<string, string> = {
  '18_24': '18–24', '25_34': '25–34', '35_40': '35–40',
  '40_50': '40–50', '50_65': '50–65', '65_plus': '65+',
}
const AGE_RANGE_OPTIONS = Object.entries(AGE_RANGE_LABELS).map(([value, label]) => ({ value, label }))
const PAGE_SIZE = 20
const SWIPE_THRESHOLD = 0.38
const TOP_HEADER_HEIGHT = 62

// ── Helpers ───────────────────────────────────────────────────────
function getPhotoUrl(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null
  const first = photos[0]
  if (!first) return null
  if (typeof first === 'string') return first
  if (typeof first === 'object' && 'url' in first && typeof (first as any).url === 'string') return (first as any).url
  return null
}
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
async function captureAndSaveCoordinates(userId: string) {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(async (pos) => {
    await (supabase as any).from('profiles').update({
      latitude: pos.coords.latitude, longitude: pos.coords.longitude,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)
  }, () => {}, { timeout: 8000, maximumAge: 300_000 })
}
function buildDiscoverUrl(page: number, filters: Filters): string {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(PAGE_SIZE))
  if (filters.location.trim()) params.set('location', filters.location.trim())
  if (filters.intents.length > 0) params.set('intents', filters.intents.join(','))
  if (filters.interests.length > 0) params.set('interests', filters.interests.join(','))
  if (filters.ageRanges.length > 0) params.set('ageRanges', filters.ageRanges.join(','))
  return `/api/discover?${params.toString()}`
}

// ── SwipeCard — new architecture ──────────────────────────────────
interface SwipeCardProps {
  sp: ScoredProfile; onLike: (sp: ScoredProfile) => void
  onPass: (id: string) => void; onReport: (id: string, name: string) => void
  onViewProfile: (sp: ScoredProfile) => void
  isTop: boolean; stackOffset: number
  visualOffset?: number
  forceInteractive?: boolean
  feedMode?: boolean
  enableKeyboard?: boolean
}

function SwipeCard({
  sp, onLike, onPass, onReport, onViewProfile, isTop, stackOffset, visualOffset,
  forceInteractive = false, feedMode = false, enableKeyboard = true,
}: SwipeCardProps) {
  const supabase = createClient()
  const p = sp.profile
  const ageLabel = AGE_RANGE_LABELS[p.age_range] ?? ''
  const initials = getInitials(p.full_name)

  const cardRef    = useRef<HTMLDivElement>(null)
  const startX     = useRef(0)
  const currentX   = useRef(0)
  const isDragging = useRef(false)
  const photoStartX = useRef(0)
  const photoCurrentX = useRef(0)
  const isDraggingPhoto = useRef(false)

  const [dragDelta, setDragDelta]       = useState(0)
  const [isFlying, setIsFlying]         = useState(false)
  const [flyDir, setFlyDir]             = useState<'left' | 'right' | null>(null)
  const [photoIdx, setPhotoIdx]         = useState(0)
  const [isActive, setIsActive]         = useState(false)

  useEffect(() => {
    const active = p.last_active
      ? Date.now() - new Date(p.last_active).getTime() < 86_400_000 : false
    setIsActive(active)
  }, [p.last_active])

  const sortedPhotos = [...(p.photos ?? [])].sort((a, b) => a.slot - b.slot)
  const allMedia = sortedPhotos  // videos would be added here later

  const canInteract = forceInteractive || isTop

  const triggerFly = useCallback((dir: 'left' | 'right') => {
    setFlyDir(dir)
    setIsFlying(true)
    setTimeout(() => {
      if (dir === 'right') onLike(sp)
      else onPass(p.id)
    }, 320)
  }, [sp, p.id, onLike, onPass])

  // Card drag (to like/pass)
  const onCardPointerDown = (e: React.PointerEvent) => {
    if (!canInteract || isFlying) return
    if ((e.target as HTMLElement).closest('button')) return
    if ((e.target as HTMLElement).closest('[data-photo-area]')) return
    isDragging.current = true
    startX.current = e.clientX
    currentX.current = e.clientX
    cardRef.current?.setPointerCapture(e.pointerId)
  }
  const onCardPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    currentX.current = e.clientX
    setDragDelta(e.clientX - startX.current)
  }
  const onCardPointerUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    const delta = currentX.current - startX.current
    const cardW = cardRef.current?.offsetWidth ?? 360
    if (Math.abs(delta) / cardW >= SWIPE_THRESHOLD) triggerFly(delta > 0 ? 'right' : 'left')
    else setDragDelta(0)
  }
  const onCardClick = (e: React.MouseEvent) => {
    // Keep action buttons and drag/swipe interactions untouched.
    if ((e.target as HTMLElement).closest('button')) return
    if (isFlying || isDragging.current || isDraggingPhoto.current) return
    if (Math.abs(dragDelta) > 6) return
    onViewProfile(sp)
  }

  // Photo swipe (to cycle photos)
  const onPhotoPointerDown = (e: React.PointerEvent) => {
    isDraggingPhoto.current = true
    photoStartX.current = e.clientX
    photoCurrentX.current = e.clientX
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPhotoPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingPhoto.current) return
    photoCurrentX.current = e.clientX
  }
  const onPhotoPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingPhoto.current) return
    isDraggingPhoto.current = false
    const delta = photoCurrentX.current - photoStartX.current
    if (Math.abs(delta) < 10) {
      onViewProfile(sp)
      return
    }
    if (delta < -40 && photoIdx < allMedia.length - 1) setPhotoIdx(i => i + 1)
    if (delta > 40  && photoIdx > 0) setPhotoIdx(i => i - 1)
  }

  useEffect(() => {
    if (!enableKeyboard || !isTop) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') triggerFly('right')
      if (e.key === 'ArrowLeft') triggerFly('left')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isTop, triggerFly, enableKeyboard])

  const rotation = dragDelta * 0.06
  const likeOpacity = Math.max(0, Math.min(1, dragDelta / 80))
  const passOpacity = Math.max(0, Math.min(1, -dragDelta / 80))
  const offsetForLayout = visualOffset ?? stackOffset
  const stackScale = 1 - offsetForLayout * 0.04
  const stackTranslateY = offsetForLayout * 12

  const cardTransform = isFlying
    ? flyDir === 'right' ? 'translateX(130%) rotate(22deg)' : 'translateX(-130%) rotate(-22deg)'
    : canInteract
      ? `translateX(${dragDelta}px) rotate(${rotation}deg)`
      : feedMode
        ? 'none'
        : `translateY(${stackTranslateY}px) scale(${stackScale})`

  const photoHeight = '78%'
  const infoHeight  = '22%'
  const displayPhoto = sortedPhotos[photoIdx] ?? null

  return (
    <div
      ref={cardRef}
      style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(165deg, rgba(16,12,36,0.97), rgba(8,6,20,0.97))',
        borderRadius: '14px',
        boxShadow: isTop
          ? '0 24px 68px rgba(7,2,20,0.52), 0 8px 26px rgba(236,72,153,0.16)'
          : '0 10px 34px rgba(7,2,20,0.38)',
        overflow: 'hidden',
        userSelect: 'none',
        transform: cardTransform,
        transition: isDragging.current ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor: canInteract ? (isDragging.current ? 'grabbing' : 'grab') : 'default',
        zIndex: Math.round(100 - offsetForLayout * 10),
        pointerEvents: canInteract ? 'auto' : 'none',
        border: '1px solid rgba(255,255,255,0.14)',
      }}
      onPointerDown={onCardPointerDown}
      onPointerMove={onCardPointerMove}
      onPointerUp={onCardPointerUp}
      onPointerCancel={onCardPointerUp}
      onClick={onCardClick}
    >
      {/* ── Photo area ── */}
      <div
        data-photo-area="true"
        style={{
          position: 'relative',
          height: photoHeight,
          transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#1a0a0f',
          cursor: 'pointer',
          flexShrink: 0,
          touchAction: 'pan-y',
        }}
        onPointerDown={onPhotoPointerDown}
        onPointerMove={onPhotoPointerMove}
        onPointerUp={onPhotoPointerUp}
      >
        {displayPhoto ? (
          <img
            src={displayPhoto.url}
            alt={p.full_name}
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #1a1030, #0e0c24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(244,63,94,0.3)',
            }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: 'white' }}>{initials}</span>
            </div>
          </div>
        )}

        {/* Bottom gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(8,4,16,0.82) 0%, rgba(0,0,0,0) 58%)',
          pointerEvents: 'none',
        }} />

        {/* Photo dots */}
        {allMedia.length > 1 && (
          <div style={{
            position: 'absolute', top: 12, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 5,
            pointerEvents: 'none',
          }}>
            {allMedia.map((_, i) => (
              <div key={i} style={{
                width: i === photoIdx ? 7 : 5,
                height: i === photoIdx ? 7 : 5,
                borderRadius: '50%',
                background: i === photoIdx ? '#ffffff' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.3s ease',
                transform: i === photoIdx ? 'scale(1.05)' : 'scale(1)',
                boxShadow: i === photoIdx ? '0 1px 6px rgba(0,0,0,0.35)' : 'none',
              }} />
            ))}
          </div>
        )}

        {/* Here Tonight badge */}
        {p.here_tonight && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'linear-gradient(135deg, rgba(240,56,104,0.72), rgba(184,32,60,0.72))',
            backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '4px 10px',
            boxShadow: '0 2px 12px rgba(240,56,104,0.35)',
            border: '1px solid rgba(240,56,104,0.45)',
          }}>
            <span style={{ fontSize: 12 }}>🔥</span>
            <span style={{ fontSize: 11, color: '#fff0f4', fontWeight: 700 }}>Here Tonight</span>
          </div>
        )}

        {/* Active badge — shown only when no Here Tonight badge */}
        {isActive && !p.here_tonight && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.13)',
            backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '4px 10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.16)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 11, color: '#e9fbe9', fontWeight: 600 }}>Active</span>
          </div>
        )}

        {/* Report button */}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <button
            onClick={e => { e.stopPropagation(); onReport(p.id, p.full_name) }}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,0,0,0.44)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <MoreVertical size={14} color="white" />
          </button>
        </div>

        {/* Vertical action rail on image */}
        <div style={{
          position: 'absolute',
          right: 12,
          bottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 4,
        }}>
          <button
            onClick={e => { e.stopPropagation(); triggerFly('left') }}
            style={{
              width: 46, height: 46, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.26)',
              background: 'rgba(0,0,0,0.34)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            <X size={18} color="#f7e7ff" />
          </button>

          <button
            onClick={e => { e.stopPropagation(); triggerFly('right') }}
            style={{
              width: 54, height: 54, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 6px 20px rgba(244,63,94,0.38)',
            }}
          >
            <Heart size={22} color="white" fill="white" />
          </button>

          <button
            onClick={e => { e.stopPropagation(); triggerFly('right') }}
            style={{
              width: 46, height: 46, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.26)',
              background: 'rgba(0,0,0,0.34)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            <Sparkles size={17} color="#f8d6ff" />
          </button>
        </div>

        {/* LIKE / PASS stamps */}
        <div style={{
          position: 'absolute', top: 24, left: 20,
          border: '3px solid #4ade80', borderRadius: 12,
          padding: '4px 14px', transform: 'rotate(-20deg)',
          opacity: likeOpacity, pointerEvents: 'none',
          background: 'rgba(5,20,10,0.35)',
        }}>
          <span style={{ color: '#4ade80', fontWeight: 900, fontSize: 22, letterSpacing: 3 }}>LIKE</span>
        </div>
        <div style={{
          position: 'absolute', top: 24, right: 20,
          border: '3px solid #f87171', borderRadius: 12,
          padding: '4px 14px', transform: 'rotate(20deg)',
          opacity: passOpacity, pointerEvents: 'none',
          background: 'rgba(30,8,8,0.35)',
        }}>
          <span style={{ color: '#f87171', fontWeight: 900, fontSize: 22, letterSpacing: 3 }}>PASS</span>
        </div>

        {/* Name overlay — always on photo */}
        <div style={{
          position: 'absolute', bottom: 14, left: 16, right: 16,
          pointerEvents: 'none',
        }}>
          <h3 style={{
            margin: 0, color: 'white',
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 600, fontSize: 22,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}>
            {p.full_name}{ageLabel ? `, ${ageLabel}` : ''}
          </h3>
          {p.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <MapPin size={11} color="rgba(255,255,255,0.75)" />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.86)' }}>{p.location}</span>
            </div>
          )}
        </div>

      </div>

      {/* ── Info area ── */}
      <div style={{
        height: infoHeight,
        transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(10,8,26,0.97), rgba(8,6,20,0.99))',
            }}>
        <div style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
          padding: '10px 14px 12px',
          borderTop: '1px solid rgba(255,255,255,0.14)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '22%',
            right: '22%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(236,72,153,0.7), transparent)',
          }} />
          <button
            onClick={e => { e.stopPropagation(); onViewProfile(sp) }}
            style={{
              width: '100%',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.28)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
              color: '#f6eaff',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              padding: '9px 12px',
              cursor: 'pointer',
              letterSpacing: 0.2,
              boxShadow: '0 10px 24px rgba(10,4,20,0.44), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            View profile
          </button>
          <p style={{
            margin: 0,
            textAlign: 'center',
            fontSize: 11,
            color: 'rgba(236,221,247,0.78)',
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: 0.15,
          }}>
            Tap to open full profile details
          </p>
        </div>
      </div>
    </div>
  )
}

const supabase = createClient()

// ── Browse Page ───────────────────────────────────────────────────
function BrowsePageContent() {
  const supabase = createClient()
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [scored, setScored]                     = useState<ScoredProfile[]>([])
  const [fetching, setFetching]                 = useState(true)
  const [loadingMore, setLoadingMore]           = useState(false)
  const [error, setError]                       = useState<string | null>(null)
  const [hasMore, setHasMore]                   = useState(true)
  const [page, setPage]                         = useState(1)
  const [likedIds, setLikedIds]                 = useState<Set<string>>(new Set())
  const [passedIds, setPassedIds]               = useState<Set<string>>(new Set())
  const [blockedIds, setBlockedIds]             = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters]           = useState(false)
  const [actionLoading, setActionLoading]       = useState<string | null>(null)
  const [matchAlert, setMatchAlert]             = useState<{ name: string; photo: string | null } | null>(null)
  const [expandedCard, setExpandedCard]         = useState<string | null>(null)
  const [openMenu, setOpenMenu]                 = useState<string | null>(null)
  const [moderationTarget, setModerationTarget] = useState<{ id: string; name: string } | null>(null)
  const [viewProfileSp, setViewProfileSp]       = useState<ScoredProfile | null>(null)
  const [drawerPhotoIdx, setDrawerPhotoIdx]     = useState<number>(0)
  const [drawerChat, setDrawerChat]             = useState<{ conversationId: string; profile: BrowseProfile } | null>(null)
  const [viewMode, setViewMode]                 = useState<ViewMode>('stack')
  const [stackStart, setStackStart]             = useState(0)
  const [stackAnimating, setStackAnimating]     = useState(false)
  const [stackAnimDir, setStackAnimDir]         = useState<'up' | 'down' | null>(null)
  const [showSelfSettings, setShowSelfSettings] = useState(false)
  const [isMobile, setIsMobile]                 = useState(false)
  const preservedViewProfileRef                 = useRef<ScoredProfile | null>(null)
  const preservedPhotoIdxRef                    = useRef<number>(0)
  const previousPanelRef                        = useRef<string | null>(null)
  const pendingDiscoverFocusRef                 = useRef(false)
  const stackAnimTimerRef                       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stackTouchStartYRef                     = useRef<number | null>(null)

  const [filters, setFilters] = useState<Filters>({ location: '', intents: [], interests: [], ageRanges: [] })
  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters)

  useEffect(() => { if (!loading && !user) router.push('/auth') }, [user, loading, router])
  useEffect(() => {
    // Prevent page bounce/overscroll artifacts while Browse uses fixed split layout.
    const prevOverflow = document.body.style.overflow
    const prevOverscroll = document.body.style.overscrollBehaviorY
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehaviorY = 'none'
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.overscrollBehaviorY = prevOverscroll
    }
  }, [])
  useEffect(() => { if (user) captureAndSaveCoordinates(user.id) }, [user])
  useEffect(() => {
    if (!user) return
    supabase.from('likes').select('likee_id').eq('liker_id', user.id)
      .then(({ data }) => { if (data) setLikedIds(new Set(data.map(r => r.likee_id))) })
  }, [user])
  useEffect(() => {
    if (!user) return
    fetch('/api/passes').then(r => r.json())
      .then(json => { if (json.passedIds) setPassedIds(new Set(json.passedIds)) }).catch(() => {})
  }, [user])
  useEffect(() => {
    if (!user) return
    fetch('/api/moderation').then(r => r.json())
      .then(json => { if (json.blockedIds) setBlockedIds(new Set(json.blockedIds)) }).catch(() => {})
  }, [user])

  const fetchProfiles = useCallback(async (pageNum: number, currentFilters: Filters, append: boolean) => {
    if (!user || !profile) return
    append ? setLoadingMore(true) : setFetching(true)
    setError(null)
    try {
      const res = await fetch(buildDiscoverUrl(pageNum, currentFilters))
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load profiles')
      const incoming: ScoredProfile[] = json.profiles ?? []
      const filtered = incoming.filter(sp =>
        !likedIds.has(sp.profile.id) && !passedIds.has(sp.profile.id) && !blockedIds.has(sp.profile.id))
      setScored(prev => append ? [...prev, ...filtered] : filtered)
      setHasMore((json.profiles ?? []).length === PAGE_SIZE)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles')
    } finally { setFetching(false); setLoadingMore(false) }
  }, [user, profile, likedIds, passedIds, blockedIds])

  useEffect(() => {
    if (!user || !profile) return
    setPage(1)
    setStackStart(0)
    fetchProfiles(1, appliedFilters, false)
  }, [user, profile, appliedFilters]) // eslint-disable-line

  useEffect(() => {
    if (stackStart > Math.max(0, scored.length - 1)) {
      setStackStart(Math.max(0, scored.length - 1))
    }
  }, [scored.length, stackStart])
  useEffect(() => {
    return () => {
      if (stackAnimTimerRef.current) clearTimeout(stackAnimTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!openMenu) return
    const handler = () => setOpenMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openMenu])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const focusDiscoverArea = useCallback(() => {
    setViewProfileSp(null)
    setDrawerChat(null)
    setShowSelfSettings(false)
    setShowFilters(false)
    setViewMode('stack')
    setStackStart(0)
    const firstCard = scored[0] ?? null
    if (firstCard) {
      setViewProfileSp(firstCard)
      setDrawerPhotoIdx(0)
      pendingDiscoverFocusRef.current = false
    } else {
      pendingDiscoverFocusRef.current = true
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [scored])

  useEffect(() => {
    if (!pendingDiscoverFocusRef.current || scored.length === 0) return
    setViewProfileSp(scored[0])
    setDrawerPhotoIdx(0)
    pendingDiscoverFocusRef.current = false
  }, [scored])

  useEffect(() => {
    const handler = () => focusDiscoverArea()
    window.addEventListener('browse:focus-discover', handler as EventListener)
    return () => window.removeEventListener('browse:focus-discover', handler as EventListener)
  }, [focusDiscoverArea])

  // Detect query param to open official profile settings in right-side panel
  useEffect(() => {
    const panel = searchParams.get('panel')
    const profilePanelRequested =
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem('browse:open-profile-panel') === '1'

    // Ignore stale restored URLs like /browse?panel=profile-settings unless it
    // was explicitly requested from the bottom nav in this session.
    if (panel === 'profile-settings' && !profilePanelRequested) {
      setShowSelfSettings(false)
      router.replace('/browse', { scroll: false })
      previousPanelRef.current = null
      return
    }

    if (panel === 'profile-settings' && profilePanelRequested && typeof window !== 'undefined') {
      window.sessionStorage.removeItem('browse:open-profile-panel')
    }

    const wasOnProfileSettings = previousPanelRef.current === 'profile-settings'
    const goingToProfileSettings = panel === 'profile-settings'

    // Preserve currently viewed person profile before switching to self profile settings.
    if (goingToProfileSettings && viewProfileSp) {
      preservedViewProfileRef.current = viewProfileSp
      preservedPhotoIdxRef.current = drawerPhotoIdx
    }

    setShowSelfSettings(panel === 'profile-settings')
    if (panel === 'profile-settings') {
      setViewProfileSp(null)
      setDrawerChat(null)
    }
    if (panel === 'chats') {
      setViewProfileSp(null)
      setShowSelfSettings(false)
    }
    if (panel === 'discover') {
      focusDiscoverArea()
      router.replace('/browse', { scroll: false })
    }

    // Restore previously viewed person profile when user goes back from profile settings.
    if (wasOnProfileSettings && panel !== 'profile-settings' && preservedViewProfileRef.current) {
      setViewProfileSp(preservedViewProfileRef.current)
      setDrawerPhotoIdx(preservedPhotoIdxRef.current)
      preservedViewProfileRef.current = null
    }

    previousPanelRef.current = panel
  }, [searchParams, router, viewProfileSp, drawerPhotoIdx, focusDiscoverArea])

  const activePanel = searchParams.get('panel')
  const showChatPane = !isMobile || activePanel === 'chats'
  const openPersonProfile = useCallback((spSel: ScoredProfile) => {
    setViewProfileSp(spSel)
    setDrawerPhotoIdx(0)
    setShowSelfSettings(false)
    // If a panel query is active (profile-settings/chats), clear it so person drawer can take over.
    if (searchParams.get('panel')) {
      router.replace('/browse', { scroll: false })
    }
  }, [router, searchParams])

  const handleLike = useCallback(async (sp: ScoredProfile) => {
    if (!user || actionLoading) return
    const targetProfile = sp.profile
    setActionLoading(targetProfile.id)
    setScored(prev => prev.filter(s => s.profile.id !== targetProfile.id))
    setLikedIds(prev => new Set([...prev, targetProfile.id]))
    try {
      const res = await fetch('/api/likes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likeeId: targetProfile.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Like failed')
      if (json.isMatch) {
        const photoUrl = getPhotoUrl(targetProfile.photos)
        setMatchAlert({ name: targetProfile.full_name, photo: photoUrl })
        setTimeout(() => setMatchAlert(null), 4500)
      }
    } catch (err) {
      console.error('Like error:', err)
      setScored(prev => [sp, ...prev])
      setLikedIds(prev => { const s = new Set(prev); s.delete(targetProfile.id); return s })
    } finally { setActionLoading(null) }
  }, [user, actionLoading])

  const handlePass = useCallback((profileId: string) => {
    setPassedIds(prev => new Set([...prev, profileId]))
    setScored(prev => prev.filter(s => s.profile.id !== profileId))
    fetch('/api/passes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passedId: profileId }),
    }).catch(err => console.error('[Pass] failed:', err))
  }, [])

  const handleBlocked = (targetId: string) => {
    setBlockedIds(prev => new Set([...prev, targetId]))
    setScored(prev => prev.filter(s => s.profile.id !== targetId))
    setModerationTarget(null)
  }

  const openChatWithProfile = useCallback(async (targetProfile: BrowseProfile) => {
    try {
      const res = await fetch('/api/chat/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: targetProfile.id }),
      })
      const data = await res.json()
      if (!res.ok || !data?.conversationId) {
        throw new Error(data?.error ?? 'Could not open chat')
      }
      setDrawerChat({ conversationId: data.conversationId, profile: targetProfile })
    } catch (err) {
      console.error('[Browse] open chat failed:', err)
      setError('Could not open chat right now')
    }
  }, [])

  const stepStack = useCallback((dir: 'up' | 'down') => {
    if (viewMode !== 'stack' || scored.length <= 1 || stackAnimating) return
    const maxIndex = Math.max(0, scored.length - 1)
    if (dir === 'down' && stackStart >= maxIndex) return
    if (dir === 'up' && stackStart <= 0) return

    setStackAnimating(true)
    setStackAnimDir(dir)
    if (stackAnimTimerRef.current) clearTimeout(stackAnimTimerRef.current)

    stackAnimTimerRef.current = setTimeout(() => {
      setStackStart(prev => {
        if (dir === 'down') return Math.min(prev + 1, maxIndex)
        return Math.max(prev - 1, 0)
      })
      setStackAnimating(false)
      setStackAnimDir(null)
    }, 190)
  }, [viewMode, scored.length, stackAnimating, stackStart])

  const handleStackScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    if (viewMode !== 'stack' || scored.length <= 1) return
    if (Math.abs(e.deltaY) < 18) return
    e.preventDefault()
    stepStack(e.deltaY > 0 ? 'down' : 'up')
  }

  const handleStackTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    stackTouchStartYRef.current = e.touches[0]?.clientY ?? null
  }

  const handleStackTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (stackTouchStartYRef.current == null) return
    const endY = e.changedTouches[0]?.clientY ?? stackTouchStartYRef.current
    const deltaY = endY - stackTouchStartYRef.current
    stackTouchStartYRef.current = null
    if (Math.abs(deltaY) < 36) return
    stepStack(deltaY < 0 ? 'down' : 'up')
  }

  const handleApplyFilters = () => { setAppliedFilters({ ...filters }); setShowFilters(false) }
  const handleResetFilters = () => {
    const reset: Filters = { location: '', intents: [], interests: [], ageRanges: [] }
    setFilters(reset); setAppliedFilters(reset); setShowFilters(false)
  }

  const activeFilterCount = [
    appliedFilters.location.trim() !== '',
    appliedFilters.intents.length > 0,
    appliedFilters.interests.length > 0,
    appliedFilters.ageRanges.length > 0,
  ].filter(Boolean).length

  if (loading || !profile) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ position: 'relative', animation: 'float 3s ease-in-out infinite' }}>
          <Image src="/icon.svg" alt="Mebley logo" width={32} height={32} />
        </div>
        <p style={{ color: '#a37a82', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          Finding your matches…
        </p>
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      minHeight: 0,
      paddingBottom: 0,
      boxSizing: 'border-box',
      overflow: 'hidden',
      overscrollBehavior: 'none',
      background: 'transparent',
    }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '16px 16px', height: '100%', overflow: 'hidden' }}>

        {/* Match alert */}
        {matchAlert && (
          <div style={{
            position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
            zIndex: 60,
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(244, 63, 94, 0.25)',
            border: '1.5px solid rgba(244,63,94,0.25)',
            padding: '12px 20px', borderRadius: 20,
            boxShadow: '0 8px 40px rgba(244,63,94,0.25)',
            backdropFilter: 'blur(20px)',
            animation: 'fadeUp 0.4s ease-out',
            whiteSpace: 'nowrap',
          }}>
            {matchAlert.photo && (
              <img src={matchAlert.photo} alt={matchAlert.name}
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover',
                  border: '2px solid rgba(244,63,94,0.3)' }} />
            )}
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff0f4',
                fontFamily: "'Fraunces', Georgia, serif" }}>
                A new stitch! 🪡
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#f43f5e',
                fontFamily: "'DM Sans', sans-serif" }}>
                You and {matchAlert.name} are connected
              </p>
            </div>
          </div>
        )}

        {moderationTarget && (
          <BlockReport targetId={moderationTarget.id} targetName={moderationTarget.name}
            onClose={() => setModerationTarget(null)} onBlocked={handleBlocked} />
        )}

        {/* Filter bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          position: 'fixed',
          top: TOP_HEADER_HEIGHT,
          left: isMobile ? 0 : '50%',
          transform: isMobile ? 'none' : 'translateX(-50%)',
          width: isMobile ? '100vw' : 'min(520px, calc(100vw - 32px))',
          zIndex: 35,
          paddingTop: 12,
          paddingBottom: 10,
          paddingLeft: isMobile ? 14 : 2,
          paddingRight: isMobile ? 14 : 2,
          background: 'linear-gradient(180deg, rgba(8,6,20,0.98) 0%, rgba(8,6,20,0.82) 75%, rgba(8,6,20,0) 100%)',
          backdropFilter: 'blur(12px)',
        }}>
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 50,
              border: `1.5px solid ${showFilters || activeFilterCount > 0 ? 'rgba(240,56,104,0.45)' : 'rgba(255,255,255,0.15)'}`,
              background: showFilters || activeFilterCount > 0
                ? 'linear-gradient(135deg, rgba(240,56,104,0.16), rgba(255,122,80,0.10))'
                : 'rgba(255,255,255,0.07)',
              color: showFilters || activeFilterCount > 0 ? '#ffb0c4' : 'rgba(240,232,244,0.80)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
            }}>
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                color: 'white', fontSize: 10, width: 18, height: 18,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700,
              }}>{activeFilterCount}</span>
            )}
            <ChevronDown size={13} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,220,251,0.75)' }} />
            <input
              type="text"
              placeholder="Search by location…"
              value={filters.location}
              onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
              style={{
                width: '100%', paddingLeft: 34, paddingRight: 12,
                paddingTop: 7, paddingBottom: 7,
                border: '1.5px solid rgba(255,255,255,0.12)',
                borderRadius: 50, fontSize: 13,
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(10px)',
                color: '#f0e8f4', outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(240,56,104,0.45)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
            <style>{`
              input::placeholder { color: rgba(245,220,251,0.62); }
            `}</style>
          </div>

          {/* View toggle */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.07)', borderRadius: 50,
            padding: 3, gap: 2, border: '1.5px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
          }}>
            {(['stack', 'grid'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{
                  width: 28, height: 28, borderRadius: 50,
                  border: 'none', cursor: 'pointer',
                  background: viewMode === mode ? 'linear-gradient(135deg, #f03868, #ff7a50)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: viewMode === mode ? '0 2px 8px rgba(244,63,94,0.3)' : 'none',
                }}>
                {mode === 'stack'
                  ? <Layers size={13} color={viewMode === mode ? 'white' : 'rgba(245,220,251,0.85)'} />
                  : <LayoutGrid size={13} color={viewMode === mode ? 'white' : 'rgba(245,220,251,0.85)'} />
                }
              </button>
            ))}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{
            background: 'rgba(16,12,36,0.97)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 24, padding: 20, marginBottom: 16,
            boxShadow: '0 16px 46px rgba(0,0,0,0.5), 0 4px 20px rgba(240,56,104,0.10)',
            backdropFilter: 'blur(16px)',
          }}>
            {/* Age */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(245,220,251,0.92)', marginBottom: 8,
                fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Age range
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {AGE_RANGE_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => setFilters(f => ({
                      ...f, ageRanges: f.ageRanges.includes(opt.value)
                        ? f.ageRanges.filter(r => r !== opt.value) : [...f.ageRanges, opt.value],
                    }))}
                    style={{
                      padding: '6px 14px', borderRadius: 50, fontSize: 12, cursor: 'pointer',
                      border: `1.5px solid ${filters.ageRanges.includes(opt.value) ? '#f43f5e' : 'rgba(255,255,255,0.24)'}`,
                      background: filters.ageRanges.includes(opt.value) ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'rgba(255,255,255,0.16)',
                      color: filters.ageRanges.includes(opt.value) ? 'white' : '#f9dfff',
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                      transition: 'all 0.15s ease',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <StitchDivider opacity={0.3} />

            {/* Looking for */}
            <div style={{ margin: '16px 0' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(245,220,251,0.92)', marginBottom: 8,
                fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Looking for
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {RELATIONSHIP_INTENTS.map(intent => (
                  <button key={intent.value}
                    onClick={() => setFilters(f => ({
                      ...f, intents: f.intents.includes(intent.value)
                        ? f.intents.filter(i => i !== intent.value) : [...f.intents, intent.value],
                    }))}
                    style={{
                      padding: '6px 14px', borderRadius: 50, fontSize: 12, cursor: 'pointer',
                      border: `1.5px solid ${filters.intents.includes(intent.value) ? '#f43f5e' : 'rgba(255,255,255,0.24)'}`,
                      background: filters.intents.includes(intent.value) ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'rgba(255,255,255,0.16)',
                      color: filters.intents.includes(intent.value) ? 'white' : '#f9dfff',
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                      transition: 'all 0.15s ease',
                    }}>
                    {intent.emoji} {intent.label}
                  </button>
                ))}
              </div>
            </div>

            <StitchDivider opacity={0.3} />

            {/* Interests */}
            <div style={{ margin: '16px 0' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(245,220,251,0.92)', marginBottom: 8,
                fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Interests
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                {INTERESTS_BY_CATEGORY.flatMap((cat, catIdx) => cat.tags.map((tag, tagIdx) => (
                  <button key={`${catIdx}-${tagIdx}-${tag}`}
                    onClick={() => setFilters(f => ({
                      ...f, interests: f.interests.includes(tag)
                        ? f.interests.filter(i => i !== tag) : [...f.interests, tag],
                    }))}
                    style={{
                      padding: '5px 12px', borderRadius: 50, fontSize: 12, cursor: 'pointer',
                      border: `1.5px solid ${filters.interests.includes(tag) ? '#f43f5e' : 'rgba(255,255,255,0.24)'}`,
                      background: filters.interests.includes(tag) ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'rgba(255,255,255,0.16)',
                      color: filters.interests.includes(tag) ? 'white' : '#f9dfff',
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 0.15s ease',
                    }}>
                    {tag}
                  </button>
                )))}
              </div>
            </div>

            <StitchDivider opacity={0.3} />

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={handleResetFilters} style={{
                flex: 1, padding: '11px', borderRadius: 14,
                border: '1.5px solid rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.08)', color: 'rgba(245,220,251,0.92)', fontSize: 13,
                fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>Reset</button>
              <button onClick={handleApplyFilters} style={{
                flex: 1, padding: '11px', borderRadius: 14,
                background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                border: 'none', color: 'white', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 16px rgba(244,63,94,0.3)',
              }}>Apply</button>
            </div>
          </div>
        )}

        <div style={{ height: 64 }} />

        {/* States */}
        {fetching ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 20 }}>
            <div style={{ animation: 'float 2.5s ease-in-out infinite' }}>
              <Image src="/icon.svg" alt="Mebley logo" width={36} height={36} />
            </div>
            <p style={{ color: '#a37a82', fontFamily: "'DM Sans', sans-serif", fontSize: 14, margin: 0 }}>
              Finding your matches…
            </p>
          </div>

        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
            <p style={{ color: '#e11d48', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
            <button onClick={() => fetchProfiles(1, appliedFilters, false)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 50,
              background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
              border: 'none', color: 'white', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}>
              <RefreshCw size={14} /> Try again
            </button>
          </div>

        ) : scored.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 0 80px', gap: 0, textAlign: 'center' }}>
            {/* Glowing heart icon */}
            <div style={{ position: 'relative', marginBottom: 28 }}>
              <div style={{
                position: 'absolute', inset: -24,
                background: 'radial-gradient(circle, rgba(240,56,104,0.22) 0%, transparent 70%)',
                borderRadius: '50%',
              }} />
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(240,56,104,0.18), rgba(255,122,80,0.12))',
                border: '1px solid rgba(240,56,104,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 32px rgba(240,56,104,0.20), 0 8px 24px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(8px)',
                position: 'relative',
              }}>
                <Image src="/icon.svg" alt="Mebley" width={38} height={38} style={{ opacity: 0.9 }} />
              </div>
            </div>
            <h3 style={{
              margin: '0 0 10px',
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 24, fontWeight: 700,
              color: '#f0e8f4',
              lineHeight: 1.2,
            }}>
              {activeFilterCount > 0 ? 'No one matches yet' : 'You\'re all caught up'}
            </h3>
            <p style={{
              margin: '0 0 24px',
              color: 'rgba(240,232,244,0.52)',
              fontSize: 14, lineHeight: 1.7,
              maxWidth: 240,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {activeFilterCount > 0
                ? 'Widen your filters to discover more people nearby.'
                : 'New people join every day.\nCheck back soon for fresh matches.'}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={handleResetFilters} style={{
                padding: '12px 28px', borderRadius: 50,
                background: 'linear-gradient(135deg, #f03868, #ff7a50)',
                border: 'none', color: 'white', fontSize: 14,
                fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 6px 24px rgba(240,56,104,0.35)',
                letterSpacing: '0.01em',
              }}>Clear filters</button>
            )}
          </div>

        ) : viewMode === 'stack' ? (

          // ── STACK MODE ──
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 'max(90px, env(safe-area-inset-bottom, 0px))' }}>
            <p style={{ fontSize: 11, color: '#a37a82', marginBottom: 8, alignSelf: 'flex-start',
              fontFamily: "'DM Sans', sans-serif" }}>
              {scored.length} match{scored.length !== 1 ? 'es' : ''} · scroll feed
              {activeFilterCount > 0 ? ' · filtered' : ''}
            </p>

            {true ? (
              <div style={{
                width: '100%',
                maxWidth: 500,
                height: isMobile ? 'calc(100vh - 195px)' : 'calc(100vh - 210px)',
                overflowY: 'auto',
                scrollSnapType: 'y mandatory',
                paddingBottom: 12,
              }}>
                {scored.map((sp) => (
                  <div key={sp.profile.id} style={{
                    position: 'relative',
                    height: isMobile ? 'calc(100vh - 225px)' : 'calc(100vh - 230px)',
                    minHeight: isMobile ? 500 : 520,
                    maxHeight: 760,
                    marginBottom: 12,
                    scrollSnapAlign: 'start',
                    scrollSnapStop: 'always',
                  }}>
                    <SwipeCard
                      sp={sp}
                      onLike={handleLike}
                      onPass={handlePass}
                      onReport={(id, name) => setModerationTarget({ id, name })}
                      onViewProfile={openPersonProfile}
                      isTop={false}
                      stackOffset={0}
                      visualOffset={0}
                      forceInteractive
                      feedMode
                      enableKeyboard={false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div
                onWheel={handleStackScroll}
                onTouchStart={handleStackTouchStart}
                onTouchEnd={handleStackTouchEnd}
                style={{ position: 'relative', width: '100%', maxWidth: 500, height: 'min(70vh, 700px)', overflow: 'hidden' }}
              >
                {(() => {
                  const renderStart = stackAnimating && stackAnimDir === 'up'
                    ? Math.max(0, stackStart - 1)
                    : stackStart
                  const renderCount = 4
                  const cards = scored.slice(renderStart, renderStart + renderCount)
                  const activeIndex = stackAnimating && stackAnimDir === 'up' ? 1 : 0

                  return cards.map((sp, idx) => {
                    const baseOffset = idx - activeIndex
                    const visualOffset = stackAnimating
                      ? (stackAnimDir === 'down' ? baseOffset - 1 : baseOffset + 1)
                      : baseOffset
                    return (
                      <SwipeCard
                        key={sp.profile.id}
                        sp={sp}
                        onLike={handleLike}
                        onPass={handlePass}
                        onReport={(id, name) => setModerationTarget({ id, name })}
                        onViewProfile={openPersonProfile}
                        isTop={idx === activeIndex}
                        stackOffset={baseOffset}
                        visualOffset={visualOffset}
                      />
                    )
                  }).reverse()
                })()}
              </div>
            )}

            {isMobile && scored.length > 1 && (
              <p style={{ marginTop: 8, fontSize: 11, color: 'rgba(245,220,251,0.72)', fontFamily: "'DM Sans', sans-serif" }}>
                Scroll to browse matches ({Math.min(stackStart + 1, scored.length)}/{scored.length})
              </p>
            )}
            {scored.length <= 5 && hasMore && (
              <button onClick={() => { const np = page + 1; setPage(np); fetchProfiles(np, appliedFilters, true) }}
                disabled={loadingMore}
                style={{
                  marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 50,
                  border: '1.5px solid rgba(240,56,104,0.28)',
                  background: 'rgba(255,255,255,0.07)', color: 'rgba(240,232,244,0.8)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  backdropFilter: 'blur(8px)',
                  opacity: loadingMore ? 0.5 : 1,
                }}>
                {loadingMore
                  ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(244,63,94,0.3)', borderTopColor: '#f43f5e', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} /> Loading…</>
                  : 'Load more matches'
                }
              </button>
            )}
          </div>

        ) : (

          // ── GRID MODE ──
          <>
            <p style={{ fontSize: 11, color: '#a37a82', marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
              {scored.length} profile{scored.length !== 1 ? 's' : ''} · sorted by compatibility
              {activeFilterCount > 0 ? ' · filtered' : ''}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {scored.map(sp => {
                const p = sp.profile
                const photoUrl = getPhotoUrl(p.photos)
                const ageLabel = AGE_RANGE_LABELS[p.age_range] ?? ''
                const initials = getInitials(p.full_name)
                const isActing = actionLoading === p.id
                const isActive = p.last_active ? Date.now() - new Date(p.last_active).getTime() < 86_400_000 : false
                const firstPrompt = p.prompts?.[0] ?? null

                return (
                  <div key={p.id} style={{
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 20,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.09)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.32)',
                    backdropFilter: 'blur(12px)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = '0 8px 36px rgba(240,56,104,0.18)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.32)'
                    }}
                  >
                    {/* Photo */}
                    <div style={{ position: 'relative', aspectRatio: '3/4', background: 'linear-gradient(135deg, #1a1030, #0e0c24)' }}>
                      {photoUrl ? (
                        <img src={photoUrl} alt={p.full_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #f43f5e, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{initials}</span>
                          </div>
                        </div>
                      )}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,10,15,0.6) 0%, transparent 50%)', pointerEvents: 'none' }} />
                      {p.here_tonight && (
                        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 3, background: 'linear-gradient(135deg, rgba(240,56,104,0.82), rgba(184,32,60,0.82))', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '3px 8px', border: '1px solid rgba(240,56,104,0.5)', boxShadow: '0 2px 10px rgba(240,56,104,0.3)' }}>
                          <span style={{ fontSize: 10 }}>🔥</span>
                          <span style={{ fontSize: 10, color: '#fff0f4', fontWeight: 700 }}>Here Tonight</span>
                        </div>
                      )}
                      {isActive && !p.here_tonight && (
                        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '3px 8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                          <span style={{ fontSize: 10, color: '#e9fbe9', fontWeight: 600 }}>Active</span>
                        </div>
                      )}
                      {/* Prompt overlay */}
                      {firstPrompt && (
                        <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '6px 10px' }}>
                          <p style={{ margin: 0, fontSize: 10, color: 'rgba(252,205,234,0.9)', fontWeight: 600, marginBottom: 2 }}>{firstPrompt.question}</p>
                          <p style={{ margin: 0, fontSize: 11, color: 'white', lineHeight: 1.4, fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}>{firstPrompt.answer}</p>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '10px 12px' }}>
                      <h3 style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#f0e8f4', fontFamily: "'Fraunces', Georgia, serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.full_name}{ageLabel ? `, ${ageLabel}` : ''}
                      </h3>
                      {p.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 6 }}>
                          <MapPin size={10} color="#a37a82" />
                          <span style={{ fontSize: 11, color: 'rgba(240,232,244,0.55)', fontFamily: "'DM Sans', sans-serif" }}>{p.location}</span>
                        </div>
                      )}
                      {p.interests?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                          {p.interests.slice(0, 2).map(interest => (
                            <span key={interest} style={{ fontSize: 10, background: 'rgba(244,63,94,0.06)', color: '#f43f5e', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(244,63,94,0.1)' }}>
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handlePass(p.id)} disabled={!!isActing} style={{
                          flex: 1, padding: '7px', borderRadius: 12,
                          border: '1.5px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.08)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: isActing ? 0.4 : 1,
                        }}>
                          <X size={15} color="rgba(240,232,244,0.6)" />
                        </button>
                        <button onClick={() => handleLike(sp)} disabled={!!isActing} style={{
                          flex: 1, padding: '7px', borderRadius: 12,
                          background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                          border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: isActing ? 0.4 : 1,
                          boxShadow: '0 3px 12px rgba(244,63,94,0.3)',
                        }}>
                          {isActing
                            ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
                            : <Heart size={15} color="white" fill="white" />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                <button onClick={() => { const np = page + 1; setPage(np); fetchProfiles(np, appliedFilters, true) }}
                  disabled={loadingMore}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 28px', borderRadius: 50,
                    border: '1.5px solid rgba(240,56,104,0.28)',
                    background: 'rgba(255,255,255,0.07)', color: 'rgba(240,232,244,0.8)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: loadingMore ? 0.5 : 1,
                  }}>
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showChatPane && (
      <div style={{ position: 'fixed', left: 0, top: TOP_HEADER_HEIGHT, bottom: 72, zIndex: isMobile ? 68 : 64, width: '100%', pointerEvents: 'none' }}>
        <aside style={{
          pointerEvents: 'auto',
            width: isMobile ? '100%' : '76%',
            maxWidth: isMobile ? '100%' : 520,
          height: '100%',
          overflow: 'hidden',
          borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(12,10,30,0.99)',
          padding: 0,
          boxShadow: '0 8px 20px rgba(8,2,20,0.2)',
        }}>
          {!drawerChat ? (
            <div style={{ height: '100%', borderRadius: 0, border: 'none', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
              <MatchesPage embedded />
            </div>
          ) : (
            <div style={{ height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, color: 'white' }}>Chat</h3>
                <button onClick={() => setDrawerChat(null)} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.24)',
                  background: 'rgba(255,255,255,0.08)', color: '#f8e9ff', cursor: 'pointer',
                  display: 'grid', placeItems: 'center',
                }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ height: 'calc(100% - 44px)', overflow: 'hidden', borderRadius: 14 }}>
                <Chat
                  conversationId={drawerChat.conversationId}
                  otherProfile={drawerChat.profile as any}
                  onBack={() => setDrawerChat(null)}
                  embedded
                />
              </div>
            </div>
          )}
        </aside>
      </div>
      )}

      {showSelfSettings && (
        <div style={{ position: 'fixed', left: 0, top: TOP_HEADER_HEIGHT, bottom: 72, zIndex: 65, width: '100%', pointerEvents: 'none' }}>
          <aside style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: 520,
            height: '100%',
            overflow: 'hidden',
            marginLeft: 'auto',
            borderLeft: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(12,10,30,0.99)',
            padding: 0,
            boxShadow: '0 8px 20px rgba(8,2,20,0.2)',
          }}>
            <iframe
              src="/profile?embedded=1"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'transparent',
              }}
            />
          </aside>
        </div>
      )}

      {viewProfileSp && !showSelfSettings && (
        <div style={{ position: 'fixed', left: 0, top: TOP_HEADER_HEIGHT, bottom: 72, zIndex: 180, width: '100%', pointerEvents: 'none' }}>
          <aside style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: isMobile ? '100%' : 480,
            height: '100%',
            overflowY: 'auto',
            marginLeft: isMobile ? 0 : 'auto',
            borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(12,10,30,0.99)',
            padding: 16,
            boxShadow: '0 8px 20px rgba(8,2,20,0.2)',
          }}>
            <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, color: 'white' }}>Profile</h3>
              <button
                onClick={() => setViewProfileSp(null)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.24)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#f8e9ff',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.14)', marginBottom: 12 }}>
              <img
                src={(viewProfileSp.profile.photos?.[drawerPhotoIdx] as any)?.url ?? getPhotoUrl(viewProfileSp.profile.photos) ?? ''}
                alt={viewProfileSp.profile.full_name}
                style={{ width: '100%', height: 400, objectFit: 'cover', objectPosition: 'top' }}
              />
            </div>
            {Array.isArray(viewProfileSp.profile.photos) && viewProfileSp.profile.photos.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 10 }}>
                {viewProfileSp.profile.photos.map((photo: any, i: number) => (
                  <button
                    key={`thumb-${i}`}
                    onClick={() => setDrawerPhotoIdx(i)}
                    style={{
                      width: 66, height: 66, borderRadius: 12, overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                      border: i === drawerPhotoIdx ? '2px solid rgba(236,72,153,0.6)' : '1px solid rgba(255,255,255,0.2)',
                      padding: 0, background: 'transparent',
                    }}
                  >
                    <img src={photo?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
            <p style={{ margin: '0 0 6px', fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, color: 'white', lineHeight: 1.1 }}>
              {viewProfileSp.profile.full_name}
            </p>
            {viewProfileSp.profile.location && (
              <p style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(245,225,251,0.9)', fontSize: 13, fontFamily: "Georgia, serif" }}>
                <MapPin size={13} color="#f9a8d4" />
                {viewProfileSp.profile.location}
              </p>
            )}
            <div style={{ marginBottom: 12 }}>
              <button
                onClick={() => openChatWithProfile(viewProfileSp.profile)}
                style={{
                  width: '100%', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #f43f5e, #ec4899)', color: 'white',
                  fontFamily: "Georgia, serif",
                  fontWeight: 700, fontSize: 13, padding: '10px 12px',
                  cursor: 'pointer', boxShadow: '0 3px 10px rgba(244,63,94,0.2)',
                }}
              >
                Message
              </button>
            </div>
            {viewProfileSp.profile.bio && (
              <div style={{ marginBottom: 12, borderRadius: 14, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', padding: 12 }}>
                <p style={{ margin: '0 0 5px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(249,168,212,0.8)', fontWeight: 700 }}>
                  About
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#f8e9ff', lineHeight: 1.6 }}>{viewProfileSp.profile.bio}</p>
              </div>
            )}
            <div style={{ marginBottom: 12, borderRadius: 14, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', padding: 12 }}>
              <p style={{ margin: '0 0 8px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(249,168,212,0.8)', fontWeight: 700 }}>
                Activities & Interests
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {viewProfileSp.profile.looking_for.slice(0, 1).map((intent, i) => (
                  <span key={`${intent}-${i}`} style={{
                    padding: '4px 11px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    border: '1px solid rgba(236,72,153,0.5)',
                    background: 'rgba(236,72,153,0.2)',
                    color: '#ffe3f3',
                  }}>
                    {intent}
                  </span>
                ))}
                {viewProfileSp.profile.interests.slice(0, 10).map((interest, i) => (
                  <span key={`${interest}-${i}`} style={{
                    padding: '4px 11px',
                    borderRadius: 999,
                    fontSize: 11,
                    border: '1px solid rgba(255,255,255,0.22)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#f0e7fb',
                  }}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            {viewProfileSp.reasons.length > 0 && (
              <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', padding: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(249,168,212,0.8)', fontWeight: 700 }}>
                  Why you match
                </p>
                {viewProfileSp.reasons.slice(0, 5).map((reason, i) => (
                  <p key={i} style={{ margin: '0 0 6px', color: '#f8e9ff', fontSize: 13 }}>
                    • {reason}
                  </p>
                ))}
              </div>
            )}
            </>
          </aside>
        </div>
      )}
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0c0a1e' }} />}>
      <BrowsePageContent />
    </Suspense>
  )
}
