export default function CrotchetWordmark({ height = 36 }: { height?: number }) {
  const scale = height / 44

  return (
    <svg
      width={200 * scale}
      height={height}
      viewBox="0 0 200 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Rich multi-stop gradient — rose → magenta → deep violet */}
        <linearGradient id="wm-main" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#ff2d55" />
          <stop offset="30%"  stopColor="#f43f5e" />
          <stop offset="55%"  stopColor="#ec4899" />
          <stop offset="80%"  stopColor="#d946ef" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        {/* Highlight gradient — lighter version for shine */}
        <linearGradient id="wm-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        {/* Shadow gradient */}
        <linearGradient id="wm-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(180,20,60,0)" />
          <stop offset="100%" stopColor="rgba(180,20,60,0.25)" />
        </linearGradient>
        {/* Thread texture */}
        <filter id="wm-thread">
          <feTurbulence type="fractalNoise" baseFrequency="0.065" numOctaves="4" seed="12" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Glow */}
        <filter id="wm-glow" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ── Glow layer ── */}
      <g filter="url(#wm-glow)" opacity="0.18">
        <path d="M 20 11 C 15 8 5 10 4 20 C 3 28 9 34 18 33" stroke="#f43f5e" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M 108 17 L 108 33 M 103 22 L 114 22" stroke="#d946ef" strokeWidth="7" strokeLinecap="round" fill="none" />
      </g>

      {/* ── Shadow layer ── */}
      <g opacity="0.15" transform="translate(1.5, 2)" filter="url(#wm-thread)">
        <path d="M 20 11 C 15 8 5 10 4 20 C 3 28 9 34 18 33" stroke="#9f0a30" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        <path d="M 23 21 L 23 33 M 23 25 C 25 21 30 20 32 21" stroke="#9f0a30" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <ellipse cx="41" cy="27" rx="6" ry="7" stroke="#9f0a30" strokeWidth="4.5" fill="none" />
        <path d="M 53 15 L 53 33 M 48 22 L 59 22" stroke="#9f0a30" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M 72 22 C 68 20 61 21 61 28 C 61 35 67 36 72 33" stroke="#9f0a30" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M 76 13 L 76 33 M 76 24 C 79 20 87 20 87 26 L 87 33" stroke="#9f0a30" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M 105 27 L 93 27 C 93 21 99 18 105 22 C 107 23 107 27 105 30 C 103 33 96 34 93 32" stroke="#9f0a30" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M 108 15 L 108 33 M 103 22 L 114 22" stroke="#9f0a30" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </g>

      {/* ── Main wordmark ── */}
      <g filter="url(#wm-thread)">
        {/* C */}
        <path
          d="M 20 11 C 15 8 5 10 4 20 C 3 28 9 34 18 33"
          stroke="url(#wm-main)" strokeWidth="5.5"
          strokeLinecap="round" fill="none"
        />
        {/* r */}
        <path
          d="M 23 21 L 23 33 M 23 25 C 25 21 30 20 32 21"
          stroke="url(#wm-main)" strokeWidth="4.5"
          strokeLinecap="round" fill="none"
        />
        {/* o */}
        <ellipse cx="41" cy="27" rx="6" ry="7"
          stroke="url(#wm-main)" strokeWidth="4.5" fill="none"
        />
        {/* t */}
        <path
          d="M 53 15 L 53 33 M 48 22 L 59 22"
          stroke="url(#wm-main)" strokeWidth="4.5"
          strokeLinecap="round" fill="none"
        />
        {/* c */}
        <path
          d="M 72 22 C 68 20 61 21 61 28 C 61 35 67 36 72 33"
          stroke="url(#wm-main)" strokeWidth="4.5"
          strokeLinecap="round" fill="none"
        />
        {/* h */}
        <path
          d="M 76 13 L 76 33 M 76 24 C 79 20 87 20 87 26 L 87 33"
          stroke="url(#wm-main)" strokeWidth="4.5"
          strokeLinecap="round" fill="none"
        />
        {/* e */}
        <path
          d="M 105 27 L 93 27 C 93 21 99 18 105 22 C 107 23 107 27 105 30 C 103 33 96 34 93 32"
          stroke="url(#wm-main)" strokeWidth="4.5"
          strokeLinecap="round" fill="none"
        />
        {/* t */}
        <path
          d="M 108 15 L 108 33 M 103 22 L 114 22"
          stroke="url(#wm-main)" strokeWidth="4.5"
          strokeLinecap="round" fill="none"
        />
      </g>

      {/* ── Shine layer — white gleam on top strokes ── */}
      <g opacity="0.35">
        <path d="M 18 12 C 12 11 6 14 5 20" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M 22 22 L 22 27" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <path d="M 40 21 C 36 21 35 25 36 28" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        <path d="M 52 16 L 52 24" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <path d="M 69 22 C 66 21 62 23 62 27" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        <path d="M 75 14 L 75 23" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <path d="M 107 16 L 107 24" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </g>

      {/* ── Thread tail with loop ── */}
      <path
        d="M 108 33 C 111 36 114 37 115 41 C 116 44 114 47 111 46 C 109 45.5 108.5 43 110 42"
        stroke="#d946ef"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
      {/* Thread end knot */}
      <circle cx="110.5" cy="42.5" r="2"
        stroke="#a855f7" strokeWidth="1.2" fill="rgba(168,85,247,0.15)" opacity="0.7" />
      {/* Second loose thread strand */}
      <path
        d="M 114 37 C 117 36 119 38 118 40"
        stroke="#ec4899"
        strokeWidth="0.9"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />

      {/* ── Dot accent under C — brand mark ── */}
      <circle cx="4" cy="36" r="2"
        fill="url(#wm-main)" opacity="0.6" />
    </svg>
  )
}