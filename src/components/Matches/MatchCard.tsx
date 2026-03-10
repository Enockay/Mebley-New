'use client'

import { Heart, X, MapPin, Clock, CheckCircle, Star } from 'lucide-react'
import { ScoredProfile } from '../../services/matchingService'

// Match extends ScoredProfile with a conversation id.
// The Match type was removed from matchingService — define it locally.
interface Match extends ScoredProfile {
  id: string
}
import { useState } from 'react'

interface MatchCardProps {
  match: Match
  onLike: (matchId: string) => void
  onPass: (matchId: string) => void
  onViewProfile: (matchId: string) => void
}

// Safely extracts a URL from whatever shape photos[0] comes back as.
// Handles: { url: string }, { url: string, slot: number, s3Key: string },
// a plain string, or null/undefined.
function getPhotoUrl(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null
  const first = photos[0]
  if (!first) return null
  if (typeof first === 'string') return first
  if (typeof first === 'object' && 'url' in first && typeof first.url === 'string') return first.url
  return null
}

export default function MatchCard({ match, onLike, onPass, onViewProfile }: MatchCardProps) {
  const [isLiked, setIsLiked]   = useState(false)
  const [isPassed, setIsPassed] = useState(false)

  const handleLike = () => {
    setIsLiked(true)
    onLike(match.id)
  }

  const handlePass = () => {
    setIsPassed(true)
    onPass(match.id)
  }

  const getTimeAgo = (timestamp: string) => {
    const diffHours = Math.floor((Date.now() - new Date(timestamp).getTime()) / 3_600_000)
    if (diffHours < 1)   return 'Active now'
    if (diffHours < 24)  return `Active ${diffHours}h ago`
    if (diffHours < 168) return `Active ${Math.floor(diffHours / 24)}d ago`
    return 'Active recently'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (isPassed) return null

  // ── Photo resolution — safe across both known shapes ──────────────────────
  const photoUrl = getPhotoUrl(match.profile.photos)

  // Initials fallback
  const initials = match.profile.full_name
    ? match.profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
        isLiked ? 'ring-4 ring-pink-500' : ''
      }`}
    >
      <div className="relative">
        <div className="aspect-[3/4] overflow-hidden bg-gray-100">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={match.profile.full_name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
              onClick={() => onViewProfile(match.id)}
            />
          ) : (
            /* Initials fallback — no random stranger's photo */
            <div
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 cursor-pointer"
              onClick={() => onViewProfile(match.id)}
            >
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl font-bold text-white">{initials}</span>
                </div>
                <p className="text-gray-500 text-sm">No photo yet</p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
          <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getScoreColor(match.score)}`}>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {match.score}%
            </div>
          </div>
        </div>

        {match.profile.profile_completeness >= 80 && (
          <div className="absolute top-4 left-4 bg-blue-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Verified
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            {match.profile.full_name}
            {match.reasons.some(r => r.includes('Mutual like')) && (
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
            )}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            {match.profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {match.profile.location}
              </div>
            )}
            {match.profile.last_active && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {getTimeAgo(match.profile.last_active)}
              </div>
            )}
          </div>
        </div>

        {match.profile.bio && (
          <p className="text-gray-700 mb-4 line-clamp-3">{match.profile.bio}</p>
        )}

        {match.reasons?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Why you might match
            </p>
            <div className="flex flex-wrap gap-2">
              {match.reasons.map((reason, i) => (
                <span key={i} className="px-3 py-1 bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 rounded-full text-sm font-medium">
                  {reason}
                </span>
              ))}
            </div>
          </div>
        )}

        {match.profile.interests?.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {match.profile.interests.slice(0, 5).map((interest, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {interest}
                </span>
              ))}
              {match.profile.interests.length > 5 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm">
                  +{match.profile.interests.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handlePass}
            disabled={isLiked}
            className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" /> Pass
          </button>
          <button
            onClick={handleLike}
            disabled={isLiked}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
            {isLiked ? 'Liked!' : 'Like'}
          </button>
        </div>
      </div>
    </div>
  )
}
