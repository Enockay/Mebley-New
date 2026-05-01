import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Mebley — Modern Connections'
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
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #f03868, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
            }}
          >
            🧵
          </div>
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
            fontSize: 32,
            color: 'rgba(240,232,244,0.80)',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
            marginBottom: 40,
          }}
        >
          Dating built for people who want something{' '}
          <span style={{ color: '#f03868', fontWeight: 700 }}>real</span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 40 }}>
          {[['12k+', 'Active members'], ['40+', 'Countries'], ['4.8★', 'App rating']].map(
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
                <span style={{ fontSize: 28, fontWeight: 800, color: '#f03868' }}>{v}</span>
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
