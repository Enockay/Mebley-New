/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  Settings, Play, MapPin, Eye, EyeOff, Sparkles,
  Camera, ChevronRight, Heart, BadgeCheck,
} from 'lucide-react'
import EditProfile from '@/components/Profile/EditProfile'
import DeleteAccount from '@/components/Profile/DeleteAccount'
import { supabase } from '@/lib/supabase-client'
import { RELATIONSHIP_INTENTS, PROFILE_PROMPTS } from '@/types/app-constants'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileVideo {
  slot:             number
  cloudfront_url:   string
  duration_seconds: number
}

interface Photo {
  slot:  number
  url:   string
  s3Key: string
}

interface PromptAnswer {
  id:       string
  question: string
  answer:   string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AGE_RANGE_LABELS: Record<string, string> = {
  '18_24':   '18–24',
  '25_34':   '25–34',
  '35_40':   '35–40',
  '40_50':   '40–50',
  '50_65':   '50–65',
  '65_plus': '65+',
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Returns one specific actionable nudge based on what's missing
function getCompletenessNudge(
  profile: any,
  videoCount: number,
  promptCount: number
): string | null {
  if (!profile.bio)                         return 'Add a bio to get 2× more matches'
  if (promptCount === 0)                    return 'Answer a prompt — it drives first messages'
  if (videoCount === 0)                     return 'Add an intro video to appear in Discover'
  if ((profile.interests ?? []).length < 5) return 'Add more interests to improve your matches'
  if (promptCount < 3)                      return `Add ${3 - promptCount} more prompt${3 - promptCount > 1 ? 's' : ''} to complete your profile`
  return null
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()

  const [showEdit, setShowEdit]                   = useState(false)
  const [videos, setVideos]                       = useState<ProfileVideo[]>([])
  const [playingSlot, setPlayingSlot]             = useState<number | null>(null)
  const [visibilityLoading, setVisibilityLoading] = useState(false)
  const [activePhotoIdx, setActivePhotoIdx]       = useState(0)

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  // ── Fetch profile videos ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    ;(supabase as any)
      .from('profile_videos')
      .select('slot, cloudfront_url, duration_seconds')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('slot')
      .then(({ data }: { data: ProfileVideo[] | null }) => {
        if (data) setVideos(data)
      })
  }, [user, profile])

  // ── Toggle profile visibility ─────────────────────────────────────────────
  const handleToggleVisibility = async () => {
    if (!user || !profile) return
    setVisibilityLoading(true)
    const newValue = !((profile as any).visible)
    await (supabase as any)
      .from('profiles')
      .update({ visible: newValue })
      .eq('id', user.id)
    await refreshProfile()
    setVisibilityLoading(false)
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400" />
      </div>
    )
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const photos: Photo[] = ((profile.photos as unknown as Photo[] | null) ?? []).filter(Boolean)
  const prompts: PromptAnswer[] = (((profile as any).prompts as PromptAnswer[] | null) ?? []).filter(Boolean)
  const interests: string[]     = profile.interests ?? []
  const lookingFor: string[]    = (profile.looking_for ?? []) as string[]
  const isVisible               = (profile as any).visible ?? false
  const completeness            = profile.profile_completeness ?? 0
  const introVideo              = videos.find(v => v.slot === 0)
  const ageLabel                = AGE_RANGE_LABELS[(profile as any).age_range ?? ''] ?? ''
  const nudge                   = getCompletenessNudge(profile, videos.length, prompts.length)
  const intentLabel             = lookingFor.length > 0
    ? RELATIONSHIP_INTENTS.find(i => i.value === lookingFor[0])
    : null

  const sortedPhotos  = [...photos].sort((a, b) => a.slot - b.slot)
  const displayPhoto  = sortedPhotos[activePhotoIdx] ?? null

