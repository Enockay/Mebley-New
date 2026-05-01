/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { LogOut, Coins, Shield, ChevronDown } from 'lucide-react'
import { usePaywall } from '@/hooks/usePaywall'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import NotificationBell from '@/components/UI/NotificationBell'

function getPhotoUrl(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null
  const first = photos[0]
  if (!first) return null
  if (typeof first === 'string') return first
  if (typeof first === 'object' && 'url' in first && typeof first.url === 'string') return first.url
  return null
}

export default function TopHeader() {
  const { profile, signOut, creditBalance, isAdmin } = useAuth()
  const { openPaywall, closePaywall } = usePaywall()
  const router               = useRouter()
  const pathname             = usePathname()
  const searchParams         = useSearchParams()
  const avatarUrl            = getPhotoUrl(profile?.photos)
  const initials             = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const isEmbedded = searchParams.get('embedded') === '1'
  if (isEmbedded) return null

  const handleOpenProfile = () => {
    closePaywall()
    const isDesktopBrowse =
      pathname === '/browse' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 1024px)').matches

    if (isDesktopBrowse) {
      window.sessionStorage.setItem('browse:open-profile-panel', '1')
      router.push('/browse?panel=profile-settings')
      return
    }
    router.push('/profile')
  }

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 320,
      height: '64px',
      paddingTop: 'env(safe-area-inset-top)',
      background: 'linear-gradient(180deg, rgba(10,7,26,0.97) 0%, rgba(8,5,22,0.94) 100%)',
      backdropFilter: 'blur(32px)',
      WebkitBackdropFilter: 'blur(32px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 32px rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center',
      paddingLeft: 'max(20px, env(safe-area-inset-left))',
      paddingRight: 'max(20px, env(safe-area-inset-right))',
    }}>

      {/* Subtle accent line at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(214,77,232,0.45) 30%, rgba(238,92,166,0.45) 70%, transparent 100%)',
      }} />

      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Logo */}
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            border: 'none', background: 'transparent', padding: 0,
            cursor: 'pointer', flexShrink: 0,
          }}
          title="Go to home"
        >
          <div style={{
            width: 34, height: 34, borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(214,77,232,0.2), rgba(238,92,166,0.15))',
            border: '1px solid rgba(214,77,232,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(214,77,232,0.15)',
          }}>
            <Image
              src="/icon.svg"
              alt="Mebley logo"
              width={22}
              height={22}
              style={{ borderRadius: '6px' }}
              priority
            />
          </div>
          <span className="logo-text" style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: '18px', fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.3px',
          }}>Mebley</span>
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {isAdmin && (
            <button
              type="button"
              onClick={() => router.push('/admin')}
              title="Moderation dashboard"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: '8px',
                border: '1px solid rgba(168,85,247,0.3)',
                background: 'rgba(168,85,247,0.1)',
                color: '#d8b4fe',
                fontSize: '12px', fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(168,85,247,0.2)'
                e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(168,85,247,0.1)'
                e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'
              }}
            >
              <Shield size={12} aria-hidden />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* Notification Bell */}
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <NotificationBell />
          </div>

          {/* Credits pill */}
          <button
            onClick={() => openPaywall('general', 'credits')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: '10px',
              border: '1px solid rgba(246,205,126,0.22)',
              background: 'rgba(246,205,126,0.07)',
              color: '#f0c96e', fontSize: '12px', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(246,205,126,0.13)'
              e.currentTarget.style.borderColor = 'rgba(246,205,126,0.38)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(246,205,126,0.07)'
              e.currentTarget.style.borderColor = 'rgba(246,205,126,0.22)'
            }}
          >
            <Coins size={13} />
            <span>
              {Math.max(0, Number(creditBalance ?? 0)).toLocaleString()}
              <span className="credits-label"> Credits</span>
            </span>
          </button>

          {/* Vertical divider */}
          <div style={{
            width: '1px', height: '28px',
            background: 'rgba(255,255,255,0.08)',
            margin: '0 4px',
            flexShrink: 0,
          }} />

          {/* Profile button */}
          <button
            onClick={handleOpenProfile}
            title="My profile"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 10px 4px 4px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(214,77,232,0.1)'
              e.currentTarget.style.borderColor = 'rgba(214,77,232,0.25)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '8px',
              overflow: 'hidden', flexShrink: 0,
              background: 'linear-gradient(135deg, #d64de8, #ee5ca6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(214,77,232,0.35)',
            }}>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={profile?.full_name ?? 'Avatar'}
                  width={32}
                  height={32}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  unoptimized
                />
              ) : (
                <span style={{
                  color: 'white', fontSize: '12px', fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif", userSelect: 'none',
                }}>
                  {initials}
                </span>
              )}
            </div>

            {/* Name */}
            <span className="hidden sm:block" style={{
              fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500, color: 'rgba(255,255,255,0.82)',
              maxWidth: '110px', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {profile?.full_name}
            </span>

            <ChevronDown size={13} color="rgba(255,255,255,0.35)" className="hidden sm:block" />
          </button>

          {/* Sign out */}
          <button
            onClick={() => signOut()}
            title="Sign out"
            style={{
              width: 36, height: 36, borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease',
              color: 'rgba(255,255,255,0.5)', flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = 'rgba(239,68,68,0.12)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.28)'
              e.currentTarget.style.color       = '#fca5a5'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color       = 'rgba(255,255,255,0.5)'
            }}
          >
            <LogOut size={15} />
          </button>

        </div>
      </div>
    </header>
  )
}