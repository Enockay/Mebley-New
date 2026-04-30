/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { LogOut, Coins, Shield } from 'lucide-react'
import { usePaywall } from '@/hooks/usePaywall'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

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
  const currentPlan          = (profile as any)?.plan ?? 'free'
  const avatarUrl            = getPhotoUrl(profile?.photos)
  const initials             = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  // SSR-safe embedded check to avoid hydration mismatch.
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
    <header className="px-2 sm:px-4 md:px-6" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 320,
      height: '62px',
      background: 'rgba(8,6,20,0.88)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 1px 24px rgba(0,0,0,0.42)',
      display: 'flex', alignItems: 'center',
    }}>
      <div className="w-full" style={{
        width: '100%',
        display: 'flex', justifyContent: 'flex-start', alignItems: 'center',
        gap: 10,
      }}>

        {/* Logo at left-most */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 sm:gap-2.5 min-w-0"
          style={{
            display: 'flex',
            alignItems: 'center',
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
          }}
          title="Go to home"
        >
          <Image
            src="/icon.svg"
            alt="Mebley logo"
            width={28}
            height={28}
            style={{ borderRadius: '999px' }}
            priority
          />
          <span
            className="block"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: '24px',
              fontWeight: 700,
              color: '#f5e8f4',
              textShadow: '0 1px 12px rgba(245,124,180,0.22)',
              lineHeight: 1,
            }}
          >
            Mebley
          </span>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3" style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>

          {isAdmin && (
            <button
              type="button"
              onClick={() => router.push('/admin')}
              title="Moderation dashboard"
              className="inline-flex"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '100px',
                border: '1px solid rgba(168,85,247,0.38)',
                background: 'rgba(168,85,247,0.12)',
                color: '#e9d5ff',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Shield size={13} aria-hidden />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* Credits */}
          <button
            className="inline-flex"
            onClick={() => openPaywall('general', 'credits')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 8px', borderRadius: '100px',
              border: '1px solid rgba(246,205,126,0.32)',
              background: 'rgba(246,205,126,0.08)',
              color: '#f3cd86', fontSize: '11px', fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            <Coins size={13} />
            <span>
              {Math.max(0, Number(creditBalance ?? 0)).toLocaleString()} Credits
            </span>
          </button>

          {/* Avatar — clicks to /profile */}
          <button
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={handleOpenProfile}
            title="My profile"
            style={{
              borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0, padding: 0, border: 'none',
              background: 'linear-gradient(135deg, #d64de8, #ee5ca6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(214,77,232,0.28)',
              outline: '2px solid rgba(255,255,255,0.35)',
              cursor: 'pointer',
            }}>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={profile?.full_name ?? 'Avatar'}
                width={36}
                height={36}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                unoptimized
              />
            ) : (
              <span style={{
                color: 'white', fontSize: '13px', fontWeight: '600',
                fontFamily: "'DM Sans', sans-serif", userSelect: 'none',
              }}>
                {initials}
              </span>
            )}
          </button>

          {/* Name — hidden on small screens */}
          <span
            className="hidden sm:block"
            style={{
              fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
              fontWeight: '500', color: 'rgba(255,255,255,0.72)',
              maxWidth: '100px', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
            {profile?.full_name}
          </span>

          {/* Sign out */}
          <button
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => signOut()}
            title="Sign out"
            style={{
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease', color: 'rgba(255,255,255,0.65)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = 'rgba(214,77,232,0.18)'
              e.currentTarget.style.borderColor = 'rgba(214,77,232,0.35)'
              e.currentTarget.style.color       = '#f6d0ff'
              e.currentTarget.style.transform   = 'scale(1.05)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
              e.currentTarget.style.color       = 'rgba(255,255,255,0.65)'
              e.currentTarget.style.transform   = 'scale(1)'
            }}>
            <LogOut size={16} />
          </button>

        </div>
      </div>
    </header>
  )
}