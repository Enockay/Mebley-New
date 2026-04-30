'use client'

import type { ReactNode } from 'react'

export default function AdminPageHeader({
  icon: Icon,
  iconColor = '#f03868',
  title,
  subtitle,
  right,
  loading,
}: {
  icon: React.ElementType
  iconColor?: string
  title: string
  subtitle: string
  right?: ReactNode
  loading?: boolean
}) {
  return (
    <header
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(8,6,20,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        padding: '0 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 64,
          gap: 12,
          flexWrap: 'wrap',
          padding: '10px 0',
        }}
      >
        {/* Left — icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: `${iconColor}18`,
              border: `1px solid ${iconColor}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={17} color={iconColor} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </h1>
            <p
              style={{
                margin: '1px 0 0',
                fontSize: 12,
                color: 'rgba(240,232,244,0.4)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '40vw',
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right slot */}
        {right && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            {right}
          </div>
        )}
      </div>

      {/* Loading bar */}
      {loading && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${iconColor}, #a855f7)`,
              borderRadius: 99,
              animation: 'admin-progress 1.4s ease infinite',
            }}
          />
          <style>{`
            @keyframes admin-progress {
              0%   { width:0%;  margin-left:0%   }
              50%  { width:70%; margin-left:15%  }
              100% { width:0%;  margin-left:100% }
            }
          `}</style>
        </div>
      )}
    </header>
  )
}
