import React from 'react'

interface CrochetHookProps {
  size?: number
  finish?: 'silver' | 'gold'
  className?: string
  style?: React.CSSProperties
}

export default function CrochetHook({ size = 56, finish = 'gold', className, style }: CrochetHookProps) {
  const isGold = finish === 'gold'
  const id = `hook-${finish}`

  return (
    <svg
      width={size * 0.42}
      height={size}
      viewBox="0 0 22 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        {/* Main shaft gradient */}
        <linearGradient id={`shaft-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={isGold ? '#3d1f00' : '#1a1a2e'} />
          <stop offset="15%"  stopColor={isGold ? '#8b5e00' : '#4a4a6a'} />
          <stop offset="35%"  stopColor={isGold ? '#d4a017' : '#8888b0'} />
          <stop offset="50%"  stopColor={isGold ? '#fff3c4' : '#ffffff'} />
          <stop offset="65%"  stopColor={isGold ? '#e8c040' : '#a0a0c8'} />
          <stop offset="85%"  stopColor={isGold ? '#9a6800' : '#5050780'} />
          <stop offset="100%" stopColor={isGold ? '#3d1f00' : '#1a1a2e'} />
        </linearGradient>
        {/* Grip gradient */}
        <linearGradient id={`grip-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={isGold ? '#2a1000' : '#0e0e1e'} />
          <stop offset="20%"  stopColor={isGold ? '#7a4800' : '#383858'} />
          <stop offset="45%"  stopColor={isGold ? '#c88a10' : '#7070a0'} />
          <stop offset="55%"  stopColor={isGold ? '#ffe080' : '#d0d0f0'} />
          <stop offset="80%"  stopColor={isGold ? '#9a6400' : '#484868'} />
          <stop offset="100%" stopColor={isGold ? '#2a1000' : '#0e0e1e'} />
        </linearGradient>
        {/* Hook tip gradient */}
        <linearGradient id={`tip-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={isGold ? '#fff3c4' : '#ffffff'} />
          <stop offset="40%"  stopColor={isGold ? '#d4a017' : '#9090c0'} />
          <stop offset="100%" stopColor={isGold ? '#5a3000' : '#202040'} />
        </linearGradient>
        {/* Knurl pattern */}
        <pattern id={`knurl-${id}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="4" x2="4" y2="0" stroke={isGold ? '#3d1f00' : '#101028'} strokeWidth="0.5" strokeOpacity="0.4" />
          <line x1="-1" y1="1" x2="1" y2="-1" stroke={isGold ? '#3d1f00' : '#101028'} strokeWidth="0.5" strokeOpacity="0.2" />
        </pattern>
        {/* Drop shadow filter */}
        <filter id={`shadow-${id}`} x="-30%" y="-10%" width="160%" height="130%">
          <feDropShadow dx="1.5" dy="2" stdDeviation="1.8"
            floodColor={isGold ? '#5a3000' : '#000020'} floodOpacity="0.5" />
        </filter>
        {/* Inner glow filter */}
        <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ── HOOK TIP ── */}
      {/* Outer arc of hook */}
      <path
        d="M 11 10 C 11 6 11 2 15 1.2 C 18.5 0.5 20.5 3 19.5 6 C 18.8 8.5 16.5 9.5 14.5 9.5 L 11 9.5"
        stroke={`url(#tip-${id})`}
        strokeWidth="3.8"
        strokeLinecap="round"
        fill="none"
        filter={`url(#shadow-${id})`}
      />
      {/* Throat — undercut notch */}
      <path
        d="M 11 9.5 C 9.5 9.5 8.2 8.5 8.5 7 C 8.8 5.5 10.5 5.2 11 5.5"
        stroke={`url(#shaft-${id})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Hook highlight gleam */}
      <path
        d="M 11.5 8.5 C 11.5 5.5 13 2.5 16 1.8"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
      {/* Secondary highlight */}
      <path
        d="M 18.5 3.5 C 19.2 5 18.8 7 17.5 8.2"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.7"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── SHAFT — tapered metal section ── */}
      <rect
        x="8.5" y="10" width="5" height="28" rx="2.5"
        fill={`url(#shaft-${id})`}
        filter={`url(#shadow-${id})`}
      />
      {/* Shaft centre highlight */}
      <rect x="10.2" y="11" width="1.6" height="26" rx="0.8"
        fill="rgba(255,255,255,0.42)" />
      {/* Shaft edge shadow left */}
      <rect x="8.5" y="10" width="1.2" height="28" rx="0.6"
        fill="rgba(0,0,0,0.18)" />

      {/* Size engraving */}
      <text x="11" y="28" textAnchor="middle" fontSize="2.8"
        fontFamily="'DM Sans', sans-serif" fontWeight="800"
        fill={isGold ? '#3d1f00' : '#101028'} opacity="0.55" letterSpacing="0.2">
        {isGold ? '5.0' : '4.0'}
      </text>
      <text x="11" y="31.5" textAnchor="middle" fontSize="1.8"
        fontFamily="'DM Sans', sans-serif" fontWeight="600"
        fill={isGold ? '#3d1f00' : '#101028'} opacity="0.4" letterSpacing="0.1">
        mm
      </text>

      {/* ── THUMB REST — ergonomic indent ── */}
      <rect x="7" y="37" width="8" height="9" rx="3.5"
        fill={`url(#shaft-${id})`}
        filter={`url(#shadow-${id})`}
      />
      {/* Thumb rest grooves */}
      {[39, 41.5, 44].map((y, i) => (
        <rect key={i} x="7" y={y} width="8" height="0.9" rx="0.45"
          fill={isGold ? '#3d1f00' : '#080818'} opacity="0.22" />
      ))}
      {/* Thumb rest highlight */}
      <rect x="7.8" y="38.2" width="3.5" height="0.7" rx="0.35"
        fill="rgba(255,255,255,0.45)" />
      {/* Shoulder rings */}
      <rect x="7" y="37" width="8" height="1.2" rx="0.6"
        fill={isGold ? '#c88a10' : '#606088'} opacity="0.5" />
      <rect x="7" y="44.8" width="8" height="1.2" rx="0.6"
        fill={isGold ? '#c88a10' : '#606088'} opacity="0.5" />

      {/* ── GRIP HANDLE ── */}
      <rect x="5.5" y="46" width="11" height="36" rx="5.5"
        fill={`url(#grip-${id})`}
        filter={`url(#shadow-${id})`}
      />
      {/* Knurl texture */}
      <rect x="5.5" y="46" width="11" height="36" rx="5.5"
        fill={`url(#knurl-${id})`} opacity="0.6" />
      {/* Grip left highlight */}
      <rect x="6.5" y="48" width="2.5" height="32" rx="1.25"
        fill="rgba(255,255,255,0.2)" />
      {/* Grip right edge shadow */}
      <rect x="14.5" y="46" width="2" height="36" rx="1"
        fill="rgba(0,0,0,0.2)" />

      {/* Decorative ring grooves on grip */}
      {[52, 57, 62, 67, 72].map((y, i) => (
        <g key={i}>
          <rect x="5.5" y={y} width="11" height="1.8" rx="0.9"
            fill={isGold ? '#1a0800' : '#04040c'} opacity="0.25" />
          <rect x="6.5" y={y + 0.3} width="5" height="0.7" rx="0.35"
            fill="rgba(255,255,255,0.28)" />
        </g>
      ))}

      {/* ── END CAP ── */}
      <rect x="5.5" y="80" width="11" height="7" rx="3.5"
        fill={`url(#shaft-${id})`}
        filter={`url(#shadow-${id})`}
      />
      {/* End cap dome highlight */}
      <ellipse cx="11" cy="81.5" rx="3.5" ry="1.2"
        fill="rgba(255,255,255,0.45)" />
      {/* End cap bottom curve */}
      <ellipse cx="11" cy="87" rx="4" ry="1"
        fill={isGold ? '#3d1f00' : '#080818'} opacity="0.3" />
    </svg>
  )
}