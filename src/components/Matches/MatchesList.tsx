'use client'

import { useState, useEffect } from 'react'
import { getDiscoverProfiles, likeProfile, ScoredProfile } from '../../services/matchingService'
import MatchCard from './MatchCard'
import { Loader2, RefreshCw, Sparkles, AlertCircle } from 'lucide-react'

// MatchesList uses the same scored profiles feed as Discover,
// displayed as a grid instead of one-at-a-time cards.
export default function MatchesList() {
  const [matches, setMatches]     = useState<ScoredProfile[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [page, setPage]           = useState(1)
  const [hasMore, setHasMore]     = useState(true)

  const loadMatches = async (pageNum = 1, refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true)
      setError(null)
      const data = await getDiscoverProfiles(pageNum, 12)
      setMatches(data.profiles)
      setHasMore(data.profiles.length === 12)
      setPage(pageNum)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load matches')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadMatches(1) }, [])

  const handleLike = async (matchId: string) => {
    try {
      await likeProfile(matchId)
    } catch (err) {
      console.error('Error liking match:', err)
    }
  }

  const handlePass = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.profile.id !== matchId))
  }

  const handleViewProfile = (matchId: string) => {
    console.log('View profile:', matchId)
  }

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Finding your matches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-pink-500" />
              Your Matches
            </h1>
            <p className="text-gray-500 mt-1">
              {matches.length > 0 ? `${matches.length} potential matches found` : 'Discovering people you might like'}
            </p>
          </div>
          <button
            onClick={() => loadMatches(page, true)}
            disabled={refreshing}
            className="p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            title="Refresh matches"
          >
            <RefreshCw className={`w-5 h-5 text-gray-700 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {matches.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No matches found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Try adjusting your preferences or check back later.
            </p>
            <button
              onClick={() => loadMatches(1, true)}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all"
            >
              Refresh Matches
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {matches.map((match) => (
                <MatchCard
                  key={match.profile.id}
                  match={{ ...match, id: match.profile.id }}
                  onLike={handleLike}
                  onPass={handlePass}
                  onViewProfile={handleViewProfile}
                />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={() => loadMatches(page + 1)}
                  disabled={refreshing}
                  className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-full font-medium hover:border-pink-300 hover:text-pink-500 transition-all disabled:opacity-40"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
