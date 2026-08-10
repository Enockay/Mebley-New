import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Mebley | Modern Connections'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #09071a 0%, #1a0b2e 50%, #0f0520 100%)',
          position: 'relative',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240,56,104,0.18) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
          }}
        />

        {/* Logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <svg width="90" height="90" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6B1428" />
                <stop offset="100%" stopColor="#3A0A14" />
              </linearGradient>
              <linearGradient id="gold1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F0D080" />
                <stop offset="100%" stopColor="#B8882A" />
              </linearGradient>
              <radialGradient id="glow" cx="50%" cy="45%" r="50%">
                <stop offset="0%" stopColor="#9D2040" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="92" fill="url(#bg1)" />
            <circle cx="100" cy="100" r="92" fill="url(#glow)" />
            <circle cx="100" cy="100" r="92" fill="none" stroke="url(#gold1)" strokeWidth="2" />
            <circle cx="100" cy="100" r="98" fill="none" stroke="#C9A96E" strokeWidth="0.7" opacity="0.4" />
            <path
              d="M100 136 C100 136, 60 111, 60 85 C60 70, 71 61, 83 61 C91 61, 98 66, 100 72 C102 66, 109 61, 117 61 C129 61, 140 70, 140 85 C140 111, 100 136, 100 136Z"
              fill="none"
              stroke="url(#gold1)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M80 98 Q85 86,90 98 Q95 86,101 98 Q107 86,112 98 Q117 86,122 98"
              fill="none"
              stroke="#F0D080"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
            <polygon points="100,62 104,68 100,74 96,68" fill="#E8C97A" opacity="0.75" />
          </svg>
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-2px',
            }}
          >
            Mebley
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            fontSize: 32,
            color: 'rgba(240,232,244,0.80)',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
            marginBottom: 40,
          }}
        >
          <span>Dating built for people who want something&nbsp;</span>
          <span style={{ color: '#f03868', fontWeight: 700 }}>real</span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 40 }}>
          {[['12k+', 'Active members'], ['40+', 'Countries'], ['4.8', 'App rating']].map(
            ([v, l]) => (
              <div
                key={l}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(240,56,104,0.25)',
                  borderRadius: 16,
                  padding: '14px 28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#f03868' }}>{v}</span>
                  {l === 'App rating' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#f03868">
                      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 16, color: 'rgba(240,232,244,0.60)' }}>{l}</span>
              </div>
            )
          )}
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 20,
            color: 'rgba(240,232,244,0.35)',
            letterSpacing: '0.08em',
          }}
        >
          mebley.com
        </div>
      </div>
    ),
    { ...size }
  )
}
