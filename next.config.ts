import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // ─── Security Headers ───────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow same-origin framing (needed for embedding panels within the app)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // XSS protection
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy — allow camera + mic for video recording
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self), interest-cohort=()'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // OneSignal SDK needs to load from their CDN
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.onesignal.com https://onesignal.com https://api.onesignal.com https://*.onesignal.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https: https://d31vt9enmz8sz2.cloudfront.net",
              "font-src 'self' https://cdn.onesignal.com",
              // blob: needed for camera preview, CloudFront for video playback
              "media-src 'self' blob: https://d31vt9enmz8sz2.cloudfront.net",
              // S3 for direct uploads, Supabase for auth/db, CloudFront for playback, OneSignal for push
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.amazonaws.com https://crotchet-media.s3.eu-north-1.amazonaws.com https://d31vt9enmz8sz2.cloudfront.net https://onesignal.com https://*.onesignal.com https://api.onesignal.com",
              // Service worker needs to load OneSignal's SW script
              "worker-src 'self' https://cdn.onesignal.com blob:",
              "frame-src 'self' https://onesignal.com",
              "frame-ancestors 'self'",
            ].join('; ')
          },
          // HSTS (production only)
          ...(process.env.NODE_ENV === 'production' ? [
            { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }
          ] : []),
        ],
      },
      // ─── API Routes extra security ──────────────────────────────────────────
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },

  // ─── Redirect http to https in production ───────────────────────────────────
  async redirects() {
    if (process.env.NODE_ENV !== 'production') return []
    return [
      {
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://yourdomain.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig