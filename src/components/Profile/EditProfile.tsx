/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useTransition } from 'react'
import { X, Check, Sparkles, Save, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase-client'
import { RELATIONSHIP_INTENTS, INTERESTS_BY_CATEGORY, PROFILE_PROMPTS } from '@/types/app-constants'
import VideoUpload from '@/components/Profile/VideoUpload'
import PhotoUpload from '@/components/Profile/PhotoUpload'

interface EditProfileProps {
  onClose:      () => void
  initialTab?:  Tab
}

type Tab = 'basics' | 'prompts' | 'intents' | 'interests' | 'photos' | 'videos'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'basics',    label: 'Basics',    emoji: '👤' },
  { id: 'prompts',   label: 'Prompts',   emoji: '💬' },
  { id: 'intents',   label: 'Seeking',   emoji: '🎯' },
  { id: 'interests', label: 'Interests', emoji: '✨' },
  { id: 'photos',    label: 'Photos',    emoji: '📸' },
  { id: 'videos',    label: 'Videos',    emoji: '🎥' },
]

const MAX_PROMPTS = 3

// Shape of a saved prompt answer
interface PromptAnswer {
  id:       string  // matches ProfilePrompt.id
  question: string  // denormalised for display without lookup
  answer:   string
}

// Split a "City, Country" string back into parts for editing
function splitLocation(location: string): { city: string; country: string } {
  if (!location) return { city: '', country: '' }
  const parts = location.split(',').map(s => s.trim())
  return {
    city:    parts[0] ?? '',
    country: parts.slice(1).join(', ') ?? '',
  }
}

