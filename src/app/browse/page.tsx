'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Heart, X, Search, SlidersHorizontal, MapPin, RefreshCw, ChevronDown } from 'lucide-react'
import { RELATIONSHIP_INTENTS, INTERESTS_BY_CATEGORY } from '@/types/database.types'

// ── Types ────────────────────────────────────────────────────────────────────

interface BrowseProfile {
  id: string
  full_name: string
  date_of_birth: string
  gender: string
  bio: string | null
  location: string | null
  nationality: string | null
  interests: string[]
  looking_for: string[]
  photos: { url: string; slot: number }[]
  last_active: string | null
  profile_completeness: number | null
}

interface Filters {
  location: string
  intents: string[]
  interests: string[]
  ageMin: number
  ageMax: number
}

const PAGE_SIZE = 20

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAge(dateOfBirth: string): number {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function getPhotoUrl(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null
  const first = photos[0]
  if (!first) return null
  if (typeof first === 'string') return first
  if (typeof first === 'object' && 'url' in first && typeof (first as { url: unknown }).url === 'string')
    return (first as { url: string }).url
  return null
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

// ── Browse Page ───────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  const [profiles, setProfiles]         = useState<BrowseProfile[]>([])
  const [fetching, setFetching]         = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [hasMore, setHasMore]           = useState(true)
  const [page, setPage]                 = useState(0)
  const [likedIds, setLikedIds]         = useState<Set<string>>(new Set())
  const [passedIds, setPassedIds]       = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters]   = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [matchAlert, setMatchAlert]     = useState<string | null>(null)

  const [filters, setFilters] = useState<Filters>({
    location:  '',
    intents:   [],
    interests: [],
    ageMin:    18,
    ageMax:    99,
  })

  // Applied filters — only update when user hits "Apply"
  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  // ── Fetch already-liked IDs so we can exclude them ──────────────────────
  useEffect(() => {
    if (!user) return
    supabase
      .from('likes')
      .select('likee_id')
      .eq('liker_id', user.id)
      .then(({ data }) => {
        if (data) setLikedIds(new Set(data.map(r => r.likee_id)))
      })
  }, [user])

  // ── Main fetch ───────────────────────────────────────────────────────────
  const fetchProfiles = useCallback(async (
    pageNum: number,
    currentFilters: Filters,
    append: boolean
  ) => {
    if (!user || !profile) return

    append ? setLoadingMore(true) : setFetching(true)
    setError(null)

    try {
      let query = supabase
        .from('profiles')
        .select(`
          id, full_name, date_of_birth, gender, bio, location,
          nationality, interests, looking_for, photos,
          last_active, profile_completeness
        `)
        .eq('is_active', true)
        .eq('visible', true)
        .neq('id', user.id)
        .order('last_active', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

      // Mutual gender preference filter:
      // Only show profiles whose gender_preference includes current user's gender
      // AND whose gender is in current user's gender_preference
      if (profile.gender) {
        query = query.contains('gender_preference', [profile.gender])
      }
      if (Array.isArray(profile.gender_preference) && profile.gender_preference.length > 0) {
        query = query.in('gender', profile.gender_preference as string[])
      }

      // Location filter — partial match
      if (currentFilters.location.trim()) {
        query = query.ilike('location', `%${currentFilters.location.trim()}%`)
      }

      // Intent filter — profile must share at least one intent
      if (currentFilters.intents.length > 0) {
        query = query.overlaps('looking_for', currentFilters.intents)
      }

      // Interests filter — profile must share at least one interest
      if (currentFilters.interests.length > 0) {
        query = query.overlaps('interests', currentFilters.interests)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const rows = (data ?? []) as BrowseProfile[]

      // Client-side: exclude already-liked/passed, apply age range
      const filtered = rows.filter(p => {
        if (likedIds.has(p.id)) return false
        if (passedIds.has(p.id)) return false
        const age = getAge(p.date_of_birth)
        if (age < currentFilters.ageMin || age > currentFilters.ageMax) return false
        return true
      })

      setProfiles(prev => append ? [...prev, ...filtered] : filtered)
      setHasMore(rows.length === PAGE_SIZE)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles')
    } finally {
      setFetching(false)
      setLoadingMore(false)
    }
  }, [user, profile, likedIds, passedIds])

  // Initial load + re-fetch when applied filters change
  useEffect(() => {
    if (!user || !profile) return
    setPage(0)
    fetchProfiles(0, appliedFilters, false)
  }, [user, profile, appliedFilters]) // eslint-disable-line react-hooks/exhaustive-deps

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
    const reset: Filters = { location: '', intents: [], interests: [], ageMin: 18, ageMax: 99 }
    setFilters(reset)
    setAppliedFilters(reset)
    setShowFilters(false)
  }

  // ── Like ─────────────────────────────────────────────────────────────────
  const handleLike = async (targetProfile: BrowseProfile) => {
    if (!user || actionLoading) return
    setActionLoading(targetProfile.id)

    // Optimistic — remove from grid immediately
    setProfiles(prev => prev.filter(p => p.id !== targetProfile.id))
    setLikedIds(prev => new Set([...prev, targetProfile.id]))

    try {
      const { error: likeError } = await supabase
        .from('likes')
        .insert({ liker_id: user.id, likee_id: targetProfile.id })

      if (likeError && likeError.code !== '23505') throw likeError // ignore duplicate

      // Check for mutual like → match
      const { data: mutual } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', targetProfile.id)
        .eq('likee_id', user.id)
        .maybeSingle()

      if (mutual) {
        // Create match + conversation if not already there
        await supabase.from('matches').upsert(
          { user1_id: user.id, user2_id: targetProfile.id },
          { onConflict: 'user1_id,user2_id' }
        )
        setMatchAlert(`🎉 It's a match with ${targetProfile.full_name}!`)
        setTimeout(() => setMatchAlert(null), 3500)
      }
    } catch (err) {
      console.error('Like error:', err)
      // Rollback optimistic update
      setProfiles(prev => [targetProfile, ...prev])
      setLikedIds(prev => { const s = new Set(prev); s.delete(targetProfile.id); return s })
    } finally {
      setActionLoading(null)
    }
  }

  // ── Pass ─────────────────────────────────────────────────────────────────
  const handlePass = (targetId: string) => {
    setPassedIds(prev => new Set([...prev, targetId]))
    setProfiles(prev => prev.filter(p => p.id !== targetId))
  }

  const activeFilterCount = [
    appliedFilters.location.trim() !== '',
    appliedFilters.intents.length > 0,
    appliedFilters.interests.length > 0,
    appliedFilters.ageMin !== 18 || appliedFilters.ageMax !== 99,
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

        {/* Match alert */}
        {matchAlert && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-pink-500 text-white px-6 py-3 rounded-full shadow-xl animate-bounce whitespace-nowrap">
            {matchAlert}
          </div>
        )}

        {/* ── Filter bar ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-pink-500 bg-pink-50 text-pink-600'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
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
        </div>

        {/* ── Filter panel ────────────────────────────────────────────── */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm space-y-5">

            {/* Age range */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Age range: {filters.ageMin}–{filters.ageMax}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={18} max={filters.ageMax - 1}
                  value={filters.ageMin}
                  onChange={e => setFilters(f => ({ ...f, ageMin: +e.target.value }))}
                  className="flex-1 accent-pink-500"
                />
                <input
                  type="range" min={filters.ageMin + 1} max={99}
                  value={filters.ageMax}
                  onChange={e => setFilters(f => ({ ...f, ageMax: +e.target.value }))}
                  className="flex-1 accent-pink-500"
                />
              </div>
            </div>

            {/* Intent filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Looking for</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(RELATIONSHIP_INTENTS).map(([key, intent]) => (
                  <button
                    key={key}
                    onClick={() => setFilters(f => ({
                      ...f,
                      intents: f.intents.includes(key)
                        ? f.intents.filter(i => i !== key)
                        : [...f.intents, key],
                    }))}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                      filters.intents.includes(key)
                        ? 'border-pink-500 bg-pink-500 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-pink-300'
                    }`}
                  >
                    {intent.emoji} {intent.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Interests</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {Object.values(INTERESTS_BY_CATEGORY).flatMap(cat =>
                  cat.tags.map(tag => (
                    <button
                      key={tag}
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
                      }`}
                    >
                      {tag}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Apply / Reset */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all"
              >
                Apply filters
              </button>
            </div>
          </div>
        )}

        {/* ── States: loading / error / empty ─────────────────────────── */}
        {fetching ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
            <p className="text-gray-500 text-sm">Finding profiles…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={() => fetchProfiles(0, appliedFilters, false)}
              className="flex items-center gap-2 bg-pink-500 text-white px-5 py-2 rounded-full text-sm"
            >
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="text-5xl">🎯</div>
            <h3 className="text-lg font-semibold text-gray-800">No profiles found</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              {activeFilterCount > 0
                ? 'Try adjusting your filters to see more people.'
                : 'Check back later — new people join every day.'}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="mt-2 px-5 py-2 bg-pink-500 text-white rounded-full text-sm font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ── Profile count ─────────────────────────────────────── */}
            <p className="text-xs text-gray-400 mb-3">
              Showing {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
              {activeFilterCount > 0 ? ' · filtered' : ''}
            </p>

            {/* ── Grid ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              {profiles.map(p => {
                const photoUrl  = getPhotoUrl(p.photos)
                const age       = getAge(p.date_of_birth)
                const initials  = getInitials(p.full_name)
                const isActing  = actionLoading === p.id

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    {/* Photo */}
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-pink-100 to-purple-100">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={p.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">{initials}</span>
                          </div>
                        </div>
                      )}

                      {/* Online indicator — active within last 24h */}
                      {p.last_active && (
                        Date.now() - new Date(p.last_active).getTime() < 86_400_000
                      ) && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          <span className="text-xs text-gray-600">Active</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {p.full_name}, {age}
                        </h3>
                        {p.location && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <MapPin size={11} />
                            <span className="text-xs truncate">{p.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Shared interests — up to 2 chips */}
                      {p.interests?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {p.interests.slice(0, 2).map(interest => (
                            <span
                              key={interest}
                              className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full"
                            >
                              {interest}
                            </span>
                          ))}
                          {p.interests.length > 2 && (
                            <span className="text-xs text-gray-400">+{p.interests.length - 2}</span>
                          )}
                        </div>
                      )}

                      {/* Like / Pass buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePass(p.id)}
                          disabled={!!isActing}
                          className="flex-1 flex items-center justify-center py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40"
                        >
                          <X size={16} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleLike(p)}
                          disabled={!!isActing}
                          className="flex-1 flex items-center justify-center py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-40"
                        >
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

            {/* ── Load more ─────────────────────────────────────────── */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-full text-sm font-medium hover:border-pink-300 hover:text-pink-500 transition-all disabled:opacity-40"
                >
                  {loadingMore
                    ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin" /> Loading…</>
                    : 'Load more profiles'
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
