'use client'

import { Heart, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

function getPhotoUrl(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null
  const first = photos[0]
  if (!first) return null
  if (typeof first === 'string') return first
  if (typeof first === 'object' && 'url' in first && typeof first.url === 'string') return first.url
  return null
}

export default function TopHeader() {
  const { profile, signOut } = useAuth()
  const avatarUrl = getPhotoUrl(profile?.photos)
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header
      style={{
        position:           'fixed',
        top:                0,
        left:               0,
        right:              0,
        zIndex:             50,
        height:             '64px',
        background:         'rgba(253, 248, 245, 0.88)',
        backdropFilter:     'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom:       '1px solid rgba(244, 63, 94, 0.07)',
        boxShadow:          '0 1px 20px rgba(180, 60, 80, 0.05)',
        display:            'flex',
        alignItems:         'center',
        padding:            '0 24px',
      }}
    >
      <div
        style={{
          maxWidth:       '960px',
          margin:         '0 auto',
          width:          '100%',
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Animated heart */}
          <div style={{ position: 'relative', width: '32px', height: '32px' }}>
            <div
              style={{
                position:     'absolute',
                inset:        '-4px',
                borderRadius: '50%',
                background:   'radial-gradient(circle, rgba(244,63,94,0.15), transparent)',
                animation:    'pulse-rose 3s ease-in-out infinite',
              }}
            />
            <Heart
              size={32}
              style={{
                color:    '#f43f5e',
                fill:     'url(#heartGrad)',
                position: 'relative',
                zIndex:   1,
                filter:   'drop-shadow(0 2px 8px rgba(244,63,94,0.35))',
              }}
            />
          </div>

          {/* Wordmark */}
          <span
            style={{
              fontFamily:  "'Fraunces', Georgia, serif",
              fontWeight:  700,
              fontSize:    '22px',
              letterSpacing: '-0.02em',
              background:  'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight:  1,
            }}
          >
            Crotchet
          </span>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          {/* Avatar */}
          <div
            style={{
              width:        '36px',
              height:       '36px',
              borderRadius: '50%',
              overflow:     'hidden',
              flexShrink:   0,
              background:   'linear-gradient(135deg, #f43f5e, #ec4899)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              boxShadow:    '0 2px 12px rgba(244,63,94,0.25)',
              border:       '2px solid rgba(255,255,255,0.8)',
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile?.full_name ?? 'Avatar'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span
                style={{
                  color:      'white',
                  fontSize:   '13px',
                  fontWeight: '600',
                  fontFamily: "'DM Sans', sans-serif",
                  userSelect: 'none',
                }}
              >
                {initials}
              </span>
            )}
          </div>

          {/* Name */}
          <span
            style={{
              fontSize:    '13px',
              fontFamily:  "'DM Sans', sans-serif",
              fontWeight:  '500',
              color:       '#6b4c52',
              maxWidth:    '100px',
              overflow:    'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:  'nowrap',
            }}
            className="hidden sm:block"
          >
            {profile?.full_name}
          </span>

          {/* Sign out */}
          <button
            onClick={() => signOut()}
            title="Sign out"
            style={{
              width:          '36px',
              height:         '36px',
              borderRadius:   '50%',
              border:         '1.5px solid rgba(244,63,94,0.12)',
              background:     'rgba(244,63,94,0.04)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              cursor:         'pointer',
              transition:     'all 0.2s ease',
              color:          '#a37a82',
            }}
            onMouseEnter={e => {
              const t = e.currentTarget
              t.style.background   = 'rgba(244,63,94,0.10)'
              t.style.borderColor  = 'rgba(244,63,94,0.25)'
              t.style.color        = '#f43f5e'
              t.style.transform    = 'scale(1.05)'
            }}
            onMouseLeave={e => {
              const t = e.currentTarget
              t.style.background   = 'rgba(244,63,94,0.04)'
              t.style.borderColor  = 'rgba(244,63,94,0.12)'
              t.style.color        = '#a37a82'
              t.style.transform    = 'scale(1)'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}