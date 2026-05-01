'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Heart, Sparkles, MessageCircle, User } from 'lucide-react'
import { usePaywall } from '@/hooks/usePaywall'

const navItems = [
  { href: '/discover', label: 'Discover', icon: Heart },
  { href: '/browse',   label: 'Browse',   icon: Sparkles },
  { href: '/matches',  label: 'Chats',    icon: MessageCircle },
  { href: '/profile',  label: 'Profile',  icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const { closePaywall } = usePaywall()
  const [unreadChats, setUnreadChats] = useState(0)

  useEffect(() => {
    let active = true

    const loadUnreadChats = async () => {
      try {
        const res = await fetch('/api/chat/conversations', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const convos = Array.isArray(data?.conversations) ? data.conversations : []
        const unreadTotal = convos.reduce((sum: number, conv: any) => {
          const count = typeof conv?.unreadCount === 'number' ? conv.unreadCount : 0
          return sum + Math.max(0, count)
        }, 0)
        if (active) setUnreadChats(unreadTotal)
      } catch {
        // Ignore transient polling failures.
      }
    }

    loadUnreadChats()
    const timer = setInterval(loadUnreadChats, 15000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  // Hide bottom nav when the page is rendered in an embedded iframe/panel
  const isEmbedded = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('embedded') === '1'
    : false
  if (isEmbedded) return null
  const handleNavClick = (href: string) => {
    if (href === '/profile') {
      closePaywall()
    }
    if (pathname === '/browse' && href === '/matches') {
      const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
      if (isMobile) {
        router.push('/matches')
        return
      }
      router.push('/browse?panel=chats')
      return
    }
    if (pathname === '/browse' && href === '/profile') {
      const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
      if (isMobile) {
        router.push('/profile')
        return
      }
      // Mark this as an intentional request so Browse can ignore stale query params on reload.
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('browse:open-profile-panel', '1')
      }
      router.push('/browse?panel=profile-settings')
      return
    }
    router.push(href)
  }

  return (
    <nav
      style={{
        position:        'fixed',
        bottom:          0,
        left:            0,
        right:           0,
        zIndex:          320,
        background:      'rgba(8,6,20,0.92)',
        backdropFilter:  'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop:       'none',
        boxShadow:       '0 -6px 28px rgba(8, 2, 16, 0.22)',
        paddingBottom:   'env(safe-area-inset-bottom)',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'stretch',
      }}
    >
      <div
        style={{
          maxWidth:       '480px',
          margin:         '0 auto',
          width:          '100%',
          display:        'flex',
          justifyContent: 'space-around',
          alignItems:     'center',
          padding:        '0 4px',
          height:         '72px',
        }}
      >
        {navItems
          // Temporarily hide Discover from nav without deleting code
          .filter(item => item.href !== '/discover')
          .map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          const showUnreadBadge = href === '/matches' && unreadChats > 0

          return (
            <button
              key={href}
              onClick={() => handleNavClick(href)}
              className="nav-btn"
              style={{
                background:     isActive
                  ? 'linear-gradient(135deg, rgba(240,56,104,0.18), rgba(255,122,80,0.10))'
                  : 'transparent',
                transform:      isActive ? 'translateY(-2px)' : 'translateY(0)',
              }}
            >
              {/* Icon wrapper with glow on active */}
              <div
                style={{
                  position:   'relative',
                  display:    'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position:     'absolute',
                      inset:        '-4px',
                      borderRadius: '50%',
                      background:   'radial-gradient(circle, rgba(240,56,104,0.28), transparent)',
                      animation:    'pulse-rose 2s ease-in-out infinite',
                    }}
                  />
                )}
                <Icon
                  size={isActive ? 23 : 22}
                  style={{
                    color:      isActive ? '#ffd8e4' : 'rgba(255,255,255,0.52)',
                    fill:       isActive ? 'rgba(240,56,104,0.16)' : 'none',
                    transition: 'all 0.25s ease',
                    position:   'relative',
                    zIndex:     1,
                  }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {showUnreadBadge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -10,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 999,
                      padding: '0 4px',
                      background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 700,
                      lineHeight: '16px',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.5)',
                      boxShadow: '0 4px 10px rgba(244,63,94,0.4)',
                    }}
                    aria-label={`${unreadChats} unread chats`}
                  >
                    {unreadChats > 99 ? '99+' : unreadChats}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize:     '10px',
                  fontFamily:   "'DM Sans', sans-serif",
                  fontWeight:   isActive ? '600' : '400',
                  color:        isActive ? '#ffd8e4' : 'rgba(255,255,255,0.52)',
                  letterSpacing: '0.02em',
                  transition:   'all 0.25s ease',
                }}
              >
                {label}
              </span>

              {/* Active dot indicator -->*/}
              {isActive && (
                <div
                  style={{
                    position:     'absolute',
                    bottom:       '6px',
                    width:        '4px',
                    height:       '4px',
                    borderRadius: '50%',
                    background:   'linear-gradient(135deg, #f03868, #ff7a50)',
                    boxShadow:    '0 0 6px rgba(240,56,104,0.65)',
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
