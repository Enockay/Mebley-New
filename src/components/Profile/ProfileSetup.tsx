'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'
import { RELATIONSHIP_INTENTS, INTERESTS_BY_CATEGORY } from '@/types/app-constants'
import {
  Check, ChevronRight, ChevronLeft, Heart,
  Camera, Upload, AlertTriangle, Loader2, RefreshCw, Sparkles, MapPin,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const AGE_RANGES = [
  { value: 'under_18', label: 'Under 18', blocked: true  },
  { value: '18_24',    label: '18 – 24',  blocked: false },
  { value: '25_34',    label: '25 – 34',  blocked: false },
  { value: '35_40',    label: '35 – 40',  blocked: false },
  { value: '40_50',    label: '40 – 50',  blocked: false },
  { value: '50_65',    label: '50 – 65',  blocked: false },
  { value: '65_plus',  label: '65+',      blocked: false },
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

const ACCEPTED_FORMATS = 'image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/gif,image/bmp,image/tiff'

const STEPS = [
  {
    number:   1,
    title:    'The basics',
    subtitle: 'Takes 30 seconds — we promise',
  },
  {
    number:   2,
    title:    'What you\'re looking for',
    subtitle: 'Be honest — it leads to better matches',
  },
  {
    number:   3,
    title:    'Your profile',
    subtitle: 'Make a great first impression',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

// Auto-generate a username from the user's first name + random suffix
function generateUsername(fullName: string): string {
  const first = fullName.trim().split(' ')[0] ?? 'user'
  const clean = first.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${clean}${suffix}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfileSetup() {
  const { user, refreshProfile } = useAuth()

  const [step, setStep]                   = useState(1)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [underageBlocked, setUnderage]    = useState(false)

  // Photo state
  const [photoFile, setPhotoFile]           = useState<File | null>(null)
  const [photoPreview, setPhotoPreview]     = useState<string | null>(null)
  const [photoUrl, setPhotoUrl]             = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError]         = useState('')

  const uploadInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    full_name:         '',
    age_range:         '',
    gender:            '',
    gender_preference: [] as string[],
    looking_for:       [] as string[],
    interests:         [] as string[],
    bio:               '',
    city:              '',
    country:           '',
    nationality:       '',
  })

  // Combined location string for storage — "City, Country"
  const combinedLocation = [formData.city, formData.country].filter(Boolean).join(', ')

  // ── Field helpers ─────────────────────────────────────────────────────────

  const handleChange = (field: string, value: string | string[]) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const toggleArray = <T extends string>(field: keyof typeof formData, value: T) =>
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as T[]).includes(value)
        ? (prev[field] as T[]).filter(v => v !== value)
        : [...(prev[field] as T[]), value],
    }))

  const selectSingle = (field: keyof typeof formData, value: string) =>
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[])[0] === value ? [] : [value],
    }))

  // ── Step validation ───────────────────────────────────────────────────────

  const canProceed = (): boolean => {
    if (step === 1) return !!(
      formData.full_name.trim() &&
      formData.age_range &&
      formData.gender &&
      formData.gender_preference.length > 0 &&
      !underageBlocked
    )
    if (step === 2) return (
      formData.looking_for.length > 0 &&
      formData.interests.length >= 3
    )
    // Step 3: photo required, everything else optional
    return !!photoUrl
  }

  // ── Photo handlers ────────────────────────────────────────────────────────

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') && !file.name.match(/\.(heic|heif)$/i)) {
      setPhotoError('Please select an image file.'); return
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('Photo must be under 10MB.'); return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setPhotoError('')
    setPhotoUrl(null)
    if (uploadInputRef.current) uploadInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handlePhotoUpload = async () => {
    if (!photoFile || !user) return
    setPhotoUploading(true)
    setPhotoError('')

    try {
      const presignRes = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot:     0,
          fileType: photoFile.type || 'image/jpeg',
          fileSize: photoFile.size,
        }),
      })
      if (!presignRes.ok) {
        const err = await presignRes.json()
        throw new Error(err.error ?? 'Failed to get upload URL')
      }

      const { url, fields, s3Key, cloudfrontUrl } = await presignRes.json()

      const fd = new FormData()
      Object.entries(fields).forEach(([k, v]) => fd.append(k, v as string))
      fd.append('file', photoFile)

      const uploadRes = await fetch(url, { method: 'POST', body: fd })
      if (!uploadRes.ok) throw new Error('Upload to S3 failed')

      const confirmRes  = await fetch('/api/photos/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: 0, s3Key, cloudfrontUrl }),
      })
      const confirmData = await confirmRes.json()

      if (!confirmRes.ok) {
        setPhotoError(confirmData.error ?? 'No face detected. Please upload a clear photo of yourself.')
        setPhotoFile(null)
        setPhotoPreview(null)
        setPhotoUploading(false)
        return
      }

      setPhotoUrl(cloudfrontUrl)
    } catch (err: any) {
      setPhotoError(err.message ?? 'Upload failed. Please try again.')
    }
    setPhotoUploading(false)
  }

  const resetPhoto = () => {
    setPhotoUrl(null)
    setPhotoPreview(null)
    setPhotoFile(null)
    setPhotoError('')
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!user) return
    setError('')
    setLoading(true)

    const lookingFor = Array.isArray(formData.looking_for)
      ? formData.looking_for
      : formData.looking_for ? [formData.looking_for as string] : []

    const photos = photoUrl ? [{ url: photoUrl, slot: 0, s3Key: '' }] : []

    const username = generateUsername(formData.full_name)

    const completeness = Math.min(100,
      20 +
      (formData.bio.trim()                ? 20 : 0) +
      Math.min(formData.interests.length * 5, 30) +
      (lookingFor.length > 0              ? 15 : 0) +
      (photoUrl                           ? 15 : 0)
    )

    const { error } = await (supabase as any).from('profiles').insert({
      id:                user.id,
      username,
      full_name:         formData.full_name.trim(),
      age_range:         formData.age_range,
      gender:            formData.gender,
      gender_preference: formData.gender_preference,
      looking_for:       lookingFor,
      bio:               formData.bio.trim(),
      location:          combinedLocation,
      nationality:       formData.nationality.trim(),
      interests:         formData.interests,
      photos,
      verified_email:    true,
      is_active:         true,
      visible:           false,
      profile_completeness: completeness,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      await refreshProfile()
      // SetupPage detects interests.length > 0 → redirects to /discover
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const currentStep = STEPS[step - 1]

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <Heart className="text-rose-500 fill-rose-500" size={26} />
            <span className="text-2xl font-bold text-gray-900">Crotchet</span>
          </div>

          {/* Step header */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{currentStep.title}</h1>
          <p className="text-gray-500 text-sm">{currentStep.subtitle}</p>
        </div>

        {/* Progress — 3 segments */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s) => (
            <div key={s.number} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                s.number <= step ? 'bg-rose-500' : 'bg-gray-200'
              }`} />
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* ── Step 1 — The Basics ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">

              {/* Full name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => handleChange('full_name', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors"
                  placeholder="First name or full name"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">This is how you'll appear to other people</p>
              </div>

              {/* Age range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Age range</label>
                <div className="grid grid-cols-3 gap-2">
                  {AGE_RANGES.filter(a => !a.blocked).map(a => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => {
                        handleChange('age_range', a.value)
                        setUnderage(false)
                      }}
                      className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        formData.age_range === a.value
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : 'border-gray-200 text-gray-600 hover:border-rose-200'
                      }`}>
                      {a.label}
                    </button>
                  ))}
                </div>
                {/* Under 18 hidden but still blocked if somehow selected */}
                {underageBlocked && (
                  <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                    <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 font-semibold">You must be 18 or older to use Crotchet.</p>
                  </div>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">I identify as</label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleChange('gender', opt.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                        formData.gender === opt.value
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <span className="text-xl">{opt.emoji}</span>
                      <span className="font-medium text-sm">{opt.label}</span>
                      {formData.gender === opt.value && <Check size={14} className="ml-auto text-rose-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender preference */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">I'm interested in</label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_PREF_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleArray('gender_preference', opt.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                        formData.gender_preference.includes(opt.value)
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <span className="text-xl">{opt.emoji}</span>
                      <span className="font-medium text-sm">{opt.label}</span>
                      {formData.gender_preference.includes(opt.value) && <Check size={14} className="ml-auto text-rose-500" />}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ── Step 2 — Intent + Interests ─────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">

              {/* Intent — single select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">I'm here for</label>
                <p className="text-xs text-gray-400 mb-3">Pick one — you can change this anytime</p>
                <div className="space-y-2">
                  {RELATIONSHIP_INTENTS.map(intent => {
                    const isSelected = formData.looking_for[0] === intent.value
                    return (
                      <button
                        key={intent.value}
                        type="button"
                        onClick={() => selectSingle('looking_for', intent.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-gray-200 hover:border-rose-200 hover:bg-rose-50/30'
                        }`}>
                        <span className="text-2xl">{intent.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${isSelected ? 'text-rose-700' : 'text-gray-900'}`}>
                            {intent.label}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{intent.description}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                          isSelected ? 'border-rose-500 bg-rose-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-full h-full rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          </div>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Interests — multi select, min 3 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Your interests</label>
                    <p className="text-xs text-gray-400">Pick at least 3</p>
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors ${
                    formData.interests.length >= 3
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {formData.interests.length} selected
                  </span>
                </div>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {INTERESTS_BY_CATEGORY.map(cat => (
                    <div key={cat.label}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-base">{cat.emoji}</span>
                        <span className="text-xs font-semibold text-gray-600">{cat.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.tags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleArray('interests', tag)}
                            className={`px-3 py-1 rounded-full text-xs border-2 transition-all ${
                              formData.interests.includes(tag)
                                ? 'border-rose-500 bg-rose-500 text-white'
                                : 'border-gray-200 text-gray-600 hover:border-rose-300'
                            }`}>
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ── Step 3 — Profile (photo + bio + location) ───────────────── */}
          {step === 3 && (
            <div className="space-y-5">

              {/* Photo — required */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Profile photo</label>
                  <span className="text-xs text-rose-500 font-medium">Required</span>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    📸 Profiles with a real photo get <strong>3× more matches.</strong> Face detection keeps everyone safe.
                  </p>
                </div>

                {photoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden mb-3">
                    <img src={photoPreview} alt="Preview" className="w-full h-52 object-cover" />
                    {photoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="bg-white rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
                          <Check size={15} className="text-green-500" />
                          <span className="text-sm font-bold text-green-700">Verified ✓</span>
                        </div>
                      </div>
                    )}
                    {photoUploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 gap-2">
                        <Loader2 size={26} className="text-white animate-spin" />
                        <p className="text-white text-sm font-medium">Checking your photo…</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl h-36 flex flex-col items-center justify-center gap-2 bg-gray-50 mb-3">
                    <Camera size={24} className="text-gray-300" />
                    <p className="text-sm text-gray-400">No photo selected yet</p>
                  </div>
                )}

                {photoError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl mb-3">
                    <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{photoError}</p>
                  </div>
                )}

                {!photoUrl && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      disabled={photoUploading}
                      className="flex items-center justify-center gap-2 py-2.5 border-2 border-gray-200 rounded-xl hover:border-rose-400 hover:bg-rose-50/30 transition-all disabled:opacity-50 text-sm font-medium text-gray-700">
                      <Upload size={15} /> Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={photoUploading}
                      className="flex items-center justify-center gap-2 py-2.5 border-2 border-rose-200 bg-rose-50/40 rounded-xl hover:border-rose-400 hover:bg-rose-50 transition-all disabled:opacity-50 text-sm font-medium text-rose-700">
                      <Camera size={15} /> Camera
                    </button>
                    {/* Gallery — no capture */}
                    <input ref={uploadInputRef} type="file" accept={ACCEPTED_FORMATS} className="hidden" onChange={handlePhotoSelect} />
                    {/* Camera — capture="environment" opens rear camera on mobile */}
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
                  </div>
                )}

                {photoPreview && !photoUrl && !photoUploading && (
                  <button
                    onClick={handlePhotoUpload}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-rose-600 hover:to-pink-600 transition-all shadow-md shadow-rose-500/20 mb-2">
                    <Camera size={15} /> Use This Photo
                  </button>
                )}

                {photoUrl && (
                  <button
                    onClick={resetPhoto}
                    className="w-full py-2 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <RefreshCw size={13} /> Choose different photo
                  </button>
                )}
              </div>

              {/* Bio — optional */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">About you</label>
                  <span className="text-xs text-gray-400">Optional — but recommended</span>
                </div>
                <textarea
                  value={formData.bio}
                  onChange={e => handleChange('bio', e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors resize-none text-sm"
                  placeholder="What makes you, you? A line or two is plenty…"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{formData.bio.length}/500</p>
              </div>

              {/* Location — optional but improves matching */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin size={13} className="text-rose-400" />
                  <label className="text-sm font-semibold text-gray-700">Location</label>
                  <span className="text-xs text-gray-400 ml-auto">Helps find people near you</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => handleChange('city', e.target.value)}
                    className="px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors text-sm"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={formData.country}
                    onChange={e => handleChange('country', e.target.value)}
                    className="px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors text-sm"
                    placeholder="Country"
                  />
                </div>
              </div>

              {/* Nationality — optional */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Nationality</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={e => handleChange('nationality', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors text-sm"
                  placeholder="e.g. British, Nigerian, Brazilian…"
                />
              </div>

              {/* Profile preview card */}
              {(formData.full_name || formData.interests.length > 0) && (
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={13} className="text-rose-500" />
                    <span className="text-xs font-semibold text-gray-700">Your profile preview</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    {formData.full_name && <p>👤 {formData.full_name}</p>}
                    {combinedLocation   && <p>📍 {combinedLocation}</p>}
                    {formData.nationality && <p>🌍 {formData.nationality}</p>}
                    {formData.looking_for[0] && (
                      <p>🎯 {RELATIONSHIP_INTENTS.find(i => i.value === formData.looking_for[0])?.label}</p>
                    )}
                    {formData.interests.length > 0 && (
                      <p>✨ {formData.interests.slice(0, 4).join(', ')}{formData.interests.length > 4 ? ` +${formData.interests.length - 4} more` : ''}</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── Navigation ──────────────────────────────────────────────── */}
          <div className="flex gap-3 mt-7">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all">
                <ChevronLeft size={17} /> Back
              </button>
            )}
            <button
              onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
              disabled={!canProceed() || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-rose-500/20">
              {loading ? (
                <><Loader2 size={17} className="animate-spin" /> Creating your profile…</>
              ) : step < 3 ? (
                <>Continue <ChevronRight size={17} /></>
              ) : (
                <><Heart size={17} className="fill-white" /> Find My Matches</>
              )}
            </button>
          </div>

          {/* Step counter */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Step {step} of 3
          </p>

        </div>
      </div>
    </div>
  )
}
