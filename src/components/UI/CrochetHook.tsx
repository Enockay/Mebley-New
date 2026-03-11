import React from 'react'

interface CrochetHookProps {
  size?: number
  finish?: 'silver' | 'gold'
  className?: string
  style?: React.CSSProperties
}

export default function CrochetHook({ size = 48, finish = 'gold', className, style }: CrochetHookProps) {
  const isGold = finish === 'gold'

  const highlight = isGold ? '#fff8e7' : '#ffffff'
  const light     = isGold ? '#f5d97a' : '#e0e0f0'
  const mid       = isGold ? '#d4a017' : '#a8a8c0'
  const deep      = isGold ? '#8b6508' : '#606078'
  const shadow    = isGold ? '#5a3e00' : '#383850'
  const gripLight = isGold ? '#e8c96a' : '#d0d0e8'
  const gripMid   = isGold ? '#c49a12' : '#9898b8'
  const gripDark  = isGold ? '#7a5500' : '#505068'

  return (
    <svg
      width={size * 0.35}
      height={size}
      viewBox="0 0 18 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id={`s-${finish}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={shadow} />
          <stop offset="20%"  stopColor={mid} />
          <stop offset="40%"  stopColor={highlight} />
          <stop offset="60%"  stopColor={light} />
          <stop offset="80%"  stopColor={mid} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
        <linearGradient id={`g-${finish}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={gripDark} />
          <stop offset="25%"  stopColor={gripMid} />
          <stop offset="50%"  stopColor={gripLight} />
          <stop offset="75%"  stopColor={gripMid} />
          <stop offset="100%" stopColor={gripDark} />
        </linearGradient>
        <filter id={`f-${finish}`}>
          <feDropShadow dx="0.8" dy="1" stdDeviation="1" stopColor={shadow} stopOpacity="0.35" />
        </filter>
        <pattern id={`k-${finish}`} x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="3" y2="3" stroke={deep} strokeWidth="0.3" strokeOpacity="0.25" />
        </pattern>
      </defs>

      {/* ── TIP — the small hook notch at very top ── */}
      {/* Main shaft going up to tip */}
      <rect x="7" y="8" width="4" height="3" rx="1" fill={`url(#s-${finish})`} />

      {/* The actual hook — tiny rightward curve at tip, like a real crochet hook */}
      {/* Outer arc */}
      <path
        d="M 9 8 C 9 8 9 4 12 3.5 C 14.5 3 15 5 14 6.5 C 13.2 7.8 11.5 8 11 8"
        stroke={`url(#s-${finish})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        filter={`url(#f-${finish})`}
      />
      {/* Throat — the undercut notch */}
      <path
        d="M 9 8 C 8 8 7.2 7.2 7.5 6.2 C 7.8 5.2 9 5 9 5"
        stroke={`url(#s-${finish})`}
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Highlight on hook */}
      <path
        d="M 9.5 7.5 C 9.5 7.5 9.5 4.5 12 4"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── SHAFT — long tapered metal section ── */}
      <rect
        x="7.5" y="10" width="3" height="26" rx="1.5"
        fill={`url(#s-${finish})`}
        filter={`url(#f-${finish})`}
      />
      {/* Shaft shine */}
      <rect x="8.5" y="11" width="1" height="24" rx="0.5"
        fill="rgba(255,255,255,0.35)" />

      {/* ── THUMB REST — the slight indent/widening in the middle ── */}
      <rect x="6.5" y="34" width="5" height="6" rx="2.5"
        fill={`url(#s-${finish})`} />
      {/* Thumb rest rim lines */}
      <rect x="6.5" y="35.5" width="5" height="1" rx="0.5"
        fill={deep} opacity="0.3" />
      <rect x="6.5" y="38" width="5" height="1" rx="0.5"
        fill={deep} opacity="0.3" />
      {/* Thumb rest highlight */}
      <rect x="7" y="35.8" width="2.5" height="0.5" rx="0.25"
        fill="rgba(255,255,255,0.4)" />

      {/* ── GRIP — wider ergonomic handle ── */}
      <rect x="5.5" y="40" width="7" height="32" rx="3.5"
        fill={`url(#g-${finish})`}
        filter={`url(#f-${finish})`}
      />
      {/* Knurl texture */}
      <rect x="5.5" y="40" width="7" height="32" rx="3.5"
        fill={`url(#k-${finish})`} opacity="0.7" />
      {/* Grip left highlight */}
      <rect x="6" y="42" width="1.5" height="28" rx="0.75"
        fill="rgba(255,255,255,0.22)" />

      {/* Grip ring grooves */}
      {[47, 53, 59, 65].map((y, i) => (
        <g key={i}>
          <rect x="5.5" y={y} width="7" height="1.5" rx="0.75"
            fill={deep} opacity="0.2" />
          <rect x="6" y={y + 0.3} width="3.5" height="0.6" rx="0.3"
            fill="rgba(255,255,255,0.25)" />
        </g>
      ))}

      {/* ── END CAP ── */}
      <rect x="5.5" y="71" width="7" height="5" rx="2.5"
        fill={`url(#s-${finish})`} />
      <ellipse cx="8.5" cy="72.5" rx="2" ry="0.8"
        fill="rgba(255,255,255,0.4)" />

      {/* Size engraving */}
      <text x="9" y="30" textAnchor="middle" fontSize="2.2"
        fontFamily="'DM Sans', sans-serif" fontWeight="700"
        fill={deep} opacity="0.6" letterSpacing="0.3">
        {isGold ? '5mm' : '4mm'}
      </text>
    </svg>
  )
}