export default function EditProfile({ onClose, initialTab }: EditProfileProps) {
  const supabase = createClient()
  const { profile, refreshProfile } = useAuth()
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [saved, setSaved]         = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>(initialTab ?? 'basics')
  const [, startTransition]       = useTransition()

  // ── Basics + intents + interests form state ───────────────────────────────
  const [formData, setFormData] = useState({
    full_name:   '',
    bio:         '',
    city:        '',
    country:     '',
    nationality: '',
    looking_for: [] as string[],
    interests:   [] as string[],
  })

  // ── Prompts state ─────────────────────────────────────────────────────────
  // Up to 3 saved answers
  const [prompts, setPrompts]             = useState<PromptAnswer[]>([])
  // Which prompt slot is being edited (0, 1, or 2)
  const [editingSlot, setEditingSlot]     = useState<number | null>(null)
  // Question picker open for which slot
  const [pickerSlot, setPickerSlot]       = useState<number | null>(null)
  // Draft answer text while editing
  const [draftAnswer, setDraftAnswer]     = useState('')
  // Draft question ID while picking
  const [draftQuestionId, setDraftQuestionId] = useState('')

  // ── Load profile into form ────────────────────────────────────────────────
  useEffect(() => {
    if (profile) {
      const { city, country } = splitLocation((profile as any).location ?? '')
      startTransition(() => {
        setFormData({
          full_name:   profile.full_name   ?? '',
          bio:         profile.bio         ?? '',
          city,
          country,
          nationality: (profile as any).nationality ?? '',
          looking_for: (profile.looking_for ?? []) as string[],
          interests:   profile.interests   ?? [],
        })

        // Load saved prompts — stored as jsonb[] on profile
        const raw = (profile as any).prompts ?? []
        setPrompts(Array.isArray(raw) ? raw.filter(Boolean) : [])
      })
    }
  }, [profile])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const toggleArrayValue = <T extends string>(field: keyof typeof formData, value: T) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as T[]).includes(value)
        ? (prev[field] as T[]).filter(v => v !== value)
        : [...(prev[field] as T[]), value],
    }))
  }

  const combinedLocation = [formData.city, formData.country].filter(Boolean).join(', ')

  // ── Prompt helpers ────────────────────────────────────────────────────────

  // IDs already used — can't pick same question twice
  const usedPromptIds = new Set(prompts.map(p => p.id))

  const startAddingPrompt = () => {
    const slot = prompts.length  // next available slot index
    setPickerSlot(slot)
    setDraftQuestionId('')
    setDraftAnswer('')
    setEditingSlot(null)
  }

  const startEditingPrompt = (index: number) => {
    const p = prompts[index]
    setEditingSlot(index)
    setDraftQuestionId(p.id)
    setDraftAnswer(p.answer)
    setPickerSlot(null)
  }

  const confirmPromptQuestion = (promptId: string) => {
    const found = PROFILE_PROMPTS.find(p => p.id === promptId)
    if (!found) return
    setDraftQuestionId(promptId)
    // Move from picker to answer editor
    setPickerSlot(null)
    setEditingSlot(prompts.length)  // new slot at end
  }

  const savePromptAnswer = () => {
    if (!draftQuestionId || !draftAnswer.trim()) return
    const found = PROFILE_PROMPTS.find(p => p.id === draftQuestionId)
    if (!found) return

    const newPrompt: PromptAnswer = {
      id:       found.id,
      question: found.question,
      answer:   draftAnswer.trim(),
    }

    if (editingSlot !== null && editingSlot < prompts.length) {
      // Replace existing
      setPrompts(prev => prev.map((p, i) => i === editingSlot ? newPrompt : p))
    } else {
      // Add new
      setPrompts(prev => [...prev, newPrompt])
    }

    setEditingSlot(null)
    setDraftQuestionId('')
    setDraftAnswer('')
  }

  const removePrompt = (index: number) => {
    setPrompts(prev => prev.filter((_, i) => i !== index))
    if (editingSlot === index) {
      setEditingSlot(null)
      setDraftAnswer('')
      setDraftQuestionId('')
    }
  }

  const cancelPromptEdit = () => {
    setEditingSlot(null)
    setPickerSlot(null)
    setDraftAnswer('')
    setDraftQuestionId('')
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!profile) return
    setError('')
    setLoading(true)

    const completeness = Math.min(100,
      20 +
      (formData.bio.trim()             ? 20 : 0) +
      Math.min(formData.interests.length * 5, 30) +
      (formData.looking_for.length > 0 ? 15 : 0) +
      (combinedLocation                ? 15 : 0)
    )

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name:            formData.full_name.trim(),
        bio:                  formData.bio.trim(),
        location:             combinedLocation,
        nationality:          formData.nationality.trim(),
        looking_for:          formData.looking_for,
        interests:            formData.interests,
        // ── Prompts saved alongside other profile fields ──────────────────────
        // Cast required — prompts not in generated types yet
        prompts:              prompts,
        profile_completeness: completeness,
        updated_at:           new Date().toISOString(),
      } as any)
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
    (combinedLocation                ? 15 : 0)
  )

  const isAutoSaveTab = activeTab === 'photos' || activeTab === 'videos'

  // ── Currently editing prompt question label ───────────────────────────────
  const draftQuestion = PROFILE_PROMPTS.find(p => p.id === draftQuestionId)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg flex flex-col"
        style={{ maxHeight: '92dvh' }}>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
            <p className="text-sm text-gray-500">
              {formData.interests.length} interests · {prompts.length}/{MAX_PROMPTS} prompts
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-gray-100 overflow-x-auto px-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <span>{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          {/* ── Basics ── */}
          {activeTab === 'basics' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nationality</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={e => setFormData(p => ({ ...p, nationality: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:outline-none transition-colors"
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

          {/* ── Prompts ── */}
          {activeTab === 'prompts' && (
            <div className="space-y-4">

              <div>
                <p className="text-sm text-gray-600 leading-relaxed mb-1">
                  Answer up to 3 prompts to give people something real to connect with.
                </p>
                <p className="text-xs text-gray-400">
                  Profiles with prompts get significantly more first messages.
                </p>
              </div>

              {/* Saved prompts list */}
              {prompts.map((p, i) => (
                <div
                  key={p.id}
                  className={`border-2 rounded-2xl overflow-hidden transition-all ${
                    editingSlot === i ? 'border-rose-400' : 'border-gray-200'
                  }`}>

                  {/* Prompt header — question */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base flex-shrink-0">
                        {PROFILE_PROMPTS.find(q => q.id === p.id)?.emoji ?? '💬'}
                      </span>
                      <p className="text-xs font-semibold text-gray-600 truncate">{p.question}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => startEditingPrompt(i)}
                        className="text-xs text-rose-500 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors">
                        Edit
                      </button>
                      <button
                        onClick={() => removePrompt(i)}
                        className="p-1 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Answer display or edit */}
                  {editingSlot === i ? (
                    <div className="p-4 space-y-3">
                      <textarea
                        value={draftAnswer}
                        onChange={e => setDraftAnswer(e.target.value)}
                        rows={3}
                        maxLength={150}
                        autoFocus
                        className="w-full px-3 py-2.5 border-2 border-rose-300 rounded-xl text-sm focus:outline-none focus:border-rose-500 resize-none transition-colors"
                        placeholder="Your answer…"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{draftAnswer.length}/150</span>
                        <div className="flex gap-2">
                          <button
                            onClick={cancelPromptEdit}
                            className="px-3 py-1.5 text-sm border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                          </button>
                          <button
                            onClick={savePromptAnswer}
                            disabled={!draftAnswer.trim()}
                            className="px-3 py-1.5 text-sm bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors disabled:opacity-40">
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-sm text-gray-800 leading-relaxed">{p.answer}</p>
                    </div>
                  )}
                </div>
              ))}

              {/* Question picker — shown when adding a new prompt */}
              {pickerSlot !== null && (
                <div className="border-2 border-rose-300 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-rose-50 border-b border-rose-100">
                    <p className="text-sm font-semibold text-rose-700">Choose a question</p>
                    <p className="text-xs text-rose-400 mt-0.5">Pick one that feels authentic to you</p>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {PROFILE_PROMPTS.filter(q => !usedPromptIds.has(q.id)).map(q => (
                      <button
                        key={q.id}
                        onClick={() => confirmPromptQuestion(q.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 transition-colors text-left">
                        <span className="text-lg flex-shrink-0">{q.emoji}</span>
                        <span className="text-sm text-gray-700">{q.question}</span>
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100">
                    <button
                      onClick={cancelPromptEdit}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Answer editor — shown after picking a question for a new prompt */}
              {editingSlot !== null && editingSlot >= prompts.length && draftQuestionId && (
                <div className="border-2 border-rose-400 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border-b border-rose-100">
                    <span className="text-base">{draftQuestion?.emoji}</span>
                    <p className="text-xs font-semibold text-rose-700">{draftQuestion?.question}</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <textarea
                      value={draftAnswer}
                      onChange={e => setDraftAnswer(e.target.value)}
                      rows={3}
                      maxLength={150}
                      autoFocus
                      className="w-full px-3 py-2.5 border-2 border-rose-300 rounded-xl text-sm focus:outline-none focus:border-rose-500 resize-none transition-colors"
                      placeholder="Your answer…"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{draftAnswer.length}/150</span>
                      <div className="flex gap-2">
                        <button
                          onClick={cancelPromptEdit}
                          className="px-3 py-1.5 text-sm border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                        <button
                          onClick={savePromptAnswer}
                          disabled={!draftAnswer.trim()}
                          className="px-3 py-1.5 text-sm bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors disabled:opacity-40">
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add prompt button — hidden when at max or picker/editor open */}
              {prompts.length < MAX_PROMPTS && pickerSlot === null && editingSlot === null && (
                <button
                  onClick={startAddingPrompt}
                  className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-rose-300 text-rose-500 rounded-2xl hover:border-rose-400 hover:bg-rose-50 transition-all font-semibold text-sm">
                  <Plus size={16} />
                  Add a prompt ({MAX_PROMPTS - prompts.length} remaining)
                </button>
              )}

              {prompts.length === MAX_PROMPTS && pickerSlot === null && editingSlot === null && (
                <p className="text-center text-xs text-gray-400 py-2">
                  You've added all 3 prompts. Edit or remove one to change it.
                </p>
              )}
            </div>
          )}

          {/* ── Intents ── */}
          {activeTab === 'intents' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">Be honest — it leads to better matches!</p>
              {RELATIONSHIP_INTENTS.map(intent => (
                <button
                  key={intent.value}
                  type="button"
                  onClick={() => toggleArrayValue('looking_for', intent.value)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left ${
                    formData.looking_for.includes(intent.value)
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <span className="text-3xl">{intent.emoji}</span>
                  <div className="flex-1">
                    <p className={`font-semibold ${formData.looking_for.includes(intent.value) ? 'text-rose-700' : 'text-gray-900'}`}>
                      {intent.label}
                    </p>
                    <p className="text-sm text-gray-500">{intent.description}</p>
                  </div>
                  {formData.looking_for.includes(intent.value) && (
                    <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Interests ── */}
          {activeTab === 'interests' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">Pick what you love</p>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors ${
                  formData.interests.length >= 3
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {formData.interests.length} selected
                </span>
              </div>
              <div className="space-y-5">
                {INTERESTS_BY_CATEGORY.map(data => (
                  <div key={data.label}>
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
                          }`}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Photos ── */}
          {activeTab === 'photos' && (
            <PhotoUpload
              existingPhotos={(profile?.photos as any[] ?? []).filter(Boolean)}
              onPhotosChanged={() => refreshProfile()}
            />
          )}

          {/* ── Videos ── */}
          {activeTab === 'videos' && (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Your intro video is required for your profile to appear in Discover.
              </p>
              <VideoUpload onVideoUploaded={() => refreshProfile()} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 pt-4 pb-6 border-t border-gray-100">
          {isAutoSaveTab ? (
            <button
              onClick={onClose}
              className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all">
              Done
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || saved}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 disabled:opacity-40'
                }`}>
                {saved ? (
                  <><Check size={18} /> Saved!</>
                ) : loading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
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
