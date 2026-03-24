/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { LogOut, Coins } from 'lucide-react'
import { usePaywall } from '@/hooks/usePaywall'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
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
  const { profile, signOut, creditBalance } = useAuth()
  const { openPaywall }      = usePaywall()
  const router               = useRouter()
  const currentPlan          = (profile as any)?.plan ?? 'free'
  const avatarUrl            = getPhotoUrl(profile?.photos)
  const initials             = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header className="px-2.5 sm:px-6" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: '64px',
      background: 'linear-gradient(135deg, rgba(22,8,36,0.9), rgba(44,12,58,0.86))',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.12)',
      boxShadow: '0 1px 24px rgba(8, 2, 16, 0.38)',
      display: 'flex', alignItems: 'center',
    }}>
      <div className="w-full" style={{
        maxWidth: '960px', margin: '0 auto', width: '100%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>

        {/* Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2.5" style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src="/icon.svg"
            alt="Mebley logo"
            width={30}
            height={30}
            style={{ borderRadius: '999px' }}
            priority
          />
          <span
            className="hidden sm:block"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: '30px',
              fontWeight: 700,
              color: '#f5e8f4',
              textShadow: '0 1px 12px rgba(245,124,180,0.22)',
              lineHeight: 1,
            }}
          >
            Mebley
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2.5" style={{ display: 'flex', alignItems: 'center' }}>

          {/* Upgrade — free users only */}
          {currentPlan === 'free' && (
            <button
              className="hidden sm:inline-flex"
              onClick={() => openPaywall('general', 'plans')}
              style={{
                alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '100px', border: 'none',
                background: 'linear-gradient(135deg, #d64de8, #ee5ca6)',
                color: 'white', fontSize: '12px', fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: '0 2px 12px rgba(214,77,232,0.34)',
              }}>
              ✨ Upgrade
            </button>
          )}

          {/* Credits */}
          <button
            className="inline-flex"
            onClick={() => openPaywall('general', 'credits')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 10px', borderRadius: '100px',
              border: '1.5px solid rgba(246,205,126,0.32)',
              background: 'rgba(246,205,126,0.08)',
              color: '#f3cd86', fontSize: '12px', fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            <Coins size={13} />
            <span className="hidden sm:inline">
              {creditBalance > 0 ? creditBalance.toLocaleString() : 'Credits'}
            </span>
          </button>

          {/* Avatar — clicks to /profile */}
          <button
            onClick={() => router.push('/profile')}
            title="My profile"
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
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
            onClick={() => signOut()}
            title="Sign out"
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.18)',
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