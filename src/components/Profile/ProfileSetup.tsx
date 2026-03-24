/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
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
  { number: 1, title: 'The basics',            subtitle: 'Takes 30 seconds — we promise' },
  { number: 2, title: "What you're looking for", subtitle: 'Be honest — it leads to better matches' },
  { number: 3, title: 'Your profile',           subtitle: 'Make a great first impression' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateUsername(fullName: string): string {
  const first  = fullName.trim().split(' ')[0] ?? 'user'
  const clean  = first.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${clean}${suffix}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfileSetup() {
  const { user, refreshProfile } = useAuth()
  const router = useRouter()

  // In PostgreSQL auth mode, user metadata isn't present on client auth user.
  const isGoogleUser = false
  const googleName   = ''

  const [step, setStep]                     = useState(1)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [underageBlocked, setUnderage]      = useState(false)

  // Photo state
  const [photoFile, setPhotoFile]           = useState<File | null>(null)
  const [photoPreview, setPhotoPreview]     = useState<string | null>(null)
  const [photoUrl, setPhotoUrl]             = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError]         = useState('')

  const uploadInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    full_name:         googleName,   // pre-filled for Google users, empty for email users
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slot: 0, fileType: photoFile.type || 'image/jpeg', fileSize: photoFile.size }),
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slot: 0, s3Key, cloudfrontUrl }),
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
    try {
      const lookingFor = Array.isArray(formData.looking_for)
        ? formData.looking_for
        : formData.looking_for ? [formData.looking_for as string] : []

      const photos     = photoUrl ? [{ url: photoUrl, slot: 0, s3Key: '' }] : []
      const username   = generateUsername(formData.full_name)

      const completeness = Math.min(100,
        20 +
        (formData.bio.trim()                ? 20 : 0) +
        Math.min(formData.interests.length * 5, 30) +
        (lookingFor.length > 0              ? 15 : 0) +
        (photoUrl                           ? 15 : 0)
      )

      const response = await fetch('/api/setup/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          full_name: formData.full_name.trim(),
          age_range: formData.age_range,
          gender: formData.gender,
          gender_preference: formData.gender_preference,
          looking_for: lookingFor,
          bio: formData.bio.trim(),
          location: combinedLocation,
          nationality: formData.nationality.trim(),
          interests: formData.interests,
          photos,
          profile_completeness: completeness,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data?.error ?? 'Failed to save profile setup')
        return
      }

      try {
        await refreshProfile()
      } catch {
        // Non-fatal for navigation; proxy/discover will fetch fresh profile server-side.
      }
      router.replace('/discover')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const currentStep = STEPS[step - 1]

  return (
    <div className="min-h-screen bg-[radial-gradient(44%_50%_at_8%_90%,rgba(236,72,153,0.26),transparent_72%),radial-gradient(38%_44%_at_92%_10%,rgba(139,92,246,0.26),transparent_74%),linear-gradient(140deg,#12022a_0%,#24033f_38%,#3f0752_72%,#5f0b5f_100%)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div className="text-center mb-7">
          <h1
            className="mb-1 text-4xl md:text-[2.8rem] font-serif font-bold leading-tight tracking-tight text-white"
            style={{ color: '#ffffff', textShadow: '0 4px 24px rgba(255,120,196,0.28), 0 2px 14px rgba(0,0,0,0.48)' }}
          >
            {currentStep.title}
          </h1>
          <p className="text-[15px] text-white/55">{currentStep.subtitle}</p>
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((s) => (
            <div key={s.number} className="flex-1">
              <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                s.number <= step ? 'bg-gradient-to-r from-[#f14fd0] to-[#ff5f9c]' : 'bg-white/15'
              }`} />
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-[16px] border border-white/16 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_30px_80px_rgba(8,3,18,0.55)] backdrop-blur-2xl sm:p-8">

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
                <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-white/55">Your name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => handleChange('full_name', e.target.value)}
                  className="w-full rounded-xl border border-white/22 bg-black/28 px-4 py-3 text-white placeholder:text-white/45 focus:border-[#da47f3] focus:outline-none transition-colors"
                  placeholder="First name or full name"
                  autoFocus={!isGoogleUser}
                />
                {isGoogleUser && formData.full_name && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check size={11} /> Pre-filled from your Google account
                  </p>
                )}
                <p className="mt-1 text-xs text-white/35">This is how you'll appear to other people</p>
              </div>

              {/* Age range */}
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-white/55">Age range</label>
                <div className="grid grid-cols-3 gap-2">
                  {AGE_RANGES.filter(a => !a.blocked).map(a => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => { handleChange('age_range', a.value); setUnderage(false) }}
                      className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        formData.age_range === a.value
                          ? 'border-[#c34cff] bg-[linear-gradient(140deg,rgba(186,63,255,0.22),rgba(255,96,178,0.18))] text-[#f3d9ff] shadow-[0_10px_26px_rgba(195,76,255,0.22)]'
                          : 'border-white/18 bg-white/[0.02] text-white/62 hover:border-[#a94de3] hover:text-white/86'
                      }`}>
                      {a.label}
                    </button>
                  ))}
                </div>
                {underageBlocked && (
                  <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                    <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 font-semibold">You must be 18 or older to use Mebley.</p>
                  </div>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-white/55">I identify as</label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleChange('gender', opt.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                        formData.gender === opt.value
                          ? 'border-[#c34cff] bg-[linear-gradient(140deg,rgba(186,63,255,0.22),rgba(255,96,178,0.18))] text-[#f3d9ff] shadow-[0_10px_26px_rgba(195,76,255,0.22)]'
                          : 'border-white/18 bg-white/[0.02] text-white/72 hover:border-[#a94de3]'
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
                <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-white/55">I'm interested in</label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_PREF_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => selectSingle('gender_preference', opt.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                        formData.gender_preference[0] === opt.value
                          ? 'border-[#c34cff] bg-[linear-gradient(140deg,rgba(186,63,255,0.22),rgba(255,96,178,0.18))] text-[#f3d9ff] shadow-[0_10px_26px_rgba(195,76,255,0.22)]'
                          : 'border-white/18 bg-white/[0.02] text-white/72 hover:border-[#a94de3]'
                      }`}>
                      <span className="text-xl">{opt.emoji}</span>
                      <span className="font-medium text-sm">{opt.label}</span>
                      {formData.gender_preference[0] === opt.value && <Check size={14} className="ml-auto text-rose-500" />}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ── Step 2 — Intent + Interests ─────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">

              <div>
                <label className="mb-1 block text-sm font-semibold uppercase tracking-[0.08em] text-white/55">I'm here for</label>
                <p className="mb-3 text-xs text-white/35">Pick one — you can change this anytime</p>
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
                            ? 'border-[#c34cff] bg-[linear-gradient(140deg,rgba(186,63,255,0.22),rgba(255,96,178,0.18))] shadow-[0_10px_26px_rgba(195,76,255,0.22)]'
                            : 'border-white/18 bg-white/[0.02] hover:border-[#a94de3] hover:bg-white/[0.03]'
                        }`}>
                        <span className="text-2xl">{intent.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${isSelected ? 'text-[#f3d9ff]' : 'text-white/82'}`}>
                            {intent.label}
                          </p>
                          <p className="text-xs text-white/42 truncate">{intent.description}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                          isSelected ? 'border-[#d54dff] bg-[#d54dff]' : 'border-white/35'
                        }`}>
                          {isSelected && (
                            <div className="w-full h-full rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-semibold uppercase tracking-[0.08em] text-white/55">Your interests</label>
                    <p className="text-xs text-white/35">Pick at least 3</p>
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors ${
                    formData.interests.length >= 3 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/50'
                  }`}>
                    {formData.interests.length} selected
                  </span>
                </div>
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {INTERESTS_BY_CATEGORY.map(cat => (
                    <div key={cat.label}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-base">{cat.emoji}</span>
                        <span className="text-xs font-semibold text-white/55">{cat.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.tags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleArray('interests', tag)}
                            className={`px-3 py-1 rounded-full text-xs border-2 transition-all ${
                              formData.interests.includes(tag)
                                ? 'border-[#d54dff] bg-gradient-to-r from-[#c34cff] to-[#ff5ea9] text-white shadow-[0_8px_20px_rgba(214,77,255,0.28)]'
                                : 'border-white/16 text-white/68 hover:border-[#a94de3] hover:bg-white/[0.03]'
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

              {/* Photo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Profile photo</label>
                  <span
                    className={`text-xs font-medium ${
                      photoUrl ? 'text-emerald-300' : photoPreview ? 'text-amber-300' : 'text-rose-500'
                    }`}
                  >
                    {photoUrl ? 'Verified' : photoPreview ? 'Ready to verify' : 'Required'}
                  </span>
                </div>
                <div className="mb-3 rounded-lg border border-white/16 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-3">
                  <p className="text-xs leading-relaxed text-white/62">
                    📸 Profiles with a real photo get <strong>3× more matches.</strong> Face detection keeps everyone safe.
                  </p>
                </div>
                {photoPreview ? (
                  <div className="relative mb-3 overflow-hidden rounded-xl border border-white/70 shadow-[0_16px_36px_rgba(62,21,41,0.18)]">
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
                  <div className="mb-3 flex h-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/22 bg-white/[0.03]">
                    <Camera size={24} className="text-white/35" />
                    <p className="text-sm text-white/45">No photo selected yet</p>
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
                    <button type="button" onClick={() => uploadInputRef.current?.click()} disabled={photoUploading}
                      className="flex items-center justify-center gap-2 rounded-lg border-2 border-white/18 bg-white/[0.03] py-2.5 text-sm font-medium text-white/75 transition-all hover:border-[#a94de3] hover:bg-white/[0.06] disabled:opacity-50">
                      <Upload size={15} /> Gallery
                    </button>
                    <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={photoUploading}
                      className="flex items-center justify-center gap-2 rounded-lg border-2 border-[#a94de3]/70 bg-[#a94de3]/15 py-2.5 text-sm font-medium text-[#f3d9ff] transition-all hover:border-[#d54dff] hover:bg-[#a94de3]/20 disabled:opacity-50">
                      <Camera size={15} /> Camera
                    </button>
                    <input ref={uploadInputRef} type="file" accept={ACCEPTED_FORMATS} className="hidden" onChange={handlePhotoSelect} />
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
                  </div>
                )}
                {photoPreview && !photoUrl && !photoUploading && (
                  <button onClick={handlePhotoUpload}
                    className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#c34cff] to-[#ff5ea9] py-3 font-semibold text-white shadow-[0_14px_28px_rgba(214,77,255,0.24)] transition-all hover:from-[#b13bf3] hover:to-[#ef4f9f]">
                    <Camera size={15} /> Use This Photo
                  </button>
                )}
                {photoUrl && (
                  <button onClick={resetPhoto}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/18 py-2 text-sm font-medium text-white/72 transition-colors hover:bg-white/[0.04]">
                    <RefreshCw size={13} /> Choose different photo
                  </button>
                )}
              </div>

              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold uppercase tracking-[0.08em] text-white/55">About you</label>
                  <span className="text-xs text-white/35">Optional — but recommended</span>
                </div>
                <textarea
                  value={formData.bio}
                  onChange={e => handleChange('bio', e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded-xl border border-white/22 bg-black/28 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-[#da47f3] focus:outline-none transition-colors"
                  placeholder="What makes you, you? A line or two is plenty…"
                />
                <p className="text-xs text-white/35 text-right mt-1">{formData.bio.length}/500</p>
              </div>

              {/* Location */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin size={13} className="text-[#f06bd4]" />
                  <label className="text-sm font-semibold uppercase tracking-[0.08em] text-white/55">Location</label>
                  <span className="ml-auto text-xs text-white/35">Helps find people near you</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => handleChange('city', e.target.value)}
                    className="rounded-xl border border-white/22 bg-black/28 px-3 py-2.5 text-sm text-white placeholder:text-white/45 focus:border-[#da47f3] focus:outline-none transition-colors"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={formData.country}
                    onChange={e => handleChange('country', e.target.value)}
                    className="rounded-xl border border-white/22 bg-black/28 px-3 py-2.5 text-sm text-white placeholder:text-white/45 focus:border-[#da47f3] focus:outline-none transition-colors"
                    placeholder="Country"
                  />
                </div>
              </div>

              {/* Nationality */}
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-white/55">Nationality</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={e => handleChange('nationality', e.target.value)}
                  className="w-full rounded-xl border border-white/22 bg-black/28 px-4 py-2.5 text-sm text-white placeholder:text-white/45 focus:border-[#da47f3] focus:outline-none transition-colors"
                  placeholder="e.g. British, Nigerian, Brazilian…"
                />
              </div>

              {/* Profile preview */}
              {(formData.full_name || formData.interests.length > 0) && (
                <div className="rounded-2xl border border-white/16 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={13} className="text-rose-500" />
                    <span className="text-xs font-semibold text-white/72">Your profile preview</span>
                  </div>
                  <div className="space-y-1 text-xs text-white/62">
                    {formData.full_name    && <p>👤 {formData.full_name}</p>}
                    {combinedLocation      && <p>📍 {combinedLocation}</p>}
                    {formData.nationality  && <p>🌍 {formData.nationality}</p>}
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
                className="flex items-center gap-2 rounded-xl border-2 border-white/18 px-5 py-3 font-medium text-white/74 transition-all hover:bg-white/[0.04]">
                <ChevronLeft size={17} /> Back
              </button>
            )}
            <button
              onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
              disabled={!canProceed() || loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c34cff] to-[#ff5ea9] py-3 font-semibold text-white shadow-[0_14px_28px_rgba(214,77,255,0.24)] transition-all hover:from-[#b13bf3] hover:to-[#ef4f9f] disabled:cursor-not-allowed disabled:opacity-40">
              {loading ? (
                <><Loader2 size={17} className="animate-spin" /> Setting up your profile…</>
              ) : step < 3 ? (
                <>Continue <ChevronRight size={17} /></>
              ) : (
                <><Heart size={17} className="fill-white" /> Find My Matches</>
              )}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-white/42">Step {step} of 3</p>

        </div>
      </div>
    </div>
  )
}