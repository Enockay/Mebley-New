'use client'
/**
 * Discover (2026 redesign). Data and actions live here; the screen itself is
 * src/components/App/DiscoverView.tsx. The previous implementation is in git
 * history (before the redesign commit) if anything needs to be compared.
 */
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePaywall } from '@/hooks/usePaywall'
import { DISCOVER_MESSAGE_START_CREDITS } from '@/lib/discover-message-start.constants'
import DiscoverView, { type ChipKey, type ChipState } from '@/components/App/DiscoverView'
import FiltersSheet, { EMPTY_FILTERS, type Filters } from '@/components/App/FiltersSheet'
import { toPerson, type DiscoverPerson } from '@/components/App/discover-model'
import StitchModal from '@/components/Discover/StitchModal'
import BlockReport from '@/components/Moderation/BlockReport'
import { Heart } from 'lucide-react'

const PAGE_SIZE = 20
const NEAR_KM = 25

type Quick = { near: boolean; serious: boolean; verified: boolean; online: boolean }

function buildUrl(page: number, f: Filters, q: Quick): string {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
  if (f.location.trim()) params.set('location', f.location.trim())
  const intents = q.serious ? [...new Set([...f.intents, 'serious relationship'])] : f.intents
  if (intents.length) params.set('intents', intents.join(','))
  if (f.interests.length) params.set('interests', f.interests.join(','))
  if (f.ageRanges.length) params.set('ageRanges', f.ageRanges.join(','))
  if (q.verified) params.set('verified', '1')
  if (q.online) params.set('online', '1')
  if (q.near) params.set('maxKm', String(NEAR_KM))
  return `/api/discover?${params.toString()}`
}

function saveCoordinates() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(pos => {
    fetch('/api/profile/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    }).catch(() => {})
  }, () => {}, { timeout: 8000, maximumAge: 300_000 })
}

