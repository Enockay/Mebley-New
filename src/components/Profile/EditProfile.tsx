'use client'

import { useState, useEffect } from 'react'
import { X, Check, Sparkles, Save } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'
import {
  RELATIONSHIP_INTENTS,
  INTERESTS_BY_CATEGORY,
  RelationshipIntent,
  InterestCategory,
} from '@/types/database.types'
import VideoUpload from '@/components/Profile/VideoUpload'
import PhotoUpload from '@/components/Profile/PhotoUpload'

interface EditProfileProps {
  onClose: () => void
}

type Tab = 'basics' | 'intents' | 'interests' | 'photos' | 'videos'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'basics',    label: 'Basics',    emoji: '👤' },
  { id: 'intents',   label: 'Seeking',   emoji: '🎯' },
  { id: 'interests', label: 'Interests', emoji: '✨' },
  { id: 'photos',    label: 'Photos',    emoji: '📸' },
  { id: 'videos',    label: 'Videos',    emoji: '🎥' },
]

export default function EditProfile({ onClose }: EditProfileProps) {
  const { profile, refreshProfile } = useAuth()
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [saved, setSaved]         = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('basics')

  const [formData, setFormData] = useState({
    full_name:   '',
    bio:         '',
    location:    '',
    looking_for: [] as RelationshipIntent[],
    interests:   [] as string[],
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name:   profile.full_name   ?? '',
        bio:         profile.bio         ?? '',
        location:    profile.location    ?? '',
        looking_for: (profile.looking_for ?? []) as RelationshipIntent[],
        interests:   profile.interests   ?? [],
      })
    }
  }, [profile])

  const toggleArrayValue = <T extends string>(field: keyof typeof formData, value: T) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as T[]).includes(value)
        ? (prev[field] as T[]).filter(v => v !== value)
        : [...(prev[field] as T[]), value],
    }))
  }

  const handleSubmit = async () => {
    if (!profile) return
    setError('')
    setLoading(true)

    const completeness = Math.min(100,
      20 +
      (formData.bio.trim()             ? 20 : 0) +
      Math.min(formData.interests.length * 5, 30) +
      (formData.looking_for.length > 0 ? 15 : 0) +
      (formData.location.trim()        ? 15 : 0)
    )

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name:            formData.full_name.trim(),
        bio:                  formData.bio.trim(),
        location:             formData.location.trim(),
        looking_for:          formData.looking_for,
        interests:            formData.interests,
        profile_completeness: completeness,
        updated_at:           new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      await refreshProfile()
      setSaved(true)
      setTimeout(() => { setSaved(false); onClose() }, 1200)
    }
  }

  const completenessScore = Math.min(100,
    20 +
    (formData.bio.trim()             ? 20 : 0) +
    Math.min(formData.interests.length * 5, 30) +
    (formData.looking_for.length > 0 ? 15 : 0) +
    (formData.location.trim()        ? 15 : 0)
  )

  const isAutoSaveTab = activeTab === 'photos' || activeTab === 'videos'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
            <p className="text-sm text-gray-500">
              {formData.interests.length} interests · {formData.looking_for.length} intents selected
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto px-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content — pb-safe ensures content clears the footer on all tabs */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          {/* Basics */}
          {activeTab === 'basics' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  About Me
                  <span className="text-gray-400 font-normal ml-1">({formData.bio.length}/500)</span>
                </label>
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                  rows={5}
                  maxLength={500}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors resize-none"
                  placeholder="Tell us what makes you, you..."
                />
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-rose-500" />
                  <span className="text-sm font-semibold text-gray-700">Profile Strength</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">
                    {completenessScore < 40 ? 'Just getting started' : completenessScore < 70 ? 'Looking good!' : 'Strong profile! 🔥'}
                  </span>
                  <span className="text-sm font-bold text-rose-600">{completenessScore}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-rose-400 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completenessScore}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Intents */}
          {activeTab === 'intents' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">Be honest — it leads to better matches!</p>
              {(Object.entries(RELATIONSHIP_INTENTS) as [RelationshipIntent, typeof RELATIONSHIP_INTENTS[RelationshipIntent]][]).map(([key, intent]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleArrayValue('looking_for', key)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left ${
                    formData.looking_for.includes(key) ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl">{intent.emoji}</span>
                  <div className="flex-1">
                    <p className={`font-semibold ${formData.looking_for.includes(key) ? 'text-rose-700' : 'text-gray-900'}`}>{intent.label}</p>
                    <p className="text-sm text-gray-500">{intent.description}</p>
                  </div>
                  {formData.looking_for.includes(key) && (
                    <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Interests */}
          {activeTab === 'interests' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">Pick what you love</p>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors ${
                  formData.interests.length >= 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {formData.interests.length} selected
                </span>
              </div>
              <div className="space-y-5">
                {(Object.entries(INTERESTS_BY_CATEGORY) as [InterestCategory, typeof INTERESTS_BY_CATEGORY[InterestCategory]][]).map(([category, data]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{data.emoji}</span>
                      <span className="text-sm font-semibold text-gray-700">{data.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {data.tags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleArrayValue('interests', tag)}
                          className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                            formData.interests.includes(tag)
                              ? 'border-rose-500 bg-rose-500 text-white'
                              : 'border-gray-200 text-gray-700 hover:border-rose-300'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {activeTab === 'photos' && (
            <PhotoUpload
              existingPhotos={(profile?.photos as any[] ?? []).filter(Boolean)}
              onPhotosChanged={() => refreshProfile()}
            />
          )}

          {/* Videos */}
          {activeTab === 'videos' && (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Your intro video is required for your profile to appear in Discover.
              </p>
              <VideoUpload onVideoUploaded={() => refreshProfile()} />
            </div>
          )}
        </div>

        {/* Footer
            ─ On mobile (bottom-sheet): pb-safe adds clearance above the
              fixed BottomNav (h ≈ 64px). sm:pb-0 removes it on desktop
              where the modal floats centred and the nav isn't in the way.
        */}
        <div className="px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-gray-100">
          {isAutoSaveTab ? (
            <button
              onClick={onClose}
              className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
            >
              Done
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || saved}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 disabled:opacity-40'
                }`}
              >
                {saved ? (
                  <><Check size={18} /> Saved!</>
                ) : loading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Save size={18} /> Save Changes</>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