  return (
    <>
      <div className="h-full overflow-y-auto bg-gray-50">
        <div className="max-w-lg mx-auto pb-8">

          {/* ── Sticky top bar ──────────────────────────────────────────── */}
          <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-rose-500 fill-rose-500" />
              <span className="font-bold text-gray-900 text-base">My Profile</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Visibility pill */}
              <button
                onClick={handleToggleVisibility}
                disabled={visibilityLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                  isVisible
                    ? 'border-green-400 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-500'
                } disabled:opacity-50`}>
                {visibilityLoading
                  ? <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  : isVisible
                    ? <><Eye size={12} /> Visible</>
                    : <><EyeOff size={12} /> Hidden</>
                }
              </button>
              {/* Settings */}
              <button
                onClick={() => setShowEdit(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
                <Settings size={15} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* ── Photo gallery ──────────────────────────────────────────── */}
          <div className="relative bg-black">
            {displayPhoto ? (
              <>
                <img
                  src={displayPhoto.url}
                  alt={profile.full_name ?? 'Profile photo'}
                  className="w-full object-cover"
                  style={{ maxHeight: '480px', aspectRatio: '4/5' }}
                />

                {/* Dark gradient for name legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

                {/* Photo progress dots */}
                {sortedPhotos.length > 1 && (
                  <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                    {sortedPhotos.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          i === activePhotoIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Left / right tap zones for photo navigation */}
                {sortedPhotos.length > 1 && (
                  <>
                    <button
                      aria-label="Previous photo"
                      className="absolute left-0 top-0 w-1/3 h-full"
                      onClick={() => setActivePhotoIdx(i => Math.max(0, i - 1))}
                    />
                    <button
                      aria-label="Next photo"
                      className="absolute right-0 top-0 w-1/3 h-full"
                      onClick={() => setActivePhotoIdx(i => Math.min(sortedPhotos.length - 1, i + 1))}
                    />
                  </>
                )}

                {/* Name + location overlay */}
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pointer-events-none">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h1 className="text-2xl font-bold text-white leading-tight">
                          {profile.full_name}
                        </h1>
                        {profile.verified_email && (
                          <BadgeCheck size={18} className="text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {ageLabel && (
                          <span className="text-white/90 text-sm font-medium">{ageLabel}</span>
                        )}
                        {profile.location && (
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-white/50 rounded-full" />
                            <MapPin size={11} className="text-white/70" />
                            <span className="text-white/80 text-xs">{profile.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {sortedPhotos.length > 1 && (
                      <span className="text-xs text-white/60 bg-black/30 px-2 py-0.5 rounded-full">
                        {activePhotoIdx + 1}/{sortedPhotos.length}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* No photo — add prompt */
              <button
                onClick={() => setShowEdit(true)}
                className="w-full bg-gradient-to-br from-rose-100 to-pink-100 flex flex-col items-center justify-center gap-3"
                style={{ aspectRatio: '4/5', maxHeight: '480px' }}>
                <div className="w-20 h-20 rounded-full bg-white/60 flex items-center justify-center">
                  <Camera size={32} className="text-rose-400" />
                </div>
                <p className="text-rose-500 font-semibold text-sm">Add your first photo</p>
              </button>
            )}
          </div>

          {/* ── Completeness nudge bar ─────────────────────────────────── */}
          {completeness < 100 && (
            <button
              onClick={() => setShowEdit(true)}
              className="mx-4 mt-3 w-[calc(100%-2rem)] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-rose-200 transition-colors text-left">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-rose-500" />
                  <span className="text-sm font-semibold text-gray-800">Profile strength</span>
                </div>
                <span className="text-sm font-bold text-rose-600">{completeness}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                <div
                  className="bg-gradient-to-r from-rose-400 to-pink-500 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              {nudge && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{nudge}</p>
                  <ChevronRight size={13} className="text-gray-400 flex-shrink-0" />
                </div>
              )}
            </button>
          )}

          {/* ── Content cards ─────────────────────────────────────────── */}
          <div className="mx-4 mt-3 space-y-3">

            {/* Identity + bio */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">About</p>
                <span className="text-xs text-gray-400">@{profile.username}</span>
              </div>

              {/* Attribute chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {(profile as any).gender && (
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-medium border border-rose-100">
                    {(profile as any).gender}
                  </span>
                )}
                {(profile as any).nationality && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">
                    🌍 {(profile as any).nationality}
                  </span>
                )}
                {intentLabel && (
                  <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium border border-purple-100">
                    {intentLabel.emoji} {intentLabel.label}
                  </span>
                )}
              </div>

              {profile.bio ? (
                <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
              ) : (
                <button
                  onClick={() => setShowEdit(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-rose-300 hover:text-rose-400 transition-colors">
                  + Add a bio
                </button>
              )}
            </div>

            {/* ── Prompts — one card each ───────────────────────────────── */}
            {prompts.length > 0 ? (
              prompts.map(prompt => {
                const meta = PROFILE_PROMPTS.find(p => p.id === prompt.id)
                return (
                  <div
                    key={prompt.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{meta?.emoji ?? '💬'}</span>
                      <p className="text-xs font-semibold text-rose-500">{prompt.question}</p>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">
                      {prompt.answer}
                    </p>
                  </div>
                )
              })
            ) : (
              <button
                onClick={() => setShowEdit(true)}
                className="w-full bg-white rounded-2xl p-5 shadow-sm border-2 border-dashed border-rose-200 hover:border-rose-400 hover:bg-rose-50/30 transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">💬</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Answer a prompt</p>
                    <p className="text-xs text-gray-500 mt-0.5">Give people something to react to</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 ml-auto flex-shrink-0" />
                </div>
              </button>
            )}

            {/* Interests */}
            {interests.length > 0 ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Interests
                </p>
                <div className="flex flex-wrap gap-2">
                  {interests.map(interest => (
                    <span
                      key={interest}
                      className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowEdit(true)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border-2 border-dashed border-gray-200 hover:border-rose-300 transition-colors text-left">
                <p className="text-sm text-gray-400">+ Add your interests</p>
              </button>
            )}

            {/* Intro video */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Intro Video
                </p>
                {!introVideo && (
                  <span className="text-xs text-rose-500 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                    Required for Discover
                  </span>
                )}
              </div>
              <div className="p-4">
                {introVideo ? (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
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
                          className="flex flex-col items-center gap-2">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                            <Play size={24} className="text-white fill-white ml-1" />
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
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/40 flex flex-col items-center justify-center gap-2 hover:bg-rose-50 transition-colors">
                    <Play size={24} className="text-rose-300" />
                    <span className="text-sm text-rose-400 font-medium">Add intro video</span>
                  </button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Profile stats
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{sortedPhotos.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Photo{sortedPhotos.length !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{prompts.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Prompt{prompts.length !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{interests.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Interest{interests.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Visibility toggle card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isVisible ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {isVisible
                      ? <Eye size={16} className="text-green-600" />
                      : <EyeOff size={16} className="text-gray-500" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {isVisible ? 'Visible in Discover' : 'Hidden from Discover'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isVisible
                        ? 'People can find and like your profile'
                        : 'Your profile is not shown to anyone'}
                    </p>
                  </div>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={handleToggleVisibility}
                  disabled={visibilityLoading}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                    isVisible ? 'bg-green-500' : 'bg-gray-300'
                  } disabled:opacity-50`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    isVisible ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Delete account — always at bottom */}
            <DeleteAccount />

          </div>
        </div>
      </div>

      {/* Edit profile modal */}
      {showEdit && (
        <EditProfile
          onClose={() => {
            setShowEdit(false)
            setActivePhotoIdx(0)
            if (user) {
              ;(supabase as any)
                .from('profile_videos')
                .select('slot, cloudfront_url, duration_seconds')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('slot')
                .then(({ data }: { data: ProfileVideo[] | null }) => {
                  if (data) setVideos(data)
                })
            }
          }}
        />
      )}
    </>
  )
}
