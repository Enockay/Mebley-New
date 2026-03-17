/* eslint-disable react/jsx-no-undef */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  Play, MapPin, Eye, EyeOff, Sparkles,
  Camera, ChevronRight, Heart, BadgeCheck, Edit3,
} from 'lucide-react'
import EditProfile from '@/components/Profile/EditProfile'
import DeleteAccount from '@/components/Profile/DeleteAccount'
import { createClient } from '@/lib/supabase-client'

import { RELATIONSHIP_INTENTS, PROFILE_PROMPTS } from '@/types/app-constants'

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

function getCompletenessNudge(profile: any, videoCount: number, promptCount: number): string | null {
  if (!profile.bio)                         return 'Add a bio to get 2× more matches'
  if (promptCount === 0)                    return 'Answer a prompt — it drives first messages'
  if ((profile.interests ?? []).length < 5) return 'Add more interests to improve your matches'
  if (promptCount < 3)                      return `Add ${3 - promptCount} more prompt${3 - promptCount > 1 ? 's' : ''} to complete your profile`
  return null
}

const s = {
  page:    { minHeight: '100vh', background: '#fdf8f5', fontFamily: "'DM Sans', sans-serif" },
  card:    { background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: 20, border: '1px solid rgba(244,63,94,0.08)', boxShadow: '0 2px 16px rgba(180,60,80,0.06)', padding: '20px' } as React.CSSProperties,
  label:   { fontSize: 10, fontWeight: 700, color: '#a37a82', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 10 },
  chip:    (color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: `${color}12`, border: `1px solid ${color}30`, color }),
  section: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
}