function BrowseContent() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const { openPaywall } = usePaywall()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [people, setPeople] = useState<DiscoverPerson[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'cards' | 'grid'>('cards')
  const [filters, setFilters] = useState<Filters>(() => ({ ...EMPTY_FILTERS, location: searchParams.get('area') ?? '' }))
  const [quick, setQuick] = useState<Quick>({ near: false, serious: false, verified: false, online: false })
  const [showFilters, setShowFilters] = useState(false)
  const [stitchFor, setStitchFor] = useState<{ person: DiscoverPerson; context?: string } | null>(null)
  const [reportFor, setReportFor] = useState<DiscoverPerson | null>(null)
  const [fullId, setFullId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const viewed = useRef(new Set<string>())

  // Area search from the top bar (?area=)
  const area = searchParams.get('area')
  useEffect(() => {
    if (area !== null) setFilters(f => (f.location === area ? f : { ...f, location: area }))
  }, [area])

  useEffect(() => { if (!loading && !user) router.push('/auth') }, [user, loading, router])
  useEffect(() => { if (!loading && user && !profile) router.push('/setup') }, [user, profile, loading, router])
  useEffect(() => { if (user) saveCoordinates() }, [user])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(t => (t === msg ? null : t)), 3500)
  }, [])

  const load = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true); else setFetching(true)
    setError(null)
    try {
      const res = await fetch(buildUrl(pageNum, filters, quick), { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not load people')
      const incoming: DiscoverPerson[] = (json.profiles ?? []).map(toPerson)
      setPeople(prev => {
        if (!append) return incoming
        const seen = new Set(prev.map(p => p.id))
        return [...prev, ...incoming.filter(p => !seen.has(p.id))]
      })
      if (!append) setSelectedId(incoming[0]?.id ?? null)
      setHasMore((json.profiles ?? []).length >= PAGE_SIZE)
      setPage(pageNum)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load people')
    } finally {
      setFetching(false)
      setLoadingMore(false)
    }
  }, [filters, quick])

  useEffect(() => { if (user && profile) load(1, false) }, [user, profile, load])

  /** Remove someone after an action and move to the next person. */
  const peopleRef = useRef<DiscoverPerson[]>([])
  useEffect(() => { peopleRef.current = people }, [people])
  const advance = useCallback((id: string) => {
    const prev = peopleRef.current
    const i = prev.findIndex(p => p.id === id)
    const next = prev.filter(p => p.id !== id)
    peopleRef.current = next
    setPeople(next)
    setSelectedId(next[Math.min(Math.max(i, 0), next.length - 1)]?.id ?? null)
    if (next.length < 4 && hasMore && !loadingMore) load(page + 1, true)
  }, [hasMore, loadingMore, load, page])

  const onLike = useCallback(async (p: DiscoverPerson) => {
    if (busy) return
    setBusy(true)
    advance(p.id)
    try {
      const res = await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ likeeId: p.id }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'Like failed')
      if (json.isMatch) showToast(`It’s a match! You and ${p.name.split(' ')[0]} can now chat.`)
    } catch {
      setPeople(prev => [p, ...prev])
      setSelectedId(p.id)
      showToast('That didn’t go through. Please try again.')
    } finally {
      setBusy(false)
    }
  }, [busy, advance, showToast])

  const onPass = useCallback((p: DiscoverPerson) => {
    advance(p.id)
    fetch('/api/passes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passedId: p.id }) }).catch(() => {})
  }, [advance])

  const sendStitch = useCallback(async (note: string) => {
    if (!stitchFor) return
    const { person, context } = stitchFor
    const full = context ? `Re: ${context}\n${note}`.slice(0, 280) : note
    const res = await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ likeeId: person.id, stitch: true, note: full }) })
    const json = await res.json().catch(() => ({}))
    if (res.status === 402 || json?.code === 'insufficient_stitch') {
      setStitchFor(null)
      openPaywall('general', 'credits')
      return
    }
    if (!res.ok) throw new Error(json?.error ?? 'Could not send your Stitch')
    setStitchFor(null)
    advance(person.id)
    showToast(json?.isMatch ? `It’s a match with ${person.name.split(' ')[0]}!` : `Stitch sent to ${person.name.split(' ')[0]}.`)
  }, [stitchFor, advance, showToast, openPaywall])

  const onMessage = useCallback(async (p: DiscoverPerson) => {
    try {
      const res = await fetch('/api/chat/open', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId: p.id }) })
      const data = await res.json().catch(() => ({}))
      if (res.status === 402) {
        showToast(typeof data?.message === 'string' ? data.message : `You need ${DISCOVER_MESSAGE_START_CREDITS} credits to message first.`)
        openPaywall('general', 'credits')
        return
      }
      if (!res.ok || !data?.conversationId) throw new Error()
      await refreshProfile()
      router.push(`/matches?conversation=${encodeURIComponent(data.conversationId)}`)
    } catch {
      showToast('Could not open the chat right now.')
    }
  }, [openPaywall, refreshProfile, router, showToast])

  const onViewed = useCallback((p: DiscoverPerson) => {
    if (viewed.current.has(p.id)) return
    viewed.current.add(p.id)
    fetch('/api/profile/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ viewedId: p.id }) }).catch(() => {})
  }, [])

  const prof = profile as unknown as { age_min?: number | null; age_max?: number | null; location?: string | null } | null
  const chips: ChipState = {
    age: filters.ageRanges.length > 0,
    ageLabel: `${prof?.age_min ?? 18}–${prof?.age_max ?? 99}`,
    near: quick.near,
    nearKm: NEAR_KM,
    serious: quick.serious,
    verified: quick.verified,
    online: quick.online,
    filterCount: [filters.location.trim(), filters.intents.length, filters.interests.length, filters.ageRanges.length].filter(Boolean).length,
  }
  const onToggleChip = (k: ChipKey) => {
    if (k === 'age') { setShowFilters(true); return }
    setQuick(q => ({ ...q, [k]: !q[k as keyof Quick] }))
  }

  const subtitle = useMemo(() => {
    const where = filters.location.trim() || prof?.location?.split(',')[0]?.trim()
    const n = people.length
    if (fetching && n === 0) return 'Finding people for you…'
    return `${n}${hasMore ? '+' : ''} ${n === 1 ? 'person matches' : 'people match'} your filters${where ? ` near ${where}` : ''}`
  }, [people.length, hasMore, fetching, filters.location, prof?.location])

  if (loading || !profile) {
    return <div className="ma" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}><div className="ma-spinner" /></div>
  }

  return (
    <>
      <DiscoverView
        people={people}
        selectedId={selectedId}
        subtitle={subtitle}
        mode={mode}
        onMode={setMode}
        chips={chips}
        onToggleChip={onToggleChip}
        onOpenFilters={() => setShowFilters(true)}
        busy={busy}
        loading={fetching}
        error={error}
        onRetry={() => load(1, false)}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={() => load(page + 1, true)}
        fullProfileId={fullId}
        onOpenFullProfile={p => setFullId(p?.id ?? null)}
        onLike={onLike}
        onPass={onPass}
        onStitch={(p, context) => setStitchFor({ person: p, context })}
        onMessage={onMessage}
        onReport={p => setReportFor(p)}
        onSelect={p => setSelectedId(p.id)}
        onViewed={onViewed}
      />
      {showFilters ? (
        <FiltersSheet value={filters} onClose={() => setShowFilters(false)} onApply={f => { setFilters(f); setShowFilters(false) }} />
      ) : null}
      {stitchFor ? (
        <StitchModal targetName={stitchFor.person.name} context={stitchFor.context} onSend={sendStitch} onClose={() => setStitchFor(null)} />
      ) : null}
      {reportFor ? (
        <BlockReport
          targetId={reportFor.id}
          targetName={reportFor.name}
          onClose={() => setReportFor(null)}
          onBlocked={id => { advance(id); setReportFor(null) }}
        />
      ) : null}
      {toast ? <div className="ma ma-toast" role="status"><Heart size={18} color="#e8355f" fill="#e8355f" /> {toast}</div> : null}
    </>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={null}>
      <BrowseContent />
    </Suspense>
  )
}
