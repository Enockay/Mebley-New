/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Discover from '@/components/Discover/Discover'
import { Video, X, ArrowRight, ShieldCheck, Users, Sparkles } from 'lucide-react'

// ── Video nudge banner ────────────────────────────────────────────
function VideoNudgeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff1f2 0%, #fdf2f8 100%)',
      borderBottom: '1px solid #fecdd3',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      position: 'relative',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
        background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(244,63,94,0.3)',
      }}>
        <Video size={18} color="white" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Add an intro video to unlock full Discover 🎥
        </p>
        <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0', lineHeight: 1.4 }}>
          Profiles with videos get 5× more interest — and help others know you're real.
        </p>
      </div>
      <a href="/profile?tab=video" style={{
        flexShrink: 0, fontSize: 12, fontWeight: 700,
        color: '#e11d48', textDecoration: 'none',
        display: 'flex', alignItems: 'center', gap: 4,
        whiteSpace: 'nowrap',
      }}>
        Add video <ArrowRight size={13} />
      </a>
      <button onClick={onDismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#94a3b8', padding: 4, marginLeft: 4, flexShrink: 0,
      }}>
        <X size={15} />
      </button>
    </div>
  )
}

// ── First-visit video popup ───────────────────────────────────────
function VideoPopup({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 28, width: '100%', maxWidth: 400,
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Top gradient strip */}
        <div style={{
          background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
          padding: '28px 28px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <Video size={30} color="white" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', margin: '0 0 6px' }}>
            Introduce yourself with video
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
            The fastest way to get real matches — and stay safe
          </p>
        </div>

        {/* Benefits */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {[
              {
                icon: <Users size={17} color="#e11d48" />,
                title: '5× more profile visits',
                desc: 'People are far more likely to like someone they\'ve seen and heard.',
              },
              {
                icon: <ShieldCheck size={17} color="#e11d48" />,
                title: 'Prove you\'re the real deal',
                desc: 'A 30-second intro is the best way to show you\'re genuine — and spot fakes.',
              },
              {
                icon: <Sparkles size={17} color="#e11d48" />,
                title: 'Show your personality',
                desc: 'Photos don\'t laugh, talk, or tell stories. Your video does.',
              },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: '#fff1f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Info note */}
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 12, padding: '10px 14px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 12, color: '#15803d', margin: 0, lineHeight: 1.5 }}>
              🎥 <strong>Keep it simple:</strong> Just 30–120 seconds. Say hi, share something you love, and be yourself. That's it.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="/profile?tab=video" onClick={onClose} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', borderRadius: 16,
              background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
              color: 'white', fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(244,63,94,0.3)',
            }}>
              <Video size={16} /> Record My Intro Video
            </a>
            <button onClick={onClose} style={{
              padding: '12px', borderRadius: 16,
              border: '1.5px solid #e2e8f0', background: 'white',
              color: '#64748b', fontWeight: 500, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Maybe later — browse first
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function DiscoverPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  const [showBanner, setShowBanner]   = useState(false)
  const [showPopup, setShowPopup]     = useState(false)
  const [popupShown, setPopupShown]   = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!profile) return

    // Check if user has no intro video
    const hasVideo = !!(profile as any).intro_video_url ||
      // also check profile_videos table via profile completeness proxy
      false

    if (!hasVideo) {
      setShowBanner(true)

      // Show popup only once per session, after a short delay
      const seen = sessionStorage.getItem('video_popup_shown')
      if (!seen) {
        const t = setTimeout(() => {
          setShowPopup(true)
          setPopupShown(true)
          sessionStorage.setItem('video_popup_shown', '1')
        }, 1200)
        return () => clearTimeout(t)
      }
    }
  }, [profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile) { router.push('/setup'); return null }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Video nudge banner — dismissible, sits above the feed */}
      {showBanner && (
        <VideoNudgeBanner onDismiss={() => setShowBanner(false)} />
      )}

      {/* Main discover feed */}
      <div className="flex-1">
        <Discover />
      </div>

      {/* First-visit popup */}
      {showPopup && (
        <VideoPopup onClose={() => setShowPopup(false)} />
      )}
    </div>
  )
}
