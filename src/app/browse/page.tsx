/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import Image from 'next/image'

import {
  Heart, X, Search, SlidersHorizontal, MapPin,
  RefreshCw, ChevronDown, Sparkles, MessageCircle,
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
  isTop: boolean; stackOffset: number
}

function SwipeCard({ sp, onLike, onPass, onReport, isTop, stackOffset }: SwipeCardProps) {
  const supabase = createClient()
  const p = sp.profile
  const ageLabel = AGE_RANGE_LABELS[p.age_range] ?? ''
  const initials = getInitials(p.full_name)

  const cardRef    = useRef<HTMLDivElement>(null)
  const startX     = useRef(0)
  const currentX   = useRef(0)
  const isDragging = useRef(false)
  const photoStartX = useRef(0)
  const isDraggingPhoto = useRef(false)

  const [dragDelta, setDragDelta]       = useState(0)
  const [isFlying, setIsFlying]         = useState(false)
  const [flyDir, setFlyDir]             = useState<'left' | 'right' | null>(null)
  const [photoIdx, setPhotoIdx]         = useState(0)
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [isActive, setIsActive]         = useState(false)

  useEffect(() => {
    const active = p.last_active
      ? Date.now() - new Date(p.last_active).getTime() < 86_400_000 : false
    setIsActive(active)
  }, [p.last_active])

  const sortedPhotos = [...(p.photos ?? [])].sort((a, b) => a.slot - b.slot)
  const allMedia = sortedPhotos  // videos would be added here later

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
    if (!isTop || isFlying) return
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

  // Photo swipe (to cycle photos)
  const onPhotoPointerDown = (e: React.PointerEvent) => {
    isDraggingPhoto.current = true
    photoStartX.current = e.clientX
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPhotoPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingPhoto.current) return
    isDraggingPhoto.current = false
    const delta = e.clientX - photoStartX.current
    if (Math.abs(delta) < 10) {
      // It's a tap — toggle info
      setInfoExpanded(v => !v)
      return
    }
    if (delta < -40 && photoIdx < allMedia.length - 1) setPhotoIdx(i => i + 1)
    if (delta > 40  && photoIdx > 0) setPhotoIdx(i => i - 1)
  }

  useEffect(() => {
    if (!isTop) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') triggerFly('right')
      if (e.key === 'ArrowLeft') triggerFly('left')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isTop, triggerFly])

  const rotation = dragDelta * 0.06
  const likeOpacity = Math.max(0, Math.min(1, dragDelta / 80))
  const passOpacity = Math.max(0, Math.min(1, -dragDelta / 80))
  const stackScale = 1 - stackOffset * 0.04
  const stackTranslateY = stackOffset * 12

  const cardTransform = isFlying
    ? flyDir === 'right' ? 'translateX(130%) rotate(22deg)' : 'translateX(-130%) rotate(-22deg)'
    : isTop
      ? `translateX(${dragDelta}px) rotate(${rotation}deg)`
      : `translateY(${stackTranslateY}px) scale(${stackScale})`

  const photoHeight = infoExpanded ? '40%' : '68%'
  const infoHeight  = infoExpanded ? '60%' : '32%'
  const displayPhoto = sortedPhotos[photoIdx] ?? null
  const firstPrompt = p.prompts?.[0] ?? null

  return (
    <div
      ref={cardRef}
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(255,251,249,0.97)',
        borderRadius: '28px',
        boxShadow: isTop
          ? '0 20px 60px rgba(180,60,80,0.18), 0 4px 20px rgba(0,0,0,0.08)'
          : '0 8px 30px rgba(180,60,80,0.10)',
        overflow: 'hidden',
        userSelect: 'none',
        transform: cardTransform,
        transition: isDragging.current ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor: isTop ? (isDragging.current ? 'grabbing' : 'grab') : 'default',
        zIndex: 10 - stackOffset,
        pointerEvents: isTop ? 'auto' : 'none',
        border: '1px solid rgba(244,63,94,0.08)',
      }}
      onPointerDown={onCardPointerDown}
      onPointerMove={onCardPointerMove}
      onPointerUp={onCardPointerUp}
      onPointerCancel={onCardPointerUp}
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
        }}
        onPointerDown={onPhotoPointerDown}
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
            background: 'linear-gradient(135deg, #fce7f3, #fdf2f8)',
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
          background: 'linear-gradient(to top, rgba(26,10,15,0.75) 0%, rgba(0,0,0,0) 55%)',
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
                height: 3, borderRadius: 2,
                width: i === photoIdx ? 20 : 6,
                background: i === photoIdx ? 'white' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.3s ease',
                boxShadow: i === photoIdx ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }} />
            ))}
          </div>
        )}

        {/* Active badge */}
        {isActive && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '4px 10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>Active</span>
          </div>
        )}

        {/* Report button */}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <button
            onClick={e => { e.stopPropagation(); onReport(p.id, p.full_name) }}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(8px)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <MoreVertical size={14} color="white" />
          </button>
        </div>

        {/* LIKE / PASS stamps */}
        <div style={{
          position: 'absolute', top: 24, left: 20,
          border: '3px solid #4ade80', borderRadius: 12,
          padding: '4px 14px', transform: 'rotate(-20deg)',
          opacity: likeOpacity, pointerEvents: 'none',
        }}>
          <span style={{ color: '#4ade80', fontWeight: 900, fontSize: 22, letterSpacing: 3 }}>LIKE</span>
        </div>
        <div style={{
          position: 'absolute', top: 24, right: 20,
          border: '3px solid #f87171', borderRadius: 12,
          padding: '4px 14px', transform: 'rotate(20deg)',
          opacity: passOpacity, pointerEvents: 'none',
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
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{p.location}</span>
            </div>
          )}
        </div>

        {/* Tap hint */}
        <div style={{
          position: 'absolute', bottom: 14, right: 16,
          display: 'flex', alignItems: 'center', gap: 4,
          pointerEvents: 'none', opacity: 0.7,
        }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
            {infoExpanded ? 'tap to collapse' : 'tap for more'}
          </span>
          <div style={{
            transform: infoExpanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.3s ease',
          }}>
            <ChevronUp size={14} color="rgba(255,255,255,0.7)" />
          </div>
        </div>
      </div>

      {/* ── Info area ── */}
      <div style={{
        height: infoHeight,
        transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 8px' }}>

          {/* Stitch divider */}
          <div style={{ marginBottom: 12 }}>
            <StitchDivider opacity={0.4} />
          </div>

          {firstPrompt && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <MessageCircle size={11} color="#f43f5e" />
                <span style={{
                  fontSize: 11, color: '#f43f5e', fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {firstPrompt.question}
                </span>
              </div>
              <p style={{
                margin: 0, fontSize: 14, color: '#2d1b1f',
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: 'italic', lineHeight: 1.5,
              }}>
                "{firstPrompt.answer}"
              </p>
            </div>
          )}

          {!firstPrompt && sp.reasons.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {sp.reasons.slice(0, 3).map((r, i) => (
                <span key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, background: 'rgba(244,63,94,0.06)',
                  color: '#f43f5e', padding: '3px 10px', borderRadius: 20,
                  border: '1px solid rgba(244,63,94,0.12)',
                }}>
                  <Sparkles size={9} /> {r}
                </span>
              ))}
            </div>
          )}

          {p.interests.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.interests.slice(0, infoExpanded ? 8 : 4).map(interest => (
                <span key={interest} style={{
                  fontSize: 11, background: 'rgba(253,248,245,1)',
                  color: '#6b4c52', padding: '3px 10px', borderRadius: 20,
                  border: '1px solid rgba(244,63,94,0.1)',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {interest}
                </span>
              ))}
              {p.interests.length > 4 && !infoExpanded && (
                <span style={{ fontSize: 11, color: '#a37a82' }}>+{p.interests.length - 4}</span>
              )}
            </div>
          )}

          {/* Extra prompts when expanded */}
          {infoExpanded && p.prompts.slice(1).map(prompt => (
            <div key={prompt.id} style={{
              marginTop: 12, paddingLeft: 12,
              borderLeft: '2px solid rgba(244,63,94,0.2)',
            }}>
              <p style={{ fontSize: 11, color: '#f43f5e', fontWeight: 600, margin: '0 0 2px' }}>
                {prompt.question}
              </p>
              <p style={{
                fontSize: 13, color: '#2d1b1f', margin: 0, lineHeight: 1.5,
                fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic',
              }}>
                "{prompt.answer}"
              </p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
          padding: '10px 16px 14px',
          borderTop: '1px solid rgba(244,63,94,0.06)',
        }}>
          {/* Pass */}
          <button
            onClick={e => { e.stopPropagation(); triggerFly('left') }}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              border: '2px solid rgba(200,150,150,0.25)',
              background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
              e.currentTarget.style.background = '#fef2f2'
              e.currentTarget.style.transform = 'scale(1.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(200,150,150,0.25)'
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <X size={20} color="#9ca3af" />
          </button>

          {/* Like — centrepiece */}
          <button
            onClick={e => { e.stopPropagation(); triggerFly('right') }}
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 6px 24px rgba(244,63,94,0.4)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.boxShadow = '0 10px 32px rgba(244,63,94,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(244,63,94,0.4)'
            }}
          >
            <Heart size={26} color="white" fill="white" />
          </button>

          {/* Stitch — super like */}
          <button
            onClick={e => { e.stopPropagation(); triggerFly('right') }}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              border: '2px solid rgba(244,63,94,0.2)',
              background: 'rgba(244,63,94,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease',
              boxShadow: '0 2px 12px rgba(244,63,94,0.08)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(244,63,94,0.5)'
              e.currentTarget.style.background = 'rgba(244,63,94,0.1)'
              e.currentTarget.style.transform = 'scale(1.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)'
              e.currentTarget.style.background = 'rgba(244,63,94,0.04)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <Sparkles size={18} color="#f43f5e" />
          </button>
        </div>
      </div>
    </div>
  )
}

