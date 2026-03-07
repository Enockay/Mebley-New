'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'
import { RELATIONSHIP_INTENTS, INTERESTS_BY_CATEGORY, RelationshipIntent, InterestCategory } from '@/types/database.types'
import { Check, ChevronRight, ChevronLeft, Heart, Sparkles } from 'lucide-react'
import VideoUpload from '@/components/Profile/VideoUpload'

const STEPS = [
  { title: 'The Basics',     subtitle: 'Tell us who you are' },
  { title: 'Your Identity',  subtitle: 'How you identify & who you seek' },
  { title: 'What You Seek',  subtitle: 'Your relationship goals' },
  { title: 'Your Passions',  subtitle: 'What lights you up' },
  { title: 'About You',      subtitle: 'In your own words' },
  { title: 'Your Video',     subtitle: 'Let people see the real you' },
]

const GENDER_OPTIONS = [
  { value: 'male',       label: 'Man',        emoji: '👨' },
  { value: 'female',     label: 'Woman',      emoji: '👩' },
  { value: 'non-binary', label: 'Non-binary', emoji: '🧑' },
  { value: 'other',      label: 'Other',      emoji: '✨' },
]

const GENDER_PREF_OPTIONS = [
  { value: 'male',       label: 'Men',        emoji: '👨' },
  { value: 'female',     label: 'Women',      emoji: '👩' },
  { value: 'non-binary', label: 'Non-binary', emoji: '🧑' },
  { value: 'everyone',   label: 'Everyone',   emoji: '💫' },
]

