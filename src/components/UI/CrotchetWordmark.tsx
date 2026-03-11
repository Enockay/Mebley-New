export default function CrotchetWordmark({ height = 32 }: { height?: number }) {
  const scale = height / 40

  return (
    <svg
      width={180 * scale}
      height={height}
      viewBox="0 0 180 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="wm-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#f43f5e" />
          <stop offset="60%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        {/* Thread texture along stroke */}
        <filter id="wm-rough">
          <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="3" seed="8" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* ── Shadow layer — slightly offset, faded ── */}
      <g opacity="0.12" transform="translate(1.2, 1.5)" filter="url(#wm-rough)">
        {/* C */}
        <path d="M 18 10 C 14 8 6 9 5 18 C 4 26 9 32 17 31" stroke="#f43f5e" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        {/* r */}
        <path d="M 21 20 L 21 31 M 21 24 C 23 20 27 19 29 20" stroke="#f43f5e" strokeWidth="3.8" strokeLinecap="round" fill="none" />
        {/* o */}
        <ellipse cx="37" cy="26" rx="5" ry="6" stroke="#f43f5e" strokeWidth="3.8" fill="none" />
        {/* t */}
        <path d="M 48 15 L 48 31 M 44 21 L 53 21" stroke="#f43f5e" strokeWidth="3.8" strokeLinecap="round" fill="none" />
        {/* c */}
        <path d="M 64 21 C 61 19 55 20 55 26 C 55 32 60 33 64 31" stroke="#f43f5e" strokeWidth="3.8" strokeLinecap="round" fill="none" />
        {/* h */}
        <path d="M 68 13 L 68 31 M 68 23 C 70 19 77 19 77 24 L 77 31" stroke="#f43f5e" strokeWidth="3.8" strokeLinecap="round" fill="none" />
        {/* e */}
        <path d="M 94 26 L 83 26 C 83 20 88 18 93 21 C 95 22 95 25 93 28 C 91 31 85 32 82 30" stroke="#f43f5e" strokeWidth="3.8" strokeLinecap="round" fill="none" />
        {/* t */}
        <path d="M 102 15 L 102 31 M 98 21 L 107 21" stroke="#f43f5e" strokeWidth="3.8" strokeLinecap="round" fill="none" />
      </g>

      {/* ── Main wordmark ── */}
      <g filter="url(#wm-rough)">
        {/* C — wide opening */}
        <path
          d="M 18 10 C 14 8 6 9 5 18 C 4 26 9 32 17 31"
          stroke="url(#wm-grad)" strokeWidth="4.5"
          strokeLinecap="round" fill="none"
        />
        {/* r */}
        <path
          d="M 21 20 L 21 31 M 21 24 C 23 20 27 19 29 20"
          stroke="url(#wm-grad)" strokeWidth="3.8"
          strokeLinecap="round" fill="none"
        />
        {/* o */}
        <ellipse cx="37" cy="26" rx="5" ry="6"
          stroke="url(#wm-grad)" strokeWidth="3.8" fill="none" />
        {/* t */}
        <path
          d="M 48 15 L 48 31 M 44 21 L 53 21"
          stroke="url(#wm-grad)" strokeWidth="3.8"
          strokeLinecap="round" fill="none"
        />
        {/* c */}
        <path
          d="M 64 21 C 61 19 55 20 55 26 C 55 32 60 33 64 31"
          stroke="url(#wm-grad)" strokeWidth="3.8"
          strokeLinecap="round" fill="none"
        />
        {/* h */}
        <path
          d="M 68 13 L 68 31 M 68 23 C 70 19 77 19 77 24 L 77 31"
          stroke="url(#wm-grad)" strokeWidth="3.8"
          strokeLinecap="round" fill="none"
        />
        {/* e */}
        <path
          d="M 94 26 L 83 26 C 83 20 88 18 93 21 C 95 22 95 25 93 28 C 91 31 85 32 82 30"
          stroke="url(#wm-grad)" strokeWidth="3.8"
          strokeLinecap="round" fill="none"
        />
        {/* t */}
        <path
          d="M 102 15 L 102 31 M 98 21 L 107 21"
          stroke="url(#wm-grad)" strokeWidth="3.8"
          strokeLinecap="round" fill="none"
        />
      </g>

      {/* ── Thread tail — loose end dangling from the last t ── */}
      <path
        d="M 102 31 C 104 33 107 34 108 37 C 109 39 107 41 105 40"
        stroke="#ec4899"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      {/* Thread loop at end */}
      <circle cx="105" cy="40" r="1.5"
        stroke="#ec4899" strokeWidth="1" fill="none" opacity="0.5" />

      {/* ── Highlight strokes — white gleam on top of letters ── */}
      <g opacity="0.25">
        <path d="M 16 11 C 12 10 7 12 6 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M 36 21 C 33 21 32 24 33 27" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M 47 16 L 47 25" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M 67 14 L 67 22" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M 101 16 L 101 25" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  )
}