'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Heart, Sparkles, MessageCircle, User } from 'lucide-react'

const navItems = [
  { href: '/discover', label: 'Discover', icon: Heart },
  { href: '/browse',   label: 'Browse',   icon: Sparkles },
  { href: '/matches',  label: 'Chats',    icon: MessageCircle },
  { href: '/profile',  label: 'Profile',  icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <nav
      style={{
        position:        'fixed',
        bottom:          0,
        left:            0,
        right:           0,
        zIndex:          50,
        background:      'linear-gradient(135deg, rgba(20,7,31,0.92), rgba(40,12,50,0.88))',
        backdropFilter:  'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop:       '1px solid rgba(255,255,255,0.14)',
        boxShadow:       '0 -6px 28px rgba(8, 2, 16, 0.36)',
        height:          '72px',
        display:         'flex',
        alignItems:      'center',
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
          padding:        '0 8px',
        }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')

          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                gap:            '4px',
                padding:        '8px 16px',
                borderRadius:   '16px',
                border:         'none',
                cursor:         'pointer',
                transition:     'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                background:     isActive
                  ? 'linear-gradient(135deg, rgba(214,77,232,0.2), rgba(238,92,166,0.16))'
                  : 'transparent',
                transform:      isActive ? 'translateY(-2px)' : 'translateY(0)',
                minWidth:       '64px',
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
                      background:   'radial-gradient(circle, rgba(214,77,232,0.26), transparent)',
                      animation:    'pulse-rose 2s ease-in-out infinite',
                    }}
                  />
                )}
                <Icon
                  size={isActive ? 23 : 22}
                  style={{
                    color:      isActive ? '#f5d6ff' : 'rgba(255,255,255,0.58)',
                    fill:       isActive ? 'rgba(214,77,232,0.2)' : 'none',
                    transition: 'all 0.25s ease',
                    position:   'relative',
                    zIndex:     1,
                  }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize:     '10px',
                  fontFamily:   "'DM Sans', sans-serif",
                  fontWeight:   isActive ? '600' : '400',
                  color:        isActive ? '#f5d6ff' : 'rgba(255,255,255,0.58)',
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
                    background:   'linear-gradient(135deg, #d64de8, #ee5ca6)',
                    boxShadow:    '0 0 6px rgba(214,77,232,0.65)',
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
