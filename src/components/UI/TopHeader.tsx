/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { LogOut, Coins } from 'lucide-react'
import { usePaywall } from '@/hooks/usePaywall'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import CrochetHook from './CrochetHook'
import CrotchetWordmark from './CrotchetWordmark'

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
  const { openPaywall }      = usePaywall()
  const router               = useRouter()
  const currentPlan          = (profile as any)?.plan ?? 'free'
  const creditBalance        = (profile as any)?.credit_balance ?? 0
  const avatarUrl            = getPhotoUrl(profile?.photos)
  const initials             = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: '64px',
      background: 'rgba(253, 248, 245, 0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(244, 63, 94, 0.07)',
      boxShadow: '0 1px 20px rgba(180, 60, 80, 0.05)',
      display: 'flex', alignItems: 'center', padding: '0 24px',
    }}>
      <div style={{
        maxWidth: '960px', margin: '0 auto', width: '100%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ filter: 'drop-shadow(0 2px 4px rgba(212,160,23,0.3))', display: 'flex', alignItems: 'center' }}>
            <CrochetHook size={44} finish="gold" />
          </div>
          <CrotchetWordmark height={28} />
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* Upgrade — free users only */}
          {currentPlan === 'free' && (
            <button
              onClick={() => openPaywall('general', 'plans')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '100px', border: 'none',
                background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                color: 'white', fontSize: '12px', fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: '0 2px 12px rgba(244,63,94,0.3)',
              }}>
              ✨ Upgrade
            </button>
          )}

          {/* Credits */}
          <button
            onClick={() => openPaywall('general', 'credits')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: '100px',
              border: '1.5px solid rgba(232,160,32,0.3)',
              background: 'rgba(232,160,32,0.08)',
              color: '#c4870a', fontSize: '12px', fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            <Coins size={13} />
            {creditBalance > 0 ? creditBalance.toLocaleString() : 'Credits'}
          </button>

          {/* Avatar — clicks to /profile */}
          <button
            onClick={() => router.push('/profile')}
            title="My profile"
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0, padding: 0, border: 'none',
              background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(244,63,94,0.25)',
              outline: '2px solid rgba(255,255,255,0.8)',
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
              fontWeight: '500', color: '#6b4c52',
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
              border: '1.5px solid rgba(244,63,94,0.12)',
              background: 'rgba(244,63,94,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease', color: '#a37a82',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = 'rgba(244,63,94,0.10)'
              e.currentTarget.style.borderColor = 'rgba(244,63,94,0.25)'
              e.currentTarget.style.color       = '#f43f5e'
              e.currentTarget.style.transform   = 'scale(1.05)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'rgba(244,63,94,0.04)'
              e.currentTarget.style.borderColor = 'rgba(244,63,94,0.12)'
              e.currentTarget.style.color       = '#a37a82'
              e.currentTarget.style.transform   = 'scale(1)'
            }}>
            <LogOut size={16} />
          </button>

        </div>
      </div>
    </header>
  )
}