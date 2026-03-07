'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Settings, Play } from 'lucide-react'
import EditProfile from '@/components/Profile/EditProfile'
import { supabase } from '@/lib/supabase-client'

interface ProfileVideo {
  slot:             number
  cloudfront_url:   string
  duration_seconds: number
}

export default function ProfilePage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [showEdit, setShowEdit]       = useState(false)
  const [videos, setVideos]           = useState<ProfileVideo[]>([])
  const [playingSlot, setPlayingSlot] = useState<number | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Fetch profile_videos whenever the profile changes (covers post-upload refresh)
  useEffect(() => {
    if (!user) return
    supabase
      .from('profile_videos')
      .select('slot, cloudfront_url, duration_seconds')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('slot')
      .then(({ data }) => {
        if (data) setVideos(data)
      })
  }, [user, profile]) // re-runs when profile changes (triggered by refreshProfile after upload)

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500" />
      </div>
    )
  }

  const avatarUrl = (profile.photos as { url: string; slot: number }[] | null)?.[0]?.url ?? null
  const introVideo = videos.find(v => v.slot === 0)

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
            <button
              onClick={() => setShowEdit(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="space-y-6">

            {/* Avatar */}
            <div className="aspect-square bg-gradient-to-br from-blue-100 to-pink-100 rounded-2xl overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-9xl opacity-30">👤</div>
              )}
            </div>

            {/* Name + username */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {profile.full_name}
              </h3>
              <p className="text-gray-600">@{profile.username}</p>
            </div>

            {/* Location */}
            {profile.location && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Location</h4>
                <p className="text-gray-600">{profile.location}</p>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">About</h4>
                <p className="text-gray-600">{profile.bio}</p>
              </div>
            )}

            {/* Looking for */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Looking for</h4>
              <p className="text-gray-600">{profile.looking_for.join(', ')}</p>
            </div>

            {/* Interests */}
            {profile.interests.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest: string) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Intro video ─────────────────────────────────────────────
                Fetched from profile_videos table (separate from profiles).
                Re-fetches automatically when refreshProfile() is called
                after a successful upload in VideoUpload.tsx.
            ──────────────────────────────────────────────────────────────── */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Intro Video</h4>
              {introVideo ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
                  {playingSlot === 0 ? (
                    <video
                      src={introVideo.cloudfront_url}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <button
                        onClick={() => setPlayingSlot(0)}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                          <Play size={28} className="text-white fill-white ml-1" />
                        </div>
                        <span className="text-sm text-white/70">
                          {formatTime(introVideo.duration_seconds)}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowEdit(true)}
                  className="w-full aspect-video rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50 flex flex-col items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
                >
                  <Play size={28} className="text-rose-300" />
                  <span className="text-sm text-rose-400 font-medium">Add intro video</span>
                  <span className="text-xs text-rose-300">Required to appear in Discover</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {showEdit && (
        <EditProfile
          onClose={() => {
            setShowEdit(false)
            // Re-fetch videos when modal closes in case a new one was uploaded
            if (user) {
              supabase
                .from('profile_videos')
                .select('slot, cloudfront_url, duration_seconds')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('slot')
                .then(({ data }) => { if (data) setVideos(data) })
            }
          }}
        />
      )}
    </div>
  )
}