const supabase = createClient()

// ── Browse Page ───────────────────────────────────────────────────
export default function BrowsePage() {
  const supabase = createClient()
  const { user, profile, loading } = useAuth()
  const router = useRouter()

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
  const [viewMode, setViewMode]                 = useState<ViewMode>('stack')

  const [filters, setFilters] = useState<Filters>({ location: '', intents: [], interests: [], ageRanges: [] })
  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters)

  useEffect(() => { if (!loading && !user) router.push('/auth') }, [user, loading, router])
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
    fetchProfiles(1, appliedFilters, false)
  }, [user, profile, appliedFilters]) // eslint-disable-line

  useEffect(() => {
    if (!openMenu) return
    const handler = () => setOpenMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openMenu])

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
    <div style={{ minHeight: '100vh', overflowY: 'auto' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '16px 16px' }}>

        {/* Match alert */}
        {matchAlert && (
          <div style={{
            position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
            zIndex: 60,
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,251,249,0.97)',
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
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#2d1b1f',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 50,
              border: `2px solid ${showFilters || activeFilterCount > 0 ? 'rgba(244,63,94,0.5)' : 'rgba(244,63,94,0.12)'}`,
              background: showFilters || activeFilterCount > 0 ? 'rgba(244,63,94,0.06)' : 'rgba(255,255,255,0.8)',
              color: showFilters || activeFilterCount > 0 ? '#f43f5e' : '#8b7280',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              backdropFilter: 'blur(8px)',
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
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a37a82' }} />
            <input
              type="text"
              placeholder="Search by location…"
              value={filters.location}
              onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
              style={{
                width: '100%', paddingLeft: 34, paddingRight: 16,
                paddingTop: 9, paddingBottom: 9,
                border: '2px solid rgba(244,63,94,0.1)',
                borderRadius: 50, fontSize: 13,
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                color: '#2d1b1f', outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(244,63,94,0.35)'}
              onBlur={e => e.target.style.borderColor = 'rgba(244,63,94,0.1)'}
            />
          </div>

          {/* View toggle */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.8)', borderRadius: 50,
            padding: 4, gap: 2, border: '1.5px solid rgba(244,63,94,0.1)',
            backdropFilter: 'blur(8px)',
          }}>
            {(['stack', 'grid'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{
                  width: 30, height: 30, borderRadius: 50,
                  border: 'none', cursor: 'pointer',
                  background: viewMode === mode ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: viewMode === mode ? '0 2px 8px rgba(244,63,94,0.3)' : 'none',
                }}>
                {mode === 'stack'
                  ? <Layers size={13} color={viewMode === mode ? 'white' : '#a37a82'} />
                  : <LayoutGrid size={13} color={viewMode === mode ? 'white' : '#a37a82'} />
                }
              </button>
            ))}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{
            background: 'rgba(255,251,249,0.97)',
            border: '1px solid rgba(244,63,94,0.1)',
            borderRadius: 24, padding: 20, marginBottom: 16,
            boxShadow: '0 8px 32px rgba(180,60,80,0.10)',
            backdropFilter: 'blur(16px)',
          }}>
            {/* Age */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#6b4c52', marginBottom: 8,
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
                      border: `1.5px solid ${filters.ageRanges.includes(opt.value) ? '#f43f5e' : 'rgba(244,63,94,0.15)'}`,
                      background: filters.ageRanges.includes(opt.value) ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'rgba(255,255,255,0.8)',
                      color: filters.ageRanges.includes(opt.value) ? 'white' : '#6b4c52',
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
              <p style={{ fontSize: 12, fontWeight: 700, color: '#6b4c52', marginBottom: 8,
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
                      border: `1.5px solid ${filters.intents.includes(intent.value) ? '#f43f5e' : 'rgba(244,63,94,0.15)'}`,
                      background: filters.intents.includes(intent.value) ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'rgba(255,255,255,0.8)',
                      color: filters.intents.includes(intent.value) ? 'white' : '#6b4c52',
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
              <p style={{ fontSize: 12, fontWeight: 700, color: '#6b4c52', marginBottom: 8,
                fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Interests
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                {INTERESTS_BY_CATEGORY.flatMap(cat => cat.tags.map(tag => (
                  <button key={tag}
                    onClick={() => setFilters(f => ({
                      ...f, interests: f.interests.includes(tag)
                        ? f.interests.filter(i => i !== tag) : [...f.interests, tag],
                    }))}
                    style={{
                      padding: '5px 12px', borderRadius: 50, fontSize: 12, cursor: 'pointer',
                      border: `1.5px solid ${filters.interests.includes(tag) ? '#f43f5e' : 'rgba(244,63,94,0.15)'}`,
                      background: filters.interests.includes(tag) ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'rgba(255,255,255,0.8)',
                      color: filters.interests.includes(tag) ? 'white' : '#6b4c52',
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
                border: '1.5px solid rgba(244,63,94,0.15)',
                background: 'white', color: '#8b7280', fontSize: 13,
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 16, textAlign: 'center' }}>
            <div style={{ opacity: 0.25, marginBottom: 8 }}>
              <Image src="/icon.svg" alt="Mebley logo" width={48} height={48} />
            </div>
            <h3 style={{ margin: 0, fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, color: '#2d1b1f' }}>
              No profiles found
            </h3>
            <p style={{ margin: 0, color: '#a37a82', fontSize: 14, maxWidth: 260, fontFamily: "'DM Sans', sans-serif" }}>
              {activeFilterCount > 0 ? 'Try adjusting your filters.' : 'New people join every day — check back soon.'}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={handleResetFilters} style={{
                padding: '10px 24px', borderRadius: 50,
                background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                border: 'none', color: 'white', fontSize: 13,
                fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(244,63,94,0.3)',
              }}>Clear filters</button>
            )}
          </div>

        ) : viewMode === 'stack' ? (

          // ── STACK MODE ──
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ fontSize: 11, color: '#a37a82', marginBottom: 12, alignSelf: 'flex-start',
              fontFamily: "'DM Sans', sans-serif" }}>
              {scored.length} match{scored.length !== 1 ? 'es' : ''} · swipe or ← → keys
              {activeFilterCount > 0 ? ' · filtered' : ''}
            </p>
            <div style={{ position: 'relative', width: '100%', height: 580 }}>
              {scored.slice(0, 3).map((sp, idx) => (
                <SwipeCard key={sp.profile.id} sp={sp}
                  onLike={handleLike} onPass={handlePass}
                  onReport={(id, name) => setModerationTarget({ id, name })}
                  isTop={idx === 0} stackOffset={idx} />
              )).reverse()}
            </div>
            {scored.length <= 5 && hasMore && (
              <button onClick={() => { const np = page + 1; setPage(np); fetchProfiles(np, appliedFilters, true) }}
                disabled={loadingMore}
                style={{
                  marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 50,
                  border: '1.5px solid rgba(244,63,94,0.2)',
                  background: 'rgba(255,255,255,0.8)', color: '#8b7280',
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
                    background: 'rgba(255,251,249,0.97)',
                    borderRadius: 20,
                    overflow: 'hidden',
                    border: '1px solid rgba(244,63,94,0.08)',
                    boxShadow: '0 4px 20px rgba(180,60,80,0.08)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(180,60,80,0.15)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(180,60,80,0.08)'
                    }}
                  >
                    {/* Photo */}
                    <div style={{ position: 'relative', aspectRatio: '3/4', background: 'linear-gradient(135deg, #fce7f3, #fdf2f8)' }}>
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
                      {isActive && (
                        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: '3px 8px' }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                          <span style={{ fontSize: 10, color: '#374151', fontWeight: 600 }}>Active</span>
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
                      <h3 style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#2d1b1f', fontFamily: "'Fraunces', Georgia, serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.full_name}{ageLabel ? `, ${ageLabel}` : ''}
                      </h3>
                      {p.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 6 }}>
                          <MapPin size={10} color="#a37a82" />
                          <span style={{ fontSize: 11, color: '#a37a82', fontFamily: "'DM Sans', sans-serif" }}>{p.location}</span>
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
                          border: '1.5px solid rgba(244,63,94,0.12)', background: 'white',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: isActing ? 0.4 : 1,
                        }}>
                          <X size={15} color="#9ca3af" />
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
                    border: '1.5px solid rgba(244,63,94,0.2)',
                    background: 'rgba(255,255,255,0.8)', color: '#8b7280',
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
    </div>
  )
}
