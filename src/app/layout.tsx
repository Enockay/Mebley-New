// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { OneSignalProvider } from '@/contexts/OneSignalContext'
import AppShell from '@/components/UI/AppShell'
import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl()
const siteName = 'Mebley'

/** Aligned with visible landing copy so Google is less likely to substitute other snippet text. */
const siteDescription =
  'Voice-first dating for intentional connections across 40+ countries. Stitch with a note, hear chemistry on profiles, and match by depth — not noise.'

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: `${siteName} | Modern Connections`,
      description: siteDescription,
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'en-US',
    },
  ],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1f0b12',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: 'Mebley | Modern Connections',
    template: '%s | Mebley',
  },
  description: siteDescription,
  keywords: [
    'dating app', 'Mebley', 'modern connections', 'intentional dating',
    'voice notes', 'online dating', 'global dating', 'relationships',
    'meet people online', 'dating platform', 'meaningful connections',
  ],
  authors: [{ name: 'Mebley', url: siteUrl }],
  creator: 'Mebley',
  publisher: 'Mebley',
  category: 'dating',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    siteName,
    title: 'Mebley | Modern Connections',
    description:
      'Dating built for people who want something real. Intentional matches, voice-first chemistry, and meaningful conversations across 40+ countries.',
    url: siteUrl,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Mebley | Modern Connections dating app',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mebley',
    creator: '@mebley',
    title: 'Mebley | Modern Connections',
    description:
      'Mebley helps ambitious people build real relationships through voice notes, intentional profiles, and values-based matching.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  manifest: '/manifest.json',
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <OneSignalProvider>
            <AppShell>{children}</AppShell>
          </OneSignalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