export default function ProfilePage() {
  const supabase = createClient()
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()

  const [showEdit, setShowEdit]         = useState(false)
  const [editTab, setEditTab]           = useState<'basics' | 'prompts' | 'intents' | 'interests' | 'photos' | 'videos'>('basics')
  const openEdit = (tab: typeof editTab = 'basics') => {
    setEditTab(tab)
    setShowEdit(true)
  }
  const [videos, setVideos]                       = useState<ProfileVideo[]>([])
  const [playingSlot, setPlayingSlot]             = useState<number | null>(null)
  const [visibilityLoading, setVisibilityLoading] = useState(false)
  const [activePhotoIdx, setActivePhotoIdx]       = useState(0)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

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

  const handleToggleVisibility = async () => {
    if (!user || !profile) return
    setVisibilityLoading(true)
    const newValue = !((profile as any).visible)
    await (supabase as any).from('profiles').update({ visible: newValue }).eq('id', user.id)
    await refreshProfile()
    setVisibilityLoading(false)
  }

  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf8f5' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2.5px solid rgba(244,63,94,0.15)', borderTopColor: '#f43f5e', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  const photos: Photo[]           = ((profile.photos as unknown as Photo[] | null) ?? []).filter(Boolean)
  const prompts: PromptAnswer[]   = (((profile as any).prompts as PromptAnswer[] | null) ?? []).filter(Boolean)
  const interests: string[]       = profile.interests ?? []
  const lookingFor: string[]      = (profile.looking_for ?? []) as string[]
  const isVisible                 = (profile as any).visible ?? false
  const completeness              = profile.profile_completeness ?? 0
  const introVideo                = videos.find(v => v.slot === 0)
  const ageLabel                  = AGE_RANGE_LABELS[(profile as any).age_range ?? ''] ?? ''
  const nudge                     = getCompletenessNudge(profile, videos.length, prompts.length)
  const intentLabel               = lookingFor.length > 0 ? RELATIONSHIP_INTENTS.find(i => i.value === lookingFor[0]) : null
  const sortedPhotos              = [...photos].sort((a, b) => a.slot - b.slot)
  const displayPhoto              = sortedPhotos[activePhotoIdx] ?? null
  const initials                  = profile.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .profile-fade { animation: fadeUp 0.4s ease forwards; }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(180,60,80,0.1) !important; }
        .toggle-track { transition: background 0.2s ease; }
      `}</style>

      <div style={s.page}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '80px 16px 100px' }}>

          {/* ── Hero section — circular avatar + name ── */}
          <div className="profile-fade" style={{ ...s.card, marginBottom: 12, padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>

              {/* Circular avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 96, height: 96, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                  padding: 3,
                  boxShadow: '0 4px 20px rgba(244,63,94,0.3)',
                }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#fdf8f5' }}>
                    {displayPhoto ? (
                      <img
                        src={displayPhoto.url}
                        alt={profile.full_name ?? ''}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(236,72,153,0.1))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 28, fontWeight: 700, color: '#f43f5e', fontFamily: "'Fraunces', serif" }}>
                          {initials}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo count badge */}
                {sortedPhotos.length > 1 && (
                  <div style={{
                    position: 'absolute', bottom: 2, right: 2,
                    background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                    borderRadius: 100, padding: '2px 7px',
                    fontSize: 10, fontWeight: 700, color: 'white',
                    border: '2px solid white',
                  }}>
                    {sortedPhotos.length}
                  </div>
                )}

                {/* Add photo button if no photo */}
                {!displayPhoto && (
                  <button
                    onClick={() => openEdit()}
                    style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                      border: '2px solid white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}>
                    <Camera size={13} color="white" />
                  </button>
                )}
              </div>

              {/* Name + details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <h1 style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 22, fontWeight: 700,
                    color: '#2d1b1f', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {profile.full_name || 'Your Name'}
                  </h1>
                  {profile.verified_email && (
                    <BadgeCheck size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {ageLabel && (
                    <span style={s.chip('#f43f5e')}>{ageLabel}</span>
                  )}
                  {(profile as any).gender && (
                    <span style={s.chip('#8b5cf6')}>{(profile as any).gender}</span>
                  )}
                  {profile.location && (
                    <span style={{ ...s.chip('#0ea5e9'), display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <MapPin size={10} /> {profile.location}
                    </span>
                  )}
                </div>

                <span style={{ fontSize: 12, color: '#a37a82' }}>@{profile.username}</span>
              </div>

              {/* Edit + visibility buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => openEdit()}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: '1.5px solid rgba(244,63,94,0.2)',
                    background: 'rgba(244,63,94,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}>
                  <Edit3 size={15} color="#f43f5e" />
                </button>
              </div>
            </div>

            {/* Photo strip if multiple photos */}
            {sortedPhotos.length > 1 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 16, overflowX: 'auto', paddingBottom: 4 }}>
                {sortedPhotos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIdx(i)}
                    style={{
                      width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                      overflow: 'hidden', padding: 0, cursor: 'pointer',
                      border: i === activePhotoIdx ? '2.5px solid #f43f5e' : '2px solid transparent',
                      boxShadow: i === activePhotoIdx ? '0 2px 10px rgba(244,63,94,0.3)' : 'none',
                      transition: 'all 0.2s ease',
                    }}>
                    <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Profile strength ── */}
          {completeness < 100 && (
            <button
              onClick={() => openEdit()}
              className="card-hover"
              style={{ ...s.card, marginBottom: 12, width: '100%', textAlign: 'left', cursor: 'pointer', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Sparkles size={14} color="#f43f5e" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2d1b1f' }}>Profile strength</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#f43f5e' }}>{completeness}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(244,63,94,0.1)', marginBottom: 8, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: 'linear-gradient(90deg, #f43f5e, #ec4899)',
                  width: `${completeness}%`,
                  transition: 'width 0.8s ease',
                }} />
              </div>
              {nudge && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#a37a82' }}>{nudge}</span>
                  <ChevronRight size={13} color="#c4a0a8" />
                </div>
              )}
            </button>
          )}

          {/* ── Visibility toggle ── */}
          <div style={{ ...s.card, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: isVisible ? 'rgba(34,197,94,0.1)' : 'rgba(180,60,80,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isVisible
                  ? <Eye size={16} color="#16a34a" />
                  : <EyeOff size={16} color="#a37a82" />
                }
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#2d1b1f', margin: 0 }}>
                  {isVisible ? 'Visible in Discover' : 'Hidden from Discover'}
                </p>
                <p style={{ fontSize: 11, color: '#a37a82', margin: '2px 0 0' }}>
                  {isVisible ? 'People can find and like you' : 'Your profile is not shown to anyone'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleVisibility}
              disabled={visibilityLoading}
              className="toggle-track"
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', flexShrink: 0,
                background: isVisible ? '#22c55e' : 'rgba(180,60,80,0.2)',
                cursor: 'pointer', position: 'relative', opacity: visibilityLoading ? 0.5 : 1,
              }}>
              <div style={{
                position: 'absolute', top: 2,
                left: isVisible ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%',
                background: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'left 0.2s ease',
              }} />
            </button>
          </div>

          {/* ── About + bio ── */}
          <div style={{ ...s.card, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={s.label}>About</p>
              {intentLabel && (
                <span style={s.chip('#8b5cf6')}>
                  {intentLabel.emoji} {intentLabel.label}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {(profile as any).nationality && (
                <span style={s.chip('#0ea5e9')}>🌍 {(profile as any).nationality}</span>
              )}
            </div>

            {profile.bio ? (
              <p style={{ fontSize: 14, color: '#4a2d35', lineHeight: 1.7, margin: 0 }}>{profile.bio}</p>
            ) : (
              <button
                onClick={() => openEdit()}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  border: '1.5px dashed rgba(244,63,94,0.25)',
                  background: 'rgba(244,63,94,0.02)',
                  fontSize: 13, color: '#c4a0a8', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                + Add a bio
              </button>
            )}
          </div>

          {/* ── Prompts ── */}
          <div style={{ marginBottom: 12, ...s.section }}>
            {prompts.length > 0 ? (
              prompts.map(prompt => {
                const meta = PROFILE_PROMPTS.find(p => p.id === prompt.id)
                return (
                  <div key={prompt.id} style={s.card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>{meta?.emoji ?? '💬'}</span>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#f43f5e', margin: 0, letterSpacing: '0.03em' }}>
                        {prompt.question}
                      </p>
                    </div>
                    <p style={{ fontSize: 14, color: '#2d1b1f', lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
                      {prompt.answer}
                    </p>
                  </div>
                )
              })
            ) : (
              <button
              onClick={() => openEdit('prompts')}
              className="card-hover"
              style={{
                ...s.card, width: '100%', textAlign: 'left', cursor: 'pointer',
                border: '1.5px dashed rgba(244,63,94,0.2)',
                background: 'rgba(244,63,94,0.02)',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'rgba(244,63,94,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 18 }}>💬</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#2d1b1f', margin: 0 }}>Answer a prompt</p>
                  <p style={{ fontSize: 11, color: '#a37a82', margin: '3px 0 0' }}>Give people something to react to</p>
                </div>
                <ChevronRight size={16} color="#c4a0a8" />
              </button>
            )}
          </div>

          {/* ── Interests ── */}
          {interests.length > 0 ? (
            <div style={{ ...s.card, marginBottom: 12 }}>
              <p style={s.label}>Interests</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {interests.map(interest => (
                  <span key={interest} style={{
                    padding: '6px 14px', borderRadius: 100,
                    fontSize: 12, fontWeight: 600,
                    background: 'rgba(244,63,94,0.06)',
                    border: '1px solid rgba(244,63,94,0.15)',
                    color: '#a03050',
                  }}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => openEdit()}
              className="card-hover"
              style={{
                ...s.card, marginBottom: 12, width: '100%', textAlign: 'left',
                cursor: 'pointer', border: '1.5px dashed rgba(244,63,94,0.2)',
                background: 'rgba(244,63,94,0.02)',
              }}>
              <p style={{ fontSize: 13, color: '#c4a0a8', margin: 0 }}>+ Add your interests</p>
            </button>
          )}

          {/* ── Intro video ── */}
          <div style={{ ...s.card, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ ...s.label, margin: 0 }}>Intro Video</p>
              {!introVideo && <span style={{ fontSize: 11, color: '#c4a0a8', fontWeight: 500 }}>Optional</span>}
            </div>
            {introVideo ? (
              <div style={{ borderRadius: 14, overflow: 'hidden', background: '#0f0409', aspectRatio: '16/9' }}>
                {playingSlot === 0 ? (
                  <video src={introVideo.cloudfront_url} controls autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                    <button
                      onClick={() => setPlayingSlot(0)}
                      style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                      }}>
                      <Play size={22} color="white" fill="white" style={{ marginLeft: 3 }} />
                    </button>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{formatTime(introVideo.duration_seconds)}</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openEdit()}
                style={{
                  width: '100%', aspectRatio: '16/9', borderRadius: 14,
                  border: '1.5px dashed rgba(244,63,94,0.2)',
                  background: 'rgba(244,63,94,0.02)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: 'pointer',
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(244,63,94,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Play size={20} color="#f43f5e" />
                </div>
                <span style={{ fontSize: 13, color: '#c4a0a8', fontFamily: "'DM Sans', sans-serif" }}>Add intro video</span>
              </button>
            )}
          </div>

          {/* ── Profile stats ── */}
          <div style={{ ...s.card, marginBottom: 12 }}>
            <p style={s.label}>Profile stats</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
              {[
                { value: sortedPhotos.length, label: `Photo${sortedPhotos.length !== 1 ? 's' : ''}` },
                { value: prompts.length,      label: `Prompt${prompts.length !== 1 ? 's' : ''}` },
                { value: interests.length,    label: `Interest${interests.length !== 1 ? 's' : ''}` },
              ].map(({ value, label }) => (
                <div key={label} style={{
                  padding: '14px 8px', borderRadius: 14,
                  background: 'rgba(244,63,94,0.04)',
                  border: '1px solid rgba(244,63,94,0.08)',
                }}>
                  <p style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: '#2d1b1f', margin: 0, lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: 11, color: '#a37a82', margin: '4px 0 0' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Delete account ── */}
          <DeleteAccount />

        </div>
      </div>

      {/* Edit profile modal */}
      {showEdit && (
        <EditProfile
          initialTab={editTab}
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