export default function ProfileSetup() {
  const { user, refreshProfile } = useAuth()
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [formData, setFormData] = useState({
    username:          '',
    full_name:         '',
    date_of_birth:     '',
    gender:            '',
    gender_preference: [] as string[],
    looking_for:       [] as RelationshipIntent[],
    bio:               '',
    location:          '',
    interests:         [] as string[],
  })

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayValue = <T extends string>(field: keyof typeof formData, value: T) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as T[]).includes(value)
        ? (prev[field] as T[]).filter(v => v !== value)
        : [...(prev[field] as T[]), value],
    }))
  }

  const canProceed = () => {
    if (step === 1) return !!(formData.username && formData.full_name && formData.date_of_birth && formData.location)
    if (step === 2) return !!(formData.gender && formData.gender_preference.length > 0)
    if (step === 3) return formData.looking_for.length > 0
    if (step === 4) return formData.interests.length >= 3
    if (step === 5) return true
    if (step === 6) return true
    return true
  }

  const handleSubmit = async () => {
    if (!user) return
    setError('')
    setLoading(true)

    const { error } = await supabase.from('profiles').insert({
      id:                user.id,
      username:          formData.username.toLowerCase().trim(),
      full_name:         formData.full_name.trim(),
      date_of_birth:     formData.date_of_birth,
      gender:            formData.gender,
      gender_preference: formData.gender_preference,
      looking_for:       formData.looking_for,
      bio:               formData.bio.trim(),
      location:          formData.location.trim(),
      interests:         formData.interests,
      verified_email:    true,
      is_active:         true,
      visible:           false, // hidden until intro video uploaded
      profile_completeness: Math.min(100,
        20 +
        (formData.bio ? 20 : 0) +
        Math.min(formData.interests.length * 5, 30) +
        (formData.looking_for.length > 0 ? 15 : 0) +
        15
      ),
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      await refreshProfile()
    }
  }

  const totalSteps   = STEPS.length
  const currentStep  = STEPS[step - 1]

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Heart className="text-rose-500 fill-rose-500" size={28} />
            <span className="text-2xl font-bold text-gray-900">Crotchet</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{currentStep.title}</h1>
          <p className="text-gray-500">{currentStep.subtitle}</p>
        </div>

        {/* ── Progress bar ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1">
              <div
                className={`h-2 w-full rounded-full transition-all duration-500 ${
                  i < step ? 'bg-rose-500' : 'bg-gray-200'
                }`}
              />
            </div>
          ))}
        </div>

        {/* ── Card ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-xl p-8">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Step 1 — Basics */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => handleChange('username', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors"
                  placeholder="your_unique_handle"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => handleChange('full_name', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={e => handleChange('date_of_birth', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => handleChange('location', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors"
                  placeholder="City, Country (e.g. Nairobi, Kenya)"
                />
              </div>
            </div>
          )}

          {/* Step 2 — Identity */}
          {step === 2 && (
            <div className="space-y-7">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">I identify as</label>
                <div className="grid grid-cols-2 gap-3">
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleChange('gender', opt.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                        formData.gender === opt.value
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      <span className="font-medium">{opt.label}</span>
                      {formData.gender === opt.value && (
                        <Check size={16} className="ml-auto text-rose-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">I'm interested in</label>
                <div className="grid grid-cols-2 gap-3">
                  {GENDER_PREF_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleArrayValue('gender_preference', opt.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                        formData.gender_preference.includes(opt.value)
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      <span className="font-medium">{opt.label}</span>
                      {formData.gender_preference.includes(opt.value) && (
                        <Check size={16} className="ml-auto text-rose-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Relationship Intents */}
          {step === 3 && (
            <div>
              <p className="text-sm text-gray-500 mb-5">
                Select all that apply — be honest, it leads to better matches!
              </p>
              <div className="space-y-3">
                {(Object.entries(RELATIONSHIP_INTENTS) as [RelationshipIntent, typeof RELATIONSHIP_INTENTS[RelationshipIntent]][]).map(([key, intent]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleArrayValue('looking_for', key)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left ${
                      formData.looking_for.includes(key)
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-3xl">{intent.emoji}</span>
                    <div className="flex-1">
                      <p className={`font-semibold ${
                        formData.looking_for.includes(key) ? 'text-rose-700' : 'text-gray-900'
                      }`}>
                        {intent.label}
                      </p>
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
            </div>
          )}

          {/* Step 4 — Interests */}
          {step === 4 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">Pick at least 3 that resonate with you</p>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  formData.interests.length >= 3
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {formData.interests.length} selected
                </span>
              </div>

              <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
                {(Object.entries(INTERESTS_BY_CATEGORY) as [InterestCategory, typeof INTERESTS_BY_CATEGORY[InterestCategory]][]).map(([category, data]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{data.emoji}</span>
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

          {/* Step 5 — Bio */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  About Me{' '}
                  <span className="text-gray-400 font-normal">(optional but recommended)</span>
                </label>
                <textarea
                  value={formData.bio}
                  onChange={e => handleChange('bio', e.target.value)}
                  rows={5}
                  maxLength={500}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors resize-none"
                  placeholder="Share a little about yourself, what makes you unique, what you're passionate about..."
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formData.bio.length}/500
                </p>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-rose-500" />
                  <span className="text-sm font-semibold text-gray-700">Your profile summary</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>📍 {formData.location || '—'}</p>
                  <p>
                    🎯 {formData.looking_for.length > 0
                      ? formData.looking_for.map(k => RELATIONSHIP_INTENTS[k]?.label).join(', ')
                      : '—'}
                  </p>
                  <p>
                    ✨ {formData.interests.length > 0
                      ? `${formData.interests.slice(0, 4).join(', ')}${formData.interests.length > 4 ? ` +${formData.interests.length - 4} more` : ''}`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6 — Video */}
          {step === 6 && (
            <div>
              <p className="text-sm text-gray-500 mb-5">
                Upload a 30–120 second intro video. Your profile stays hidden from Discover
                until you do — it keeps things real and authentic! 🎥
              </p>
              <VideoUpload
                onVideoUploaded={(slot, url) => {
                  console.log('Video uploaded:', slot, url)
                }}
              />
            </div>
          )}

          {/* ── Navigation ───────────────────────────────────────────── */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                <ChevronLeft size={18} /> Back
              </button>
            )}

            {step < totalSteps ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating your profile...
                  </>
                ) : (
                  <>
                    <Heart size={18} className="fill-white" /> Find My Matches
                  </>
                )}
              </button>
            )}
          </div>

        </div>

        {/* Step indicator */}
        <p className="text-center text-sm text-gray-400 mt-4">
          Step {step} of {totalSteps}
        </p>

      </div>
    </div>
  )
}
