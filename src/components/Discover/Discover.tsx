'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDiscoverProfiles, likeProfile, passProfile, ScoredProfile } from '@/services/matchingService'
import { Heart, X, Star, MapPin, Briefcase, RefreshCw } from 'lucide-react'

export default function Discover() {
  const [profiles, setProfiles] = useState<ScoredProfile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [matchAlert, setMatchAlert] = useState<string | null>(null)
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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfiles(1)
  }, [loadProfiles])

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
    // Load more when 3 profiles remaining
    if (nextIndex >= profiles.length - 3) {
      const nextPage = page + 1
      setPage(nextPage)
      loadProfiles(nextPage)
    }
    setCurrentIndex(nextIndex)
  }

  if (loading && profiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Finding your matches...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => loadProfiles(1)}
            className="flex items-center gap-2 mx-auto bg-pink-500 text-white px-6 py-2 rounded-full"
          >
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!current || currentIndex >= profiles.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">You're all caught up!</h2>
          <p className="text-gray-500 mb-6">Check back later for new profiles</p>
          <button
            onClick={() => { setPage(1); loadProfiles(1) }}
            className="flex items-center gap-2 mx-auto bg-pink-500 text-white px-6 py-2 rounded-full"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>
    )
  }

  const { profile, score, reasons } = current

  return (
    <div className="flex flex-col items-center justify-start h-full p-4 overflow-y-auto">

      {/* Match alert */}
      {matchAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-pink-500 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-bounce">
          {matchAlert}
        </div>
      )}

      {/* Profile card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden mb-4">

        {/* Photo area */}
        <div className="relative bg-gradient-to-br from-pink-100 to-purple-100 h-72 flex items-center justify-center">
          {profile.photos && profile.photos.length > 0 ? (
            <img
              src={profile.photos[0].url}
              alt={profile.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-8xl">
              {profile.gender === 'female' ? '👩' : profile.gender === 'male' ? '👨' : '🧑'}
            </div>
          )}

          {/* Score badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-3 py-1 flex items-center gap-1">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">{score}% match</span>
          </div>

          {/* Profile counter */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-full px-3 py-1">
            <span className="text-xs text-gray-600">{currentIndex + 1} / {profiles.length}</span>
          </div>
        </div>

        {/* Profile info */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.full_name}{profile.age ? `, ${profile.age}` : ''}
              </h2>
              {profile.location && (
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin size={14} />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{profile.bio}</p>
          )}

          {/* Looking for */}
          {profile.looking_for?.length > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <Briefcase size={14} className="text-pink-500" />
              <span className="text-sm text-gray-600">{profile.looking_for.join(', ')}</span>
            </div>
          )}

          {/* Interests */}
          {profile.interests?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.interests.slice(0, 5).map((interest, i) => (
                <span key={i} className="bg-pink-50 text-pink-600 text-xs px-3 py-1 rounded-full">
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Match reasons */}
          {reasons.length > 0 && (
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-green-700 mb-1">Why you match:</p>
              {reasons.slice(0, 2).map((reason, i) => (
                <p key={i} className="text-xs text-green-600">✓ {reason}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-6">
        <button
          onClick={handlePass}
          disabled={actionLoading}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50"
        >
          <X size={28} className="text-gray-400" />
        </button>

        <button
          onClick={handleLike}
          disabled={actionLoading}
          className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
        >
          <Heart size={32} className="text-white fill-white" />
        </button>

        <button
          onClick={() => loadProfiles(1)}
          disabled={actionLoading}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={22} className="text-gray-400" />
        </button>
      </div>

    </div>
  )
}