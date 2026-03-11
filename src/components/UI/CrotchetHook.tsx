import React from 'react'

interface CrochetHookProps {
  size?: number
  finish?: 'silver' | 'gold'
  className?: string
  style?: React.CSSProperties
}

export default function CrochetHook({ size = 48, finish = 'gold', className, style }: CrochetHookProps) {
  const isGold = finish === 'gold'

  // Colour stops for metallic effect
  const highlight  = isGold ? '#fff8e7' : '#ffffff'
  const light      = isGold ? '#f5d97a' : '#e8e8f0'
  const mid        = isGold ? '#d4a017' : '#b0b0c8'
  const deep       = isGold ? '#8b6508' : '#6a6a82'
  const shadow     = isGold ? '#5a3e00' : '#3a3a50'
  const gripLight  = isGold ? '#e8c96a' : '#d0d0e8'
  const gripMid    = isGold ? '#c49a12' : '#9898b8'
  const gripDark   = isGold ? '#7a5500' : '#505068'

  return (
    <svg
      width={size}
      height={size * 3.2}
      viewBox="0 0 48 154"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        {/* Main shaft gradient — left-to-right metallic */}
        <linearGradient id={`shaft-${finish}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={shadow} />
          <stop offset="18%"  stopColor={mid} />
          <stop offset="38%"  stopColor={highlight} />
          <stop offset="55%"  stopColor={light} />
          <stop offset="75%"  stopColor={mid} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>

        {/* Grip gradient */}
        <linearGradient id={`grip-${finish}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={gripDark} />
          <stop offset="20%"  stopColor={gripMid} />
          <stop offset="45%"  stopColor={gripLight} />
          <stop offset="65%"  stopColor={gripMid} />
          <stop offset="100%" stopColor={gripDark} />
        </linearGradient>

        {/* Hook tip gradient */}
        <linearGradient id={`tip-${finish}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={highlight} />
          <stop offset="40%"  stopColor={light} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>

        {/* Shine overlay */}
        <linearGradient id={`shine-${finish}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
          <stop offset="35%"  stopColor="rgba(255,255,255,0.55)" />
          <stop offset="50%"  stopColor="rgba(255,255,255,0.0)" />
        </linearGradient>

        {/* Drop shadow filter */}
        <filter id={`shadow-${finish}`} x="-30%" y="-10%" width="160%" height="120%">
          <feDropShadow dx="1.5" dy="2" stdDeviation="2" stopColor={shadow} stopOpacity="0.4" />
        </filter>

        {/* Knurl texture for grip */}
        <pattern id={`knurl-${finish}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="4" y2="4" stroke={deep} strokeWidth="0.4" strokeOpacity="0.3" />
          <line x1="4" y1="0" x2="0" y2="4" stroke={deep} strokeWidth="0.4" strokeOpacity="0.15" />
        </pattern>
      </defs>

      {/* ── Hook tip (curved top) ── */}
      {/* Outer curve — the hook itself */}
      <path
        d="M 24 8 C 24 8 36 8 38 16 C 40 22 36 30 28 31 L 24 31"
        stroke={`url(#shaft-${finish})`}
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
        filter={`url(#shadow-${finish})`}
      />
      {/* Inner hook highlight */}
      <path
        d="M 24 8 C 24 8 35 8.5 37 16 C 38.8 22 35 29 28 30"
        stroke={`url(#shine-${finish})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />

      {/* Hook throat — the concave undercut */}
      <path
        d="M 24 31 C 22 31 20 29.5 20 27 C 20 24.5 22 23 24 23"
        stroke={`url(#tip-${finish})`}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Throat shine */}
      <path
        d="M 24 31 C 22.5 31 21 30 21 27.5"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Shaft — narrow tapered section ── */}
      {/* Main shaft body */}
      <rect
        x="21"
        y="31"
        width="6"
        height="38"
        rx="3"
        fill={`url(#shaft-${finish})`}
        filter={`url(#shadow-${finish})`}
      />
      {/* Shaft shine stripe */}
      <rect
        x="23.2"
        y="33"
        width="1.8"
        height="34"
        rx="0.9"
        fill={`url(#shine-${finish})`}
        opacity="0.6"
      />

      {/* ── Shoulder — transition collar into grip ── */}
      <rect
        x="18"
        y="67"
        width="12"
        height="7"
        rx="3.5"
        fill={`url(#shaft-${finish})`}
      />
      {/* Collar ring detail */}
      <rect
        x="18"
        y="70"
        width="12"
        height="1.5"
        rx="0.75"
        fill={deep}
        opacity="0.4"
      />
      <rect
        x="18.5"
        y="70"
        width="6"
        height="0.8"
        rx="0.4"
        fill="rgba(255,255,255,0.4)"
      />

      {/* ── Grip body — wider ergonomic handle ── */}
      {/* Main grip */}
      <rect
        x="16"
        y="74"
        width="16"
        height="62"
        rx="8"
        fill={`url(#grip-${finish})`}
        filter={`url(#shadow-${finish})`}
      />

      {/* Knurl texture overlay */}
      <rect
        x="16"
        y="74"
        width="16"
        height="62"
        rx="8"
        fill={`url(#knurl-${finish})`}
        opacity="0.6"
      />

      {/* Grip highlight — left edge */}
      <rect
        x="17"
        y="76"
        width="3"
        height="58"
        rx="1.5"
        fill="rgba(255,255,255,0.25)"
      />

      {/* Grip shine — centre */}
      <rect
        x="22"
        y="76"
        width="2"
        height="58"
        rx="1"
        fill="rgba(255,255,255,0.15)"
      />

      {/* Ring grooves on grip — 4 decorative rings */}
      {[88, 97, 106, 115].map((y, i) => (
        <g key={i}>
          <rect x="16" y={y} width="16" height="2.5" rx="1.25" fill={deep} opacity="0.25" />
          <rect x="17" y={y + 0.4} width="8" height="1" rx="0.5" fill="rgba(255,255,255,0.3)" />
        </g>
      ))}

      {/* ── Butt cap — end of handle ── */}
      <rect
        x="16"
        y="134"
        width="16"
        height="10"
        rx="5"
        fill={`url(#shaft-${finish})`}
      />
      {/* Cap shine */}
      <ellipse
        cx="21"
        cy="136"
        rx="3"
        ry="1.2"
        fill="rgba(255,255,255,0.45)"
      />

      {/* ── Size marking on shaft — engraved look ── */}
      <text
        x="24"
        y="58"
        textAnchor="middle"
        fontSize="3.5"
        fontFamily="'DM Sans', sans-serif"
        fontWeight="700"
        fill={deep}
        opacity="0.7"
        letterSpacing="0.5"
      >
        {isGold ? '5.0' : '4.0'}
      </text>
      <text
        x="24"
        y="62"
        textAnchor="middle"
        fontSize="2.8"
        fontFamily="'DM Sans', sans-serif"
        fill={deep}
        opacity="0.5"
        letterSpacing="0.3"
      >
        mm
      </text>
    </svg>
  )
}